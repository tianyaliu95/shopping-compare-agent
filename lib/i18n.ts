export type Locale = 'en' | 'zh';

export const LOCALES: Locale[] = ['en', 'zh'];
export const STORAGE_KEY = 'compare-agent-locale';

export type TypeExample = {
  id: 'headphones' | 'keyboards' | 'monitors';
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
      id: 'keyboards',
      label: 'Keyboards',
      products: ['Keychron Q1 Max', 'Logitech MX Mechanical', 'Nuphy Air75 V2'],
      preference: 'Mostly laptop use, want quiet typing',
    },
    {
      id: 'monitors',
      label: 'Monitors',
      products: ['Dell U2723QE', 'LG 27UP850', 'BenQ RD280U'],
      preference: 'Coding all day, care about text clarity and USB-C',
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
      id: 'keyboards',
      label: '键盘',
      products: ['Keychron Q1 Max', 'Logitech MX Mechanical', 'Nuphy Air75 V2'],
      preference: '主要在笔记本上用，希望打字安静',
    },
    {
      id: 'monitors',
      label: '显示器',
      products: ['Dell U2723QE', 'LG 27UP850', 'BenQ RD280U'],
      preference: '整天写代码，在意文字清晰度和 USB-C',
    },
  ],
};

const en = {
  langName: 'EN',
  kicker: 'AI Research Agent',
  titleLine1: 'Compare',
  titleLine2: 'Agent',
  subtitle: 'Paste 2-4 products. The AI agent plans criteria, reads public sources, and returns a sourced pick.',
  tryAType: 'Try a type',
  yourOwn: 'Your own',
  products: 'Products',
  ofMax: (n: number, max: number) => `${n} of ${max}`,
  productPlaceholder: (i: number) => `Product ${i}`,
  removeProduct: 'Remove product',
  addProduct: '+ Add product',
  whatMatters: 'What matters',
  whatMattersPlaceholder: 'Budget, key features, who it\'s for…',
  compare: 'Compare',
  researching: 'Researching…',
  startAComparison: 'Start a comparison',
  agentLoop: 'Agent loop',
  planning: 'Planning comparison dimensions…',
  starting: 'Starting agent…',
  done: 'Done',
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
  copyrightYear: (year: number) => `© ${year}`,
  copyrightName: 'Tianya Liu',
  poweredBy: 'Powered by Gemini',
  caveat: 'Prices and specs can change. Please verify before you buy.',
};

export type Copy = typeof en;

const zh = {
  langName: '中文',
  kicker: 'AI 研究助手',
  titleLine1: '对比助手',
  titleLine2: '',
  subtitle: '输入 2-4 个产品。AI 助手会规划对比维度、检索公开来源，并给出有出处的推荐。',
  tryAType: '先选个品类试试',
  yourOwn: '自己填',
  products: '产品',
  ofMax: (n: number, max: number) => `${n} / ${max}`,
  productPlaceholder: (i: number) => `产品 ${i}`,
  removeProduct: '移除产品',
  addProduct: '+ 添加产品',
  whatMatters: '你在意什么',
  whatMattersPlaceholder: '预算、关键功能、使用场景…',
  compare: '开始对比',
  researching: '研究中…',
  startAComparison: '开始对比',
  agentLoop: 'Agent 过程',
  planning: '正在规划对比维度…',
  starting: '正在启动助手…',
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
