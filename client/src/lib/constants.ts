// 业务常量：护理周期、展示文案、评分权重。集中管理便于后续调整。
import type { CareKey, FoodType, Gender, WeightStatus, BathType } from '../types';

export const CARE_INTERVALS: Record<
  CareKey,
  { label: string; icon: string; intervalDays: number }
> = {
  feeding: { label: '喂食', icon: '🌾', intervalDays: 1 },
  drinking: { label: '饮水', icon: '💧', intervalDays: 1 },
  bedding: { label: '换垫料', icon: '🛏️', intervalDays: 7 },
  bath: { label: '洗澡', icon: '🛁', intervalDays: 3 },
};

export const GENDER_LABELS: Record<Gender, string> = {
  male: '男孩',
  female: '女孩',
  unknown: '未知',
};

export const FOOD_TYPE_LABELS: Record<FoodType, string> = {
  staple: '主食',
  snack: '零食',
  vegetable: '蔬菜',
  other: '其他',
};

export const WEIGHT_STATUS_LABELS: Record<WeightStatus, string> = {
  normal: '状态良好',
  underweight: '偏轻',
  overweight: '偏重',
  watch: '继续观察',
};

export const BATH_TYPE_LABELS: Record<BathType, string> = {
  sand: '沙浴',
  dry: '干洗',
  other: '其他',
};

/** 健康评分三个维度的权重：体重、食量、活跃度 */
export const HEALTH_WEIGHTS = {
  weight: 0.4,
  food: 0.3,
  activity: 0.3,
} as const;

/** 体重波动阈值：超过该比例进入“观察”提醒 */
export const WEIGHT_CHANGE_WARN_RATIO = 0.05;
export const WEIGHT_CHANGE_ALERT_RATIO = 0.1;
