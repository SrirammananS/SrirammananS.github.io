#!/bin/bash

# Configuration
SOURCE_FILE="/Users/sricholaidevi/Documents/MSC/Site/SrirammananS.github.io/CFIS/pdfs/list.json"
BACKUP_DIR="/Users/sricholaidevi/Documents/MSC/Site/SrirammananS.github.io/CFIS/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/list_backup_${TIMESTAMP}.json"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Perform backup
if [ -f "$SOURCE_FILE" ]; then
    cp "$SOURCE_FILE" "$BACKUP_FILE"
    echo "Backup successful: $BACKUP_FILE"
    
    # Keep only the last 10 backups
    ls -t "${BACKUP_DIR}"/list_backup_*.json | tail -n +11 | xargs -I {} rm -- {}
    echo "Cleanup complete. Kept last 10 backups."
else
    echo "Error: Source file $SOURCE_FILE not found."
    exit 1
fi
