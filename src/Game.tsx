import { useState, useEffect, useRef } from 'react';
import type { Scene, Player, RaidState, Item, ExchangeAsset, Jackpots } from './types/game';
import { GEAR, ITEMS, RELICS } from './data/items';
import {
  WIN_GOAL, ENERGY_CAP, ENEMIES, FACILITIES, STORY_EVENTS,
  RARITY_CONFIG, LOOT_DB, EXCHANGE_ASSETS, EXCHANGE_NEWS_POOL,
  EXCHANGE_FEE_RATE, JACKPOT_BASES,
} from './data/gameConfig';
import {
  Sword, Shield, Heart, Activity, Skull, ShoppingBag, Briefcase,
  Footprints, LogOut, Coins, Trash2, Utensils, Smile, Hammer,
  HelpCircle, Gem, Rocket, Radio,
} from './components/Icons';
import { PixelCard } from './components/PixelCard';
import { ProgressBar } from './components/ProgressBar';
import { CRTOverlay } from './components/CRTOverlay';
import { SlotMachine } from './components/SlotMachine';
import {
  countItemInStorage, removeItemsFromStorage, isMaterial, isJunk,
  groupItems, generateLootItem, getSellMultiplier,
} from './utils/gameHelpers';

const introTexts = [
  '除夕之夜，写字楼的灯光惨白依旧。',
  '你刚刚提交了最后一行代码，正准备迎接久违的假期。',
  '推开大门的瞬间，一阵不属于这个季节的刺骨寒风将你吞没……',
  '再睁眼时，熟悉的街道已成焦土。',
  '视网膜上跳动着幽绿色的乱码，最终汇聚成一个复古的游戏界面。',
  '【系统启动……废土生存协议已加载】',
  '【注意：检测到黑市控制权已被不明财团掌控】',
  '【目标更新：缴纳 $32,500 激活撤离飞船，返回现实世界】',
  '在这个绝望的世界，金钱就是你唯一的归途。',
  '活下去，或者成为数据的一部分。',
];

const INIT_PLAYER: Player = {
  hp: 100, maxHp: 100, satiety: 100, maxSatiety: 100,
  mood: 100, maxMood: 100, sanity: 100, maxSanity: 100,
  money: 500, weapon: GEAR.knife, armor: GEAR.clothes,
  relics: [], facilities: { medical: 0, recycling: 0, kitchen: 0 },
  inventory: [], storage: [], day: 1, ownedGear: [],
};

export function Game() {
  const [scene, setScene] = useState<Scene>('intro');
  const [logs, setLogs] = useState<string[]>([]);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [isShake, setIsShake] = useState(false);

  const [shopTab, setShopTab] = useState<'buy' | 'gamble' | 'exchange'>('exchange');
  const [buySubTab, setBuySubTab] = useState<'supplies' | 'gear' | 'materials'>('supplies');
  const [betAmount, setBetAmount] = useState(50);
  const [isVipMode, setIsVipMode] = useState(false);
  const [showCasinoRules, setShowCasinoRules] = useState(false);

  const [isSpinning, setIsSpinning] = useState(false);
  const [freeSpins, setFreeSpins] = useState(0);
  const [slotMoodMsg, setSlotMoodMsg] = useState('');
  const [jackpots, setJackpots] = useState<Jackpots>({ mini: 2000, major: 8000, grand: 20000 });
  const [energy, setEnergy] = useState(0);
  const [isFrenzy, setIsFrenzy] = useState(false);
  const [frenzySpins, setFrenzySpins] = useState(0);
  const [slotGrid, setSlotGrid] = useState<string[][] | null>(null);
  const [winningPositions, setWinningPositions] = useState<[number, number][]>([]);
  const [teaserCol, setTeaserCol] = useState<number | null>(null);
  const [slotBanner, setSlotBanner] = useState('');
  const [bannerBoost, setBannerBoost] = useState(false);

  const [exchangeAssets, setExchangeAssets] = useState<ExchangeAsset[]>(EXCHANGE_ASSETS.map(a => ({ ...a })));
  const [exchangeNews, setExchangeNews] = useState<{ text: string; targetId: string; effect: number } | null>(null);
  const [exchangeLastDay, setExchangeLastDay] = useState<number | null>(null);
  const [selectedAssetId, setSelectedAssetId] = useState(EXCHANGE_ASSETS[0].id);
  const [buyQty, setBuyQty] = useState(1);
  const [sellQty, setSellQty] = useState(1);

  const [introStep, setIntroStep] = useState(0);
  const introEndRef = useRef<HTMLDivElement>(null);
  const [player, setPlayer] = useState<Player>(INIT_PLAYER);
  const [raidState, setRaidState] = useState<RaidState>({
    distance: 0, dangerLevel: 1, currentEnemy: null, isGlitchEnemy: false,
    tempLoot: [], currentLootItem: null, currentInteractiveEvent: null,
  });

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString('zh-CN', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs(prev => [`[${time}] ${msg}`, ...prev].slice(0, 8));
  };

  const triggerShake = () => { setIsShake(true); setTimeout(() => setIsShake(false), 500); };

  const upgradeFacility = (facId: string) => {
    const fac = FACILITIES[facId];
    const lvl = player.facilities[facId] || 0;
    if (lvl >= fac.maxLevel) { addLog('该设施已升至最高级！'); return; }
    const cfg = fac.levels[lvl];
    const canBuild = Object.entries(cfg.cost).every(([name, cnt]) => countItemInStorage(player.storage, name) >= cnt);
    if (!canBuild) { addLog('升级材料不足！'); return; }
    let newStorage = [...player.storage];
    for (const [name, cnt] of Object.entries(cfg.cost)) newStorage = removeItemsFromStorage(newStorage, name, cnt);
    const newFacilities = { ...player.facilities, [facId]: lvl + 1 };
    const updates: Partial<Player> = { storage: newStorage, facilities: newFacilities };
    if (facId === 'kitchen') { updates.maxSatiety = cfg.effect; updates.satiety = cfg.effect; }
    setPlayer(prev => ({ ...prev, ...updates }));
    addLog(`设施升级成功：${fac.name} (Lv.${lvl + 1})`);
  };

  const settleExchange = () => {
    if (exchangeLastDay !== null && player.day === exchangeLastDay) return;
    const news = EXCHANGE_NEWS_POOL[Math.floor(Math.random() * EXCHANGE_NEWS_POOL.length)];
    setExchangeNews(news);
    setExchangeAssets(prev => prev.map(a => {
      let delta = (Math.random() * 2 - 1) * a.vol;
      if (a.id === 'realty') delta += (a.change || 0) > 0 ? 0.02 : (a.change || 0) < 0 ? -0.02 : 0;
      if (news && news.targetId === a.id) delta += news.effect;
      return { ...a, price: Math.max(1, Math.round(a.price * (1 + delta) * 100) / 100), change: Math.round(delta * 1000) / 10 };
    }));
    setExchangeLastDay(player.day);
  };

  const buyAsset = (id: string, qty: number) => {
    const asset = exchangeAssets.find(a => a.id === id);
    if (!asset) return;
    const totalCost = Math.round((asset.price * qty) * (1 + EXCHANGE_FEE_RATE) * 100) / 100;
    if (qty <= 0 || player.money < totalCost) { addLog('资金不足！'); return; }
    const fee = Math.round(asset.price * qty * EXCHANGE_FEE_RATE * 100) / 100;
    setPlayer(p => ({ ...p, money: p.money - totalCost }));
    setExchangeAssets(prev => prev.map(a => {
      if (a.id !== id) return a;
      const newHeld = a.held + qty;
      return { ...a, held: newHeld, costBasis: newHeld > 0 ? ((a.costBasis || 0) * a.held + totalCost) / newHeld : 0 };
    }));
    addLog(`📈 买入 ${asset.name} ${qty} 份，花费 $${(asset.price * qty).toFixed(2)}（手续费 $${fee.toFixed(2)}）`);
  };

  const sellAsset = (id: string, qty: number) => {
    const asset = exchangeAssets.find(a => a.id === id);
    if (!asset || asset.held <= 0) { addLog('无可卖出的持仓。'); return; }
    const q = Math.min(qty, asset.held);
    if (q <= 0) return;
    const revenue = asset.price * q;
    const fee = Math.round(revenue * EXCHANGE_FEE_RATE * 100) / 100;
    const net = Math.max(0, Math.round((revenue - fee) * 100) / 100);
    const pnl = Math.round(((asset.price - (asset.costBasis || 0)) * q - fee) * 100) / 100;
    setPlayer(p => ({ ...p, money: p.money + net }));
    setExchangeAssets(prev => prev.map(a => {
      if (a.id !== id) return a;
      const remaining = a.held - q;
      return { ...a, held: remaining, costBasis: remaining > 0 ? a.costBasis : 0 };
    }));
    addLog(`💰 卖出 ${asset.name} ${q} 份，收入 $${net.toFixed(2)}（手续费 $${fee.toFixed(2)}），盈亏 $${pnl.toFixed(2)}`);
  };

  const sellAssetAll = (id: string) => {
    const asset = exchangeAssets.find(a => a.id === id);
    if (!asset || asset.held <= 0) { addLog('无可清仓的持仓。'); return; }
    const revenue = asset.price * asset.held;
    const fee = Math.round(revenue * EXCHANGE_FEE_RATE * 100) / 100;
    const net = Math.max(0, Math.round((revenue - fee) * 100) / 100);
    const pnl = Math.round(((asset.price - (asset.costBasis || 0)) * asset.held - fee) * 100) / 100;
    setPlayer(p => ({ ...p, money: p.money + net }));
    setExchangeAssets(prev => prev.map(a => a.id === id ? { ...a, held: 0, costBasis: 0 } : a));
    addLog(`📉 清仓 ${asset.name}，收入 $${net.toFixed(2)}（手续费 $${fee.toFixed(2)}），盈亏 $${pnl.toFixed(2)}`);
  };

  useEffect(() => { if (shopTab === 'exchange') settleExchange(); }, [shopTab, raidState.distance]);

  const handleEventChoice = (choice: any) => {
    if (choice.req) {
      if (choice.req.item) {
        const hasItem = player.storage.some(i => i.id === choice.req.item);
        if (!hasItem) { addLog('缺少所需物品！'); return; }
        const idx = player.storage.findIndex(i => i.id === choice.req.item);
        setPlayer(prev => ({ ...prev, storage: prev.storage.filter((_, i) => i !== idx) }));
      }
      if (choice.req.stat) {
        if ((player as any)[choice.req.stat] < choice.req.val) { addLog('状态不足！'); return; }
        setPlayer(prev => ({ ...prev, [choice.req.stat]: (prev as any)[choice.req.stat] - choice.req.val }));
      }
    }
    addLog(choice.resultText);
    if (choice.mood) setPlayer(prev => ({ ...prev, mood: Math.min(prev.maxMood, prev.mood + choice.mood) }));
    if (choice.sanity) setPlayer(prev => ({ ...prev, sanity: Math.min(prev.maxSanity, prev.sanity + choice.sanity) }));
    if (choice.combat) {
      let enemy: any = ENEMIES[0];
      if (choice.enemyId === 'weak_scavenger') enemy = { name: '受伤的拾荒者', hp: 15, maxHp: 15, atk: 4, exp: 20 };
      if (choice.enemyId === 'glitch') enemy = { name: '?%#ERROR', hp: 60, maxHp: 60, atk: 12, exp: 0 };
      setRaidState(prev => ({ ...prev, currentEnemy: { ...enemy }, isGlitchEnemy: choice.enemyId === 'glitch' }));
      setScene('combat'); return;
    }
    if (choice.lootChance && Math.random() < choice.lootChance) {
      const loot = generateLootItem(raidState.distance + 500, player.mood);
      setRaidState(prev => ({ ...prev, tempLoot: [...prev.tempLoot, loot], currentLootItem: loot }));
      setScene('event'); return;
    }
    setScene('raid');
  };

  const handleShopClick = (item: any, type: 'item' | 'gear' | 'material') => {
    const key = item.id || item.name;
    if (type === 'gear' && (player.ownedGear || []).includes(item.id)) { addLog('已购买该装备。'); return; }
    if (confirmId === key) {
      if (type === 'gear') buyGear(item);
      else if (type === 'material') buyMaterial(item);
      else buyItem(item);
      setConfirmId(null);
    } else {
      setConfirmId(key);
      setTimeout(() => setConfirmId(prev => prev === key ? null : prev), 3000);
    }
  };

  const handleSpin = () => {
    const isFS = freeSpins > 0, isFrenzyS = frenzySpins > 0;
    if (!isFS && !isFrenzyS && player.money < betAmount) { addLog('资金不足！'); return; }
    if (!isFS && !isFrenzyS) {
      setPlayer(p => ({ ...p, money: p.money - betAmount }));
      setJackpots(prev => ({ mini: prev.mini + Math.floor(betAmount * 0.05), major: prev.major + Math.floor(betAmount * 0.03), grand: prev.grand + Math.floor(betAmount * 0.02) }));
    } else if (isFS) setFreeSpins(prev => Math.max(0, prev - 1));
    else setFrenzySpins(prev => Math.max(0, prev - 1));

    setIsSpinning(true); setSlotGrid(null); setSlotMoodMsg(''); setWinningPositions([]); setTeaserCol(null); setSlotBanner(''); setBannerBoost(false);

    const poolNormal = [{ s: '💀', w: 20 }, { s: '🔧', w: 25 }, { s: '🍗', w: 20 }, { s: '☢️', w: 15 }, { s: '💎', w: 10 }, { s: '7️⃣', w: 4 }, { s: '🃏', w: 4 }, { s: '⭐', w: 2 }];
    const poolVip = [{ s: '💀', w: 35 }, { s: '🔧', w: 10 }, { s: '🍗', w: 10 }, { s: '☢️', w: 15 }, { s: '💎', w: 15 }, { s: '7️⃣', w: 8 }, { s: '🃏', w: 4 }, { s: '⭐', w: 3 }];
    let base = isVipMode ? poolVip : poolNormal;
    if (!isVipMode && betAmount < 100) base = base.filter(x => x.s !== '⭐');
    const pool = (isFrenzy || isFrenzyS) ? base.filter(x => x.s !== '💀' && x.s !== '🔧') : base;
    if (pool.length === 0) pool.push({ s: '🔧', w: 100 });
    const pick = () => { const tot = pool.reduce((a, b) => a + b.w, 0); let r = Math.random() * tot; for (const p of pool) { r -= p.w; if (r <= 0) return p.s; } return pool[pool.length - 1].s; };

    const grid = Array.from({ length: 3 }, () => Array.from({ length: 5 }, () => pick()));
    const lines = [[0,0,0,0,0],[1,1,1,1,1],[2,2,2,2,2],[0,1,2,1,0],[2,1,0,1,2],[0,0,1,2,2],[2,2,1,0,0],[1,0,1,2,1],[1,2,1,0,1],[0,1,1,1,2]];
    const mul: Record<string, Record<number, number>> = { '7️⃣': { 3: 80, 4: 250, 5: 1000 }, '💎': { 3: 40, 4: 100, 5: 500 }, '☢️': { 3: 20, 4: 50, 5: 200 }, '🍗': { 3: 10, 4: 30, 5: 100 }, '🔧': { 3: 5, 4: 15, 5: 50 } };
    const wildEnabled = isVipMode || betAmount >= 50;
    const allowed = new Set(['🔧']);
    if (isVipMode || betAmount >= 50) { allowed.add('🍗'); allowed.add('☢️'); }
    if (isVipMode || betAmount >= 100) { allowed.add('💎'); allowed.add('7️⃣'); }

    let totalMult = 0, energyGain = 0, miniWin = false, majorWin = false, grandWin = false;
    const wins: [number, number][] = [];
    let winningLines = 0;

    for (const line of lines) {
      const seq = line.map((r, c) => grid[r][c]);
      let base_sym: string | null = null;
      for (const s of seq) { if (s !== '🃏' && s !== '⭐' && s !== '💀') { base_sym = s; break; } }
      if (!base_sym || !mul[base_sym] || !allowed.has(base_sym)) continue;
      let len = 0;
      const tempWins: [number, number][] = [];
      for (let c = 0; c < 5; c++) {
        const s = seq[c];
        if (s === '⭐' || s === '💀') break;
        if (s === base_sym || (wildEnabled && s === '🃏')) { len++; tempWins.push([line[c], c]); } else break;
      }
      if (len >= 3) {
        wins.push(...tempWins);
        totalMult += mul[base_sym][len] || 0;
        winningLines++;
        if (!(isFrenzy || isFrenzyS)) energyGain += len === 3 ? 1 : len === 4 ? 2 : 3;
        if (len === 5) { if (base_sym === '☢️') miniWin = true; if (base_sym === '💎') majorWin = true; if (base_sym === '7️⃣') grandWin = true; }
      }
    }

    const scatters = grid.flat().filter(s => s === '⭐').length;
    const teaser = scatters >= 2 && [0, 1, 2, 3].some(c => [0, 1, 2].some(r => grid[r][c] === '⭐')) ? 4 : null;
    setTeaserCol(teaser); setSlotGrid(grid);
    const baseDelay = teaser === 4 ? 3700 : 2000;
    if (teaser === 4) setTimeout(() => { setSlotBanner('即将出免费摇奖...？！！'); setBannerBoost(true); setTimeout(() => setBannerBoost(false), 600); }, 1400);

    setTimeout(() => {
      setWinningPositions(wins); setIsSpinning(false);
      if (scatters >= 3) {
        const add = scatters === 3 ? 5 : scatters === 4 ? 10 : 20;
        setFreeSpins(prev => prev + add);
        setTimeout(() => { setSlotBanner(`获得 ${add} 次免费摇奖！`); setBannerBoost(true); setTimeout(() => setBannerBoost(false), 600); }, 500);
      }
      const lineBet = betAmount / 10;
      const frenzyMult = (isFrenzy || isFrenzyS) ? (winningLines > 5 ? 2 : 1.5) : 1;
      const winAmount = Math.floor(totalMult * lineBet * frenzyMult);

      if (miniWin) { setPlayer(p => ({ ...p, money: p.money + jackpots.mini })); setJackpots(prev => ({ ...prev, mini: JACKPOT_BASES.mini })); setSlotBanner('MINI JACKPOT!'); setBannerBoost(true); setTimeout(() => setBannerBoost(false), 600); }
      else if (majorWin) { setPlayer(p => ({ ...p, money: p.money + jackpots.major })); setJackpots(prev => ({ ...prev, major: JACKPOT_BASES.major })); setSlotBanner('MAJOR JACKPOT!'); setBannerBoost(true); setTimeout(() => setBannerBoost(false), 600); }
      else if (grandWin) { setPlayer(p => ({ ...p, money: p.money + jackpots.grand })); setJackpots(prev => ({ ...prev, grand: JACKPOT_BASES.grand })); setSlotBanner('GRAND JACKPOT!'); setBannerBoost(true); setTimeout(() => setBannerBoost(false), 600); }

      if (winAmount > 0) {
        setPlayer(p => ({ ...p, money: p.money + winAmount, mood: Math.min(p.maxMood, p.mood + 5) }));
        setSlotMoodMsg('心情 +5');
        addLog(`🎰 中奖！获得 $${winAmount}${(isFrenzy || isFrenzyS) ? ` (狂热 x${frenzyMult})` : ''}`);
      } else {
        setPlayer(p => ({ ...p, mood: Math.max(0, p.mood - 2) }));
        setSlotMoodMsg('心情 -2');
        addLog('🎰 未中奖。');
      }

      if (!(isFrenzy || isFrenzyS)) {
        const newEnergy = energy + energyGain;
        if (newEnergy >= ENERGY_CAP) { setEnergy(0); setFrenzySpins(prev => prev + 5); setIsFrenzy(true); if (!miniWin && !majorWin && !grandWin) setTimeout(() => { setSlotBanner('RADIATION FRENZY!'); setBannerBoost(true); setTimeout(() => setBannerBoost(false), 600); }, 600); }
        else { setEnergy(newEnergy); setIsFrenzy(false); }
      } else { if (frenzySpins === 0) setIsFrenzy(false); }
    }, baseDelay);
  };

  const buyItem = (item: Item) => {
    if (player.money >= (item.cost || 0)) { setPlayer(prev => ({ ...prev, money: prev.money - (item.cost || 0), storage: [...prev.storage, { ...item, type: 'consumable' }] })); addLog(`购买了 ${item.name}`); }
    else addLog('资金不足！');
  };
  const buyMaterial = (item: Item) => {
    const price = Math.floor((item.val || 0) * 5);
    if (player.money >= price) { setPlayer(prev => ({ ...prev, money: prev.money - price, storage: [...prev.storage, { ...item }] })); addLog(`购买材料 ${item.name}，花费 $${price}`); }
    else addLog('资金不足！');
  };
  const buyGear = (gear: any) => {
    if ((player.ownedGear || []).includes(gear.id)) { addLog('已购买该装备。'); return; }
    if (player.money >= gear.cost) { setPlayer(prev => ({ ...prev, money: prev.money - gear.cost, [gear.type]: gear, ownedGear: [...(prev.ownedGear || []), gear.id] })); addLog(`装备了 ${gear.name}`); }
    else addLog('资金不足！');
  };

  const sellOneByKey = (key: string) => {
    const idx = player.storage.findIndex(i => (i.id || `${i.type}:${i.name}`) === key);
    if (idx === -1) return;
    const item = player.storage[idx];
    const mult = getSellMultiplier(player);
    let base = item.val || Math.floor((item.cost || 0) / 2) || 1;
    if (player.relics.find(r => r.id === 'cat')) base = Math.floor(base * 1.2);
    const finalPrice = Math.floor(base * mult);
    setPlayer(prev => ({ ...prev, money: prev.money + finalPrice, storage: prev.storage.filter((_, i) => i !== idx) }));
    addLog(`出售 ${item.name}，获得 $${finalPrice}`);
  };

  const useOneByKey = (key: string) => {
    const idx = player.storage.findIndex(i => (i.id || `${i.type}:${i.name}`) === key);
    if (idx === -1) return;
    const item = player.storage[idx];
    if (item.type === 'relic') {
      if (player.relics.some(r => r.id === item.id)) { addLog('已装备该遗物。'); return; }
      setPlayer(prev => ({ ...prev, relics: [...prev.relics, item], storage: prev.storage.filter((_, i) => i !== idx) }));
      addLog(`装备遗物：${item.name}`); return;
    }
    if (item.type !== 'consumable') return;
    let used = false;
    const np = { ...player };
    if (item.effect === 'heal' && player.hp < player.maxHp) { np.hp = Math.min(player.maxHp, player.hp + (item.value || 0)); used = true; }
    else if (item.effect === 'satiety' && player.satiety < player.maxSatiety) { np.satiety = Math.min(player.maxSatiety, player.satiety + (item.value || 0)); used = true; }
    else if (item.effect === 'mood' && player.mood < player.maxMood) { np.mood = Math.min(player.maxMood, player.mood + (item.value || 0)); np.sanity = Math.max(0, player.sanity - 10); used = true; }
    else if (item.effect === 'sanity' && player.sanity < player.maxSanity) { np.sanity = Math.min(player.maxSanity, player.sanity + (item.value || 0)); used = true; }
    if (used) { np.storage = player.storage.filter((_, i) => i !== idx); setPlayer(np); addLog(`使用了 ${item.name}。`); }
  };

  const sellAllLoot = () => {
    const junk = player.storage.filter(isJunk);
    if (!junk.length) { addLog('没有可出售的杂物。'); return; }
    const mult = getSellMultiplier(player);
    const hasCat = player.relics.find(r => r.id === 'cat');
    let total = junk.reduce((a, i) => a + (i.val || 0), 0);
    if (hasCat) total = Math.floor(total * 1.2);
    total = Math.floor(total * mult);
    setPlayer(prev => ({ ...prev, money: prev.money + total, storage: prev.storage.filter(i => !isJunk(i)) }));
    addLog(`一键出售杂物，获得 $${total}`);
  };

  const startRaid = () => {
    setRaidState({ distance: 0, dangerLevel: 1, currentEnemy: null, isGlitchEnemy: false, tempLoot: [], currentLootItem: null, currentInteractiveEvent: null });
    setPlayer(p => ({ ...p, sanity: Math.max(0, p.sanity - 5) }));
    setScene('raid');
    addLog('进入废墟... 感觉到这里充满了恶意。');
  };

  const explore = () => {
    if (player.satiety <= 0) { addLog('你饿得走不动了... 生命值正在流失！'); setPlayer(p => ({ ...p, hp: Math.max(0, p.hp - 10) })); if (player.hp <= 10) setScene('gameover'); return; }
    const newDist = raidState.distance + 100;
    const rng = Math.random();
    const danger = 1 + Math.floor(newDist / 500);
    let satCost = 5, sanCost = 2;
    if (player.mood < 15) { satCost += 5; sanCost += 2; } else if (player.mood < 30) { satCost += 2; sanCost += 1; }
    setPlayer(prev => ({ ...prev, satiety: Math.max(0, prev.satiety - satCost), sanity: Math.max(0, prev.sanity - sanCost) }));
    setRaidState(prev => ({ ...prev, distance: newDist, dangerLevel: danger }));
    addLog(`深入废墟 ${newDist}m... (饱食-${satCost}, 理智-${sanCost})`);
    if (player.sanity < 50 && Math.random() > 0.7) addLog('你听到耳边有奇怪的低语...');
    if (rng < 0.2) {
      const ev = STORY_EVENTS[Math.floor(Math.random() * STORY_EVENTS.length)];
      setRaidState(prev => ({ ...prev, currentInteractiveEvent: ev })); setScene('interactive_event');
      addLog('前方出现异常情况...'); return;
    }
    if (rng < 0.45) {
      let enemy: any = null, isGlitch = false;
      if (player.sanity < 30 && Math.random() < 0.6) {
        isGlitch = true;
        const ms = (50 - player.sanity) / 10;
        enemy = { name: '?&%#@!', hp: 50 + ms * 20, maxHp: 50 + ms * 20, atk: 8 + ms * 3, exp: 0 };
      } else {
        const pool = ENEMIES.filter((_, i) => i < danger);
        const t = pool[Math.floor(Math.random() * pool.length)] || ENEMIES[ENEMIES.length - 1];
        enemy = { ...t };
      }
      setRaidState(prev => ({ ...prev, currentEnemy: enemy, isGlitchEnemy: isGlitch }));
      setPlayer(p => ({ ...p, sanity: Math.max(0, p.sanity - 5), mood: Math.max(0, p.mood - 2) }));
      setScene('combat');
      if (isGlitch) addLog('警告：遭遇不可名状的实体！'); else addLog(`遭遇敌对目标：${enemy.name}！`);
    } else if (rng < 0.8) {
      const loot = generateLootItem(newDist, player.mood);
      setRaidState(prev => ({ ...prev, tempLoot: [...prev.tempLoot, loot], currentLootItem: loot }));
      setPlayer(p => ({ ...p, mood: Math.min(p.maxMood, p.mood + 5) }));
      addLog(`发现物资：${loot.name}`); setScene('event');
    } else { setPlayer(p => ({ ...p, mood: Math.max(0, p.mood - 1) })); addLog('周围很安静，也许太安静了。'); }
  };

  const handleCombat = (action: 'attack' | 'flee') => {
    if (!raidState.currentEnemy) return;
    if (action === 'attack') {
      let hitChance = player.mood < 30 ? 0.6 : 0.9;
      let atk = player.weapon.atk || 0;
      if (player.relics.find(r => r.id === 'adrenaline') && player.hp < player.maxHp * 0.3) { atk *= 2; addLog('肾上腺素激活！伤害翻倍！'); }
      if (raidState.isGlitchEnemy) { setPlayer(p => ({ ...p, satiety: Math.max(0, p.satiety - 2) })); addLog('攻击这个怪物让你感到异常疲惫...(饱食-2)'); }
      if (Math.random() > hitChance) { addLog('你的攻击落空了！(心情低落)'); setPlayer(p => ({ ...p, mood: Math.max(0, p.mood - 1) })); }
      else {
        const dmg = Math.max(1, atk + Math.floor(Math.random() * 3));
        const remHp = raidState.currentEnemy.hp - dmg;
        addLog(`你造成了 ${dmg} 点伤害。`);
        if (remHp <= 0) {
          addLog('击败了敌人！');
          const e = raidState.currentEnemy;
          const reward = Math.max(10, Math.floor((e.exp || 20) * 1.5) + (e.atk || 5) * 3) * raidState.dangerLevel + Math.floor(Math.random() * 20);
          const drops: Item[] = [];
          if (Math.random() < 0.6) drops.push({ ...ITEMS.food, type: 'consumable' });
          if (Math.random() < 0.3) drops.push({ ...ITEMS.medkit, type: 'consumable' });
          setPlayer(p => ({ ...p, money: p.money + reward, storage: [...p.storage, ...drops] }));
          addLog(`获得 $${reward}${drops.length ? '，并拾取 ' + drops.map(i => i.name).join('、') : ''}`);
          if (player.relics.find(r => r.id === 'vampire')) { setPlayer(p => ({ ...p, hp: Math.min(p.maxHp, p.hp + 5) })); addLog('吸血鬼之牙：汲取了 5 点生命。'); }
          setPlayer(p => ({ ...p, mood: Math.min(p.maxMood, p.mood + 5) }));
          setRaidState(prev => ({ ...prev, currentEnemy: null })); setScene('raid'); return;
        }
        setRaidState(prev => ({ ...prev, currentEnemy: { ...prev.currentEnemy!, hp: remHp } }));
      }
      const def = player.armor.def || 0;
      const enemyDmg = Math.max(0, raidState.currentEnemy.atk - def);
      setPlayer(prev => ({ ...prev, hp: prev.hp - enemyDmg, mood: Math.max(0, prev.mood - 2) }));
      if (enemyDmg > 0) triggerShake();
      addLog(`敌人反击！受到 ${enemyDmg} 点伤害。`);
      if (player.hp - enemyDmg <= 0) setScene('gameover');
    } else {
      const flee = player.mood > 80 ? 0.7 : player.mood < 30 ? 0.3 : 0.5;
      if (Math.random() < flee) {
        addLog('逃跑成功！'); setRaidState(prev => ({ ...prev, currentEnemy: null }));
        setPlayer(p => ({ ...p, mood: Math.min(p.maxMood, p.mood + 2) })); addLog('短暂喘息：心情 +2'); setScene('raid');
      } else {
        addLog('逃跑失败！被敌人追上了。');
        const def = player.armor.def || 0;
        const enemyDmg = Math.max(0, raidState.currentEnemy.atk - def);
        setPlayer(prev => ({ ...prev, hp: prev.hp - enemyDmg })); triggerShake();
        if (player.hp - enemyDmg <= 0) setScene('gameover');
      }
    }
  };

  const evac = () => {
    const medLvl = player.facilities.medical || 0;
    const heal = medLvl === 0 ? 10 : FACILITIES.medical.levels[medLvl - 1].effect;
    setPlayer(prev => ({ ...prev, hp: Math.min(prev.maxHp, prev.hp + heal), satiety: Math.max(0, prev.satiety - 10), storage: [...prev.storage, ...raidState.tempLoot], day: (prev.day || 1) + 1 }));
    addLog('撤离成功！物资已转运至仓库。'); setScene('result');
  };

  const resetGame = () => { setPlayer(INIT_PLAYER); setScene('intro'); setIntroStep(0); setLogs(['重新开始。祝你好运，行者。']); };

  useEffect(() => {
    if (scene === 'intro' && introStep < introTexts.length) {
      const t = setTimeout(() => setIntroStep(prev => prev + 1), 1500);
      return () => clearTimeout(t);
    }
  }, [scene, introStep]);

  useEffect(() => { introEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [introStep]);

  const inSpecialMode = freeSpins > 0 || frenzySpins > 0 || isFrenzy;

  const StatBar = () => (
    <div className="bg-slate-800/80 p-3 rounded mb-4 border border-slate-600 backdrop-blur-sm grid grid-cols-2 gap-x-4 gap-y-2 flex-none">
      <div className="col-span-2">
        <div className="flex justify-between text-sm text-slate-400 mb-1">
          <span>HP {player.hp}/{player.maxHp}</span>
          <span className="flex gap-1">{player.relics.map((_, i) => <Gem key={i} size={12} className="text-purple-400" />)}</span>
        </div>
        <ProgressBar current={player.hp} max={player.maxHp} color="bg-red-600" icon={<Heart size={14} className="text-red-500" />} />
      </div>
      <div>
        <ProgressBar current={player.satiety} max={player.maxSatiety} color="bg-yellow-600" icon={<Utensils size={14} className="text-yellow-500" />} />
        <div className="flex justify-between text-xs text-slate-500 mt-0.5"><span>饱食</span><span>{player.satiety}/{player.maxSatiety}</span></div>
      </div>
      <div>
        <ProgressBar current={player.sanity} max={player.maxSanity} color="bg-blue-600" icon={<Activity size={14} className="text-blue-500" />} />
        <div className="flex justify-between text-xs text-slate-500 mt-0.5"><span>理智</span><span>{player.sanity}/{player.maxSanity}</span></div>
      </div>
      <div className="col-span-2">
        <ProgressBar current={player.mood} max={player.maxMood} color="bg-purple-500" icon={<Smile size={14} className="text-purple-400" />} />
        <div className="flex justify-between text-xs text-slate-500 mt-0.5"><span>心情</span><span>{player.mood}/{player.maxMood}</span></div>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen bg-neutral-900 flex items-center justify-center p-4 font-mono text-slate-200 select-none ${isShake ? 'shake-anim' : ''}`}>
      <div className="game-container relative w-full max-w-lg bg-slate-800 rounded-2xl p-6 border-b-8 border-r-8 border-slate-950 shadow-2xl min-h-safe flex flex-col my-2">

        {scene !== 'intro' && (
          <div className="mb-2 flex-none border-b-4 border-slate-600 pb-2">
            <div className="flex justify-between items-end mb-2">
              <div>
                <h1 className="text-3xl text-yellow-500 leading-none mb-1 tracking-wider">废土行动</h1>
                <span className="text-lg text-slate-400">EXTRACTION RPG</span>
              </div>
              <div className="text-right">
                <div className="text-green-400 text-2xl flex items-center gap-1 justify-end font-bold"><span className="text-sm">$</span> {player.money.toLocaleString()}</div>
                <div className="text-lg text-slate-500">DAY {player.day}</div>
              </div>
            </div>
            <div className="px-1">
              <div className="flex justify-between text-[10px] text-yellow-600 mb-1 font-bold"><span>撤离飞船启动资金进度</span><span>{Math.floor((player.money / WIN_GOAL) * 100)}%</span></div>
              <div className="h-1 bg-slate-900 border border-slate-700 rounded-full overflow-hidden"><div className="h-full bg-yellow-500 transition-all duration-1000" style={{ width: `${Math.min(100, (player.money / WIN_GOAL) * 100)}%` }}></div></div>
            </div>
          </div>
        )}

        <div className="relative bg-[#1a1c21] border-4 border-slate-700 rounded-lg flex-1 flex flex-col justify-between overflow-hidden shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] min-h-0">
          <CRTOverlay sanity={player.sanity} />

          {/* ===== 开场剧情 ===== */}
          {scene === 'intro' && (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6 bg-black z-20 overflow-y-auto relative w-full h-full" onClick={() => setIntroStep(prev => Math.min(prev + 1, introTexts.length))}>
              <button onClick={e => { e.stopPropagation(); setIntroStep(introTexts.length); }} className="absolute top-4 right-4 text-slate-600 text-sm border border-slate-700 px-2 py-1 rounded hover:text-slate-400 z-50">SKIP &gt;&gt;</button>
              <div className="space-y-4 w-full max-w-lg z-10">
                {introTexts.slice(0, introStep + 1).map((text, i) => (
                  <p key={i} className={`text-green-500 text-lg leading-relaxed animate-in fade-in slide-in-from-bottom-2 duration-500 ${i === introTexts.length - 1 ? 'text-red-500 font-bold' : 'opacity-80'}`}>{text}</p>
                ))}
                <div ref={introEndRef}></div>
              </div>
              {introStep >= introTexts.length
                ? <button onClick={e => { e.stopPropagation(); setScene('home'); setLogs(['欢迎回来。当前的撤离目标是筹齐 $32,500。']); }} className="mt-8 px-8 py-3 bg-green-900/50 border-2 border-green-500 text-green-400 text-2xl hover:bg-green-800 animate-pulse mb-8 z-50 pointer-events-auto">INITIALIZE &gt;</button>
                : <div className="text-slate-600 text-sm animate-pulse mt-8">点击屏幕加速...</div>
              }
            </div>
          )}

          {scene !== 'intro' && (
            <div className="relative z-10 p-4 flex-1 flex flex-col h-full overflow-hidden min-h-0">
              {scene !== 'victory' && <StatBar />}

              {/* ===== 主界面 ===== */}
              {scene === 'home' && (
                <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center fade-in overflow-y-auto">
                  <div className="grid grid-cols-2 gap-4 w-full">
                    {player.money >= WIN_GOAL && (
                      <PixelCard onClick={() => setScene('victory')} className="col-span-2 bg-yellow-900/40 border-yellow-500 fever-mode py-6 victory-pulse">
                        <div className="flex flex-col items-center"><Rocket className="mb-2 text-yellow-400" size={48} /><span className="text-3xl text-yellow-400 font-bold tracking-widest">终极撤离</span><span className="text-sm text-yellow-600 mt-1 uppercase">激活飞船协议</span></div>
                      </PixelCard>
                    )}
                    <PixelCard onClick={() => { setScene('shop'); setShopTab('exchange'); }} className="col-span-2">
                      <div className="flex flex-col items-center py-2"><ShoppingBag className="mb-2 text-yellow-500" size={32} /><span className="text-2xl">黑市交易</span></div>
                    </PixelCard>
                    <PixelCard onClick={() => setScene('hideout')}>
                      <div className="flex flex-col items-center py-2"><Hammer className="mb-2 text-orange-500" size={32} /><span className="text-2xl">藏身处</span></div>
                    </PixelCard>
                    <PixelCard onClick={startRaid}>
                      <div className="flex flex-col items-center py-2"><LogOut className="mb-2 text-red-500" size={32} /><span className="text-2xl">开始探索</span></div>
                    </PixelCard>
                    <PixelCard onClick={() => setScene('storage')}>
                      <div className="flex flex-col items-center py-2"><Briefcase className="mb-2 text-blue-500" size={32} /><span className="text-2xl">物资仓库</span></div>
                    </PixelCard>
                    <PixelCard onClick={() => setScene('equipment')}>
                      <div className="flex flex-col items-center py-2"><Shield className="mb-2 text-slate-300" size={32} /><span className="text-2xl">角色装备</span></div>
                    </PixelCard>
                  </div>
                </div>
              )}

              {/* ===== 黑市 ===== */}
              {scene === 'shop' && (
                <div className="flex-1 flex flex-col h-full overflow-hidden fade-in min-h-0 relative">
                  <div className="flex-none bg-[#1a1c21] z-10 border-b border-slate-700 pb-2 mb-2">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-2xl text-yellow-500 tracking-widest">=== 黑市 ===</span>
                      <span className="text-green-400 text-xl flex items-center gap-1"><Coins size={20} /> ${player.money.toLocaleString()}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {(['buy', 'gamble', 'exchange'] as const).map((t) => (
                        <button key={t} onClick={() => setShopTab(t)} className={`py-1 text-lg rounded ${shopTab === t ? (t === 'buy' ? 'bg-yellow-700' : t === 'gamble' ? 'bg-purple-700' : 'bg-blue-700') + ' text-white' : 'bg-slate-800 text-slate-400'}`}>
                          {t === 'buy' ? '补给' : t === 'gamble' ? '赌场' : '交易所'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 pb-2 min-h-0">

                    {/* 补给子标签 */}
                    {shopTab === 'buy' && (
                      <div className="pt-2">
                        <div className="grid grid-cols-3 gap-2 px-2 mb-2">
                          {(['supplies', 'gear', 'materials'] as const).map(t => (
                            <button key={t} onClick={() => setBuySubTab(t)} className={`py-1 text-lg rounded ${buySubTab === t ? (t === 'supplies' ? 'bg-blue-700' : t === 'gear' ? 'bg-green-700' : 'bg-yellow-700') + ' text-white' : 'bg-slate-800 text-slate-400'}`}>
                              {t === 'supplies' ? '生存补给' : t === 'gear' ? '武器护甲' : '设施材料'}
                            </button>
                          ))}
                        </div>
                        {buySubTab === 'supplies' && (
                          <div className="space-y-2">
                            {Object.values(ITEMS).filter(i => (i.cost || 0) > 0).map(item => (
                              <div key={item.id} onClick={() => handleShopClick(item, 'item')} className={`group p-3 border cursor-pointer flex justify-between items-center rounded transition-all duration-200 ${confirmId === item.id ? 'bg-yellow-900/30 border-yellow-500' : 'bg-slate-800/50 border-slate-600 hover:bg-slate-700 hover:border-blue-600/50'}`}>
                                <div>
                                  <div className={`text-2xl ${confirmId === item.id ? 'text-yellow-400 font-bold' : 'text-blue-400'}`}>{confirmId === item.id ? '确认购买?' : item.name}</div>
                                  <div className="text-lg text-slate-500">{confirmId === item.id ? '再次点击确认' : item.desc}</div>
                                </div>
                                <div className="text-2xl font-bold text-yellow-500">${item.cost}</div>
                              </div>
                            ))}
                          </div>
                        )}
                        {buySubTab === 'gear' && (
                          <div className="space-y-2">
                            {Object.values(GEAR).filter(g => g.cost > 0).map(item => {
                              const owned = (player.ownedGear || []).includes(item.id);
                              return (
                                <div key={item.id} onClick={owned ? undefined : () => handleShopClick(item, 'gear')} className={`group p-3 border flex justify-between items-center rounded transition-all duration-200 ${owned ? 'bg-slate-700 border-slate-700 opacity-60 cursor-not-allowed' : confirmId === item.id ? 'bg-yellow-900/30 border-yellow-500 cursor-pointer' : 'bg-slate-800/50 border-slate-600 hover:bg-slate-700 hover:border-yellow-600/50 cursor-pointer'}`}>
                                  <div>
                                    <div className={`text-2xl ${owned ? 'text-slate-400' : confirmId === item.id ? 'text-yellow-400 font-bold' : 'text-green-400'}`}>{owned ? `${item.name}（已购买）` : confirmId === item.id ? '确认购买?' : item.name}</div>
                                    <div className="text-lg text-slate-500">{owned ? '已购买' : confirmId === item.id ? '再次点击确认' : item.desc}</div>
                                  </div>
                                  <div className={`text-2xl font-bold ${owned ? 'text-slate-400' : 'text-yellow-500'}`}>${item.cost}</div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                        {buySubTab === 'materials' && (
                          <div className="space-y-2">
                            {LOOT_DB.filter(isMaterial).map(mat => {
                              const price = Math.floor((mat.val || 0) * 5);
                              return (
                                <div key={mat.name} onClick={() => handleShopClick(mat, 'material')} className={`group p-3 border cursor-pointer flex justify-between items-center rounded transition-all duration-200 ${confirmId === mat.name ? 'bg-yellow-900/30 border-yellow-500' : 'bg-slate-800/50 border-slate-600 hover:bg-slate-700 hover:border-blue-600/50'}`}>
                                  <div>
                                    <div className={`text-2xl ${confirmId === mat.name ? 'text-yellow-400 font-bold' : 'text-blue-400'}`}>{confirmId === mat.name ? '确认购买?' : mat.name}</div>
                                    <div className="text-lg text-slate-500">{confirmId === mat.name ? '再次点击确认' : `回收价 $${mat.val} | 购买价 $${price}`}</div>
                                  </div>
                                  <div className="text-2xl font-bold text-yellow-500">${price}</div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {/* 赌场 */}
                    {shopTab === 'gamble' && (
                      <div className="flex flex-col items-center pt-2">
                        <div className="flex justify-between items-center w-full mb-3 px-4">
                          <button onClick={() => setShowCasinoRules(true)} className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-800 border border-slate-600 text-blue-400 hover:text-blue-300 hover:bg-slate-700 transition-all"><HelpCircle size={18} /></button>
                          <button onClick={() => { if (inSpecialMode || isSpinning) return; const next = !isVipMode; setIsVipMode(next); setBetAmount(next ? 500 : 50); }} disabled={inSpecialMode || isSpinning} className={`px-6 py-1.5 font-bold text-lg rounded border transition-colors ${(inSpecialMode || isSpinning) ? 'opacity-50 cursor-not-allowed grayscale' : ''}${isVipMode ? 'bg-red-900/50 border-red-500 text-red-400 shadow-[0_0_10px_rgba(220,38,38,0.5)]' : 'bg-slate-800 border-slate-600 text-slate-400'}`}>
                            {isVipMode ? '🔥 VIP高危模式' : '普通模式'}
                          </button>
                          <div className="w-8"></div>
                        </div>
                        {isVipMode && <div className="text-[10px] text-red-500 mb-2 mt-[-8px]">极品翻倍 | 骷髅剧增 | 下注上限 $5000</div>}
                        <SlotMachine bet={betAmount} onSpin={handleSpin} isSpinning={isSpinning} result={slotGrid} moodMsg={slotMoodMsg} jackpots={jackpots} energy={energy} isFrenzy={isFrenzy || frenzySpins > 0} freeSpins={freeSpins} frenzySpins={frenzySpins} teaserCol={teaserCol} winningPositions={winningPositions} bannerText={slotBanner} bannerBoost={bannerBoost} isVipMode={isVipMode} energyCap={ENERGY_CAP} />
                        <div className="flex gap-4 mt-2 w-full justify-center">
                          <button disabled={inSpecialMode || isSpinning} onClick={() => setBetAmount(Math.max(isVipMode ? 500 : 10, betAmount - (isVipMode ? 100 : 10)))} className={`bg-slate-700 px-4 py-2 rounded border border-slate-500 text-xl ${(inSpecialMode || isSpinning) ? 'opacity-50 cursor-not-allowed' : ''}`}>-</button>
                          <div className={`bg-black/50 px-6 py-2 rounded text-xl border border-slate-600 w-32 text-center ${isVipMode ? 'text-red-500' : 'text-yellow-500'}`}>${betAmount}</div>
                          <button disabled={inSpecialMode || isSpinning} onClick={() => setBetAmount(Math.min(player.money, betAmount + (isVipMode ? 100 : 10)))} className={`bg-slate-700 px-4 py-2 rounded border border-slate-500 text-xl ${(inSpecialMode || isSpinning) ? 'opacity-50 cursor-not-allowed' : ''}`}>+</button>
                        </div>
                        <button disabled={inSpecialMode || isSpinning} onClick={() => setBetAmount(Math.min(player.money, isVipMode ? 5000 : 500))} className={`text-sm mt-2 underline ${(inSpecialMode || isSpinning) ? 'text-slate-700 cursor-not-allowed' : 'text-slate-500'}`}>MAX BET (${isVipMode ? 5000 : 500})</button>
                      </div>
                    )}

                    {/* 交易所 */}
                    {shopTab === 'exchange' && (
                      <div className="flex flex-col pt-2">
                        <div className={`mx-4 mb-2 px-3 py-2 rounded border ${exchangeNews ? 'border-blue-500/50 bg-blue-900/10 text-blue-300' : 'border-slate-700 bg-slate-800 text-slate-400'} text-sm truncate`}>{exchangeNews ? exchangeNews.text : '今日暂无重大新闻……'}</div>
                        <div className="px-2 space-y-2">
                          {exchangeAssets.map(a => {
                            const color = a.change > 0 ? 'text-green-400' : a.change < 0 ? 'text-red-400' : 'text-slate-400';
                            return (
                              <div key={a.id} onClick={() => setSelectedAssetId(a.id)} className={`p-3 border rounded cursor-pointer ${selectedAssetId === a.id ? 'bg-blue-900/20 border-blue-500' : 'bg-slate-800 border-slate-600'} flex items-center justify-between`}>
                                <div className="min-w-0"><div className="text-xl text-slate-200 truncate max-w-[50vw]">{a.name}</div><div className="text-sm text-slate-500">持有 {a.held} 份</div></div>
                                <div className="text-right"><div className="text-2xl text-yellow-500 font-bold">${a.price.toFixed(2)}</div><div className={`text-sm ${color}`}>{a.change > 0 ? '+' : ''}{a.change}%</div></div>
                              </div>
                            );
                          })}
                        </div>
                        <div className="mt-2 px-2 pt-2 border-t border-slate-700">
                          {(() => {
                            const sa = exchangeAssets.find(x => x.id === selectedAssetId) || exchangeAssets[0];
                            const maxBuyQ = Math.floor(player.money / ((sa?.price || 1) * (1 + EXCHANGE_FEE_RATE)));
                            return (
                              <div className="space-y-2">
                                <div className="flex items-center justify-between flex-wrap gap-y-1">
                                  <div className="text-slate-400 min-w-0 truncate">选中：<span className="text-slate-200">{sa?.name}</span> @ <span className="text-yellow-500">${(sa?.price ?? 0).toFixed(2)}</span></div>
                                  <div className="text-slate-500">持有 {sa?.held} 份</div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  <div className="p-2 border rounded bg-slate-800 border-slate-600 text-sm">
                                    <div className="text-slate-300 mb-1">买入</div>
                                    <div className="flex items-center flex-wrap gap-2">
                                      <button onClick={() => setBuyQty(q => Math.max(1, q - 1))} className="px-2 py-1 bg-slate-700 border border-slate-600 rounded">-</button>
                                      <div className="px-3 py-1 bg-black/40 text-yellow-400 rounded border border-slate-700">{buyQty}</div>
                                      <button onClick={() => setBuyQty(q => Math.min(maxBuyQ || 1, q + 1))} className="px-2 py-1 bg-slate-700 border border-slate-600 rounded">+</button>
                                      <button onClick={() => buyAsset(sa.id, buyQty)} disabled={maxBuyQ <= 0 || player.money < sa.price * buyQty * (1 + EXCHANGE_FEE_RATE)} className={`ml-2 px-3 py-1 rounded border ${maxBuyQ <= 0 ? 'bg-slate-700 border-slate-700 text-slate-400' : 'bg-green-700 border-green-800 text-white hover:bg-green-600'}`}>买入</button>
                                      <button onClick={() => { const q = Math.floor(player.money / (sa.price * (1 + EXCHANGE_FEE_RATE))); if (q > 0) { setBuyQty(q); buyAsset(sa.id, q); } }} disabled={maxBuyQ <= 0} className={`px-3 py-1 rounded border ${maxBuyQ <= 0 ? 'bg-slate-700 border-slate-700 text-slate-400' : 'bg-blue-700 border-blue-800 text-white hover:bg-blue-600'}`}>梭哈</button>
                                    </div>
                                  </div>
                                  <div className="p-2 border rounded bg-slate-800 border-slate-600 text-sm">
                                    <div className="text-slate-300 mb-1">卖出</div>
                                    <div className="flex items-center flex-wrap gap-2">
                                      <button onClick={() => setSellQty(q => Math.max(1, q - 1))} className="px-2 py-1 bg-slate-700 border border-slate-600 rounded">-</button>
                                      <div className="px-3 py-1 bg-black/40 text-red-400 rounded border border-slate-700">{sellQty}</div>
                                      <button onClick={() => setSellQty(q => Math.min(sa?.held || 1, q + 1))} className="px-2 py-1 bg-slate-700 border border-slate-600 rounded">+</button>
                                      <button onClick={() => sellAsset(sa.id, sellQty)} disabled={sa.held <= 0 || sellQty > sa.held} className={`ml-2 px-3 py-1 rounded border ${sa.held <= 0 ? 'bg-slate-700 border-slate-700 text-slate-400' : 'bg-orange-700 border-orange-800 text-white hover:bg-orange-600'}`}>卖出</button>
                                      <button onClick={() => sellAssetAll(sa.id)} disabled={sa.held <= 0} className={`px-3 py-1 rounded border ${sa.held <= 0 ? 'bg-slate-700 border-slate-700 text-slate-400' : 'bg-red-700 border-red-800 text-white hover:bg-red-600'}`}>清仓</button>
                                    </div>
                                  </div>
                                </div>
                                <div className="text-[10px] text-slate-500 mt-1">交易费 2%（买入与卖出均收取）</div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex-none pt-3 border-t border-slate-700 mt-2">
                    <button onClick={() => setScene('home')} className="w-full bg-slate-700 p-3 text-xl hover:bg-slate-600 border border-slate-500 text-slate-300 rounded">返回安全屋</button>
                  </div>

                  {/* 赌场规则弹窗 */}
                  {showCasinoRules && (
                    <div className="absolute inset-0 bg-black/95 z-[80] flex flex-col p-4 fade-in rounded-lg overflow-hidden">
                      <div className="flex justify-between items-center border-b border-slate-700 pb-2 mb-4 flex-none">
                        <h2 className="text-2xl text-yellow-500 tracking-widest flex items-center gap-2"><HelpCircle size={24} /> 赌场生存指南</h2>
                        <button onClick={() => setShowCasinoRules(false)} className="text-slate-500 hover:text-white"><LogOut size={24} /></button>
                      </div>
                      <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 pb-4 text-sm text-slate-300">
                        {[
                          { title: '📌 基础术语', color: 'text-yellow-500', content: '老虎机共有 5 个转轴。3连：前3轴相同符号。4连：前4轴相同。5连：全5轴相同（最高奖励）。' },
                          { title: '一、投注等级与符号解锁', color: 'text-blue-400', content: '基础(<50)：💀🔧 | 进阶(50-99)：+🍗☢️🃏 | 尊享(≥100/VIP)：全符号' },
                          { title: '二、赔率表', color: 'text-amber-400', content: '7️⃣：80/250/1000 | 💎：40/100/500 | ☢️：20/50/200 | 🍗：10/30/100 | 🔧：5/15/50\n公式：奖金=倍数×(下注÷10)' },
                          { title: '三、核心规则', color: 'text-green-400', content: '共10条中奖线，符号从左到右连续。🃏 万能牌可替代任意符号(下注≥50)。💀 中断连线，⭐ 散射牌任意位置触发。' },
                          { title: '四、奖励模式', color: 'text-purple-400', content: 'Free Spins：3个⭐=5次，4个=10次，5个=20次。\n狂热模式：能量满42自动开启5次狂热，剔除低分符号，基础奖励×1.5，5条线以上×2。' },
                        ].map((s, i) => (
                          <div key={i} className="bg-slate-800 p-3 rounded border border-slate-700">
                            <h3 className={`${s.color} text-lg mb-1 font-bold`}>{s.title}</h3>
                            <p className="whitespace-pre-line">{s.content}</p>
                          </div>
                        ))}
                      </div>
                      <button onClick={() => setShowCasinoRules(false)} className="w-full flex-none bg-slate-700 hover:bg-slate-600 text-white py-3 rounded text-xl border-b-4 border-slate-900 active:border-b-0 active:translate-y-1 transition-all mt-2">明白</button>
                    </div>
                  )}
                </div>
              )}

              {/* ===== 战斗 ===== */}
              {scene === 'combat' && raidState.currentEnemy && (
                <div className="flex-1 flex flex-col h-full overflow-hidden fade-in justify-between">
                  <div className="text-center mt-4">
                    <div className={`inline-block p-4 rounded-full bg-slate-800 border-4 border-red-800 mb-2 ${raidState.isGlitchEnemy ? 'animate-pulse' : ''}`}><Skull size={64} className="text-red-500" /></div>
                    <h2 className="text-3xl text-red-500 font-bold tracking-widest">{raidState.currentEnemy.name}</h2>
                    <div className="w-2/3 mx-auto mt-2"><ProgressBar current={raidState.currentEnemy.hp} max={raidState.currentEnemy.maxHp} color="bg-red-600" /></div>
                  </div>
                  <div className="flex justify-between px-4 text-xl border-t border-b border-slate-700 py-2 bg-black/30">
                    <div className="text-green-400">HP: {raidState.currentEnemy.hp}/{raidState.currentEnemy.maxHp}</div>
                    <div className="text-yellow-400">ATK: {raidState.currentEnemy.atk} DMG</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-2">
                    <button onClick={() => handleCombat('attack')} className="p-6 bg-red-900/40 border-2 border-red-600 hover:bg-red-800/60 rounded flex flex-col items-center justify-center"><Sword size={48} className="text-red-500 mb-2" /><span className="text-2xl text-red-300 font-bold">攻击</span></button>
                    <button onClick={() => handleCombat('flee')} className="p-6 bg-slate-800 border-2 border-slate-600 hover:bg-slate-700 rounded flex flex-col items-center justify-center"><Footprints size={48} className="text-slate-400 mb-2" /><span className="text-2xl text-slate-300">逃跑</span></button>
                  </div>
                </div>
              )}

              {/* ===== 设施升级 ===== */}
              {scene === 'hideout' && (
                <div className="flex-1 flex flex-col h-full overflow-hidden fade-in min-h-0">
                  <h2 className="flex-none bg-[#1a1c21] z-10 text-center text-2xl text-orange-400 mb-4 border-b border-slate-700 py-2">=== 设施升级 ===</h2>
                  <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pb-2">
                    {Object.entries(FACILITIES).map(([key, fac]) => {
                      const lvl = player.facilities[key] || 0;
                      const isMax = lvl >= fac.maxLevel;
                      const cfg = isMax ? null : fac.levels[lvl];
                      return (
                        <div key={key} className={`p-3 border rounded ${lvl > 0 ? 'border-green-500/50 bg-green-900/10' : 'border-slate-600 bg-slate-800'}`}>
                          <div className="flex justify-between items-center mb-1">
                            <span className={`text-xl ${lvl > 0 ? 'text-green-400' : 'text-slate-200'}`}>{fac.name} <span className="text-sm text-yellow-500">Lv.{lvl}</span></span>
                            {isMax && <span className="text-sm bg-yellow-900 text-yellow-300 px-2 rounded">已满级</span>}
                          </div>
                          {lvl > 0 && <p className="text-sm text-green-300 mb-1">当前: {fac.levels[lvl - 1].desc}</p>}
                          {!isMax && cfg && (
                            <div className="mt-2 border-t border-slate-600/50 pt-2">
                              <p className="text-sm text-slate-400 mb-1">下一级: {cfg.desc}</p>
                              <div className="text-sm text-slate-500 mb-1">升级材料:</div>
                              <div className="grid grid-cols-2 gap-1 mb-2">
                                {Object.entries(cfg.cost).map(([mat, cnt]) => {
                                  const has = countItemInStorage(player.storage, mat);
                                  return <span key={mat} className={`text-sm ${has >= cnt ? 'text-green-500' : 'text-red-500'}`}>{mat}: {has}/{cnt}</span>;
                                })}
                              </div>
                              <button onClick={() => upgradeFacility(key)} className="w-full bg-orange-700 hover:bg-orange-600 text-white text-lg py-2 rounded">升级至 Lv.{lvl + 1}</button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex-none pt-3 border-t border-slate-700 mt-2"><button onClick={() => setScene('home')} className="w-full bg-slate-700 p-3 text-xl hover:bg-slate-600 border border-slate-500 text-slate-300 rounded">返回</button></div>
                </div>
              )}

              {/* ===== 仓库 ===== */}
              {scene === 'storage' && (
                <div className="flex-1 flex flex-col h-full overflow-hidden fade-in min-h-0">
                  <div className="flex-none flex justify-between items-center border-b border-slate-700 pb-2 mb-2 pt-2 bg-[#1a1c21]">
                    <h2 className="text-2xl text-blue-400 tracking-widest">=== 仓库 ===</h2>
                    <button onClick={sellAllLoot} className="text-base bg-red-900/50 text-red-300 px-3 py-1 rounded hover:bg-red-800 border border-red-700 flex items-center gap-1"><Trash2 size={16} /> 卖杂物</button>
                  </div>
                  <div className="flex-1 overflow-y-auto no-scrollbar space-y-2 pr-1 pb-2">
                    {player.storage.length === 0
                      ? <div className="text-center text-slate-600 mt-10 text-xl">仓库空空如也...</div>
                      : groupItems(player.storage).map((g, idx) => (
                        <div key={idx} className={`p-3 border rounded flex justify-between items-center ${RARITY_CONFIG[g.item.rarity || 'white'].border} ${RARITY_CONFIG[g.item.rarity || 'white'].bg}`}>
                          <div>
                            <div className={`${RARITY_CONFIG[g.item.rarity || 'white'].color} text-xl`}>{g.item.name}*{g.count}</div>
                            <div className="text-sm text-slate-500 mt-0.5">{g.item.type === 'consumable' ? '食物/药品' : g.item.type === 'relic' ? '遗物' : isMaterial(g.item) ? '材料' : '杂物'}</div>
                          </div>
                          <div className="flex gap-2">
                            {(g.item.type === 'consumable' || g.item.type === 'relic') && <button onClick={() => useOneByKey(g.key)} className="bg-green-700 hover:bg-green-600 text-white px-3 py-1 text-lg rounded">{g.item.type === 'relic' ? '装备' : '使用'}</button>}
                            {(g.item.type === 'loot' || g.item.type === 'relic') && <button onClick={() => sellOneByKey(g.key)} className="bg-slate-700 hover:bg-slate-600 text-yellow-400 px-3 py-1 text-lg rounded border border-slate-600 flex items-center gap-1"><Coins size={16} /> ${g.item.val}</button>}
                          </div>
                        </div>
                      ))
                    }
                  </div>
                  <div className="flex-none pt-3 border-t border-slate-700 mt-2"><button onClick={() => setScene('home')} className="w-full bg-slate-700 p-3 text-xl hover:bg-slate-600 border border-slate-500 text-slate-300 rounded">返回</button></div>
                </div>
              )}

              {/* ===== 装备 ===== */}
              {scene === 'equipment' && (
                <div className="flex-1 flex flex-col h-full overflow-hidden fade-in min-h-0">
                  <div className="flex-none flex justify-between items-center border-b border-slate-700 pb-2 mb-2 pt-2 bg-[#1a1c21]">
                    <h2 className="text-2xl text-slate-300 tracking-widest">=== 装备 ===</h2>
                    <div className="text-slate-400 text-base">WPN {player.weapon.atk} / ARM {player.armor.def}</div>
                  </div>
                  <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 pr-1 pb-2">
                    <div className="p-3 border rounded bg-slate-800 border-slate-600">
                      <div className="flex items-center justify-between"><div className="flex items-center gap-2"><Sword className="text-red-500" size={24} /><span className="text-xl text-red-400">{player.weapon.name}</span></div><div className="text-red-400 text-lg">ATK {player.weapon.atk}</div></div>
                      <div className="text-slate-400 text-base mt-1">{player.weapon.desc}</div>
                    </div>
                    <div className="p-3 border rounded bg-slate-800 border-slate-600">
                      <div className="flex items-center justify-between"><div className="flex items-center gap-2"><Shield className="text-blue-500" size={24} /><span className="text-xl text-blue-400">{player.armor.name}</span></div><div className="text-blue-400 text-lg">DEF {player.armor.def || 0}</div></div>
                      <div className="text-slate-400 text-base mt-1">{player.armor.desc}</div>
                    </div>
                    <div className="p-3 border rounded bg-slate-800 border-slate-600">
                      <div className="flex items-center justify-between mb-2"><div className="flex items-center gap-2"><Gem className="text-purple-400" size={20} /><span className="text-xl text-slate-200">遗物</span></div><div className="text-slate-500 text-sm">{player.relics.length} 件</div></div>
                      {player.relics.length === 0
                        ? <div className="text-center text-slate-600 py-4">未装备遗物</div>
                        : player.relics.map((r, i) => (
                          <div key={i} className={`p-2 border rounded flex justify-between items-center mb-1 ${RARITY_CONFIG[r.rarity || 'purple'].border} ${RARITY_CONFIG[r.rarity || 'purple'].bg}`}>
                            <div className={`${RARITY_CONFIG[r.rarity || 'purple'].color} text-lg`}>{r.name}</div>
                            <div className="text-slate-400 text-base ml-4 flex-1 text-right">{r.desc}</div>
                          </div>
                        ))
                      }
                    </div>
                  </div>
                  <div className="flex-none pt-3 border-t border-slate-700 mt-2"><button onClick={() => setScene('home')} className="w-full bg-slate-700 p-3 text-xl hover:bg-slate-600 border border-slate-500 text-slate-300 rounded">返回</button></div>
                </div>
              )}

              {/* ===== 探索 ===== */}
              {scene === 'raid' && (
                <div className="flex-1 flex flex-col justify-between fade-in h-full">
                  <div className="text-center space-y-6 mt-8">
                    <div className="relative inline-block"><Footprints className="mx-auto text-slate-600" size={64} /><div className="absolute top-0 right-0 animate-ping h-3 w-3 rounded-full bg-red-500 opacity-75"></div></div>
                    <div className="space-y-2"><div className="text-xl text-slate-500">正在搜索区域...</div><div className="text-5xl font-bold text-slate-200 tracking-widest">{raidState.distance}m</div></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-auto mb-2">
                    <PixelCard onClick={explore} className="bg-slate-800 hover:bg-green-900/20 border-green-800/50"><div className="text-center py-2"><span className="text-2xl font-bold text-green-500 block mb-1">&gt; 继续搜寻</span><span className="text-lg text-slate-500">消耗5饱食/2理智</span></div></PixelCard>
                    <PixelCard onClick={evac} className="bg-slate-800 hover:bg-blue-900/20 border-blue-800/50"><div className="text-center py-2"><span className="text-2xl font-bold text-blue-500 block mb-1">&lt; 呼叫撤离</span></div></PixelCard>
                  </div>
                </div>
              )}

              {/* ===== 拾取事件 ===== */}
              {scene === 'event' && raidState.currentLootItem && (
                <div className="flex-1 flex flex-col items-center justify-center text-center fade-in">
                  <div className={`p-6 bg-slate-900 rounded-full mb-6 border-4 ${RARITY_CONFIG[raidState.currentLootItem.rarity].border} shadow-[0_0_20px_rgba(0,0,0,0.5)]`}>
                    {raidState.currentLootItem.rarity === 'special' ? <Radio size={64} className={RARITY_CONFIG[raidState.currentLootItem.rarity].color} /> : <Briefcase size={64} className={RARITY_CONFIG[raidState.currentLootItem.rarity].color} />}
                  </div>
                  <div className="mb-2 text-lg uppercase tracking-widest text-slate-500">{RARITY_CONFIG[raidState.currentLootItem.rarity].label} 物资</div>
                  <h2 className={`text-4xl mb-4 tracking-wide ${RARITY_CONFIG[raidState.currentLootItem.rarity].color}`}>{raidState.currentLootItem.name}</h2>
                  <div className="text-2xl text-slate-300 mb-8"><p className="bg-slate-800 p-3 rounded border border-slate-600 inline-block px-6">估值: <span className="text-yellow-400 font-bold">${raidState.currentLootItem.val}</span></p></div>
                  <button onClick={() => setScene('raid')} className="w-full max-w-[240px] py-4 bg-slate-700 hover:bg-slate-600 text-2xl rounded">收入背包</button>
                </div>
              )}

              {/* ===== 互动事件 ===== */}
              {scene === 'interactive_event' && raidState.currentInteractiveEvent && (
                <div className="flex-1 flex flex-col justify-center text-center fade-in overflow-y-auto min-h-0">
                  <div className="mb-6"><HelpCircle size={80} className="mx-auto text-blue-400 mb-4 animate-bounce" /><p className="text-2xl text-slate-200 leading-snug">{raidState.currentInteractiveEvent.text}</p></div>
                  <div className="space-y-3">
                    {raidState.currentInteractiveEvent.choices.map(choice => (
                      <button key={choice.id} onClick={() => handleEventChoice(choice)} className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-600 p-4 rounded text-left group">
                        <span className="block text-blue-300 text-xl group-hover:text-blue-200">{choice.text}</span>
                        {choice.req && <span className="block text-sm text-red-400 mt-1">需要: {choice.req.item ? ITEMS[choice.req.item]?.name || choice.req.item : `${choice.req.stat} ${choice.req.val}`}</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ===== 结算/游戏结束 ===== */}
              {(scene === 'result' || scene === 'gameover') && (
                <div className="flex-1 flex flex-col items-center justify-center text-center fade-in">
                  {scene === 'result' ? (
                    <>
                      <Briefcase size={96} className="text-green-600 mb-6" />
                      <h2 className="text-4xl text-green-500 mb-4 tracking-widest">撤离成功</h2>
                      <div className="bg-black/20 p-4 rounded border border-slate-700 mb-8 max-h-48 overflow-y-auto w-full">
                        <div className="text-base text-slate-500 mb-2 uppercase border-b border-slate-600">获得物品</div>
                        {groupItems(raidState.tempLoot).map((g, i) => (
                          <div key={i} className={`flex justify-between text-lg ${RARITY_CONFIG[g.item.rarity].color}`}><span>{g.item.name}*{g.count}</span><span>${g.totalVal}</span></div>
                        ))}
                        <div className="mt-2 pt-2 border-t border-slate-600 flex justify-between font-bold text-yellow-500 text-xl"><span>总估值</span><span>${raidState.tempLoot.reduce((a, b) => a + (b.val || 0), 0)}</span></div>
                      </div>
                      <button onClick={() => setScene('storage')} className="px-8 py-4 bg-blue-900/30 border-2 border-blue-800 text-blue-400 text-2xl rounded hover:bg-blue-900/50 transition-colors">前往仓库整理</button>
                    </>
                  ) : (
                    <>
                      <Skull size={96} className="text-slate-700 mb-6" />
                      <h2 className="text-4xl text-red-600 mb-4 tracking-widest">行动失败</h2>
                      <button onClick={resetGame} className="px-8 py-4 bg-red-900/30 border-2 border-red-800 text-red-400 text-2xl rounded">重新开始</button>
                    </>
                  )}
                </div>
              )}

              {/* ===== 胜利 ===== */}
              {scene === 'victory' && (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-6 bg-black/90 z-[70] absolute inset-0 rounded-lg fade-in">
                  <div className="animate-bounce mb-4"><Rocket size={80} className="text-yellow-400" /></div>
                  <h2 className="text-5xl text-yellow-400 font-bold tracking-[0.2em] mb-4">回归现实</h2>
                  <div className="space-y-4 max-w-sm">
                    <p className="text-green-400 text-xl leading-relaxed">随着最后 $32,500 的汇入，写字楼那沉重的铁门发出了低沉的鸣响。</p>
                    <p className="text-green-500 text-lg opacity-80 italic">刺眼的阳光重新洒落，废墟的影像如破碎的像素点般消散。</p>
                    <p className="text-green-400 text-xl font-bold">你回到了除夕的午夜。</p>
                    <div className="bg-slate-900 border border-slate-700 p-4 mt-8 rounded">
                      <div className="text-slate-500 text-sm uppercase">生存统计</div>
                      <div className="text-2xl text-yellow-500 mt-2 font-bold">${player.money.toLocaleString()}</div>
                      <div className="text-slate-500 text-sm">逃出生天！</div>
                    </div>
                  </div>
                  <button onClick={resetGame} className="mt-8 px-8 py-4 bg-yellow-900/40 border-2 border-yellow-500 text-yellow-400 text-2xl hover:bg-yellow-800 rounded">再次挑战 &gt;</button>
                </div>
              )}
            </div>
          )}

          {/* ===== 日志 ===== */}
          {scene !== 'intro' && scene !== 'victory' && (
            <div className="h-20 bg-black p-3 overflow-y-auto font-mono text-base md:text-lg border-t-4 border-slate-700 z-10 no-scrollbar flex flex-col-reverse tracking-wide leading-snug flex-none">
              {logs.map((log, i) => (
                <div key={i} className={`mb-1 border-l-2 pl-2 ${
                  log.includes('受到') || log.includes('失败') || log.includes('缺少') || log.includes('不足') ? 'text-red-500 border-red-900'
                  : log.includes('获得') || log.includes('出售') || log.includes('购买') || log.includes('撤离') || log.includes('击败') || log.includes('升级') || log.includes('买入') || log.includes('卖出') ? 'text-green-500 border-green-900'
                  : log.includes('警告') || log.includes('低语') ? 'text-blue-400 border-blue-900'
                  : 'text-slate-500 border-slate-800'
                }`}>
                  <span className="opacity-50 mr-2">{log.match(/\[(.*?)\]/)?.[0] || '>'}</span>
                  {log.replace(/\[.*?\] /, '')}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 手柄装饰 */}
        <div className="mt-6 flex-none flex justify-between items-center px-6 opacity-80">
          <div className="grid grid-cols-3 gap-1 w-24 h-24">
            <div className="bg-slate-700 rounded col-start-2"></div>
            <div className="bg-slate-700 rounded col-start-1 row-start-2"></div>
            <div className="bg-slate-800 rounded col-start-2 row-start-2 flex items-center justify-center"><div className="w-3 h-3 rounded-full bg-black/30"></div></div>
            <div className="bg-slate-700 rounded col-start-3 row-start-2"></div>
            <div className="bg-slate-700 rounded col-start-2 row-start-3"></div>
          </div>
          <div className="flex gap-6 transform rotate-12">
            <div className="w-12 h-12 rounded-full bg-red-800 shadow-[0_4px_0_rgb(80,0,0)] border-t border-red-600"></div>
            <div className="w-12 h-12 rounded-full bg-red-800 shadow-[0_4px_0_rgb(80,0,0)] border-t border-red-600"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
