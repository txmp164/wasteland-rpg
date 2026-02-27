import { useState, useEffect, useRef, useCallback } from 'react';
import type { Jackpots } from '../types/game';

interface SlotMachineProps {
  bet: number;
  onSpin: () => void;
  isSpinning: boolean;
  result: string[][] | null;
  moodMsg: string;
  jackpots: Jackpots;
  energy: number;
  isFrenzy: boolean;
  freeSpins: number;
  frenzySpins: number;
  teaserCol: number | null;
  winningPositions: [number, number][];
  bannerText: string;
  bannerBoost: boolean;
  isVipMode: boolean;
  energyCap: number;
  isLdw: boolean;
  energyCores: number;
  energyCoreTarget: number;
  bonusChoice: { prizes: string[]; chosen: number | null } | null;
  onBonusChoose: (idx: number) => void;
}

export const SlotMachine = ({
  bet,
  onSpin,
  isSpinning,
  result,
  moodMsg,
  jackpots,
  energy,
  isFrenzy,
  freeSpins,
  frenzySpins,
  teaserCol,
  winningPositions,
  bannerText,
  bannerBoost,
  isVipMode,
  energyCap,
  isLdw,
  energyCores,
  energyCoreTarget,
  bonusChoice,
  onBonusChoose,
}: SlotMachineProps) => {
  const moodColor =
    moodMsg && moodMsg.includes('+')
      ? 'text-green-400'
      : moodMsg && moodMsg.includes('-')
        ? 'text-red-400'
        : 'text-yellow-400';

  const [animCols, setAnimCols] = useState([false, false, false, false, false]);
  const [displayGrid, setDisplayGrid] = useState(
    Array.from({ length: 3 }, () => Array.from({ length: 5 }, () => '❓'))
  );
  const spinTimers = useRef<(ReturnType<typeof setInterval> | null)[]>([null, null, null, null, null]);
  const [popCells, setPopCells] = useState(new Set<string>());
  const [activeTeaser, setActiveTeaser] = useState<number | null>(null);
  const skippedRef = useRef(false);
  const resultRef = useRef<string[][] | null>(null);
  const stopCallbacksRef = useRef<Array<() => void>>([]);

  const randPick = useCallback(() => {
    let pool = ['💀', '🔧', '🍗', '☢️', '💎', '7️⃣', '🃏', '⭐'];
    if (!isVipMode) {
      if (bet < 100) pool = ['💀', '🔧', '🍗', '☢️', '💎', '7️⃣', '🃏'];
    }
    return pool[Math.floor(Math.random() * pool.length)];
  }, [isVipMode, bet]);

  const startSpinAnim = (c: number) => {
    setAnimCols((prev) => {
      const p = [...prev];
      p[c] = true;
      return p;
    });
    spinTimers.current[c] = setInterval(() => {
      setDisplayGrid((prev) => {
        const next = prev.map((row) => [...row]);
        for (let r = 0; r < 3; r++) next[r][c] = randPick();
        return next;
      });
    }, 40);
  };

  const stopSpinAnim = (c: number, finalCol: string[]) => {
    if (spinTimers.current[c]) {
      clearInterval(spinTimers.current[c]!);
      spinTimers.current[c] = null;
    }
    setAnimCols((prev) => {
      const p = [...prev];
      p[c] = false;
      return p;
    });
    setDisplayGrid((prev) => {
      const next = prev.map((row) => [...row]);
      for (let r = 0; r < 3; r++) next[r][c] = finalCol[r];
      return next;
    });
    setPopCells((prev) => {
      const next = new Set(prev);
      for (let r = 0; r < 3; r++) next.add(`${r}-${c}`);
      return next;
    });
    setTimeout(() => {
      setPopCells((prev) => {
        const next = new Set(prev);
        for (let r = 0; r < 3; r++) next.delete(`${r}-${c}`);
        return next;
      });
    }, 300);
  };

  const skipAll = useCallback(() => {
    if (!skippedRef.current && resultRef.current) {
      skippedRef.current = true;
      setActiveTeaser(null);
      stopCallbacksRef.current.forEach((fn) => fn());
      stopCallbacksRef.current = [];
    }
  }, []);

  useEffect(() => {
    if (isSpinning) {
      skippedRef.current = false;
      stopCallbacksRef.current = [];
      for (let c = 0; c < 5; c++) startSpinAnim(c);
    } else {
      for (let c = 0; c < 5; c++) {
        if (spinTimers.current[c]) {
          clearInterval(spinTimers.current[c]!);
          spinTimers.current[c] = null;
        }
      }
      setAnimCols([false, false, false, false, false]);
      setActiveTeaser(null);
    }
    return () => {
      for (let c = 0; c < 5; c++) {
        if (spinTimers.current[c]) {
          clearInterval(spinTimers.current[c]!);
          spinTimers.current[c] = null;
        }
      }
    };
  }, [isSpinning]);

  useEffect(() => {
    resultRef.current = result;
  }, [result]);

  useEffect(() => {
    if (isSpinning && result) {
      (async () => {
        let scatterCountSoFar = 0;
        for (let c = 0; c < 5; c++) {
          if (skippedRef.current) break;

          let baseDelay = c === 0 ? 250 : 150;
          if (c === 4 && teaserCol === 4 && scatterCountSoFar === 2) {
            baseDelay = 800;
            setActiveTeaser(4);
          }

          await new Promise<void>((resolve) => {
            let resolved = false;
            const tid = setTimeout(() => {
              if (!resolved) { resolved = true; resolve(); }
            }, baseDelay);
            stopCallbacksRef.current[c] = () => {
              if (!resolved) { resolved = true; clearTimeout(tid); resolve(); }
            };
          });

          if (spinTimers.current[c] || skippedRef.current) {
            const finalCol = [result[0][c], result[1][c], result[2][c]];
            stopSpinAnim(c, finalCol);
            if (c === 4) setActiveTeaser(null);
            scatterCountSoFar += finalCol.filter((s) => s === '⭐').length;
          }
        }

        if (skippedRef.current && result) {
          for (let c = 0; c < 5; c++) {
            if (spinTimers.current[c]) {
              const finalCol = [result[0][c], result[1][c], result[2][c]];
              stopSpinAnim(c, finalCol);
            }
          }
          setActiveTeaser(null);
        }
      })();
    }
  }, [isSpinning, result, teaserCol]);

  const coreProgress = Math.min(100, (energyCores / energyCoreTarget) * 100);

  return (
    <div
      className={`bg-slate-900 p-3 border-4 ${
        isVipMode
          ? 'border-red-600 shadow-[0_0_20px_rgba(220,38,38,0.5)]'
          : 'border-yellow-600'
      } rounded-lg text-center mb-2 relative overflow-hidden ${isFrenzy ? 'fever-mode' : ''}`}
      onDoubleClick={isSpinning ? skipAll : undefined}
    >
      <div
        className={`absolute inset-0 ${isVipMode ? 'bg-red-900/10' : 'bg-yellow-900/10'} pointer-events-none`}
      />

      {bannerText && (
        <div
          className={`absolute inset-0 z-[100] flex items-center justify-center pointer-events-none transition-transform duration-200 ${
            bannerBoost ? 'scale-110' : 'scale-100'
          }`}
        >
          <span className={`text-3xl font-bold neon-text px-4 py-2 rounded-lg border-2 max-w-[90%] break-words whitespace-normal leading-snug ${isLdw ? 'text-yellow-300 bg-black/80 border-yellow-400 shadow-[0_0_30px_#ca8a04] ldw-flash' : 'text-yellow-400 bg-black/80 border-yellow-500 shadow-[0_0_20px_#ca8a04]'}`}>
            {bannerText}
          </span>
        </div>
      )}

      {bonusChoice && bonusChoice.chosen === null && (
        <div className="absolute inset-0 z-[120] flex flex-col items-center justify-center bg-black/90 rounded-lg">
          <div className="text-yellow-400 text-2xl font-bold mb-1 neon-text">选择奖励箱！</div>
          <div className="text-slate-400 text-sm mb-4">直觉选一个</div>
          <div className="flex gap-4">
            {bonusChoice.prizes.map((_, idx) => (
              <button
                key={idx}
                onClick={() => onBonusChoose(idx)}
                className="w-20 h-20 bg-slate-800 border-4 border-yellow-500 rounded-lg text-4xl flex items-center justify-center hover:bg-yellow-900/40 transition-all hover:scale-110 active:scale-95 bonus-box-pulse"
              >
                🎁
              </button>
            ))}
          </div>
        </div>
      )}

      {bonusChoice && bonusChoice.chosen !== null && (
        <div className="absolute inset-0 z-[120] flex flex-col items-center justify-center bg-black/90 rounded-lg">
          <div className="text-yellow-400 text-2xl font-bold mb-2 neon-text">你的奖励！</div>
          <div className="flex gap-4 mb-4">
            {bonusChoice.prizes.map((prize, idx) => (
              <div
                key={idx}
                className={`w-20 h-20 rounded-lg text-2xl flex items-center justify-center border-4 font-bold transition-all ${
                  idx === bonusChoice.chosen
                    ? 'bg-yellow-900/60 border-yellow-400 scale-110 text-yellow-300 shadow-[0_0_20px_#ca8a04]'
                    : 'bg-slate-800/60 border-slate-600 text-slate-400 opacity-50'
                }`}
              >
                {idx === bonusChoice.chosen ? prize : '🎁'}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-2 px-1 relative z-10">
        <div className="text-left">
          <div className="text-[10px] text-amber-400 font-bold uppercase">MINI</div>
          <div className="text-lg text-amber-300 font-bold leading-none">
            ${jackpots.mini.toLocaleString()}
          </div>
        </div>
        <div className="text-center">
          <div className="text-[10px] text-amber-500 font-bold uppercase">MAJOR</div>
          <div className="text-xl text-amber-400 font-bold leading-none">
            ${jackpots.major.toLocaleString()}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-amber-600 font-bold uppercase">GRAND</div>
          <div className="text-2xl text-amber-500 font-bold leading-none">
            ${jackpots.grand.toLocaleString()}
          </div>
        </div>
      </div>

      <div className="mb-2 px-1 relative z-10">
        <div className="flex justify-between items-center mb-1">
          <div className="text-[10px] text-cyan-300 font-bold">
            ⚡ 能量核心 {energyCores}/{energyCoreTarget}
          </div>
          <div className="text-[10px] text-yellow-500 font-bold">
            {energyCores >= energyCoreTarget ? '▶ 免费转×5 就绪！' : `还差 ${energyCoreTarget - energyCores} 个`}
          </div>
        </div>
        <div className="h-2 bg-slate-800 border border-slate-600 rounded-full overflow-hidden relative">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              energyCores >= energyCoreTarget
                ? 'bg-cyan-400 shadow-[0_0_8px_#22d3ee] animate-pulse'
                : coreProgress >= 70
                  ? 'bg-cyan-500'
                  : 'bg-cyan-700'
            }`}
            style={{ width: `${coreProgress}%` }}
          />
          {[...Array(energyCoreTarget - 1)].map((_, i) => (
            <div
              key={i}
              className="absolute top-0 bottom-0 w-px bg-slate-600"
              style={{ left: `${((i + 1) / energyCoreTarget) * 100}%` }}
            />
          ))}
        </div>
      </div>

      <div className="mb-1 flex justify-between items-center px-1 relative z-10">
        <div className="text-[10px] text-slate-400">
          ENERGY {energy}/{energyCap}
        </div>
        <div className="text-[10px] text-slate-400">
          FS {freeSpins} / RF {frenzySpins}
        </div>
      </div>

      <div
        className="relative bg-black/40 p-2 rounded z-10 cursor-pointer"
        onDoubleClick={isSpinning ? skipAll : undefined}
        title={isSpinning ? '双击急停' : ''}
      >
        <div className="middle-frame-overlay" />
        <div className="slot-grid mid-row-frame">
          {[0, 1, 2, 3, 4].map((c) => (
            <div
              key={c}
              id={`col-${c}`}
              className={`slot-col ${
                activeTeaser === c ? 'teaser-col' : animCols[c] ? 'text-blur-out' : ''
              }`}
            >
              {[0, 1, 2].map((r) => {
                const val = displayGrid?.[r]?.[c] || '❓';
                const win = winningPositions?.some((w) => w[0] === r && w[1] === c);
                const pop = popCells.has(`${r}-${c}`);
                return (
                  <div
                    key={r}
                    id={`cell-${c}-${r}`}
                    className={`slot-cell ${pop ? 'pop' : ''} ${win ? (isLdw ? 'win ldw-cell' : 'win') : ''}`}
                  >
                    {val}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        {isSpinning && (
          <div className="absolute inset-0 flex items-end justify-center pb-1 pointer-events-none">
            <span className="text-[9px] text-slate-600 opacity-60">双击急停</span>
          </div>
        )}
      </div>

      <button
        onClick={onSpin}
        disabled={isSpinning}
        className={`w-full mt-3 py-3 text-xl font-bold rounded border-b-4 active:border-b-0 active:translate-y-1 transition-all relative z-10 ${
          isSpinning
            ? 'bg-slate-600 border-slate-800 text-slate-400'
            : isFrenzy || frenzySpins > 0
              ? 'bg-yellow-600 border-yellow-800 hover:bg-yellow-500 text-black animate-pulse'
              : freeSpins > 0
                ? 'bg-cyan-600 border-cyan-800 hover:bg-cyan-500 text-white'
                : 'bg-red-600 border-red-800 hover:bg-red-500 text-white'
        }`}
      >
        {isSpinning
          ? 'SPINNING...'
          : freeSpins > 0
            ? `FREE SPIN! (×${freeSpins})`
            : frenzySpins > 0
              ? 'RADIATION FRENZY!'
              : `PULL LEVER ($${bet})`}
      </button>
      {moodMsg && (
        <div className={`mt-2 text-sm relative z-10 font-bold ${moodColor} ${isLdw ? 'ldw-msg' : ''}`}>
          {moodMsg}
        </div>
      )}
    </div>
  );
};
