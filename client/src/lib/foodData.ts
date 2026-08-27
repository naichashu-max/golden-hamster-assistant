// “金丝熊能吃吗？”食材速查库。
// 安全等级：safe 安全 / caution 微量慎食 / forbidden 严禁剧毒。
// 说明：内容为常见饲养经验汇总，仅供日常参考；不确定时请选择不喂。

export type FoodSafety = 'safe' | 'caution' | 'forbidden';

export interface FoodItem {
  name: string;
  aliases?: string[];
  level: FoodSafety;
  note: string;
}

export const FOOD_LIBRARY: FoodItem[] = [
  // ---------- 🟢 安全 ----------
  { name: '胡萝卜', level: 'safe', note: '洗净生吃或蒸熟，维生素来源，适量。' },
  { name: '西兰花', level: 'safe', note: '焯水或生吃少量，富含纤维，过量易胀气。' },
  { name: '黄瓜', level: 'safe', note: '水分多，少量喂食。' },
  { name: '苹果', level: 'safe', note: '去皮去籽后少量，甜度高不宜多。' },
  { name: '香蕉', level: 'safe', note: '极少量，糖分高。' },
  { name: '蓝莓', level: 'safe', note: '少量，抗氧化。' },
  { name: '草莓', level: 'safe', note: '去蒂少量。' },
  { name: '生菜', level: 'safe', note: '选深色叶菜，浅色生菜营养少且水分多。' },
  { name: '西葫芦', level: 'safe', note: '生吃或蒸熟，适量。' },
  { name: '南瓜', level: 'safe', note: '蒸熟少量，纤维好。' },
  { name: '玉米', level: 'safe', note: '极少量，淀粉高易胖。' },
  { name: '燕麦', level: 'safe', note: '无糖原味燕麦，少量。' },
  { name: '小米', level: 'safe', note: '可与主粮混合，少量。' },
  { name: '熟鸡蛋白', aliases: ['鸡蛋蛋白', '蛋白'], level: 'safe', note: '白水煮蛋的蛋白，少量优质蛋白。' },
  { name: '水煮鸡胸肉', aliases: ['鸡胸肉', '鸡肉'], level: 'safe', note: '无盐无油白水煮熟，少量。' },
  { name: '冻干鸡肉', level: 'safe', note: '无添加冻干，高蛋白，适量。' },
  { name: '豆腐', level: 'safe', note: '无盐原味，极少量。' },
  { name: '樱桃', level: 'safe', note: '去核去梗，少量。' },
  { name: '桃子', level: 'safe', note: '去皮去核，少量。' },
  { name: '梨', level: 'safe', note: '去皮去籽，少量。' },
  { name: '西瓜', level: 'safe', note: '去皮去籽，极少量，水分糖分都高。' },
  { name: '菠菜', level: 'safe', note: '少量，草酸较高不宜多。' },
  { name: '蒲公英叶', aliases: ['蒲公英'], level: 'safe', note: '洗净少量。' },
  { name: '羽衣甘蓝', level: 'safe', note: '少量。' },
  { name: '紫薯', level: 'safe', note: '蒸熟少量，淀粉较高。' },
  { name: '豌豆', level: 'safe', note: '新鲜或蒸熟，少量。' },
  { name: '毛豆', level: 'safe', note: '煮熟少量。' },
  { name: '葵花籽', aliases: ['瓜子'], level: 'safe', note: '带壳少量，高脂肪。' },
  { name: '南瓜籽', level: 'safe', note: '无盐少量。' },
  { name: '亚麻籽', level: 'safe', note: '极少量，富含 Omega-3。' },
  { name: '全麦面包', level: 'safe', note: '无糖无添加，极少量。' },
  { name: '玉米笋', level: 'safe', note: '少量。' },
  { name: '甜椒', aliases: ['彩椒'], level: 'safe', note: '少量，维生素 C 丰富。' },
  { name: '白菜', level: 'safe', note: '洗净少量。' },
  { name: '油菜', level: 'safe', note: '洗净少量。' },
  { name: '娃娃菜', level: 'safe', note: '洗净少量。' },
  { name: '菜花', aliases: ['花菜'], level: 'safe', note: '焯水少量。' },
  { name: '苜蓿', level: 'safe', note: '少量。' },
  { name: '熟鸡蛋黄', aliases: ['蛋黄'], level: 'safe', note: '极少量，胆固醇较高。' },
  { name: '三文鱼', level: 'safe', note: '白水煮熟无盐，极少量。' },

  // ---------- 🟡 微量慎食 ----------
  { name: '花生', level: 'caution', note: '无盐少量，高脂肪。' },
  { name: '核桃', level: 'caution', note: '极少量，高脂肪。' },
  { name: '腰果', level: 'caution', note: '极少量，高脂肪。' },
  { name: '熟杏仁', aliases: ['杏仁'], level: 'caution', note: '熟制极少量；生杏仁含氰苷有风险。' },
  { name: '蜂蜜', level: 'caution', note: '糖分过高，极少量或避免。' },
  { name: '葡萄干', level: 'caution', note: '高糖，极少量或避免。' },
  { name: '米饭', level: 'caution', note: '煮熟极少量，高碳水。' },
  { name: '意大利面', level: 'caution', note: '煮熟极少量。' },
  { name: '白面包', level: 'caution', note: '极少量，营养低。' },
  { name: '奶酪', level: 'caution', note: '低盐原味极少量，注意乳糖不耐受。' },
  { name: '无糖酸奶', aliases: ['酸奶'], level: 'caution', note: '极少量。' },
  { name: '番茄', aliases: ['西红柿'], level: 'caution', note: '去蒂少量。' },
  { name: '土豆', aliases: ['马铃薯'], level: 'caution', note: '煮熟极少量，淀粉高；生土豆严禁。' },
  { name: '芹菜', level: 'caution', note: '少量。' },
  { name: '白萝卜', aliases: ['萝卜'], level: 'caution', note: '少量，可能产气。' },
  { name: '蘑菇', aliases: ['菌菇'], level: 'caution', note: '少量，务必确认是可食用品种。' },
  { name: '橙子', level: 'caution', note: '去皮去籽极少量，酸性强。' },
  { name: '菠萝', level: 'caution', note: '极少量，糖分高。' },
  { name: '芒果', level: 'caution', note: '极少量，糖分高。' },
  { name: '葡萄', level: 'caution', note: '去籽极少量。' },
  { name: '枸杞', level: 'caution', note: '极少量。' },
  { name: '红枣', level: 'caution', note: '去核极少量，糖分高。' },
  { name: '山药', level: 'caution', note: '蒸熟极少量。' },
  { name: '鹰嘴豆', level: 'caution', note: '煮熟少量。' },
  { name: '牛奶', level: 'caution', note: '多数仓鼠乳糖不耐受，不建议。' },
  { name: '糖', level: 'caution', note: '高糖，尽量避免。' },

  // ---------- 🔴 严禁 ----------
  { name: '洋葱', level: 'forbidden', note: '对仓鼠有毒，严禁喂食。' },
  { name: '大蒜', level: 'forbidden', note: '严禁喂食。' },
  { name: '大葱', level: 'forbidden', note: '严禁喂食。' },
  { name: '韭菜', level: 'forbidden', note: '严禁喂食。' },
  { name: '巧克力', level: 'forbidden', note: '含可可碱，对仓鼠剧毒。' },
  { name: '咖啡', level: 'forbidden', note: '咖啡因可致死，严禁。' },
  { name: '茶', level: 'forbidden', note: '含茶碱与咖啡因，严禁。' },
  { name: '酒精', aliases: ['酒'], level: 'forbidden', note: '严禁。' },
  { name: '牛油果', aliases: ['鳄梨'], level: 'forbidden', note: '对仓鼠有毒，严禁。' },
  { name: '生杏仁', level: 'forbidden', note: '含氰化物，严禁。' },
  { name: '苹果籽', level: 'forbidden', note: '含氰苷，严禁。' },
  { name: '樱桃核', level: 'forbidden', note: '含氰化物，严禁。' },
  { name: '桃核', level: 'forbidden', note: '含氰化物，严禁。' },
  { name: '生土豆', level: 'forbidden', note: '含龙葵素，严禁。' },
  { name: '生豆类', level: 'forbidden', note: '含凝集素，严禁生食。' },
  { name: '大黄', level: 'forbidden', note: '草酸极高，有毒。' },
  { name: '番茄叶', aliases: ['番茄茎'], level: 'forbidden', note: '含龙葵碱，严禁。' },
  { name: '柑橘皮', aliases: ['橘子皮', '橙子皮'], level: 'forbidden', note: '精油有刺激性，严禁。' },
  { name: '辣椒', level: 'forbidden', note: '刺激性强，严禁。' },
  { name: '腌制品', aliases: ['咸菜', '腊肉'], level: 'forbidden', note: '高盐，严禁。' },
  { name: '油炸食品', aliases: ['炸鸡', '薯条'], level: 'forbidden', note: '高油高盐，严禁。' },
  { name: '薯片', level: 'forbidden', note: '高盐高油，严禁。' },
  { name: '糖果', aliases: ['软糖', '硬糖'], level: 'forbidden', note: '高糖，严禁。' },
  { name: '口香糖', level: 'forbidden', note: '吞食有危险，严禁。' },
  { name: '生肉', level: 'forbidden', note: '细菌风险，严禁。' },
];

export function searchFoods(query: string): FoodItem[] {
  const keyword = query.trim().toLowerCase();
  if (!keyword) return FOOD_LIBRARY;
  return FOOD_LIBRARY.filter(
    (food) =>
      food.name.toLowerCase().includes(keyword) ||
      (food.aliases ?? []).some((alias) => alias.toLowerCase().includes(keyword)),
  );
}
