#!/bin/bash
# Detect plugin-looking subdirectories and warn Claude the user is in the wrong folder

PLUGIN_DIRS=()

for dir in "$CLAUDE_PROJECT_DIR"/*/; do
  name=$(basename "$dir")
  # Skip known non-plugin folders
  case "$name" in
    scripts|.git|node_modules) continue ;;
  esac
  PLUGIN_DIRS+=("$name")
done

if [ ${#PLUGIN_DIRS[@]} -gt 0 ]; then
  DIRS_LIST=$(printf '  - %s\n' "${PLUGIN_DIRS[@]}")
  echo "⚠️ SESSION CONTEXT: The user has started Claude Code in the workshop root folder, NOT inside a plugin folder. They are likely in the wrong place.

The following plugin folder(s) exist in this directory:
$DIRS_LIST

If the user asks you to build, modify, or add functionality to a plugin, tell them they are in the wrong folder and to run: cd <plugin-folder-name> — then close this session and open Claude Code again from there. Do not attempt to do plugin work from the root folder. Stop after telling them this — do not offer further suggestions."
else
  echo "⚠️ SESSION CONTEXT: The user has started Claude Code in the workshop root folder. No plugin subfolders exist yet. If the user asks to work on a plugin, tell them they need to create a plugin subfolder first and work from inside it — not from this root folder. Stop after telling them this."
fi
