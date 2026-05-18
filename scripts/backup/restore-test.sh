#!/usr/bin/env bash
# Monthly restore test scaffold — download latest dump and restore to a throwaway DB.
# Run in staging or a local docker-compose.dev stack; never against production without care.

set -euo pipefail

: "${S3_BUCKET:?S3_BUCKET required}"
: "${RESTORE_DATABASE_URL:?RESTORE_DATABASE_URL required (empty/test database)}"

STAMP="${1:-latest}"
TMP_DIR="${TMPDIR:-/tmp}/cqm-restore"
mkdir -p "$TMP_DIR"

if [[ "$STAMP" == "latest" ]]; then
  echo "[restore-test] list latest object under ${S3_PREFIX:-cqm/pg}/ and set OBJECT_KEY"
  echo "[restore-test] example: aws s3 cp s3://\${S3_BUCKET}/\${OBJECT_KEY} $TMP_DIR/restore.sql.gz"
  exit 1
fi

DUMP_FILE="$TMP_DIR/restore.sql.gz"
echo "[restore-test] restoring $DUMP_FILE into $RESTORE_DATABASE_URL"
gunzip -c "$DUMP_FILE" | psql "$RESTORE_DATABASE_URL" -v ON_ERROR_STOP=1
echo "[restore-test] verify row counts: SELECT COUNT(*) FROM requests;"
