import type { Enemy, Facility, ExchangeAsset } from '../types/game';

export { STORY_EVENTS } from './events';
export { LOOT_DB } from './loot';

export const WIN_GOAL = 32500;
export const ENERGY_CAP = 42;
export const EXCHANGE_FEE_RATE = 0.02;

export const JACKPOT_BASES = {
  mini: 2000,
  major: 8000,
  grand: 20000,
};

export const ENEMIES: Enemy[] = [
  { id: 'rat', name: '变异老鼠', hp: 10, maxHp: 10, atk: 3, exp: 10 },
  { id: 'scavenger', name: '流浪拾荒者', hp: 25, maxHp: 25, atk: 6, exp: 30 },
  { id: 'thug', name: '武装暴徒', hp: 45, maxHp: 45, atk: 10, exp: 60 },
  { id: 'merc', name: '精英佣兵', hp: 80, maxHp: 80, atk: 15, exp: 150 },
];

export const FACILITIES: Record<string, Facility> = {
  medical: {
    id: 'medical',
    name: '战地医疗站',
    maxLevel: 3,
    levels: [
      {
        cost: { 螺丝组件: 10, 废旧钢材: 10 },
        effect: 30,
        desc: 'Lv1: 基础包扎 (撤离回血 30)',
      },
      {
        cost: { 粗糙布料: 10, 线材组件: 5 },
        effect: 60,
        desc: 'Lv2: 无菌处理 (撤离回血 60)',
      },
      {
        cost: { 完整抗生素: 1, 蓄电池: 1 },
        effect: 100,
        desc: 'Lv3: 全自动手术舱 (撤离回血 100)',
      },
    ],
  },
  recycling: {
    id: 'recycling',
    name: '物资回收中心',
    maxLevel: 3,
    levels: [
      {
        cost: { 螺丝组件: 15, 好用的钳子: 1 },
        effect: 0.1,
        desc: 'Lv1: 简易分类 (出售价格 +10%)',
      },
      {
        cost: { 线材组件: 10, 润滑油: 3 },
        effect: 0.2,
        desc: 'Lv2: 精细拆解 (出售价格 +20%)',
      },
      {
        cost: { 优质钢材: 2, 蓄电池: 2 },
        effect: 0.35,
        desc: 'Lv3: 熔炼重铸 (出售价格 +35%)',
      },
    ],
  },
  kitchen: {
    id: 'kitchen',
    name: '野战厨房',
    maxLevel: 3,
    levels: [
      {
        cost: { 废旧钢材: 5, 神秘肉罐头: 3 },
        effect: 120,
        desc: 'Lv1: 篝火烤肉 (饱食上限 120)',
      },
      {
        cost: { 燃气瓶: 2, 未知酱料: 5 },
        effect: 150,
        desc: 'Lv2: 便携灶台 (饱食上限 150)',
      },
      {
        cost: { 优质钢材: 3, 火药: 2 },
        effect: 200,
        desc: 'Lv3: 分子料理机 (饱食上限 200)',
      },
    ],
  },
};

export const RARITY_CONFIG = {
  white: {
    label: '普通',
    color: 'text-slate-400',
    border: 'border-slate-500',
    bg: 'bg-slate-800',
  },
  green: {
    label: '优良',
    color: 'text-emerald-400',
    border: 'border-emerald-500',
    bg: 'bg-emerald-900/20',
  },
  blue: {
    label: '稀有',
    color: 'text-cyan-400',
    border: 'border-cyan-500',
    bg: 'bg-cyan-900/20',
  },
  purple: {
    label: '史诗',
    color: 'text-fuchsia-400',
    border: 'border-fuchsia-500',
    bg: 'bg-fuchsia-900/20',
  },
  gold: {
    label: '传说',
    color: 'text-amber-400',
    border: 'border-amber-500',
    bg: 'bg-amber-900/20',
  },
  special: {
    label: '特殊',
    color: 'text-red-500 animate-pulse',
    border: 'border-red-500',
    bg: 'bg-red-900/20',
  },
};

export const EXCHANGE_ASSETS: ExchangeAsset[] = [
  {
    id: 'gold',
    name: '量子黄金',
    price: 100,
    vol: 0.02,
    held: 0,
    change: 0,
    costBasis: 0,
  },
  {
    id: 'realty',
    name: '末日地产',
    price: 80,
    vol: 0.05,
    held: 0,
    change: 0,
    costBasis: 0,
  },
  {
    id: 'space',
    name: '慈善航天',
    price: 50,
    vol: 0.2,
    held: 0,
    change: 0,
    costBasis: 0,
  },
  {
    id: 'wtc',
    name: '加密硬币WTC',
    price: 10,
    vol: 0.5,
    held: 0,
    change: 0,
    costBasis: 0,
  },
];

export const EXCHANGE_NEWS_POOL = [
  {
    text: '天顶星航天宣布发现外星可乐秘方，股价暴涨 40%！',
    targetId: 'space',
    effect: 0.4,
  },
  {
    text: '某黑客声称删库跑路，废土币瞬间蒸发 80%。',
    targetId: 'wtc',
    effect: -0.8,
  },
  {
    text: '金库加固完成，避难所黄金买盘增强，稳中有升 5%。',
    targetId: 'gold',
    effect: 0.05,
  },
  { text: '城防升级延期，地产板块承压 10%。', targetId: 'realty', effect: -0.1 },
];
