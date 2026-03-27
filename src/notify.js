const { execSync, spawn } = require('node:child_process');
const { readDebounceTimestamp, writeDebounceTimestamp, readConfig, getTerminalNotifierPath } = require('./config.js');
const { detectTerminal, buildFocusScript, isTerminalFocused, shortenPath } = require('./terminal.js');

function parseHookEvent(raw) {
  try {
    const data = JSON.parse(raw);
    const eventName = data.hook_event_name;
    const cwd = data.cwd || '';
    const sessionId = data.session_id || 'unknown';
    const notificationType = data.notification_type || '';
    const message = data.message || '';

    let subtitle;
    let body = shortenPath(cwd);

    if (eventName === 'Notification' && notificationType === 'permission_prompt') {
      subtitle = 'Needs permission';
      if (message) body = `${shortenPath(cwd)} — "${message}"`;
    } else if (eventName === 'Stop') {
      subtitle = 'Ready for input';
    } else {
      subtitle = 'Waiting for you';
    }

    return { sessionId, cwd, eventName, notificationType, subtitle, body, message };
  } catch {
    return null;
  }
}

function buildNotificationArgs(event, tnPath, focusCommand) {
  const args = [
    tnPath,
    '-title', 'Claude Code',
    '-subtitle', event.subtitle,
    '-message', event.body,
    '-sound', 'default',
    '-group', `claude-notify-${event.sessionId}`,
  ];

  if (focusCommand) {
    args.push('-execute', focusCommand);
  }

  return args;
}

function shouldNotify(sessionId, debounceSeconds, base) {
  const lastTs = readDebounceTimestamp(sessionId, base);
  const elapsed = (Date.now() - lastTs) / 1000;
  return elapsed >= debounceSeconds;
}

async function handleHookEvent() {
  // Read JSON from stdin
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString('utf8').trim();
  if (!raw) return;

  const event = parseHookEvent(raw);
  if (!event) return;

  const config = readConfig();

  // Debounce check
  if (!shouldNotify(event.sessionId, config.debounceSeconds)) return;

  // Active window check — skip notification if user is already looking at this session
  const terminal = config.terminal || detectTerminal();
  if (isTerminalFocused(terminal, event.cwd)) return;

  // Build focus command for click action
  const focusScript = buildFocusScript(terminal, event.cwd);
  const focusCommand = `osascript -e '${focusScript.replace(/'/g, "'\\''")}'`;

  // Send notification
  const tnPath = getTerminalNotifierPath();
  const args = buildNotificationArgs(event, tnPath, focusCommand);

  try {
    execSync(args.map((a) => `'${a.replace(/'/g, "'\\''")}'`).join(' '), {
      stdio: 'pipe',
      timeout: 5000,
    });
  } catch {
    // Fallback: use osascript if terminal-notifier isn't available
    try {
      execSync(
        `osascript -e 'display notification "${event.body}" with title "Claude Code" subtitle "${event.subtitle}" sound name "default"'`,
        { stdio: 'pipe', timeout: 5000 }
      );
    } catch {}
  }

  // Update debounce timestamp
  writeDebounceTimestamp(event.sessionId, Date.now());
}

async function sendTestNotification() {
  const config = readConfig();
  const terminal = config.terminal || detectTerminal();
  const tnPath = getTerminalNotifierPath();

  console.log('  Sending test notification...');

  try {
    execSync(
      [tnPath, '-title', 'Claude Code', '-subtitle', 'Test notification', '-message', 'claude-notify is working!', '-sound', 'default']
        .map((a) => `'${a.replace(/'/g, "'\\''")}'`)
        .join(' '),
      { stdio: 'pipe', timeout: 5000 }
    );
    console.log('  Test notification sent!');
  } catch {
    // Fallback
    try {
      execSync(
        `osascript -e 'display notification "claude-notify is working!" with title "Claude Code" subtitle "Test notification" sound name "default"'`,
        { stdio: 'pipe', timeout: 5000 }
      );
      console.log('  Test notification sent! (via osascript fallback)');
    } catch (err) {
      console.log(`  Failed to send notification: ${err.message}`);
    }
  }
}

module.exports = {
  parseHookEvent,
  buildNotificationArgs,
  shouldNotify,
  handleHookEvent,
  sendTestNotification,
};
