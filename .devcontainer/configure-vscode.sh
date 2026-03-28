#!/bin/bash
# Write machine-level VS Code settings that devcontainer settings can't override
MACHINE_SETTINGS="$HOME/.vscode-remote/data/Machine/settings.json"
mkdir -p "$(dirname "$MACHINE_SETTINGS")"

if [ -f "$MACHINE_SETTINGS" ]; then
  jq '. + {
    "git.autofetch": false,
    "git.suggestSmartCommit": false,
    "chat.commandCenter.enabled": false,
    "chat.editor.enabled": false,
    "chat.agent.enabled": false,
    "github.copilot.chat.enabled": false,
    "workbench.secondarySideBar.visible": false
  }' "$MACHINE_SETTINGS" > "${MACHINE_SETTINGS}.tmp" && mv "${MACHINE_SETTINGS}.tmp" "$MACHINE_SETTINGS"
else
  cat > "$MACHINE_SETTINGS" <<'EOF'
{
  "git.autofetch": false,
  "git.suggestSmartCommit": false,
  "chat.commandCenter.enabled": false,
  "chat.editor.enabled": false,
  "chat.agent.enabled": false,
  "github.copilot.chat.enabled": false,
  "workbench.secondarySideBar.visible": false
}
EOF
fi
