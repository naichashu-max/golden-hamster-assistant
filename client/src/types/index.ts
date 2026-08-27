// 领域类型定义：与 Supabase 表结构对应。
// 日期统一使用本地 YYYY-MM-DD；时间戳使用 ISO 字符串。

export type Gender = 'male' | 'female' | 'unknown';

/** 宠物档案 */
export interface Pet {
  id: string;
  name: string;
  /** 出生日，YYYY-MM-DD */
  birthDate: string;
  breed: string;
  gender: Gender;
  /** 头像照片：Base64 */
  photo?: string;
  personality?: string;
  createdAt: string;
  updatedAt: string;
}

export type WeightStatus = 'normal' | 'underweight' | 'overweight' | 'watch';

/** 体重 / 身长记录 */
export interface WeightRecord {
  id: string;
  petId: string;
  date: string;
  /** 体重（克） */
  weight: number;
  /** 身长（厘米），可选 */
  bodyLength?: number;
  status: WeightStatus;
  note?: string;
  createdAt: string;
}

/** 成长相册照片 */
export interface GrowthPhoto {
  id: string;
  petId: string;
  date: string;
  photo: string;
  caption?: string;
  /** 专属标签，如：塞满颊囊 */
  tag?: string;
  createdAt: string;
}

export type FoodType = 'staple' | 'snack' | 'vegetable' | 'freeze_dried' | 'other';

/** 喂食记录 */
export interface FeedingRecord {
  id: string;
  petId: string;
  date: string;
  /** 喂食时间，HH:mm */
  time?: string;
  foodType: FoodType;
  /** 食量（克），可选 */
  amount?: number;
  note?: string;
  createdAt: string;
}

/** 饮水记录 */
export interface DrinkingRecord {
  id: string;
  petId: string;
  date: string;
  /** 换水时间，HH:mm */
  time?: string;
  /** 饮水量（毫升），可选 */
  amount?: number;
  note?: string;
  createdAt: string;
}

/** 清洁任务类型：局部清理 / 整笼大扫除。金丝熊严禁水洗，无“洗澡”任务。 */
export type CleaningTask = 'spot' | 'deep';

export interface CleaningRecord {
  id: string;
  petId: string;
  date: string;
  /** 清洁时间，HH:mm */
  time?: string;
  taskType: CleaningTask;
  /** 整笼大扫除时的垫料类型 */
  beddingType?: string;
  note?: string;
  createdAt: string;
}

/** 换垫料记录（旧版表结构，保留兼容） */
export interface BeddingRecord {
  id: string;
  petId: string;
  date: string;
  beddingType: string;
  note?: string;
  createdAt: string;
}

/** 夜间活动记录 */
export interface ActivityRecord {
  id: string;
  petId: string;
  date: string;
  /** 活动记录时间，HH:mm */
  time?: string;
  /** 跑轮时间（分钟） */
  wheelMinutes: number;
  /** 活跃程度评分 1-5 */
  activeLevel: number;
  /** 活动时段，如 22:00-03:00 */
  activeTimeRange?: string;
  note?: string;
  createdAt: string;
}

/** 每日报告（预留） */
export interface DailyReport {
  id: string;
  petId: string;
  date: string;
  healthScore: number;
  weight?: number;
  activityMinutes: number;
  summary: string;
  generatedAt: string;
}

/** 护理项目：喂食、饮水、局部清洁、整笼清洁 */
export type CareKey = 'feeding' | 'drinking' | 'spotClean' | 'deepClean';

export interface CareStatus {
  key: CareKey;
  label: string;
  icon: string;
  lastDate?: string;
  /** 建议间隔（天） */
  intervalDays: number;
  /** 距下次护理天数；负数表示已逾期 */
  daysUntil: number;
  nextDate: string;
  status: 'ok' | 'soon' | 'overdue';
}

/** 健康分析：只给饲养提醒，不做诊断 */
export interface HealthBreakdownItem {
  label: string;
  score: number;
  message: string;
}

/** 黄色警报：体重连续环比下降超过阈值时触发 */
export interface HealthAlert {
  title: string;
  checklist: string[];
}

export interface HealthResult {
  score: number;
  summary: string;
  reminders: string[];
  breakdown: HealthBreakdownItem[];
  alert: HealthAlert | null;
}

/** AI 陪伴所需的上下文快照 */
export interface PetContext {
  pet: Pet;
  recentActivity: ActivityRecord[];
  recentWeight: WeightRecord[];
  recentFeeding: FeedingRecord[];
}

export interface AiReply {
  text: string;
  source: 'rule-based' | 'cloud';
}

// ---------- 以下为早期本地存储版本的遗留类型，保留以避免旧模块编译报错 ----------

export type SyncOperation = 'upsert' | 'delete';

export interface SyncItem {
  id: string;
  entity: string;
  entityId: string;
  operation: SyncOperation;
  payload: string;
  status: 'pending' | 'synced';
  createdAt: string;
}
