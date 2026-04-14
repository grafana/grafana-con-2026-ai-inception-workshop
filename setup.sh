#!/bin/bash
set -e

PROXY_URL="https://cc-workshop-proxy.grafana.fun"
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
SETTINGS_FILE="$HOME/.claude/settings.json"
BACKUP_FILE="$HOME/.claude/settings.json.workshop-backup"

# Detect environment
if [ "$CODESPACES" = "true" ]; then
 IS_LOCAL=false
else
 IS_LOCAL=true
fi

# Check if already set up
if [ "$IS_LOCAL" = true ]; then
 # In local mode, the backup file is our marker that setup already ran
 if [ -f "$BACKUP_FILE" ]; then
   echo "Setup has already been run."
   echo "To re-run, first run: bash unsetup.sh"
   exit 0
 fi
 # Also check for fresh-install case: settings.json exists with our env vars but no backup
 if [ -f "$SETTINGS_FILE" ]; then
   EXISTING_BASE_URL=$(jq -r '.env.ANTHROPIC_BASE_URL // empty' "$SETTINGS_FILE" 2>/dev/null)
   if [ "$EXISTING_BASE_URL" = "$PROXY_URL" ]; then
     echo "Setup has already been run."
     echo "To re-run, first run: bash unsetup.sh"
     exit 0
   fi
 fi
fi

# Local mode: confirm with user
if [ "$IS_LOCAL" = true ]; then
 echo "It looks like you're running on a local machine."
 echo "This will temporarily modify your Claude Code settings."
 read -p "Continue? (y/n) " -n 1 -r
 echo
 if [[ ! $REPLY =~ ^[Yy]$ ]]; then
   echo "Aborted."
   exit 0
 fi
fi

# Check if claude is installed, install if in codespaces
if ! command -v claude &> /dev/null; then
 if [ "$IS_LOCAL" = true ]; then
   echo "Error: Claude Code is not installed."
   echo "Install it with: curl -fsSL https://claude.ai/install.sh | bash"
   exit 1
 else
   echo "Installing Claude Code..."
   export TERM_PROGRAM=xterm
   curl -fsSL https://claude.ai/install.sh | bash
   # Reload to get claude in PATH
   export PATH="$HOME/.claude/local/bin:$PATH"
 fi
fi

# Check dependencies
if ! command -v jq &> /dev/null; then
 echo "Error: jq is required but not installed."
 exit 1
fi

if ! command -v go &> /dev/null; then
 echo "Error: go is required but not installed."
 exit 1
fi

if [ "$IS_LOCAL" = true ]; then
 if ! command -v docker &> /dev/null; then
   echo "Error: Docker is required but not installed."
   echo "Install it from https://docs.docker.com/get-docker/"
   echo "Once installed, verify it works by running: docker run --rm hello-world"
   exit 1
 fi
fi

# Install mage
if ! command -v mage &> /dev/null; then
 echo "Installing mage..."
 go install github.com/magefile/mage@latest
fi

# Prompt for password with retry
MAX_ATTEMPTS=3
ATTEMPT=0
KEY=""

while [ -z "$KEY" ] && [ "$ATTEMPT" -lt "$MAX_ATTEMPTS" ]; do
 ATTEMPT=$((ATTEMPT + 1))
 read -s -p "Enter workshop password: " PASSWORD
 echo

 RESPONSE=$(curl -s -X POST "$PROXY_URL/workshop/key" -d "{\"password\":\"$PASSWORD\"}")
 KEY=$(echo "$RESPONSE" | jq -r '.key // empty')

 if [ -z "$KEY" ]; then
   REMAINING=$((MAX_ATTEMPTS - ATTEMPT))
   if [ "$REMAINING" -gt 0 ]; then
     echo "Invalid password. $REMAINING attempt(s) remaining."
   else
     echo "Too many failed attempts."
     exit 1
   fi
 fi
done

KEY_SUFFIX="${KEY: -20}"

if [ "$IS_LOCAL" = true ]; then
 # === LOCAL MODE ===

 # Handle ~/.claude/settings.json
 if [ -f "$SETTINGS_FILE" ]; then
   # Back up existing settings
   cp "$SETTINGS_FILE" "$BACKUP_FILE"
   echo "Backed up existing settings to $BACKUP_FILE"
   # Merge env vars into existing settings
   jq --arg base_url "$PROXY_URL" --arg key "$KEY" \
     '.env.ANTHROPIC_BASE_URL = $base_url | .env.ANTHROPIC_API_KEY = $key | .model = "opus[1m]" | .permissions.defaultMode = "bypassPermissions" | .skipDangerousModePermissionPrompt = true' \
     "$SETTINGS_FILE" > "${SETTINGS_FILE}.tmp" && mv "${SETTINGS_FILE}.tmp" "$SETTINGS_FILE"
 else
   # Fresh install — create directory and settings from scratch
   mkdir -p "$HOME/.claude"
   jq -n \
     --arg base_url "$PROXY_URL" \
     --arg key "$KEY" \
     '{
       env: {
         ANTHROPIC_BASE_URL: $base_url,
         ANTHROPIC_API_KEY: $key
       },
       model: "opus[1m]",
       permissions: {
         defaultMode: "bypassPermissions"
       },
       skipDangerousModePermissionPrompt: true
     }' > "$SETTINGS_FILE"
 fi

 # Handle ~/.claude.json — only create if it doesn't exist
 if [ ! -f ~/.claude.json ]; then
   jq -n \
     --arg dir "$PROJECT_DIR" \
     --arg suffix "$KEY_SUFFIX" \
     '{
       hasCompletedOnboarding: true,
       customApiKeyResponses: {
         approved: [$suffix],
         rejected: []
       },
       projects: {
         ($dir): {
           hasTrustDialogAccepted: true
         }
       }
     }' > ~/.claude.json
 fi

 echo ""
 echo "Done!"
 echo "When you're done with the workshop, run: bash unsetup.sh"

else
 # === CODESPACES MODE ===

 # Write ~/.claude/settings.json with base URL and API key
 rm -rf "$HOME/.claude"
 mkdir -p "$HOME/.claude"
 jq -n \
   --arg base_url "$PROXY_URL" \
   --arg key "$KEY" \
   '{
     env: {
       ANTHROPIC_BASE_URL: $base_url,
       ANTHROPIC_API_KEY: $key,
       TERM_PROGRAM: "xterm"
     },
     model: "opus[1m]",
     permissions: {
       defaultMode: "bypassPermissions"
     },
     skipDangerousModePermissionPrompt: true
   }' > "$SETTINGS_FILE"

 # Write ~/.claude.json with onboarding completed and project trusted
 jq -n \
   --arg dir "$PROJECT_DIR" \
   --arg suffix "$KEY_SUFFIX" \
   '{
     hasCompletedOnboarding: true,
     customApiKeyResponses: {
       approved: [$suffix],
       rejected: []
     },
     projects: {
       ($dir): {
         hasTrustDialogAccepted: true
       }
     }
   }' > ~/.claude.json

 echo "Claude setup is done"
fi

bash "$PROJECT_DIR/milestone1.sh"

echo ""
echo "============================================"
echo "  Setup complete!"
echo ""
echo "  Follow the prompts in PROMPTS.md"
echo "============================================"

