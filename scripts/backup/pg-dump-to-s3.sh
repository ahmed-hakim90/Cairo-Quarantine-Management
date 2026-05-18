#!/usr/bin/env bash
# Daily PostgreSQL backup scaffold — run via cron on VPS or as a one-off Compose job.
# Requires: pg_dump, aws CLI (or s3-compatible client), env vars from .env.vps.example
#
# Example cron (02:00 Cairo — adjust TZ on host):
#   0 2 * * * /opt/cqm/scripts/backup/pg-dump-to-s3.sh >> /var/log/cqm-backup.log 2>&1

set -euo pipefail

: "${DATABASE_URL:?DATABASE_URL required}"
: "${S3_BUCKET:?S3_BUCKET required}"

RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-14}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
TMP_DIR="${TMPDIR:-/tmp}/cqm-backup"
mkdir -p "$TMP_DIR"

DUMP_FILE="$TMP_DIR/cqm-${STAMP}.sql.gz"
OBJECT_KEY="${S3_PREFIX:-cqm/pg}/cqm-${STAMP}.sql.gz"

echo "[backup] dumping to $DUMP_FILE"
pg_dump "$DATABASE_URL" --no-owner --format=plain | gzip -9 > "$DUMP_FILE"

export AWS_ACCESS_KEY_ID="${S3_ACCESS_KEY_ID:-}"
export AWS_SECRET_ACCESS_KEY="${S3_SECRET_ACCESS_KEY:-}"
export AWS_DEFAULT_REGION="${S3_REGION:-auto}"

AWS_ARGS=()
if [[ -n "${S3_ENDPOINT:-}" ]]; then
  AWS_ARGS+=(--endpoint-url "$S3_ENDPOINT")
fi

echo "[backup] uploading s3://${S3_BUCKET}/${OBJECT_KEY}"
aws s3 cp "$DUMP_FILE" "s3://${S3_BUCKET}/${OBJECT_KEY}" "${AWS_ARGS[@]}"

echo "[backup] pruning objects older than ${RETENTION_DAYS} days (manual list/delete — implement per provider)"
# TODO: aws s3 ls + delete by LastModified, or use lifecycle rules on the bucket

rm -f "$DUMP_FILE"
echo "[backup] done"
