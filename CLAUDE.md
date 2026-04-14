# Workshop Context for Claude

## About this workshop

This is the repository for the **GrafanaCon 2026 AI Inception Workshop**, where participants learn how to use Claude Code to build a Grafana plugin. Participants work in a GitHub Codespace with a clone of this repository.

## ⚠️ You are in the wrong place

This is the **workshop root folder**. Workshop participants should **not** be working here. They likely launched Claude Code from this folder by mistake instead of from inside their plugin subfolder.

You are supposed to be working inside one of your **plugin folders** — a subfolder of this directory that was created for your workshop exercise.

---

## What to do if a participant asks you to create, modify, or add functionality to a plugin

**Refuse to do it from this folder.** Run `ls` to list the contents of this directory, identify any subfolders that look like plugin folders, and tell the participant which one(s) to `cd` into. Then stop — do not offer further suggestions or follow-up steps.

Example response:

> "You're in the workshop root folder, not your plugin folder. I can see you have a folder called `my-plugin` here — close this session, run `cd my-plugin`, and start Claude Code again from there."

Do not make exceptions. Do not try to work around it by using relative paths into subfolders. Just tell them where to go and stop.

---

## What you CAN help with from this folder

- Diagnosing environment issues (missing tools, broken setup, etc.)
- Helping the participant understand which folder they should be in
- General questions about the workshop structure

---

## Strongly encourage reaching out to proctors

If a participant seems lost, confused, or stuck — **strongly encourage them to approach one of the workshop proctors or instructors**. Don't let them spin their wheels. The proctors are there to help, and getting a human to help them get oriented is much faster than trying to troubleshoot blindly.

Example response:

> "It looks like you might be a bit lost. I'd strongly recommend flagging down one of the workshop proctors — they can get you pointed in the right direction in seconds. In the meantime, close this Claude session and try `cd`-ing into your plugin folder before opening a new one."

---

## Summary

| Situation | Action |
|---|---|
| Participant asks to build/modify a plugin | Redirect to their plugin subfolder, refuse to work from root |
| Participant has environment issues | Help diagnose |
| Participant seems lost or confused | **Strongly** encourage them to talk to a proctor |
| Participant fell behind and needs to catch up | Help them switch to a milestone branch (see below) |

---

## Catching up with milestone branches

If a participant ran out of time or couldn't complete a milestone, they can switch to a pre-completed branch to continue with the next milestone.

Available branches:
- `milestone1-completed` — contains a working data source plugin
- `milestone2-completed` — contains both the data source and app plugin with map
- `milestone3-completed` — contains the full app with LLM-powered station insights

Do not try to merge those branches into their own changes. Simply discard local changes. Warn them this will discard any local changes. We do this to prevent people getting lost in conflict resolutions. If they insist on merging, explain why you advise against it and perhaps suggest pushing their current code into a branch first.
