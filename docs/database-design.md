# 数据库设计

## 1. 设计说明

- 客户端：IndexedDB（对象存储，`keyPath: "id"`），可存照片 Base64。
- 服务端：SQLite（`better-sqlite3`），作为未来云同步的权威数据源。
- 两端字段保持同名同义，以本文档为契约。
- 所有表都带 `id`、`createdAt`、`updatedAt`；业务时间字段带 `date`（YYYY-MM-DD）。

## 2. 实体关系

`pet 1 ── n weight_record / growth_photo / feeding_record / drinking_record /
bedding_record / bath_record / activity_record / daily_report`

所有记录通过 `petId` 归属到某只金丝熊。

## 3. 表结构（SQLite）

### pets 宠物档案

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | TEXT PK | UUID |
| name | TEXT | 名字 |
| birthDate | TEXT | 出生日 YYYY-MM-DD |
| breed | TEXT | 品种，如：短毛奶油、长毛熊 |
| gender | TEXT | male / female / unknown |
| photo | TEXT | 头像照片 Base64 或 URL |
| personality | TEXT | 性格描述 |
| createdAt / updatedAt | TEXT | 时间戳 |

### weight_records 体重/身长记录

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | TEXT PK | UUID |
| petId | TEXT | 外键 |
| date | TEXT | 记录日期 |
| weight | REAL | 体重 g |
| bodyLength | REAL | 身长 cm，可空 |
| status | TEXT | 状态：正常/偏瘦/偏胖/观察 |
| note | TEXT | 备注 |

### growth_photos 成长相册

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | TEXT PK | UUID |
| petId | TEXT | 外键 |
| date | TEXT | 拍摄日期 |
| photo | TEXT | Base64 或 URL |
| caption | TEXT | 说明 |

### feeding_records 喂食

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | TEXT PK | UUID |
| petId | TEXT | 外键 |
| date | TEXT | 日期 |
| foodType | TEXT | 主食/零食/蔬菜 |
| amount | REAL | 食量 g，可空 |
| note | TEXT | 备注 |

### drinking_records 饮水

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | TEXT PK | UUID |
| petId | TEXT | 外键 |
| date | TEXT | 日期 |
| amount | REAL | 饮水量 ml，可空 |
| note | TEXT | 备注 |

### bedding_records 换垫料

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | TEXT PK | UUID |
| petId | TEXT | 外键 |
| date | TEXT | 日期 |
| beddingType | TEXT | 木屑/纸棉/混合 |
| note | TEXT | 备注 |

### bath_records 洗澡（沙浴）

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | TEXT PK | UUID |
| petId | TEXT | 外键 |
| date | TEXT | 日期 |
| bathType | TEXT | 沙浴/干洗 |
| note | TEXT | 备注 |

### activity_records 活动记录

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | TEXT PK | UUID |
| petId | TEXT | 外键 |
| date | TEXT | 日期 |
| wheelMinutes | INTEGER | 跑轮时间（分钟） |
| activeLevel | INTEGER | 活跃度 1-5 |
| activeTimeRange | TEXT | 活动时段，如 22:00-03:00 |
| note | TEXT | 备注 |

### daily_reports 每日报告

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | TEXT PK | UUID |
| petId | TEXT | 外键 |
| date | TEXT | 日期 |
| healthScore | INTEGER | 健康评分 0-100 |
| weight | REAL | 当日/最近体重 |
| activityMinutes | INTEGER | 活动分钟 |
| summary | TEXT | 摘要 |
| generatedAt | TEXT | 生成时间 |

### sync_queue 同步队列（客户端）

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | TEXT PK | UUID |
| entity | TEXT | 实体类型 |
| entityId | TEXT | 实体 id |
| operation | TEXT | upsert / delete |
| payload | TEXT | JSON 序列化 |
| status | TEXT | pending / synced |

## 4. 索引

```sql
CREATE INDEX idx_weight_pet_date ON weight_records(petId, date);
CREATE INDEX idx_feeding_pet_date ON feeding_records(petId, date);
CREATE INDEX idx_activity_pet_date ON activity_records(petId, date);
```

## 5. 关键约定

- 日期一律使用 `YYYY-MM-DD` 本地日期字符串，避免时区歧义。
- 照片客户端存 Base64；云端建议改为对象存储 URL（预留字段即可）。
- 金额/体重等浮点使用 `REAL`，展示时保留 1 位小数。
