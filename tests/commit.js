const { execSync } = require('child_process');
const path = require('path');

const gitCmdDir = path.join(
  process.env.LOCALAPPDATA || '',
  'Microsoft',
  'WinGet',
  'Packages',
  'Git.MinGit_Microsoft.Winget.Source_8wekyb3d8bbwe',
  'cmd'
);

const env = {
  ...process.env,
  PATH: `${gitCmdDir};${process.env.PATH}`,
};

try {
  execSync('git add tests/commit.js', { env, stdio: 'inherit' });
  execSync('git commit -m "chore: add git helper script"', { env, stdio: 'inherit' });
  execSync('git log -n 2 --oneline', { env, stdio: 'inherit' });
  execSync('git status', { env, stdio: 'inherit' });
} catch (err) {
  console.error('Git operation failed:', err.message);
  process.exit(1);
}
