#!/bin/sh
# Nightly Tailchat backup: mongodump + MinIO volume tar, 14-day rotation.
# Installed at /opt/tailchat/backup.sh, run by /etc/cron.d/tailchat-backup.
set -eu

TS=$(date +%Y%m%d)
DEST="/root/backups/tailchat/$TS"
mkdir -p "$DEST"

cd /opt/tailchat
docker compose exec -T mongo mongodump --archive --gzip --db tailchat > "$DEST/mongo-tailchat.archive.gz"
docker run --rm -v tailchat_storage:/data:ro -v "$DEST":/backup alpine \
  tar czf /backup/minio-storage.tar.gz -C /data .

# rotate: drop day-dirs older than 14 days
find /root/backups/tailchat -maxdepth 1 -mindepth 1 -type d -mtime +14 -exec rm -rf {} +

echo "$(date -Is) backup ok: $(du -sh "$DEST" | cut -f1)"
