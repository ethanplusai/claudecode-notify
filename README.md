# claude-notify

> Native macOS notifications when Claude Code needs you. Click to jump to the right terminal.

Running 12 Claude Code sessions? Stop tab-surfing. `claude-notify` tells you exactly when and where you're needed.

## Install

```bash
npm install -g claude-notify
claude-notify install
```

That's it. Every Claude Code session on your machine will now send you a notification when it's waiting for input or needs permission.

## What it does

- **Hooks into Claude Code natively** — uses the built-in hooks system, no polling or background processes
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

Claude Code has a [hooks system](https://docs.anthropic.com/en/docs/claude-code/hooks) that fires events when things happen. `claude-notify` registers two hooks in your global `~/.claude/settings.json`:

- **`Stop`** — fires when Claude finishes responding and is ready for your next prompt
- **`Notification`** — fires when Claude needs permission to run a tool

When either event fires, `claude-notify` reads the event data, checks if you're already focused on that terminal (skips if so), debounces rapid events, and sends a native macOS notification via `terminal-notifier`.

## Supported terminals

- iTerm2 (full tab focus)
- Terminal.app (full tab focus)
- Warp (app activation)
- Kitty (app activation)
- Alacritty (app activation)

## Requirements

- macOS
- Node.js 18+
- Claude Code with hooks support

## Uninstall

```bash
claude-notify uninstall
npm uninstall -g claude-notify
```

## License

MIT
