# 金丝熊饲养助手

一只温暖、简洁、治愈的金丝熊成长手账。记录它每天的吃喝、跑轮、体重与心情，
让日常照料更有确定感。默认本地保存，预留云同步接口；只做饲养提醒，不做疾病诊断。

## 功能

- **宠物档案**：名字、出生日、品种、性别、照片、性格描述
- **成长记录**：每日体重/身长、体重变化曲线、成长相册
- **日常管理**：喂食、饮水、换垫料、洗澡，自动计算距离下次护理时间
- **活动记录**：夜间活动、跑轮时间、活跃度、每日报告
- **健康分析**：基于体重/食量/活跃度趋势生成 0-100 评分与温和提醒
- **AI 陪伴**：依据历史记录，对“今天不怎么出来”这类问题给出温和建议

## 技术栈

- 前端：React 18 + TypeScript + Vite，移动端优先，自研轻量 SVG 图表
- 后端：Express + TypeScript + Node 内置 SQLite（`node:sqlite`）
- 本地存储：IndexedDB（照片以 Base64 保存）
- 云同步：仓储层写入同步队列，`SyncAdapter` 可替换实现

## 目录结构

```
.
├── docs/                       # 产品 / 数据库 / 架构 / 开发计划
├── client/                     # 前端
│   ├── src/
│   │   ├── components/         # 复用 UI：卡片、圆环、曲线、照片、导航、彩蛋
│   │   ├── context/            # 全局状态
│   │   ├── lib/                # 存储、算法、AI、同步、格式化
│   │   ├── pages/              # 首页、成长、日常、活动、健康、AI、档案
│   │   ├── styles/             # 主题样式
│   │   └── types/              # 领域类型
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
└── server/                     # 后端（云同步与 AI API）
    ├── src/
    │   ├── db/                 # SQLite 连接与 schema
    │   ├── routes/             # 宠物、记录、健康、AI
    │   ├── services/           # 健康评分、AI 建议
    │   └── index.ts
    └── package.json
```

## 快速开始

> 需要 Node 22.5+（推荐 Node 24），因为后端使用内置 `node:sqlite`。

```bash
# 1. 安装前后端依赖
npm run install:all

# 2. 启动前端（默认 http://localhost:5173）
npm run dev:client
```

首次打开会自动载入一份示例档案（团子），可直接体验完整界面。

如需启动预留的云同步/AI 后端：

```bash
npm run dev:server   # 默认 http://localhost:4000
```

## 数据与同步

所有记录默认写入浏览器 IndexedDB，离线可用。`lib/repository.ts` 在每次写操作后
会把变更写入 `sync_queue`；`lib/sync.ts` 通过 `SyncAdapter` 抽象推送/拉取逻辑，
当前使用 `LocalOnlyAdapter`，未来替换为 REST 适配器即可接入云端。

设计文档见 `docs/`：

- `product-design.md`：产品定位与视觉规范
- `database-design.md`：字段契约与 SQL schema
- `architecture.md`：分层与同步/AI 抽象

## 在线访问与分享

已在线部署，直接访问：

**https://naichashu-max.github.io/golden-hamster-assistant/**

前端是纯静态站点，数据保存在每个人自己的浏览器里，互相不可见。把链接发给朋友，
手机浏览器打开后从菜单选择「添加到主屏幕」，即可像原生 App 一样使用并离线打开。

更新网站：本地修改后运行 `npm run deploy:ghpages` 一键重新发布
（未配置本机 Git 凭据时，先设置 `GITHUB_TOKEN` 环境变量）。
图标可用 `node scripts/generate-icons.mjs` 重新生成。

注意：换手机前请在「设置 → 数据备份」导出备份文件。

可选进阶：把 `server/` 部署到 Render / Fly.io 等平台，并在 `client/src/lib/sync.ts`
中把 `LocalOnlyAdapter` 换成 REST 适配器，即可启用云同步。

## 开发者彩蛋

在应用右上角连续轻点 5 次，会出现一个字。
