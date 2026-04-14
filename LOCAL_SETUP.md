# Local Setup Guide

> **We recommend using GitHub Codespaces for this workshop.** Only follow these instructions if you're unable to use Codespaces.

## Prerequisites

Make sure you have the following installed:

- **git**
- **go** (1.25+)
- **jq**
- **curl**
- **Docker** — [Install Docker](https://docs.docker.com/get-docker/)
- **mage** — installed automatically by `setup.sh` via `go install`, but if that fails you can install it manually: `go install github.com/magefile/mage@latest`

Verify Docker is working:

```bash
docker run hello-world
```

### macOS (Homebrew)

```bash
brew install git go jq curl
```

### Ubuntu / Debian

```bash
sudo apt update && sudo apt install -y git golang-go jq curl
```

### Fedora / RHEL

```bash
sudo dnf install -y git golang jq curl
```

### Arch and arch-based (Manjaro/Endeavour/Bazzite) Linux

```bash
sudo pacman -S --needed git go jq curl
```

### Windows

**We strongly recommend using GitHub Codespaces instead of a local setup on Windows.** If you must work locally, use [WSL (Windows Subsystem for Linux)](https://learn.microsoft.com/en-us/windows/wsl/install) and follow the Ubuntu/Debian instructions above from within your WSL terminal.

## 1. Install Claude Code

If you don't already have Claude Code installed:

### macOS

```bash
brew install --cask claude-code
```

### Linux

```bash
curl -fsSL https://claude.ai/install.sh | bash
```

## 2. Clone the repository

```bash
git clone https://github.com/grafana/grafana-con-2026-ai-inception-workshop.git
cd grafana-con-2026-ai-inception-workshop
```

## 3. Run the setup script

```bash
bash setup.sh
```

The script will detect that you're on a local machine and ask for confirmation before modifying your Claude Code settings. Enter the workshop password when prompted.

## 4. Start Claude Code

```bash
claude
```

On first launch, Claude Code will detect the workshop API key and ask:

```
Detected a custom API key in your environment
Do you want to use this API key?
```

Select **Yes** and press Enter.

## After the workshop

> ⚠️ **Important:** The workshop API key will stop working after the event. If you don't restore your configuration, Claude Code will fail to connect. Run the cleanup script below to get back to normal.

To restore your original Claude Code configuration:

```bash
bash unsetup.sh
```

This removes the workshop proxy settings and restores any previous configuration you had.
