# STC Tailchat deployment — netcup-vps-01

Production chat for STC Worldwide, served publicly at `https://$CHAT_DOMAIN`.

- **Host:** netcup-vps-01 (152.53.82.15 public / 100.66.129.67 tailnet), Debian 13, root over key-only SSH
- **Location on host:** `/opt/tailchat/`
- **Image:** `ghcr.io/stc-worldwide/tailchat:1.14.0` (pinned; built from this fork by `.github/workflows/docker-publish.yml` on `v*.*.*` tags and on `master` pushes. The GHCR package must be set public once — org packages default private — or the VPS needs `docker login ghcr.io` with a read:packages PAT. Before 1.12.0 the deployment ran upstream's `moonrailgun/tailchat:1.11.12`.)
- **Topology:** Caddy (public 80/443, Let's Encrypt) → traefik (internal path router) → tailchat services. MongoDB/Redis/MinIO are internal-only.

## Deploy / redeploy

```sh
cd /opt/tailchat
docker compose pull
docker compose up -d
```

First-time setup: copy `docker-compose.env.example` → `docker-compose.env`, fill every
blank value, `chmod 600 docker-compose.env`, `ln -s docker-compose.env .env`.
DNS A record for `$CHAT_DOMAIN` → 152.53.82.15 must exist before first start or
Let's Encrypt issuance fails (Caddy retries automatically once DNS resolves).

## Verify what is INSTALLED, not what is checked out

The compose file in the git fork is not what runs — `/opt/tailchat/docker-compose.yml`
on the VPS is. After changing the fork, copy the files over and `docker compose up -d`,
then check `docker compose ps` and `docker inspect --format '{{.Config.Image}}' <ctr>`.

## Ship a new release

1. Tag the fork: `git tag v1.x.y && git push origin v1.x.y` — `docker-publish.yml`
   builds and pushes `ghcr.io/stc-worldwide/tailchat:1.x.y` (~30–60 min; watch the
   Actions run).
2. Edit the pinned tag in `deploy/stc/docker-compose.yml` (all four app services), PR it.
3. Copy to VPS, `docker compose pull && docker compose up -d`.
4. Smoke-test: login, send message, upload image, `/admin/`.

(Upstream `moonrailgun/tailchat` images are no longer used; the fork builds its own.)

## Registration control

`EMAIL_VERIFY=true` gates signup on a verified email. To freeze signups entirely once
the org is onboarded, add `DISABLE_USER_REGISTER=true` to `docker-compose.env` and
`docker compose up -d` (recreates app containers).

## Backups

Nightly cron on the VPS (`/etc/cron.d/tailchat-backup`) dumps MongoDB and tars the
MinIO volume into `/root/backups/tailchat/`, keeping 14 days.

Restore: stop the stack, `mongorestore` the dump into the `mongo` container, untar the
MinIO volume back into `tailchat_storage`, start the stack.

## MongoDB 4 -> 7 migration (2026-08-31)

mongo:7 cannot open 4.x data files in place, so the migration was dump/restore into a
fresh volume rather than an image swap:

1. `docker compose stop service-core service-openapi service-all-plugins tailchat-admin`
   (stop writes; mongo/redis/minio/caddy stay up)
2. `docker compose exec -T mongo mongodump --archive --gzip --db tailchat > /root/backups/tailchat/pre-mongo7.archive.gz`
3. Copy the mongo:7 compose (volume `data7`) to `/opt/tailchat/`, then
   `docker compose up -d mongo` — recreates mongo on 7 with an empty volume
4. `docker compose exec -T mongo mongorestore --archive --gzip < /root/backups/tailchat/pre-mongo7.archive.gz`
5. `docker compose up -d`, then smoke-test `/health`

The old `tailchat_data` volume holds the final mongo:4 state untouched. Rollback =
restore the pre-migration compose (mongo:4 + `data`) and `up -d`. Remove the volume
only after the mongo:7 stack has soaked.

## Ports exposed publicly

Only Caddy's 80/443 (+443/udp for HTTP/3). Docker-published ports bypass the host's
default-deny nftables — never add a `ports:` mapping to any other service unless it is
bound to `127.0.0.1` or the tailnet IP.

## Firewall (nftables)

`vps-nftables.conf` in this directory is a custody copy of the live
`/etc/nftables.conf` (backup on the host: `/etc/nftables.conf.bak-20260829`).
Two amendments were made 2026-08-29 for this stack: input accepts tcp 80/443,
and the forward chain accepts `docker0`/`br-*` traffic — without the forward
rules containers have NO outbound at all (first symptom: Caddy cannot reach
Let's Encrypt). Apply changes with `nft -c -f` (check) then `nft -f`.

## Email (Resend SMTP)

Sender domain `stc-worldwide.com` is verified in Resend (DKIM/SPF/MX + DMARC
in Cloudflare). The env uses a sending-only API key scoped to that domain.
**netcup blocks outbound 465/587** — `SMTP_URI` must use Resend's alternate
port 2465 (`smtps://resend:<key>@smtp.resend.com:2465`). Healthy boot logs
`SMTP 服务可用` from the MAIL service; `SMTP 服务不可用` means the transporter
verify failed (check port reachability first). `EMAIL_VERIFY=true` is live.

## Landing page

Caddy also serves https://stc-worldwide.com (+www) from `/opt/landing`
(read-only mount). Source: `STC-Worldwide/stc-worldwide.com`; redeploy is
`scp site/index.html site/fonts/* root@152.53.82.15:/opt/landing/...` — no
container restart needed for content changes.

## Admin panel

`https://$CHAT_DOMAIN/admin/` (trailing slash required). Credentials: `ADMIN_USER` /
`ADMIN_PASS` from `docker-compose.env`. The newer `admin-next` app is NOT deployed —
it postdates the 1.11.12 image.

## Deploy safety

Tag deploys run a **canary boot check** first: the new image's gateway is
started against the live backends under `NAMESPACE=canary` (isolated from the
production moleculer cluster) and `/health` must answer before the stack
rolls. Added after the v1.13.0 incident, where a Node-22-only moleculer
tracing crash passed every build-time gate.

Emergency levers (env in `docker-compose.env`, then `docker compose up -d`):
- `DISABLE_TRACING=true` — disables moleculer tracing entirely (the v1.13.0
  crash was in the tracing middleware; this would have been a viable
  mitigation).
- Rollback = edit the image pin in `/opt/tailchat/docker-compose.yml` (or run
  the Deploy workflow with the previous version) and `docker compose up -d`.
