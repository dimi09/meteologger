#!/bin/bash
set -e
BACKUP_DIR=/backups
RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-7}
HOUR=${BACKUP_HOUR:-02}
MINUTE=${BACKUP_MINUTE:-00}
mkdir -p "$BACKUP_DIR"

run_backup() {
  ts=$(date +%F_%H-%M)
  file="$BACKUP_DIR/measurelog_${ts}.dump"
  echo "[backup] $(date) -> $file"
  PGPASSWORD="$POSTGRES_PASSWORD" pg_dump -h db -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc > "$file" \
    && echo "[backup] ok" || echo "[backup] FAILED"
  # Διατήρηση μόνο των τελευταίων N ημερών
  find "$BACKUP_DIR" -name 'measurelog_*.dump' -type f -mtime +"$RETENTION_DAYS" -delete
}

[ "${BACKUP_ON_START:-false}" = "true" ] && run_backup

while true; do
  now=$(date +%s)
  target=$(date -d "$(date +%F) ${HOUR}:${MINUTE}:00" +%s)
  [ "$target" -le "$now" ] && target=$(date -d "tomorrow ${HOUR}:${MINUTE}:00" +%s)
  wait=$((target - now))
  echo "[backup] επόμενο backup σε ${wait}s ($(date -d @${target}))"
  sleep "$wait"
  run_backup
done
