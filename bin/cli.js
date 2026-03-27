#!/usr/bin/env node

const command = process.argv[2];

const HELP = `
claude-notify — macOS notifications for Claude Code

Commands:
  install     Add notification hooks to Claude Code
  uninstall   Remove notification hooks
  status      Check if hooks are active
  test        Send a test notification
  notify      (internal) Called by Claude Code hooks

Options:
  --help      Show this help
  --version   Show version
`;

async function main() {
  if (command === '--version' || command === '-v') {
    const pkg = require('../package.json');
    console.log(pkg.version);
    return;
  }

  if (command === 'install') {
    const { install } = require('../src/install.js');
    await install();
  } else if (command === 'uninstall') {
    const { uninstall } = require('../src/install.js');
    await uninstall();
  } else if (command === 'status') {
    const { status } = require('../src/install.js');
    await status();
  } else if (command === 'test') {
    const { sendTestNotification } = require('../src/notify.js');
    await sendTestNotification();
  } else if (command === 'notify') {
    const { handleHookEvent } = require('../src/notify.js');
    await handleHookEvent();
  } else {
    console.log(HELP.trim());
  }
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
