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
  {
    id: 'vending_machine',
    text: '一台"GENIUS牌营养配给机"歪斜在墙边，屏幕忽闪忽灭，隐约还有存货咣当作响。',
    choices: [
      {
        id: 'kick',
        text: '用力踹一脚（50%成功）',
        resultText: '',
        luckCheck: {
          threshold: 0.5,
          successText: '嘭！掉出来一堆罐头和一叠钞票，机器随即爆炸起火。大赚！',
          failText: '踹坏了脚趾。机器发出刺耳警报后彻底断电，什么都没有。',
          successMood: 20,
          successMoney: 150,
          successLootChance: 1.0,
          failMood: -10,
          failHp: -8,
        },
      },
      {
        id: 'hack',
        text: '按标准流程输入密码 0000',
        resultText: '"密码错误。剩余尝试次数：0。账户已锁定。"屏幕黑掉了。',
        mood: -5,
        sanity: -3,
      },
      {
        id: 'walk',
        text: '走开，不是你的就不要碰',
        resultText: '你感觉到了一种久违的道德感，但胃更饿了。',
        sanity: 5,
        mood: -3,
      },
    ],
  },
  {
    id: 'wasteland_philosopher',
    text: '一个穿着破西装、戴着歪斜领带的男人拦住了你的去路，自我介绍叫"破产教授"，要跟你辩论末世的意义。',
    choices: [
      {
        id: 'debate',
        text: '认真辩论（消耗10理智）',
        req: { stat: 'sanity', val: 10 },
        resultText: '你们激烈交锋了半小时，他最后说"好有道理"然后跑路了，留下一本他自己写的书。',
        mood: 15,
        sanity: 10,
        lootChance: 0.7,
      },
      {
        id: 'agree',
        text: '无脑附和他所有观点',
        resultText: '"你真是我遇到最聪明的人！"他感动得热泪盈眶，把口袋里仅剩的零钱全塞给了你。',
        mood: 5,
        money: 80,
      },
      {
        id: 'ignore',
        text: '直接无视，绕道走',
        resultText: '"等等——！"他在身后喊，但你已经不在了。心情微妙。',
        mood: -5,
        sanity: 3,
      },
    ],
  },
  {
    id: 'survey_form',
    text: '地上有一张防水调查问卷，第一题：请问您末日前从事什么工作？第二题：您觉得生存下来的理由是什么？',
    choices: [
      {
        id: 'honest',
        text: '如实填写（50%感悟）',
        resultText: '',
        luckCheck: {
          threshold: 0.5,
          successText: '填写过程中你想通了一些事情，内心久违地平静了。',
          failText: '填到第二题时你陷入了存在主义危机，笔掉了，人也僵在原地。',
          successSanity: 15,
          successMood: 10,
          failSanity: -10,
          failMood: -8,
        },
      },
      {
        id: 'creative',
        text: '随便乱填（职业：末日审计师）',
        resultText: '感觉良好，不知道为什么。',
        mood: 8,
        sanity: 5,
      },
      {
        id: 'trash',
        text: '揉成一团扔掉',
        resultText: '没什么意义的东西。继续前进。',
        mood: 0,
      },
    ],
  },
  {
    id: 'three_headed_cat',
    text: '一只三头辐射猫坐在路中间，六只眼睛同时盯着你。中间那个头在打呼噜，左边那个在呲牙，右边那个睡着了。',
    choices: [
      {
        id: 'pet',
        text: '尝试抚摸（60%成功）',
        resultText: '',
        luckCheck: {
          threshold: 0.6,
          successText: '三个头同时开始蹭你，你获得了一种难以名状的温暖。它离开时留下了什么东西。',
          failText: '左边那个头咬了你一口。辐射伤，但也许值得。',
          successMood: 25,
          successSanity: 10,
          successLootChance: 0.8,
          failHp: -12,
          failMood: -5,
        },
      },
      {
        id: 'feed',
        text: '喂食（消耗1急救包）',
        req: { item: 'medkit' },
        resultText: '你把急救包里的纱布喂给它们，三个头各叼走一块，然后并排坐在那里舔爪子。没有谢谢。',
        mood: 15,
        sanity: 8,
      },
      {
        id: 'detour',
        text: '绕道走',
        resultText: '你感觉六道目光一路跟着你走了很久。',
        mood: -3,
        sanity: -5,
      },
    ],
  },
  {
    id: 'underground_radio',
    text: '废墟地板下传来微弱的音乐声，是一首战前的老情歌。刨开碎石，你发现了一台还在运行的地下广播站，主持人位置上坐着一副骷髅。',
    choices: [
      {
        id: 'listen',
        text: '坐下来听一会儿',
        resultText: '你靠着骷髅主持人坐了大约十分钟。歌很好听，眼眶有点热。',
        mood: 20,
        sanity: 15,
      },
      {
        id: 'broadcast',
        text: '接过麦克风，说几句话',
        resultText: '"嗯……这里是废墟电台，没什么好说的，大家保重。"你把麦克风放回去，感觉轻了一点。',
        mood: 15,
        sanity: 20,
      },
      {
        id: 'take_parts',
        text: '拆走零件',
        resultText: '广播停了。废墟更安静了。',
        mood: -15,
        sanity: -10,
        lootChance: 1.0,
      },
    ],
  },
  {
    id: 'corporate_video',
    text: '一台嵌在墙里的显示器自动播放着企业培训录像："欢迎加入末日生存有限公司！第一课：积极心态是最重要的生存技能……"',
    choices: [
      {
        id: 'watch',
        text: '认真观看（70%感悟）',
        resultText: '',
        luckCheck: {
          threshold: 0.7,
          successText: '你居然在这种地方受到了激励。目标感油然而生，虽然你也不确定目标是什么。',
          failText: '看完第三集后你意识到这是骗局，心情极差，但也更清醒了。',
          successMood: 18,
          successSanity: 8,
          failMood: -12,
          failSanity: 10,
        },
      },
      {
        id: 'skip',
        text: '快进到结尾',
        resultText: '"恭喜你完成全部培训！证书已发放至您的废土信箱。"信箱不存在。',
        mood: 5,
        sanity: -3,
      },
      {
        id: 'smash',
        text: '砸掉屏幕',
        resultText: '安静了。',
        mood: 10,
        sanity: -5,
        lootChance: 0.3,
      },
    ],
  },
  {
    id: 'expired_lottery',
    text: '你在废墟中发现一张彩票，对照旁边贴着的过期号码，——你中了头奖。奖金：一千万。问题是，那家彩票机构已经不存在了。',
    choices: [
      {
        id: 'find_office',
        text: '去找他们的兑奖站（50%成功）',
        resultText: '',
        luckCheck: {
          threshold: 0.5,
          successText: '你找到了一处满是灰尘的兑奖站，里面还剩一些现金，被你全取走了。',
          failText: '走了很远只找到一个被烧光的废墟，还遇上了流氓，身上的钱被抢走一部分。',
          successMood: 20,
          successMoney: 500,
          failMood: -10,
          failMoney: -120,
        },
      },
      {
        id: 'keep',
        text: '夹进口袋当纪念品',
        resultText: '万一哪天世界重建了呢？',
        mood: 8,
        sanity: 3,
      },
      {
        id: 'burn',
        text: '点火烧掉',
        resultText: '火苗烧了大约两秒。你看着它，平静得出乎意料。',
        sanity: 10,
        mood: -3,
      },
    ],
  },
  {
    id: 'graffiti_dare',
    text: '一面墙上用红色涂料写着："你根本不敢继续往前走。" 落款：无名氏，写于第三年。',
    choices: [
      {
        id: 'continue',
        text: '继续往前走，就是为了证明他错了',
        resultText: '你走过了那面墙。不知为何心情好了很多。',
        mood: 15,
        sanity: 5,
      },
      {
        id: 'write_back',
        text: '在旁边写：你也不敢留下名字',
        resultText: '你在旁边留下了这句话，感觉赢了。',
        mood: 20,
        sanity: 8,
      },
      {
        id: 'ponder',
        text: '站在原地想了五分钟',
        resultText: '你不确定自己有没有被激怒，但确实没动。这很诚实。',
        sanity: 5,
        mood: -5,
      },
    ],
  },
  {
    id: 'rusty_gym',
    text: '一处废弃健身房，器械大多生锈，但有一套哑铃居然还完好。镜子里的你看起来很憔悴。',
    choices: [
      {
        id: 'workout',
        text: '硬撑做一套（消耗8饱食，40%成功）',
        req: { stat: 'satiety', val: 8 },
        resultText: '',
        luckCheck: {
          threshold: 0.4,
          successText: '你完成了一套有点惨烈的训练，汗水流下来，反而感觉清醒了。',
          failText: '举到一半肌肉拉伤，哑铃砸到了脚。',
          successMood: 20,
          successSanity: 12,
          successHp: 5,
          failHp: -10,
          failMood: -8,
        },
      },
      {
        id: 'rest',
        text: '在长椅上躺一会儿',
        resultText: '肌肉没有锻炼，但心理得到了休息。',
        mood: 10,
        sanity: 10,
      },
      {
        id: 'mirror',
        text: '对着镜子发呆',
        resultText: '你在镜子里看自己看了很久，然后砸碎了它。',
        mood: -5,
        sanity: -8,
        lootChance: 0.2,
      },
    ],
  },
  {
    id: 'system_update',
    text: '空气中突然浮现出一个全息弹窗："系统更新可用 v4.1.2 末日补丁。新功能：意义感 +15%。预计安装时间：永远。是否立即更新？"',
    choices: [
      {
        id: 'update',
        text: '点击"立即更新"（50%成功）',
        resultText: '',
        luckCheck: {
          threshold: 0.5,
          successText: '"更新完成。检测到内心空洞已修复17%。"你感觉好一点了，虽然原理不明。',
          failText: '"更新失败。错误代码：HUMANITY_NOT_FOUND。"弹窗消失了，你看了一会儿空气。',
          successMood: 20,
          successSanity: 20,
          failSanity: -8,
          failMood: -5,
        },
      },
      {
        id: 'later',
        text: '点击"稍后提醒我"',
        resultText: '"好的，将在1分钟后再次提醒您。" 你继续走，弹窗跟着你漂移了整整三十秒。',
        mood: 5,
        sanity: -5,
      },
      {
        id: 'decline',
        text: '强制关闭弹窗',
        resultText: '"强制关闭需要管理员权限。" 你挥手打散了全息影像。它是假的，但手感很实在。',
        mood: 8,
        sanity: 5,
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
