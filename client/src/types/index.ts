// 领域类型定义：与 docs/database-design.md 中的字段保持一一对应。
// 日期统一使用本地 YYYY-MM-DD，避免时区歧义；时间戳使用 ISO 字符串。

export type Gender = 'male' | 'female' | 'unknown';

/** 宠物档案 */
export interface Pet {
  id: string;
  name: string;
  /** 出生日，YYYY-MM-DD */
  birthDate: string;
  breed: string;
  gender: Gender;
  /** 头像照片：Base64 或云端 URL */
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
  createdAt: string;
}

export type FoodType = 'staple' | 'snack' | 'vegetable' | 'other';

/** 喂食记录 */
export interface FeedingRecord {
  id: string;
  petId: string;
  date: string;
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
  /** 饮水量（毫升），可选 */
  amount?: number;
  note?: string;
  createdAt: string;
}

/** 换垫料记录 */
export interface BeddingRecord {
  id: string;
  petId: string;
  date: string;
  beddingType: string;
  note?: string;
  createdAt: string;
}

export type BathType = 'sand' | 'dry' | 'other';

/** 洗澡记录（金丝熊通常为沙浴） */
export interface BathRecord {
  id: string;
  petId: string;
  date: string;
  bathType: BathType;
  note?: string;
  createdAt: string;
}

/** 夜间活动记录 */
export interface ActivityRecord {
  id: string;
  petId: string;
  date: string;
  /** 跑轮时间（分钟） */
  wheelMinutes: number;
  /** 活跃程度评分 1-5 */
  activeLevel: number;
  /** 活动时段，如 22:00-03:00 */
  activeTimeRange?: string;
  note?: string;
  createdAt: string;
}

/** 每日报告（可由活动/健康模块生成） */
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

/** 护理项目状态：自动计算距离下次护理时间 */
export type CareKey = 'feeding' | 'drinking' | 'bedding' | 'bath';

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

/** 健康评分结果：只给饲养提醒，不做诊断 */
export interface HealthBreakdownItem {
  label: string;
  score: number;
  message: string;
}

export interface HealthResult {
  score: number;
  summary: string;
  reminders: string[];
  breakdown: HealthBreakdownItem[];
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

export type SyncOperation = 'upsert' | 'delete';

/** 同步队列条目：本地变更等待推送云端 */
export interface SyncItem {
  id: string;
  entity: string;
  entityId: string;
  operation: SyncOperation;
  payload: string;
  status: 'pending' | 'synced';
  createdAt: string;
}
