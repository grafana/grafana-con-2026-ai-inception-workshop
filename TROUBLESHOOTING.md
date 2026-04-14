# Troubleshooting

Common issues encountered during the workshop and how to fix them.

## Clipboard not working in Codespaces

If you see the error **"Unable to read from the browser's clipboard"** when trying to paste into the Codespace terminal:

1. Click the lock/tune icon in your browser's address bar (to the left of the URL).
2. Find **Clipboard** and toggle it **on**.
3. Reload the page.

This is a browser permission — Codespaces needs explicit clipboard access for the `.github.dev` domain.

## Port forwarding not working

If port 3000 is not showing up in the Ports tab, or the forwarded URL returns an error:

1. Try stopping and restarting the Grafana server (`Ctrl+C` then `npm run server` again).
2. If that doesn't help, rebuild the Codespace:
   ```
   gh codespace rebuild
   ```
   This will recreate the environment from scratch. You'll need to run `bash setup.sh` again afterward.

## Claude Code started in the wrong folder

If Claude doesn't seem to know about your plugin or refuses to make changes, you're probably in the workshop root folder instead of your plugin folder. Exit Claude (`/exit` or `Ctrl+C`), then:

```
cd aiworkshop-bcapi-datasource   # for Milestone 1
cd aiworkshop-bcapi-app           # for Milestone 2+
claude
```

You can verify you're in the right place by running `/skills` — you should see `validate-plugin` and `build-plugin`.

## Backend changes not taking effect

The Go backend does **not** hot-reload. After any backend code change, you must restart the Grafana server:

1. Go to the terminal running `npm run server`.
2. Press `Ctrl+C` to stop it.
3. Run `npm run server` again.

The frontend dev server (`npm run dev`) picks up changes automatically — no restart needed for frontend-only changes.

## "No data" in Explore

If you see "No data" in Grafana's Explore view right after scaffolding the data source — **this is expected**. The scaffolded plugin doesn't fetch data yet. Follow the Milestone 1 prompts to implement the API queries.

## Forgetting to run all three terminals

Each milestone requires **three terminal tabs** running simultaneously:

1. `npm run dev` — frontend build watcher
2. `npm run server` — Grafana with your plugin
3. `claude` — Claude Code

If any of these is missing, things won't work as expected. Check that all three are running.

## Grafana UI not reflecting plugin changes

If you've made changes but the Grafana UI looks outdated:

- **Hard refresh** the browser: `Ctrl+Shift+R` (or `Cmd+Shift+R` on Mac).
- Make sure `npm run dev` is still running and didn't crash.
- For backend changes, make sure you restarted `npm run server` (see above).

## `setup.sh` fails with "Invalid password"

The workshop password is shared by the instructor at the start of the session. If you missed it, ask a proctor. The script allows 3 attempts before locking out — if you've been locked out, just run `bash setup.sh` again.

## Docker issues (local setup only)

If `npm run server` fails with Docker-related errors:

- Make sure Docker is **running** (not just installed).
- Verify with: `docker run --rm hello-world`
- On macOS, check that Docker Desktop is open. On Linux, check the daemon: `systemctl status docker`
