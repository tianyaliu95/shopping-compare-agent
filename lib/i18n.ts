export type Locale = 'en' | 'zh';

export const LOCALES: Locale[] = ['en', 'zh'];
export const STORAGE_KEY = 'compare-agent-locale';

export type TypeExample = {
  id: 'headphones' | 'vacuums' | 'coffee-makers' | 'office-chairs';
  label: string;
  products: string[];
  preference: string;
};

export const TYPE_EXAMPLES: Record<Locale, TypeExample[]> = {
  en: [
    {
      id: 'headphones',
      label: 'Headphones',
      products: ['Sony WH-1000XM5', 'Bose QuietComfort Ultra', 'Apple AirPods Max'],
      preference: 'Budget around $400, prioritize noise cancelling',
    },
    {
      id: 'vacuums',
      label: 'Vacuums',
      products: ['Dyson V15 Detect', 'Roborock Q Revo', 'Shark Detect Pro'],
      preference: 'Pet hair in an apartment, around $700, want strong suction without much fuss',
    },
    {
      id: 'coffee-makers',
      label: 'Coffee',
      products: ['Breville Barista Express', 'Gaggia Classic Evo Pro', "De'Longhi Dedica Arte"],
      preference: 'Home espresso around $700, want something easy to learn',
    },
    {
      id: 'office-chairs',
      label: 'Office Chairs',
      products: ['Herman Miller Aeron', 'Steelcase Leap V2', 'Secretlab Titan Evo'],
      preference: 'Sitting 8 hours a day, need lumbar support, up to $1,200',
    },
  ],
  zh: [
    {
      id: 'headphones',
      label: '耳机',
      products: ['Sony WH-1000XM5', 'Bose QuietComfort Ultra', 'Apple AirPods Max'],
      preference: '预算约 400 美元，优先降噪',
    },
    {
      id: 'vacuums',
      label: '吸尘器',
      products: ['Dyson V15 Detect', 'Roborock Q Revo', 'Shark Detect Pro'],
      preference: '公寓有宠物毛，预算约 700 美元，希望吸力强、不用太操心',
    },
    {
      id: 'coffee-makers',
      label: '咖啡机',
      products: ['Breville Barista Express', 'Gaggia Classic Evo Pro', "De'Longhi Dedica Arte"],
      preference: '家用意式，预算约 700 美元，希望好上手',
    },
    {
      id: 'office-chairs',
      label: '办公椅',
      products: ['Herman Miller Aeron', 'Steelcase Leap V2', 'Secretlab Titan Evo'],
      preference: '每天坐 8 小时，需要腰部支撑，预算 1200 美元以内',
    },
  ],
};

const en = {
  langName: 'EN',
  kicker: 'AI Research Agent',
  titleLine1: 'Compare',
  titleLine2: 'Agent',
  subtitle: 'Paste 2-4 product names or links. The AI agent plans criteria, reads public sources, and returns a sourced pick.',
  tryAType: 'Try a category',
  yourOwn: 'Your own',
  products: 'Products',
  ofMax: (n: number, max: number) => `${n} of ${max}`,
  productPlaceholder: (i: number) => `Product ${i} or URL`,
  productHint: 'A name, Amazon link, or official product page all work.',
  removeProduct: 'Remove product',
  addProduct: '+ Add product',
  whatMatters: 'What matters to you',
  whatMattersHint: 'Budget, key features, or who it’s for — we’ll pick against this.',
  whatMattersPlaceholder: 'Budget, key features, who it\'s for…',
  compare: 'Compare',
  researching: 'Researching…',
  startAComparison: 'Start a comparison',
  agentLoop: 'Agent Loop',
  planning: 'Planning comparison dimensions…',
  starting: 'Starting agent…',
  readingPages: 'Reading the pages you pasted…',
  done: 'Complete',
  compareFailed: 'Compare failed',
  recommendation: 'Recommendation',
  whoWins: 'Who wins',
  whoWinsHint: 'Best on each criterion, given what you care about.',
  decisionTable: 'Decision table',
  eachCellSourced: 'Each cell links to a source.',
  spec: 'Spec',
  pick: 'Pick',
  source: 'Source',
  win: 'Win',
  comparisonTable: 'Comparison table',
  missingKey: 'Set GEMINI_API_KEY on the server.',
  invalidJson: 'Invalid JSON',
  needProducts: 'Describe 2-4 products to compare.',
  tooManySteps: 'Agent stopped after too many tool steps. Try fewer products.',
  quotaPause: (s: number) => `Free-tier pause, retrying in ${s}s…`,
  buildingTable: 'Building the decision table…',
  cachedRun: 'Replaying the latest run for these products…',
  rateLimited: (min: number) =>
    `This demo runs on a free API tier. Try again in about ${min} min, or pick one of the example categories.`,
  backToTop: 'Back to top',
  copyrightYear: (year: number) => `© ${year}`,
  copyrightName: 'Tianya Liu',
  poweredBy: 'Powered by Gemini',
  caveat: 'Prices and specs can change. Please verify before you buy.',
};

export type Copy = typeof en;

const zh = {
  langName: '中文',
  kicker: 'AI 产品对比助手',
  titleLine1: 'Compare',
  titleLine2: 'Agent',
  subtitle: '输入 2-4 个产品名或链接。AI 助手会规划对比维度、检索公开来源，并给出有出处的推荐。',
  tryAType: '先选个品类试试',
  yourOwn: '自己填',
  products: '产品',
  ofMax: (n: number, max: number) => `${n} / ${max}`,
  productPlaceholder: (i: number) => `产品 ${i} 或链接`,
  productHint: '产品名、亚马逊链接或官网商品页都可以。',
  removeProduct: '移除产品',
  addProduct: '+ 添加产品',
  whatMatters: '你注重的方面',
  whatMattersHint: '预算、关键功能或使用场景，都会用来决定推荐。',
  whatMattersPlaceholder: '预算、关键功能、使用场景…',
  compare: '开始对比',
  researching: '研究中…',
  startAComparison: '开始对比',
  agentLoop: 'Agent 过程',
  planning: '正在规划对比维度…',
  starting: '正在启动助手…',
  readingPages: '正在读取你贴的链接…',
  done: '完成',
  compareFailed: '对比失败',
  recommendation: '推荐',
  whoWins: '谁赢了',
  whoWinsHint: '按你在意的点，看每一项谁更好。',
  decisionTable: '对比详情',
  eachCellSourced: '每个格子都有来源链接。',
  spec: '规格',
  pick: '推荐',
  source: '来源',
  win: '胜出',
  comparisonTable: '对比表',
  missingKey: '请在服务器设置 GEMINI_API_KEY。',
  invalidJson: '请求格式无效',
  needProducts: '请填写 2-4 个要对比的产品。',
  tooManySteps: '工具步骤过多，已停止。请减少产品数量再试。',
  quotaPause: (s: number) => `免费额度暂停，${s} 秒后重试…`,
  buildingTable: '正在生成对比表…',
  cachedRun: '正在回放这几个产品最近一次的研究过程…',
  rateLimited: (min: number) =>
    `本演示使用免费 API 额度，请约 ${min} 分钟后再试，或先点一个示例品类看看。`,
  backToTop: '回到顶部',
  copyrightYear: (year: number) => `© ${year}`,
  copyrightName: 'Tianya Liu',
  poweredBy: '由 Gemini 提供支持',
  caveat: '以上为公开信息快照，购买前请核对价格与规格。',
};

export const copy: Record<Locale, typeof en> = { en, zh };

export function detectLocale(): Locale {
  if (typeof window === 'undefined') return 'en';
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved === 'zh' || saved === 'en') return saved;
  return navigator.language.toLowerCase().startsWith('zh') ? 'zh' : 'en';
}
