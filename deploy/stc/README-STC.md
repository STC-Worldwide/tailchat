# STC Tailchat deployment — netcup-vps-01

Production chat for STC Worldwide, served publicly at `https://$CHAT_DOMAIN`.

- **Host:** netcup-vps-01 (152.53.82.15 public / 100.66.129.67 tailnet), Debian 13, root over key-only SSH
- **Location on host:** `/opt/tailchat/`
- **Image:** `moonrailgun/tailchat:1.11.12` (pinned; official upstream image — the STC fork is source custody, not the build source)
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

## Update to a newer Tailchat

1. Check upstream releases / Docker Hub tags (`moonrailgun/tailchat`).
2. Edit the pinned tag in `deploy/stc/docker-compose.yml` (all four app services), PR it.
3. Copy to VPS, `docker compose pull && docker compose up -d`.
4. Smoke-test: login, send message, upload image, `/admin/`.

## Registration control

`EMAIL_VERIFY=true` gates signup on a verified email. To freeze signups entirely once
the org is onboarded, add `DISABLE_USER_REGISTER=true` to `docker-compose.env` and
`docker compose up -d` (recreates app containers).

## Backups

Nightly cron on the VPS (`/etc/cron.d/tailchat-backup`) dumps MongoDB and tars the
MinIO volume into `/root/backups/tailchat/`, keeping 14 days.

Restore: stop the stack, `mongorestore` the dump into the `mongo` container, untar the
MinIO volume back into `tailchat_storage`, start the stack.

## Ports exposed publicly

Only Caddy's 80/443 (+443/udp for HTTP/3). Docker-published ports bypass the host's
default-deny nftables — never add a `ports:` mapping to any other service unless it is
bound to `127.0.0.1` or the tailnet IP.

## Admin panel

`https://$CHAT_DOMAIN/admin/` (trailing slash required). Credentials: `ADMIN_USER` /
`ADMIN_PASS` from `docker-compose.env`. The newer `admin-next` app is NOT deployed —
it postdates the 1.11.12 image.
