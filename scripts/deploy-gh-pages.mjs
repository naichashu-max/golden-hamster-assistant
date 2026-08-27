// 本地一键发布：构建前端并把 client/dist 推送到 gh-pages 分支。
// 用法：npm run deploy:ghpages（未配置本机 Git 凭据时，先设置 GITHUB_TOKEN 环境变量）
import { execFileSync } from 'node:child_process';
import { cpSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const clientDir = join(root, 'client');
const distDir = join(clientDir, 'dist');
const repo = 'naichashu-max/golden-hamster-assistant';
const siteUrl = `https://naichashu-max.github.io/golden-hamster-assistant/`;

const run = (cmd, args, cwd) =>
  execFileSync(cmd, args, {
    cwd,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });

// 1. 构建前端
run('npm', ['run', 'build'], clientDir);

// 2. 把构建产物放进一个干净的临时 Git 仓库，强推 gh-pages 分支
const token = process.env.GITHUB_TOKEN;
const pushUrl = token
  ? `https://x-access-token:${token}@github.com/${repo}.git`
  : `https://github.com/${repo}.git`;

const work = mkdtempSync(join(tmpdir(), 'hamster-pages-'));
try {
  cpSync(distDir, work, { recursive: true });
  const git = (...args) => run('git', args, work);
  git('init', '-b', 'gh-pages');
  git('config', 'user.name', 'deploy-bot');
  git('config', 'user.email', 'deploy-bot@users.noreply.github.com');
  git('add', '-A');
  git('commit', '-m', `deploy ${new Date().toISOString()}`);
  git('push', '-f', pushUrl, 'gh-pages:gh-pages');
} finally {
  rmSync(work, { recursive: true, force: true });
}

console.log(`已发布，稍后访问：${siteUrl}`);
