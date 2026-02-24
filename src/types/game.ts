export type Scene =
  | 'intro'
  | 'home'
  | 'shop'
  | 'combat'
  | 'raid'
  | 'event'
  | 'interactive_event'
  | 'result'
  | 'gameover'
  | 'storage'
  | 'equipment'
  | 'hideout'
  | 'victory';

export interface Item {
  id: string;
  name: string;
  type: 'consumable' | 'loot' | 'relic';
  cost?: number;
  effect?: string;
  value?: number;
  desc?: string;
  rarity: 'white' | 'green' | 'blue' | 'purple' | 'gold' | 'special';
  val?: number;
}

export interface Gear {
  id: string;
  name: string;
  type: 'weapon' | 'armor';
  cost: number;
  atk?: number;
  def?: number;
  desc: string;
}

export interface Enemy {
  id?: string;
  name: string;
  hp: number;
  maxHp: number;
  atk: number;
  exp: number;
}

export interface Facility {
  id: string;
  name: string;
  maxLevel: number;
  levels: {
    cost: Record<string, number>;
    effect: number;
    desc: string;
  }[];
}

export interface Player {
  hp: number;
  maxHp: number;
  satiety: number;
  maxSatiety: number;
  mood: number;
  maxMood: number;
  sanity: number;
  maxSanity: number;
  money: number;
  weapon: Gear;
  armor: Gear;
  relics: Item[];
  facilities: Record<string, number>;
  inventory: Item[];
  storage: Item[];
  day: number;
  ownedGear?: string[];
}

export interface RaidState {
  distance: number;
  dangerLevel: number;
  currentEnemy: Enemy | null;
  isGlitchEnemy: boolean;
  tempLoot: Item[];
  currentLootItem: Item | null;
  currentInteractiveEvent: StoryEvent | null;
}

export interface LuckCheck {
  threshold: number;
  successText: string;
  failText: string;
  successMood?: number;
  successSanity?: number;
  successHp?: number;
  successMoney?: number;
  failMood?: number;
  failSanity?: number;
  failHp?: number;
  failMoney?: number;
  successLootChance?: number;
}

export interface StoryEvent {
  id: string;
  text: string;
  choices: {
    id: string;
    text: string;
    req?: { item?: string; stat?: string; val?: number };
    resultText: string;
    mood?: number;
    sanity?: number;
    hp?: number;
    money?: number;
    combat?: boolean;
    enemyId?: string;
    lootChance?: number;
    luckCheck?: LuckCheck;
  }[];
}

export interface ExchangeAsset {
  id: string;
  name: string;
  price: number;
  vol: number;
  held: number;
  change: number;
  costBasis: number;
}

export interface Jackpots {
  mini: number;
  major: number;
  grand: number;
}
