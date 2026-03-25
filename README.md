# GrafanaCon 2026 - AI Inception Workshop

> **Can't use Codespaces?** See [LOCAL_SETUP.md](LOCAL_SETUP.md) for local setup instructions.

## Getting Started

1. Wait for the Codespace to finish loading (Claude Code is being installed).
2. Run the setup script:
   ```
   bash setup.sh
   ```
3. Enter the workshop password (shared by the instructor).
4. Start Claude Code:
   ```
   claude
   ```

## Useful Commands

```bash
# Create a new plugin
npx @grafana/create-plugin@latest

# Plugin development
yarn install          # Install dependencies
mage build:linux      # Build backend (Go)
yarn dev             # Start frontend dev server
yarn server          # Start Docker container with Grafana
```

## Workshop Resources

- **[api.md](api.md)** - Barcelona Bicing API reference
- **[scaffolding](scaffolding.md)** - Scaffolding commands
- **[PROMPTS.md](PROMPTS.md)** - Complete list of prompts used throughout the workshop
- **[Slides](https://docs.google.com/presentation/d/1Af0BXvxNxtmIATizqiUjr2P-frlvAMu5WwB3xTp5eu0/)**