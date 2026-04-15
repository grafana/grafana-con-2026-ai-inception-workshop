#!/bin/bash
set -e

SETTINGS_FILE="$HOME/.claude/settings.json"
BACKUP_FILE="$HOME/.claude/settings.json.workshop-backup"

# Only relevant for local machines
if [ "$CODESPACES" = "true" ]; then
  echo "You're in a Codespace — no need to unsetup, this environment is disposable."
  exit 0
fi

if [ -f "$BACKUP_FILE" ]; then
  # Restore from backup
  mv "$BACKUP_FILE" "$SETTINGS_FILE"
  echo "Restored your original Claude Code settings from backup."
elif [ -f "$SETTINGS_FILE" ]; then
  # No backup — this was a fresh install. Remove all workshop settings.
  UPDATED=$(jq 'del(.env.ANTHROPIC_BASE_URL, .env.ANTHROPIC_API_KEY, .model, .permissions, .skipDangerousModePermissionPrompt)' "$SETTINGS_FILE")

  # If env block is now empty, remove it too
  UPDATED=$(echo "$UPDATED" | jq 'if .env == {} then del(.env) else . end')

  # If the whole file is now empty, just remove it
  if [ "$(echo "$UPDATED" | jq 'length')" = "0" ]; then
    rm "$SETTINGS_FILE"
    echo "Removed workshop settings. (No previous config existed.)"
  else
    echo "$UPDATED" > "$SETTINGS_FILE"
    echo "Removed workshop environment variables from settings."
  fi
else
  echo "Nothing to restore — no workshop setup found."
fi
