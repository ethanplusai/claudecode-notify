const { test, describe } = require('node:test');
const assert = require('node:assert');
const os = require('node:os');
const path = require('node:path');

const { parseHookEvent, buildNotificationArgs, shouldNotify } = require('../src/notify.js');

describe('notify - parseHookEvent', () => {
  test('parses Stop event JSON', () => {
    const json = JSON.stringify({
      session_id: 'abc123',
      cwd: '/Users/test/project',
      hook_event_name: 'Stop',
    });
    const event = parseHookEvent(json);
    assert.strictEqual(event.sessionId, 'abc123');
    assert.strictEqual(event.cwd, '/Users/test/project');
    assert.strictEqual(event.eventName, 'Stop');
    assert.strictEqual(event.subtitle, 'Ready for input');
  });

  test('parses Notification permission_prompt event', () => {
    const json = JSON.stringify({
      session_id: 'abc123',
      cwd: '/Users/test/project',
      hook_event_name: 'Notification',
      notification_type: 'permission_prompt',
      title: 'Permission needed',
      message: 'Allow Bash: npm test?',
    });
    const event = parseHookEvent(json);
    assert.strictEqual(event.subtitle, 'Needs permission');
    assert.ok(event.body.includes('npm test'));
  });

  test('returns null for invalid JSON', () => {
    const event = parseHookEvent('not json');
    assert.strictEqual(event, null);
  });
});

describe('notify - buildNotificationArgs', () => {
  test('builds correct args for Stop event', () => {
    const event = {
      sessionId: 'abc',
      cwd: '/Users/test/project',
      eventName: 'Stop',
      subtitle: 'Ready for input',
      body: '~/project',
    };
    const args = buildNotificationArgs(event, '/path/to/terminal-notifier', 'echo focus');
    assert.ok(args.includes('-title'));
    assert.ok(args.includes('Claude Code'));
    assert.ok(args.includes('-subtitle'));
    assert.ok(args.includes('Ready for input'));
    assert.ok(args.includes('-sound'));
  });
});

describe('notify - shouldNotify', () => {
  test('returns true when no recent notification', () => {
    const TEST_DIR = path.join(os.tmpdir(), 'cn-test-' + Date.now());
    const result = shouldNotify('new-session', 5, TEST_DIR);
    assert.strictEqual(result, true);
  });

  test('returns false within debounce window', () => {
    const TEST_DIR = path.join(os.tmpdir(), 'cn-test-' + Date.now());
    const { writeDebounceTimestamp } = require('../src/config.js');
    writeDebounceTimestamp('debounce-test', Date.now(), TEST_DIR);
    const result = shouldNotify('debounce-test', 5, TEST_DIR);
    assert.strictEqual(result, false);
  });

  test('returns true after debounce window expires', () => {
    const TEST_DIR = path.join(os.tmpdir(), 'cn-test-' + Date.now());
    const { writeDebounceTimestamp } = require('../src/config.js');
    writeDebounceTimestamp('expired-test', Date.now() - 10000, TEST_DIR);
    const result = shouldNotify('expired-test', 5, TEST_DIR);
    assert.strictEqual(result, true);
  });
});
