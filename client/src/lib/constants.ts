// 业务常量：护理周期、展示文案、评分阈值。集中管理便于后续调整。
import type { CareKey, CleaningTask, FoodType, Gender, WeightStatus } from '../types';

export const CARE_INTERVALS: Record<
  CareKey,
  { label: string; icon: string; intervalDays: number }
> = {
  feeding: { label: '喂食', icon: '🥣', intervalDays: 1 },
  drinking: { label: '换凉开水', icon: '💧', intervalDays: 1 },
  // 局部清洁默认 3 天（建议区间 2~3 天）
  spotClean: { label: '局部铲屎/清尿沙', icon: '🧹', intervalDays: 3 },
  // 整笼大扫除默认 30 天（建议区间 30~45 天）
  deepClean: { label: '整笼大扫除换垫料', icon: '🏠', intervalDays: 30 },
};

export const GENDER_LABELS: Record<Gender, string> = {
  male: '男孩',
  female: '女孩',
  unknown: '未知',
};

export const FOOD_TYPE_LABELS: Record<FoodType, string> = {
  staple: '主粮',
  snack: '零食',
  vegetable: '蔬菜',
  freeze_dried: '冻干',
  other: '其他',
};

export const WEIGHT_STATUS_LABELS: Record<WeightStatus, string> = {
  normal: '标准体重',
  underweight: '偏轻',
  overweight: '偏重',
  watch: '继续观察',
};

export const CLEANING_LABELS: Record<CleaningTask, string> = {
  spot: '局部铲屎/清尿沙',
  deep: '整笼大扫除换垫料',
};

/** 相册可选标签（拍立得时光） */
export const PHOTO_TAGS = [
  '塞满颊囊',
  '越狱未遂',
  '睡成肉饼',
  '疯狂跑轮',
  '干饭现场',
  '囤粮大师',
  '第一次回家',
  '今日份可爱',
] as const;

/** 成年金丝熊正常体重参考区间（克） */
export const ADULT_WEIGHT = { min: 120, max: 180 } as const;

/** 体重环比下降超过 10% 视为一次明显下降 */
export const WEIGHT_DROP_ALERT_RATIO = 0.1;
/** 连续两次环比下降超过阈值时，触发黄色警报 */
export const WEIGHT_DROP_ALERT_STREAK = 2;

/** 健康评分三个维度的内部权重：体重、食量、活跃度 */
export const HEALTH_WEIGHTS = {
  weight: 0.4,
  food: 0.3,
  activity: 0.3,
} as const;
