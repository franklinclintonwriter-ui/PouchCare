#!/bin/bash
# PouchCare Platform — Deploy to u4s-srv
# Run this from your LOCAL machine (Windows terminal / Git Bash / PowerShell)
# from the PouchCare-Platform directory

set -e

echo "=== Uploading zip files to u4s-srv:/data/ ==="
scp pouchcare-complete.zip u4s-srv:/data/
scp pouchcare-frontend.zip u4s-srv:/data/
scp pouchcare-wordpress.zip u4s-srv:/data/

echo ""
echo "=== Upload complete! ==="
echo ""
echo "Now SSH into your server and run the setup:"
echo "  ssh u4s-srv"
echo "  bash /data/setup-pouchcare.sh"
