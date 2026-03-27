# claude-notify

> Native macOS notifications when Claude Code needs you. Click to jump to the right terminal.

Running 12 Claude Code sessions across multiple terminals? Stop tab-surfing. `claude-notify` pings you the second any session needs input — and clicking the notification takes you straight there.

## Install

```bash
npm install -g claude-notify
claude-notify install
```

That's it. Every Claude Code session on your machine will now notify you when it's waiting for input or needs permission. No background processes, no polling — it hooks directly into Claude Code.

## What you'll see

When Claude finishes a response or needs permission:

- **"Ready for input"** — Claude is done and waiting for your next prompt
- **"Needs permission"** — Claude wants to run a tool and needs your OK (shows the exact command)

Notifications include the project folder name so you know exactly which session needs you.

## What it does

- **Hooks into Claude Code natively** — uses the built-in [hooks system](https://docs.anthropic.com/en/docs/claude-code/hooks), zero background processes
- **Smart notifications** — debounces rapid-fire events, skips if you're already looking at the terminal
- **Click to focus** — click the notification to jump to the exact terminal tab
- **Works globally** — one install covers all current and future sessions
- **Permission-aware** — shows what Claude needs permission for

## Commands

```bash
claude-notify install     # Add hooks to Claude Code
claude-notify uninstall   # Remove hooks cleanly
claude-notify status      # Check if active
claude-notify test        # Send a test notification
```

## How it works

Claude Code has a [hooks system](https://docs.anthropic.com/en/docs/claude-code/hooks) that fires shell commands on lifecycle events. `claude-notify` registers two hooks in your global `~/.claude/settings.json`:

- **`Stop`** — fires when Claude finishes responding and is ready for your next prompt
- **`Notification`** — fires when Claude needs permission to run a tool

When a hook fires, `claude-notify` reads the event data from stdin, checks if you're already focused on that terminal (skips if so), applies a 5-second debounce to avoid spam, and sends a native macOS notification via [terminal-notifier](https://github.com/julienXX/terminal-notifier).

## Supported terminals

| Terminal | Click-to-focus |
|----------|---------------|
| iTerm2 | Finds and activates the exact tab |
| Terminal.app | Finds and activates the exact tab |
| Warp | Activates the app |
| Kitty | Activates the app |
| Alacritty | Activates the app |

## Requirements

- macOS
- Node.js 18+
- Claude Code with hooks support

## Troubleshooting

**No notifications appearing?**
- Check macOS **System Settings > Notifications > terminal-notifier** — make sure banner style is set to "Banners" or "Alerts"
- Run `claude-notify test` to verify the notification pipeline works
- Run `claude-notify status` to confirm hooks are active

**Notification sound but no banner?**
- Same fix — set the alert style to "Banners" in System Settings

## Uninstall

```bash
claude-notify uninstall
npm uninstall -g claude-notify
```

Clean removal — only touches the hooks it added, leaves all your other Claude Code settings intact.

## License

MIT
