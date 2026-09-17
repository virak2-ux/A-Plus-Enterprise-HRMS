#!/usr/bin/env bash
# Cambodia Enterprise HRMS - Automated Database Backup Script
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/cambodia_hrms_${TIMESTAMP}.sql.gz"
RETENTION_DAYS=30

mkdir -p "${BACKUP_DIR}"

echo "Starting PostgreSQL backup: ${BACKUP_FILE}..."
pg_dump -U "${POSTGRES_USER:-postgres}" -h "${POSTGRES_HOST:-localhost}" -p "${POSTGRES_PORT:-5432}" "${POSTGRES_DB:-cambodia_hrms}" | gzip > "${BACKUP_FILE}"

echo "Backup created successfully. Size: $(du -h "${BACKUP_FILE}" | cut -f1)"

echo "Pruning backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_DIR}" -type f -name "cambodia_hrms_*.sql.gz" -mtime +${RETENTION_DAYS} -delete

echo "Backup rotation complete."
