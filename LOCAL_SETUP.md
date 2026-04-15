# Local Setup Guide

> **We recommend using GitHub Codespaces for this workshop.** Only follow these instructions if you're unable to use Codespaces.

## Option A: Local Dev Container (recommended for local setup)

If you have **Docker** and **VS Code** installed, you can run the same containerized environment locally using Dev Containers — no need to install Go, Node, or other tools on your machine.

### Prerequisites

- [Docker Desktop](https://docs.docker.com/get-docker/)
- [VS Code](https://code.visualstudio.com/) with the [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)

### Steps

1. Clone the repository and open it in VS Code:

   ```bash
   git clone https://github.com/grafana/grafana-con-2026-ai-inception-workshop.git
   code grafana-con-2026-ai-inception-workshop
   ```

2. VS Code will prompt you to "Reopen in Container" (or use the command palette: **Dev Containers: Reopen in Container**).

3. When prompted to select a configuration, choose **"GrafanaCon 2026 - AI Workshop (Local)"**.

4. Wait for the container to build (first time takes a few minutes while it installs Go, Node, and Docker).

5. Once inside the container, open a terminal and run:

   ```bash
   bash setup.sh
   ```

6. Enter the workshop password when prompted, then follow the instructions in `PROMPTS.md`.

> **Note:** The "Local" configuration uses a multi-architecture base image that works on Apple Silicon (ARM) Macs, Intel Macs, Windows, and Linux. The "Codespaces" configuration is optimized for GitHub Codespaces and only works on amd64.

---

## Option B: Fully local (no container)

If you prefer not to use Docker or Dev Containers, you can install all dependencies directly on your machine.

### Prerequisites

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

> ⚠️ **Important:** The workshop API key will stop working after the event.

**Option A (Dev Container):** No cleanup needed — just close VS Code and delete the container. Your host machine's Claude Code settings are untouched.

**Option B (Fully local):** Run the cleanup script to restore your original Claude Code configuration:

```bash
bash unsetup.sh
```

This removes the workshop proxy settings and restores any previous configuration you had.
