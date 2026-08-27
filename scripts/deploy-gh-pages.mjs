// 本地一键发布：构建前端并通过 GitHub API 把 client/dist 发布为 gh-pages 分支。
// 用法：npm run deploy:ghpages
//   - 已设置 GITHUB_TOKEN 环境变量时走 API（推荐，稳定）；
//   - 未设置时回退到 git push（依赖本机已登录的 Git 凭据）。
import { execFileSync } from 'node:child_process';
import { cpSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs';
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

/** 递归收集目录下所有文件，返回相对路径与内容。 */
function collectFiles(dir, base = '') {
  const files = [];
  for (const name of readdirSync(dir)) {
    const abs = join(dir, name);
    const rel = base ? `${base}/${name}` : name;
    if (statSync(abs).isDirectory()) {
      files.push(...collectFiles(abs, rel));
    } else {
      files.push({ path: rel.replaceAll('\\', '/'), data: readFileSync(abs) });
    }
  }
  return files;
}

async function apiDeploy() {
  const token = process.env.GITHUB_TOKEN;
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'hamster-deploy',
  };
  const jsonHeaders = { ...headers, 'Content-Type': 'application/json' };
  const base = `https://api.github.com/repos/${repo}`;

  const files = collectFiles(distDir);
  files.push({ path: '.nojekyll', data: Buffer.alloc(0) }); // 关闭 Jekyll，加速发布

  // 1. 为每个文件创建 blob
  const tree = [];
  for (const file of files) {
    const res = await fetch(`${base}/git/blobs`, {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({ content: file.data.toString('base64'), encoding: 'base64' }),
    });
    if (!res.ok) throw new Error(`创建 blob 失败 ${file.path}: ${res.status} ${await res.text()}`);
    const blob = await res.json();
    tree.push({ path: file.path, mode: '100644', type: 'blob', sha: blob.sha });
  }

  // 2. 创建 tree
  const treeRes = await fetch(`${base}/git/trees`, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({ tree }),
  });
  if (!treeRes.ok) throw new Error(`创建 tree 失败: ${treeRes.status} ${await treeRes.text()}`);
  const treeJson = await treeRes.json();

  // 3. 创建根提交（无父提交，等价于 force push）
  const commitRes = await fetch(`${base}/git/commits`, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({
      message: `deploy-${Date.now()}`,
      tree: treeJson.sha,
      parents: [],
    }),
  });
  if (!commitRes.ok) throw new Error(`创建提交失败: ${commitRes.status} ${await commitRes.text()}`);
  const commit = await commitRes.json();

  // 4. 创建或更新 gh-pages 分支引用
  const existing = await fetch(`${base}/git/ref/heads/gh-pages`, { headers });
  const updateRes = await fetch(
    existing.ok ? `${base}/git/refs/heads/gh-pages` : `${base}/git/refs`,
    {
      method: existing.ok ? 'PATCH' : 'POST',
      headers: jsonHeaders,
      body: JSON.stringify(
        existing.ok
          ? { sha: commit.sha, force: true }
          : { ref: 'refs/heads/gh-pages', sha: commit.sha },
      ),
    },
  );
  if (!updateRes.ok) throw new Error(`更新分支失败: ${updateRes.status} ${await updateRes.text()}`);

  console.log(`已发布到 gh-pages，稍后访问：${siteUrl}`);
}

function gitDeploy() {
  const pushUrl = `https://github.com/${repo}.git`;
  const work = mkdtempSync(join(tmpdir(), 'hamster-pages-'));
  try {
    cpSync(distDir, work, { recursive: true });
    const git = (...args) => run('git', args, work);
    git('init', '-b', 'gh-pages');
    git('config', 'user.name', 'deploy-bot');
    git('config', 'user.email', 'deploy-bot@users.noreply.github.com');
    git('add', '-A');
    git('commit', '-m', `deploy-${Date.now()}`);
    git('push', '-f', pushUrl, 'gh-pages:gh-pages');
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
  console.log(`已发布，稍后访问：${siteUrl}`);
}

// 1. 构建前端
run('npm', ['run', 'build'], clientDir);

// 2. 发布
if (process.env.GITHUB_TOKEN) {
  await apiDeploy();
} else {
  console.warn('未设置 GITHUB_TOKEN，改用本机 git 凭据推送。');
  gitDeploy();
}
