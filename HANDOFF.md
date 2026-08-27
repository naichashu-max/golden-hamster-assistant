# 金丝熊饲养助手 · 项目交接文档

> 用途：给接手这个项目的 AI / 开发者一个完整起点，继续美化与迭代。
> 最后更新：2026-08-27

## 1. 项目概览

面向金丝熊（叙利亚仓鼠）饲养者的移动端 Web 应用：记录成长、健康与日常，
风格温暖治愈，强调“科学饲养 + 只提醒不诊断”。已上线并带完整账号体系。

核心功能：

- 账号：邮箱注册 / 登录 / 切换账号（Supabase Auth）
- 宠物档案：名字、出生日、品种、性别、照片、性格
- 成长记录：体重/身长、体重曲线、拍立得相册（可打标签）
- 日常管理：喂食、饮水、局部铲屎、整笼大扫除，护理倒计时
- 首页快捷打卡：换凉开水 / 添主粮 / 新鲜蔬菜 / 投喂冻干
- 活动记录：夜间活动、跑轮时间、活跃度
- 健康分析：体重趋势、黄色警报、温和提醒
- 百科：食材安全速查（约 90 种）+ 垫料容积计算器
- AI 陪伴：本地规则引擎对话
- 数据备份：导出 / 导入 JSON

## 2. 线上地址与仓库

- 线上网站：https://naichashu-max.github.io/golden-hamster-assistant/
- 代码仓库：https://github.com/naichashu-max/golden-hamster-assistant
- 仓库是公开的，分支：`main`（源码）+ `gh-pages`（构建产物，勿手改）

## 3. 技术栈与运行环境

- 前端：React 18 + TypeScript + Vite 5，HashRouter，移动端优先（最大宽度 480px）
- 样式：单文件 `client/src/styles/global.css`，CSS 变量主题，无 UI 框架
- 图表：自研 SVG（`WeightChart.tsx`），无图表库
- 账号/数据库：Supabase（Postgres + Auth + RLS 行级安全）
- 后端：`server/` 是早期 Express 实现，已被 Supabase 取代，**不需要运行**
- 运行环境：Node 22.5+（推荐 24），Windows / macOS / Linux 均可

## 4. 本地启动

```bash
npm run install:all      # 安装前后端依赖
npm run dev:client       # 前端 http://localhost:5173
```

前端已在 `client/src/supabaseConfig.ts` 中填好真实项目密钥，本地即可正常登录使用。
常用命令（根目录）：

```bash
npm run build                  # 构建前端（tsc + vite）
npm run deploy:ghpages         # 构建并发布到 gh-pages（需 GITHUB_TOKEN）
npm run push:main              # 通过 GitHub API 推送源码（需 GITHUB_TOKEN）
node scripts/generate-icons.mjs  # 重新生成 PWA 图标
```

## 5. 目录结构

```
.
├── client/src/
│   ├── pages/          # 每个功能一页（见第 10 节）
│   ├── components/     # 通用组件：Card / BottomNav / WeightChart / PhotoStrip / EasterEgg
│   ├── context/
│   │   └── AppContext.tsx   # 全局状态：登录用户、当前宠物、全部记录、CRUD 操作
│   ├── lib/
│   │   ├── supabase.ts      # Supabase 客户端 + 错误翻译
│   │   ├── cloudRepo.ts     # 云仓储层：所有读写统一走这里（页面不直接碰 SDK）
│   │   ├── health.ts        # 健康引擎 + 状态文案
│   │   ├── care.ts          # 护理倒计时
│   │   ├── ai.ts            # AI 陪伴规则引擎
│   │   ├── foodData.ts      # 食材安全库
│   │   ├── constants.ts     # 周期、文案、阈值、相册标签
│   │   ├── format.ts        # 日期/时间/数字格式化
│   │   ├── image.ts         # 图片压缩（上传前缩小到 1280px JPEG）
│   │   ├── id.ts            # UUID 与时间戳
│   │   └── idb.ts / repository.ts / sync.ts  # 早期本地存储实现，已废弃，可删可留
│   ├── types/index.ts       # 领域类型（与数据库字段对应）
│   ├── styles/global.css    # 全部样式与设计变量
│   └── supabaseConfig.ts    # Supabase URL + anon key
├── supabase/migrations/     # 数据库迁移（必须逐个执行，见第 6 节）
├── scripts/                 # 图标生成、gh-pages 发布、API 推送
├── docs/                    # 产品/数据库/架构设计文档
└── server/                  # 遗留 Express 实现（可忽略）
```

## 6. 数据库（Supabase）

项目信息（anon key 是公开密钥，可以放进前端）：

- Project URL：`https://dmizbhwnlribfnlwfhda.supabase.co`
- anon public key：`sb_publishable_pJQ6b7RGJR21Sb08MM7JBg_VWKYseX7`
- project ref：`dmizbhwnlribfnlwfhda`

> ⚠️ 严禁把 `service_role` 密钥写进前端或仓库；前端只用 anon key。

数据表（都在 `public` schema，全部带 `user_id` 并启用 RLS，用户之间天然隔离）：

- `pets`：id, user_id, name, birth_date, breed, gender, photo, personality, created_at, updated_at
- `weight_records`：id, user_id, pet_id, date, weight, body_length, status, note, created_at
- `growth_photos`：id, user_id, pet_id, date, photo, caption, tag, created_at
- `feeding_records`：id, user_id, pet_id, date, time, food_type, amount, note, created_at
- `drinking_records`：id, user_id, pet_id, date, time, amount, note, created_at
- `cleaning_records`：id, user_id, pet_id, date, time, task_type('spot'|'deep'), bedding_type, note, created_at
- `activity_records`：id, user_id, pet_id, date, time, wheel_minutes, active_level, active_time_range, note, created_at
- `daily_reports`：预留，暂未使用

迁移文件（已全部在线上执行）：

- `supabase/migrations/0001_init.sql`：建表 + RLS
- `supabase/migrations/0002_cleaning_and_tags.sql`：删除洗澡表、新增清洁表、相册 tag
- `supabase/migrations/0003_record_time.sql`：喂食/饮水/清洁/活动增加 time 字段

**修改数据结构必须新增迁移 SQL（如 0004_xxx.sql），并在 Supabase 控制台
SQL Editor 中执行后，前端才能使用新字段。**

## 7. 数据流

1. `App.tsx` 未登录显示 `AuthPage`，登录后显示主路由。
2. `AppContext.tsx` 监听 `onAuthStateChange`，登录后调 `cloudRepo.listPets()`
   并加载当前宠物全部记录到内存。
3. 所有增删改走 `cloudRepo.ts`（Supabase），成功后刷新对应记录状态。
4. 单表读取失败会降级为空数组（`AppContext.loadRecords` 里的 `safe()`），
   不会因为某张表异常拖垮整个首页。

## 8. 设计系统（接手美化时从这里改）

颜色（`global.css` 的 `:root`）：

| 用途 | 值 |
| --- | --- |
| 页面背景 | `#FDFBF7` |
| 主色（奶酪黄） | `#EAA44A` |
| 主色深（温暖棕） | `#8C6D53` |
| 安全/已打卡 | `#85B79D` |
| 注意/未打卡 | `#E88A8A` |
| 正文文字 | `#4F3E31` |
| 次要文字 | `#9B8B79` |
| 卡片 | `#FFFFFF`，大圆角 24px（`--radius`），浅阴影 `--shadow-soft`，无边框 |

其余规范：

- 圆角：`--radius: 24px`、`--radius-sm: 16px`
- 阴影：极浅 `0 2px 8px rgba(140,109,83,0.06)`
- 按钮：`transition: transform 0.12s ease` + `:active { transform: scale(0.95) }`
- 字体：系统字体栈，中文优先；数字指标加粗
- 移动端优先，整体最大宽 480px；底部导航 6 项 + 右下角 AI 悬浮按钮
- 图标全部用 emoji，无图标库

注意：`WeightChart.tsx` 里有少量硬编码颜色（`#EAA44A`、`#E8C98B`、`#9B8B79`），
改主题时要一起改；彩蛋字颜色 `#4A3728` 在 `EasterEgg` 对应的 `.easter-char`。

## 9. 页面与路由

| 路由 | 页面 | 说明 |
| --- | --- | --- |
| 登录页 | `AuthPage` | 未登录时显示，含注册/登录切换、错误提示、记住上次邮箱 |
| `/` | `HomePage` | 问候卡、四胶囊打卡、黄色警报、最近照片、成长曲线 |
| `/growth` | `GrowthPage` | 体重曲线/记录、拍立得相册（标签）、体重历史 |
| `/care` | `DailyCarePage` | 护理倒计时、局部/整笼清洁、清洁与吃喝记录 |
| `/activity` | `ActivityPage` | 每日报告、活动表单、活动历史 |
| `/health` | `HealthPage` | 状态卡、黄色警报清单、趋势条、饲养提醒 |
| `/wiki` | `EncyclopediaPage` | 食材速查 + 垫料计算器 |
| `/ai` | `AiCompanionPage` | 规则引擎对话 |
| `/pet/new`、`/pet/:id` | `PetProfilePage` | 创建/编辑档案 |
| `/settings` | `SettingsPage` | 切换账号、备份、重置、说明 |

新增页面步骤：在 `pages/` 建文件 → `App.tsx` 加路由 → `BottomNav.tsx` 加导航项
（若需要）→ `global.css` 加样式。

## 10. 必须保留的业务规则（美化时不要破坏）

- 金丝熊**严禁水洗、不使用浴沙**：应用里不能出现“洗澡”功能。
- 清洁两级：局部铲屎/清尿沙 2~3 天；整笼大扫除换垫料 30~45 天。
- 成年金丝熊参考体重 120~180g；连续两次环比下降超 10% 触发黄色警报，
  清单：检查牙齿、软便、颊囊。
- 健康结论只做“饲养提醒”，绝不输出疾病诊断。
- 食材库三档：🟢安全 / 🟡微量慎食 / 🔴严禁剧毒。
- 垫料计算：容积(L) = 长×宽×厚度/1000；底面积建议 ≥ 5000 cm²。
- AI 对话不要给出医疗诊断式回答。

## 11. 数据模型速览（types/index.ts）

- `Pet`、`WeightRecord`、`GrowthPhoto(tag?)`、`FeedingRecord(time?)`、
  `DrinkingRecord(time?)`、`CleaningRecord(taskType,time?)`、`ActivityRecord(time?)`
- 日期一律 `YYYY-MM-DD`，时间 `HH:mm`，时间戳 ISO 字符串
- 字段命名：前端 camelCase，数据库 snake_case，`cloudRepo.ts` 负责互转

## 12. 发布与凭证

- 发布前端：`npm run deploy:ghpages`，脚本通过 GitHub API 把 `client/dist`
  写入 gh-pages 分支，比 git push 稳定。
- 推送源码：`npm run push:main`，同样走 GitHub API。
- 两个脚本都读环境变量 `GITHUB_TOKEN`（classic token，`repo` 权限即可）。
- **不要把 token 写进任何仓库文件**；如果 token 已在聊天中出现过，用完建议轮换。
- 网络提示：本环境直连 `github.com:443` 的 git 推送时好时坏，`api.github.com`
  稳定，所以项目内置了 API 推送脚本。

## 13. 常见坑与注意

- Windows 下 git 可能出现 “dubious ownership”，需要
  `git -c safe.directory=<项目绝对路径> <命令>`。
- CRLF/LF 警告无害，忽略即可。
- PWA 有 Service Worker 缓存：发布大改版后，若旧用户刷新仍见旧页面，
  可在 `client/public/sw.js` 里改 `CACHE_NAME` 强制刷新（目前 `golden-hamster-v1`）。
- 照片目前以 Base64 存数据库（压缩到 1280px），用户多了会占容量；
  后续建议迁到 Supabase Storage。
- 邮箱验证开关：Supabase → Authentication → Providers → Email → Confirm email。
- 备份导出/导入会覆盖当前账号全部数据，导入时保留 pet 优先顺序。

## 14. 彩蛋

应用右上角透明区域连点 5 次会出现一个字「昕」。位置：
`client/src/components/EasterEgg.tsx`，样式 `.easter-char`。可以保留。

## 15. 建议的下一步美化方向（供接手的 AI 参考）

- 页面级微动效：卡片入场、打卡成功的弹跳/撒花
- 空状态插画与新手引导（首次创建档案的引导流）
- 首页问候语按时间段变化（早安/晚安），状态更丰富
- 拍照上传迁到 Supabase Storage + 缩略图 URL
- 百科加拼音搜索、分类筛选
- 本地提醒/推送通知（喂食、换水、清洁倒计时）
- 深色模式（基于现有 CSS 变量很容易做）
- 骨架屏加载态，替代现在的“正在加载…”文案
