const { execSync } = require('node:child_process');
const os = require('node:os');

function detectTerminal() {
  const termProgram = process.env.TERM_PROGRAM;
  if (termProgram) {
    if (termProgram.includes('iTerm')) return 'iTerm2';
    if (termProgram === 'Apple_Terminal') return 'Terminal.app';
    if (termProgram === 'WarpTerminal') return 'Warp';
    if (termProgram === 'kitty') return 'kitty';
    if (termProgram === 'Alacritty') return 'Alacritty';
  }

  try {
    const ps = execSync('ps -eo comm= 2>/dev/null', { encoding: 'utf8' });
    if (ps.includes('iTerm2')) return 'iTerm2';
    if (ps.includes('Warp')) return 'Warp';
    if (ps.includes('kitty')) return 'kitty';
    if (ps.includes('Alacritty')) return 'Alacritty';
    if (ps.includes('Terminal')) return 'Terminal.app';
  } catch {}

  return 'unknown';
}

function buildFocusScript(terminal, cwd) {
  const escaped = cwd.replace(/'/g, "'\\''");

  switch (terminal) {
    case 'iTerm2':
      return `
tell application "iTerm2"
  activate
  set found to false
  repeat with w in windows
    repeat with t in tabs of w
      repeat with s in sessions of t
        if name of s contains "${escaped}" or name of s contains "${shortenPath(cwd)}" then
          select t
          set found to true
          exit repeat
        end if
      end repeat
      if found then exit repeat
    end repeat
    if found then
      set index of w to 1
      exit repeat
    end if
  end repeat
end tell`;

    case 'Terminal.app':
      return `
tell application "Terminal"
  activate
  set found to false
  repeat with w in windows
    repeat with t in tabs of w
      if custom title of t contains "${escaped}" or history of t contains "${escaped}" then
        set selected tab of w to t
        set index of w to 1
        set found to true
        exit repeat
      end if
    end repeat
    if found then exit repeat
  end repeat
end tell`;

    case 'Warp':
      return `tell application "Warp" to activate`;

    case 'kitty':
      return `do shell script "open -a kitty"`;

    case 'Alacritty':
      return `do shell script "open -a Alacritty"`;

    default:
      return `
tell application "System Events"
  set frontApp to name of first application process whose frontmost is true
end tell
tell application frontApp to activate`;
  }
}

function isTerminalFocused(terminal, cwd) {
  try {
    const frontApp = execSync(
      `osascript -e 'tell application "System Events" to get name of first application process whose frontmost is true'`,
      { encoding: 'utf8' }
    ).trim();

    const terminalNames = {
      'iTerm2': 'iTerm2',
      'Terminal.app': 'Terminal',
      'Warp': 'Warp',
      'kitty': 'kitty',
      'Alacritty': 'Alacritty',
    };

    const expectedName = terminalNames[terminal];
    if (!expectedName || !frontApp.includes(expectedName)) return false;

    if (terminal === 'iTerm2') {
      const currentPath = execSync(
        `osascript -e 'tell application "iTerm2" to tell current session of current tab of current window to get variable named "path"'`,
        { encoding: 'utf8' }
      ).trim();
      return currentPath === cwd || currentPath.endsWith(cwd.replace(os.homedir(), ''));
    }

    return false;
  } catch {
    return false;
  }
}

function shortenPath(fullPath) {
  const home = os.homedir();
  if (fullPath.startsWith(home)) {
    return '~' + fullPath.slice(home.length);
  }
  return fullPath;
}

module.exports = {
  detectTerminal,
  buildFocusScript,
  isTerminalFocused,
  shortenPath,
};
