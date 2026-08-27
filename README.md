# 金丝熊饲养助手

一只温暖、简洁、治愈的金丝熊成长手账。记录它每天的吃喝、跑轮、体重与心情，
让日常照料更有确定感。支持注册账号，数据保存在云端数据库，换设备登录同一账号即可继续记录；
只做饲养提醒，不做疾病诊断。

## 功能

- **账号**：邮箱注册 / 登录 / 退出，密码由 Supabase Auth 安全保存
- **宠物档案**：名字、出生日、品种、性别、照片、性格描述
- **成长记录**：每日体重/身长、体重变化曲线、拍立得时光相册（专属标签）
- **日常管理**：喂食、饮水、局部铲屎/清尿沙、整笼大扫除换垫料，自动计算下次护理时间
- **今日打卡**：首页一键打卡（换凉开水 / 添主粮 / 新鲜蔬菜 / 投喂冻干）
- **活动记录**：夜间活动、跑轮时间、活跃度、每日报告
- **健康分析**：120~180g 参考区间、连续下降黄色警报与排查清单、温和饲养提醒
- **AI 陪伴**：依据历史记录，对“今天不怎么出来”这类问题给出温和建议
- **百科小助手**：“金丝熊能吃吗”食材速查 + 垫料容积计算器
- **数据备份**：一键导出 / 导入 JSON

## 技术栈

- 前端：React 18 + TypeScript + Vite，移动端优先，PWA 可安装到主屏幕
- 账号：Supabase Auth（邮箱 + 密码）
- 数据库：Supabase Postgres，行级安全（RLS）保证每人只能读写自己的数据
- AI 陪伴：本地规则引擎，无需外部模型即可使用

## 在线访问

**https://naichashu-max.github.io/golden-hamster-assistant/**

打开后先注册账号（邮箱 + 密码）再使用；手机浏览器菜单选「添加到主屏幕」可像 App 一样使用。

## 目录结构

```
.
├── docs/                       # 产品 / 数据库 / 架构 / 开发计划
├── supabase/
│   └── migrations/             # 云数据库建表与权限策略（一次性执行）
├── client/                     # 前端
│   ├── src/
│   │   ├── components/         # 复用 UI 组件
│   │   ├── context/            # 账号与全局状态
│   │   ├── lib/                # Supabase 客户端、云仓储、算法、AI
│   │   ├── pages/              # 登录注册与各功能页
│   │   ├── styles/             # 主题样式
│   │   ├── types/              # 领域类型
│   │   └── supabaseConfig.ts   # 填入 Supabase 项目密钥
│   └── package.json
├── scripts/                    # 图标生成、一键发布
└── server/                     # 早期预留的 Express 实现（现由 Supabase 取代，留作参考）
```

## 本地开发

> 需要 Node 22.5+（推荐 Node 24）。

```bash
npm run install:all
npm run dev:client   # 默认 http://localhost:5173
```

本地开发同样依赖 Supabase：先在 `client/src/supabaseConfig.ts` 中填入项目密钥，
否则应用只会显示登录页和配置提示。

## 一次性配置 Supabase（账号 + 数据库）

1. 到 [supabase.com](https://supabase.com) 注册，点击 **New project** 创建免费项目。
2. 打开左侧 **SQL Editor**，把 `supabase/migrations/0001_init.sql` 的内容完整粘贴并执行，
   这会创建数据表与“每人只能看自己数据”的权限策略。
3. 打开 **Project Settings → API**，复制 **Project URL** 和 **anon public key**，
   填入 `client/src/supabaseConfig.ts`（anon key 是公开密钥，可以安全提交）。
4. 重新发布：`npm run deploy:ghpages`。
5. 可选：
   - 想让用户注册后立即登录（跳过邮箱验证）：**Authentication → Providers → Email**，
     关闭 **Confirm email**（更便捷，但保留验证更安全）。
   - 把 **Authentication → URL Configuration → Site URL** 设为线上地址，
     邮箱验证链接才能正确跳回应用。

> 不要把 `service_role` 密钥放进前端，前端只需要 anon public key。

## 更新网站

本地修改后运行一条命令重新发布前端：

```bash
npm run deploy:ghpages
```

未配置本机 Git 凭据时，先设置 `GITHUB_TOKEN` 环境变量。
应用图标可用 `node scripts/generate-icons.mjs` 重新生成。

设计文档见 `docs/`：

- `product-design.md`：产品定位与视觉规范
- `database-design.md`：字段契约
- `architecture.md`：分层与数据流

## 开发者彩蛋

在应用右上角连续轻点 5 次，会出现一个字。
