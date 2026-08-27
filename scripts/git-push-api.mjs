// 通过 GitHub API 推送本地 HEAD 提交（用于 git push 直连被网络阻断时）。
// 用法：设置 GITHUB_TOKEN 后运行 npm run push:main
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const token = process.env.GITHUB_TOKEN;
const repo = process.env.GITHUB_REPO ?? 'naichashu-max/golden-hamster-assistant';
const branch = process.env.GITHUB_BRANCH ?? 'main';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

if (!token) {
  console.error('请先设置 GITHUB_TOKEN 环境变量');
  process.exit(1);
}

const api = `https://api.github.com/repos/${repo}`;
const headers = {
  Authorization: `Bearer ${token}`,
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
  'User-Agent': 'hamster-push',
};

async function request(path, options = {}) {
  const requestHeaders = options.body
    ? { ...headers, 'Content-Type': 'application/json' }
    : headers;
  const res = await fetch(`${api}${path}`, { ...options, headers: requestHeaders });
  if (!res.ok) throw new Error(`${path}: ${res.status} ${await res.text()}`);
  return res.status === 204 ? null : res.json();
}

const git = (...args) =>
  execFileSync('git', ['-c', `safe.directory=${root}`, ...args], {
    cwd: root,
    encoding: 'utf8',
    shell: process.platform === 'win32',
  }).trim();

// 远端 main 当前指向的提交与 tree
const ref = await request(`/git/ref/heads/${branch}`);
const remoteCommit = await request(`/git/commits/${ref.object.sha}`);
const remoteTree = await request(`/git/trees/${remoteCommit.tree.sha}?recursive=1`);
const remoteFiles = new Map();
for (const entry of remoteTree.tree ?? []) {
  if (entry.type === 'blob') remoteFiles.set(entry.path, entry.sha);
}

// 本地工作区文件的 blob sha
const localPaths = git('ls-files').split('\n').filter(Boolean);
const localFiles = new Map();
for (const path of localPaths) {
  const sha = git('hash-object', path);
  localFiles.set(path.replaceAll('\\', '/'), sha);
}

// 计算与远端的差异：更新/新增走 blob 上传，删除用 null sha
const changes = [];
for (const [path, sha] of localFiles) {
  if (remoteFiles.get(path) === sha) continue;
  const content = readFileSync(join(root, path));
  const blob = await request('/git/blobs', {
    method: 'POST',
    body: JSON.stringify({ content: content.toString('base64'), encoding: 'base64' }),
  });
  if (blob.sha !== sha) throw new Error(`blob sha 不一致：${path}`);
  changes.push({ path, mode: '100644', type: 'blob', sha });
}
for (const path of remoteFiles.keys()) {
  if (!localFiles.has(path)) {
    changes.push({ path, mode: '100644', type: 'blob', sha: null });
  }
}

if (changes.length === 0) {
  console.log('没有需要推送的变更');
  process.exit(0);
}

const newTree = await request('/git/trees', {
  method: 'POST',
  body: JSON.stringify({ base_tree: remoteCommit.tree.sha, tree: changes }),
});

const message = git('log', '-1', '--pretty=%B');
const commit = await request('/git/commits', {
  method: 'POST',
  body: JSON.stringify({ message, tree: newTree.sha, parents: [ref.object.sha] }),
});

await request(`/git/refs/heads/${branch}`, {
  method: 'PATCH',
  body: JSON.stringify({ sha: commit.sha, force: false }),
});

console.log(`已推送提交 ${commit.sha} 到 ${branch}`);
