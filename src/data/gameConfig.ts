import type { Enemy, Facility, StoryEvent, ExchangeAsset, Item } from '../types/game';
import { RELICS } from './items';

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

export const STORY_EVENTS: StoryEvent[] = [
  {
    id: 'injured_scavenger',
    text: '你发现一个受伤的拾荒者靠在墙边，腹部的伤口正在渗血。',
    choices: [
      {
        id: 'help',
        text: '救助 (消耗急救包)',
        req: { item: 'medkit' },
        resultText: '你包扎了他的伤口。他感激地塞给你一些东西。',
        mood: 20,
        sanity: 5,
        lootChance: 1.0,
      },
      {
        id: 'rob',
        text: '打劫',
        resultText: '你趁火打劫。他试图反抗...',
        combat: true,
        enemyId: 'weak_scavenger',
        mood: -10,
        sanity: -10,
      },
      {
        id: 'ignore',
        text: '无视',
        resultText: '你从他身边走过，假装没听见他的呻吟。',
        mood: -5,
        sanity: -2,
      },
    ],
  },
  {
    id: 'abandoned_shrine',
    text: '废墟深处有一座堆满电子元件的奇怪祭坛，散发着微光。',
    choices: [
      {
        id: 'pray',
        text: '祈祷 (消耗5饱食)',
        req: { stat: 'satiety', val: 5 },
        resultText: '你感到一阵平静，但也更加饥饿。',
        mood: 10,
        sanity: 20,
      },
      {
        id: 'desecrate',
        text: '搜刮祭坛',
        resultText: '你拿走了上面的零件，但感觉有什么东西跟上了你...',
        combat: true,
        enemyId: 'glitch',
        mood: 0,
        sanity: -15,
        lootChance: 1.0,
      },
      {
        id: 'leave',
        text: '离开',
        resultText: '不作死就不会死。',
        mood: 0,
        sanity: 0,
      },
    ],
  },
];

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

export const LOOT_DB: Item[] = [
  { name: '螺丝组件', val: 15, rarity: 'white', type: 'loot' },
  { name: '废旧钢材', val: 25, rarity: 'white', type: 'loot' },
  { name: '神秘肉罐头', val: 30, rarity: 'white', type: 'loot' },
  { name: '粗糙布料', val: 50, rarity: 'green', type: 'loot' },
  { name: '线材组件', val: 65, rarity: 'green', type: 'loot' },
  { name: '未知酱料', val: 80, rarity: 'green', type: 'loot' },
  { name: '好用的钳子', val: 150, rarity: 'blue', type: 'loot' },
  { name: '润滑油', val: 180, rarity: 'blue', type: 'loot' },
  { name: '燃气瓶', val: 220, rarity: 'blue', type: 'loot' },
  { name: '优质钢材', val: 400, rarity: 'purple', type: 'loot' },
  { name: '蓄电池', val: 550, rarity: 'purple', type: 'loot' },
  { name: '火药', val: 600, rarity: 'purple', type: 'loot' },
  { name: '求生急救包', val: 1000, rarity: 'gold', type: 'loot' },
  { name: '完整抗生素', val: 1200, rarity: 'gold', type: 'loot' },
  {
    name: '弯曲的铁罐',
    val: 5,
    rarity: 'white',
    type: 'loot',
    desc: '踢起来哐当作响。',
  },
  {
    name: '烧焦的二极管',
    val: 10,
    rarity: 'white',
    type: 'loot',
    desc: '散发着臭氧味。',
  },
  {
    name: '生锈的瓶盖',
    val: 8,
    rarity: 'white',
    type: 'loot',
    desc: '也许曾经是货币？',
  },
  {
    name: '核子可乐瓶盖',
    val: 60,
    rarity: 'green',
    type: 'loot',
    desc: '鲜艳的红色，收藏家的最爱。',
  },
  {
    name: '真空电子管',
    val: 90,
    rarity: 'green',
    type: 'loot',
    desc: '脆弱但精美的旧时代元件。',
  },
  {
    name: '损坏的终端机',
    val: 120,
    rarity: 'green',
    type: 'loot',
    desc: '屏幕已经碎了。',
  },
  {
    name: '生物识别扫描仪',
    val: 250,
    rarity: 'blue',
    type: 'loot',
    desc: '还能读取指纹数据。',
  },
  {
    name: '战前全息游戏卡',
    val: 300,
    rarity: 'blue',
    type: 'loot',
    desc: '上面写着《格罗格纳克野蛮人》。',
  },
  {
    name: '量子可乐瓶盖',
    val: 350,
    rarity: 'blue',
    type: 'loot',
    desc: '在这个黑暗的世界里发出幽蓝的光。',
  },
  {
    name: '微型核融合核心',
    val: 800,
    rarity: 'purple',
    type: 'loot',
    desc: '即使过了百年，能量依然澎湃。',
  },
  {
    name: '隐形小子原型机',
    val: 900,
    rarity: 'purple',
    type: 'loot',
    desc: '光学迷彩发生器，可惜没电了。',
  },
  {
    name: '避难所科技午餐盒',
    val: 1800,
    rarity: 'gold',
    type: 'loot',
    desc: '保存完好，里面或许有惊喜？',
  },
  {
    name: 'G.E.C.K. 碎片',
    val: 2500,
    rarity: 'gold',
    type: 'loot',
    desc: '伊甸园创造器的残片，无价之宝。',
  },
  {
    name: '特别的磁带',
    val: 50000,
    rarity: 'special',
    type: 'loot',
    desc: '普通的磁带...但上面手写着"Day 1 源代码备份"。',
  },
  { ...RELICS.vampire },
  { ...RELICS.cat },
  { ...RELICS.adrenaline },
];

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
