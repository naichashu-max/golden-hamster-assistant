# 项目架构

## 1. 总体结构

```
金丝熊饲养助手/
├── README.md
├── package.json              # 根脚本：一键安装/启动 client、server
├── docs/                     # 设计文档（本文档所在目录）
├── client/                   # 前端：React + TypeScript + Vite
└── server/                   # 后端：Express + TypeScript + SQLite
```

## 2. 前端分层

```
client/src/
├── pages/         # 页面级组件（每个功能一页）
├── components/    # 可复用 UI 组件
├── context/       # 全局状态（宠物、记录、导航）
├── lib/           # 纯逻辑：存储、算法、同步、格式化
│   ├── idb.ts         # IndexedDB 封装（本地保存）
│   ├── repository.ts  # 仓储层：统一读写入口
│   ├── care.ts        # 护理周期计算
│   ├── health.ts      # 健康评分引擎
│   ├── ai.ts          # AI 陪伴规则引擎
│   ├── sync.ts        # 云同步接口预留
│   └── format.ts      # 格式化工具
├── types/         # 领域类型定义
└── styles/        # 主题与全局样式
```

关键原则：
- **页面不直接碰 IndexedDB**，统一走 `repository.ts`。
- **算法纯函数**，方便单元测试。
- **AI / 同步通过接口抽象**，本地实现与云端实现可替换。

## 3. 后端分层

```
server/src/
├── index.ts          # 入口：Express + 中间件 + 路由挂载
├── db/
│   ├── schema.sql    # 建表脚本
│   └── database.ts   # SQLite 连接与初始化
├── routes/           # REST 路由
└── services/         # 健康评分、AI 建议等业务逻辑
```

## 4. 本地存储与云同步

数据默认写入 IndexedDB（`idb.ts`）。`repository.ts` 在每次写操作后，
把变更推入 `sync_queue`；`sync.ts` 暴露：

```ts
interface SyncAdapter {
  push(queue: SyncItem[]): Promise<void>;
  pull(since: number): Promise<RemoteChange[]>;
}
```

当前默认使用 `LocalOnlyAdapter`（空实现），未来替换为调用 `server` 的
`REST` 适配器即可，业务层无需改动。

## 5. AI 服务抽象

```ts
interface AiAdapter {
  reply(input: string, context: PetContext): Promise<string>;
}
```

- `RuleBasedAiAdapter`：本地规则引擎，基于历史记录给出温和建议。
- `CloudAiAdapter`：预留，接入大模型，由 `server/api/ai` 代理。

## 6. 技术选型

- 前端：React 18 + TypeScript + Vite，CSS 变量主题，移动端优先。
- 图表：自研轻量 SVG 折线，减少依赖、风格可控。
- 后端：Express 5 + better-sqlite3（同步 API，代码简洁）。
