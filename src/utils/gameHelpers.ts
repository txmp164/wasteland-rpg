import type { Item, Player } from '../types/game';
import { FACILITIES, LOOT_DB } from '../data/gameConfig';

export const countItemInStorage = (items: Item[], itemName: string): number => {
  return items.filter((i) => i.name === itemName).length;
};

export const removeItemsFromStorage = (
  items: Item[],
  itemName: string,
  count: number
): Item[] => {
  let removed = 0;
  return items.filter((item) => {
    if (item.name === itemName && removed < count) {
      removed++;
      return false;
    }
    return true;
  });
};

export const getMaterialNameSet = (): Set<string> => {
  const names = new Set<string>();
  Object.values(FACILITIES).forEach((f) => {
    (f.levels || []).forEach((lvl) => {
      Object.keys(lvl.cost).forEach((n) => names.add(n));
    });
  });
  return names;
};

export const isMaterial = (item: Item): boolean => {
  return item && item.type === 'loot' && getMaterialNameSet().has(item.name);
};

export const isJunk = (item: Item): boolean => {
  return item && item.type === 'loot' && !isMaterial(item);
};

export const groupItems = (
  items: Item[]
): { key: string; item: Item; count: number; totalVal: number }[] => {
  const map = new Map<
    string,
    { key: string; item: Item; count: number; totalVal: number }
  >();
  items.forEach((item) => {
    const key = item.id || `${item.type}:${item.name}`;
    if (!map.has(key)) map.set(key, { key, item, count: 0, totalVal: 0 });
    const g = map.get(key)!;
    g.count += 1;
    g.totalVal += item.val || 0;
  });
  const arr = Array.from(map.values());
  const wt = (t: string) => (t === 'consumable' ? 0 : t === 'relic' ? 1 : 2);
  arr.sort((a, b) => {
    const ta = wt(a.item.type || 'loot'),
      tb = wt(b.item.type || 'loot');
    if (ta !== tb) return ta - tb;
    return (a.item.name || '').localeCompare(b.item.name || '');
  });
  return arr;
};

export const generateLootItem = (dist: number, mood: number): Item => {
  const rand = Math.random() * 100;
  const luckBonus = Math.floor(dist / 100);
  const moodBonus = mood > 80 ? 5 : 0;
  let targetRarity: Item['rarity'] = 'white';
  if (dist > 3000 && Math.random() > 0.98) targetRarity = 'special';
  else {
    const score = rand + luckBonus + moodBonus;
    if (score > 140) targetRarity = 'gold';
    else if (score > 115) targetRarity = 'purple';
    else if (score > 90) targetRarity = 'blue';
    else if (score > 60) targetRarity = 'green';
    else targetRarity = 'white';
  }
  let pool = LOOT_DB.filter((i) => i.rarity === targetRarity);
  if (pool.length === 0) pool = LOOT_DB.filter((i) => i.rarity === 'white');
  return pool[Math.floor(Math.random() * pool.length)];
};

export const getSellMultiplier = (player: Player): number => {
  const lvl = player.facilities.recycling || 0;
  if (lvl === 0) return 1;
  return 1 + FACILITIES.recycling.levels[lvl - 1].effect;
};
