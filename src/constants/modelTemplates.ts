import { type ModelTemplate, ModelCategory, CharacterTemplateId } from "@/types/mapEditor"

export const CHARACTER_TEMPLATES: ModelTemplate[] = [
  {
    id: CharacterTemplateId.MERCHANT,
    name: "商人",
    category: ModelCategory.CHARACTER,
    defaultSize: { width: 32, height: 64 },
    defaultGridSize: { gridWidth: 1, gridHeight: 2 },
    icon: "🧙‍♂️",
    description: "友好的商人，可以进行交易和对话",
  },
  {
    id: CharacterTemplateId.GUARD,
    name: "守卫",
    category: ModelCategory.CHARACTER,
    defaultSize: { width: 32, height: 64 },
    defaultGridSize: { gridWidth: 1, gridHeight: 2 },
    icon: "🛡️",
    description: "村庄守卫，负责安全",
  },
  {
    id: CharacterTemplateId.VILLAGER,
    name: "村民",
    category: ModelCategory.CHARACTER,
    defaultSize: { width: 32, height: 64 },
    defaultGridSize: { gridWidth: 1, gridHeight: 2 },
    icon: "👨‍🌾",
    description: "普通村民，提供信息和任务",
  },
  {
    id: CharacterTemplateId.ELDER,
    name: "长者",
    category: ModelCategory.CHARACTER,
    defaultSize: { width: 32, height: 64 },
    defaultGridSize: { gridWidth: 1, gridHeight: 2 },
    icon: "🧓",
    description: "德高望重的长者，掌握历史传说与线索",
  },
  {
    id: CharacterTemplateId.CHILD,
    name: "孩子",
    category: ModelCategory.CHARACTER,
    defaultSize: { width: 32, height: 64 },
    defaultGridSize: { gridWidth: 1, gridHeight: 2 },
    icon: "🧒",
    description: "天真活泼的孩子，喜欢在村里奔跑",
  },
  {
    id: CharacterTemplateId.ARTISAN,
    name: "工匠",
    category: ModelCategory.CHARACTER,
    defaultSize: { width: 32, height: 64 },
    defaultGridSize: { gridWidth: 1, gridHeight: 2 },
    icon: "🔨",
    description: "经验丰富的武器工匠，性格爽朗直率",
  },
]

export const PLANT_TEMPLATES: ModelTemplate[] = [
  {
    id: "tree-oak",
    name: "橡树",
    category: ModelCategory.PLANT,
    defaultSize: { width: 32, height: 64 },
    defaultGridSize: { gridWidth: 1, gridHeight: 2 },
    icon: "🌳",
    description: "高大的橡树，提供阴凉",
  },
  {
    id: "tree-pine",
    name: "松树",
    category: ModelCategory.PLANT,
    defaultSize: { width: 32, height: 64 },
    defaultGridSize: { gridWidth: 1, gridHeight: 2 },
    icon: "🌲",
    description: "常青松树",
  },
  {
    id: "bush-berry",
    name: "浆果丛",
    category: ModelCategory.PLANT,
    defaultSize: { width: 32, height: 32 },
    defaultGridSize: { gridWidth: 1, gridHeight: 1 },
    icon: "🍓",
    description: "可采摘浆果的灌木丛",
  },
  {
    id: "flower-patch",
    name: "花丛",
    category: ModelCategory.PLANT,
    defaultSize: { width: 32, height: 32 },
    defaultGridSize: { gridWidth: 1, gridHeight: 1 },
    icon: "🌸",
    description: "美丽的花丛装饰",
  },
]

export const BUILDING_TEMPLATES: ModelTemplate[] = [
  {
    id: "house-small",
    name: "小屋",
    category: ModelCategory.BUILDING,
    defaultSize: { width: 128, height: 96 },
    defaultGridSize: { gridWidth: 4, gridHeight: 3 },
    icon: "🏠",
    description: "温馨的小屋",
  },
  {
    id: "shop-general",
    name: "杂货店",
    category: ModelCategory.BUILDING,
    defaultSize: { width: 160, height: 128 },
    defaultGridSize: { gridWidth: 5, gridHeight: 4 },
    icon: "🏪",
    description: "售卖各种物品的商店",
  },
  {
    id: "tower-watch",
    name: "瞭望塔",
    category: ModelCategory.BUILDING,
    defaultSize: { width: 64, height: 128 },
    defaultGridSize: { gridWidth: 2, gridHeight: 4 },
    icon: "🗼",
    description: "高耸的瞭望塔",
  },
  {
    id: "well",
    name: "水井",
    category: ModelCategory.BUILDING,
    defaultSize: { width: 64, height: 64 },
    defaultGridSize: { gridWidth: 2, gridHeight: 2 },
    icon: "⛲",
    description: "村庄的水源",
  },
]

export const ALL_TEMPLATES = [...CHARACTER_TEMPLATES, ...PLANT_TEMPLATES, ...BUILDING_TEMPLATES]

export const TEMPLATES_BY_CATEGORY = {
  [ModelCategory.CHARACTER]: CHARACTER_TEMPLATES,
  [ModelCategory.PLANT]: PLANT_TEMPLATES,
  [ModelCategory.BUILDING]: BUILDING_TEMPLATES,
}

export const AI_PROMPT_TEMPLATES = {
  [CharacterTemplateId.MERCHANT]: "你是一个经验丰富的商人，热情友好，总是愿意与顾客交谈。你了解各种商品的价值，喜欢分享贸易故事。",
  [CharacterTemplateId.GUARD]: "你是一名忠诚的守卫，严肃但公正。你负责维护村庄的安全，对可疑行为保持警惕，但对友善的访客很礼貌。",
  [CharacterTemplateId.VILLAGER]: "你是一个普通的村民，生活简单快乐。你了解村庄的日常生活，喜欢与人聊天，分享当地的趣闻和传说。",
  [CharacterTemplateId.ELDER]: "你是村庄的长者，智慧而慈祥。你知道许多古老的故事和传说，总是愿意给年轻人提供建议和指导。",
  [CharacterTemplateId.CHILD]: "你是一个天真活泼的孩子，对世界充满好奇。你喜欢玩耍和探险，经常问一些有趣的问题。",
  [CharacterTemplateId.ARTISAN]: "你是一位经验丰富的武器工匠，性格爽朗直率，说话干脆利落，有着数十年的锻造经验。你对自己打造的每一件武器都充满自豪，喜欢和客人分享武器的制作工艺和使用心得。你说话不拐弯抹角，实在可靠，是远近闻名的武器大师。",
}
