import { useState, useEffect, useRef } from 'react';
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
}: SlotMachineProps) => {
  const moodColor =
    moodMsg && moodMsg.includes('+')
      ? 'text-green-400'
      : moodMsg && moodMsg.includes('-')
        ? 'text-red-400'
        : 'text-purple-400';
  const [animCols, setAnimCols] = useState([false, false, false, false, false]);
  const [displayGrid, setDisplayGrid] = useState(
    Array.from({ length: 3 }, () => Array.from({ length: 5 }, () => '❓'))
  );
  const spinTimers = useRef<(NodeJS.Timeout | null)[]>([null, null, null, null, null]);
  const [popCells, setPopCells] = useState(new Set<string>());
  const [activeTeaser, setActiveTeaser] = useState<number | null>(null);

  const randPick = () => {
    let pool = ['💀', '🔧', '🍗', '☢️', '💎', '7️⃣', '🃏', '⭐'];
    if (!isVipMode) {
      if (bet < 100) pool = ['💀', '🔧', '🍗', '☢️', '💎', '7️⃣', '🃏'];
    }
    return pool[Math.floor(Math.random() * pool.length)];
  };

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
    }, 50);
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

  useEffect(() => {
    if (isSpinning) {
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
    if (isSpinning && result) {
      (async () => {
        let scatterCountSoFar = 0;
        for (let c = 0; c < 5; c++) {
          let baseDelay = c === 0 ? 500 : 300;
          if (c === 4 && teaserCol === 4 && scatterCountSoFar === 2) {
            baseDelay = 2000;
            setActiveTeaser(4);
          }
          await new Promise((r) => setTimeout(r, baseDelay));

          if (spinTimers.current[c]) {
            const finalCol = [result[0][c], result[1][c], result[2][c]];
            stopSpinAnim(c, finalCol);
            if (c === 4) setActiveTeaser(null);
            scatterCountSoFar += finalCol.filter((s) => s === '⭐').length;
          }
        }
      })();
    }
  }, [isSpinning, result, teaserCol]);

  return (
    <div
      className={`bg-slate-900 p-3 border-4 ${
        isVipMode
          ? 'border-red-600 shadow-[0_0_20px_rgba(220,38,38,0.5)]'
          : 'border-yellow-600'
      } rounded-lg text-center mb-2 relative overflow-hidden ${isFrenzy ? 'fever-mode' : ''}`}
    >
      <div
        className={`absolute inset-0 ${isVipMode ? 'bg-red-900/10' : 'bg-yellow-900/10'} pointer-events-none`}
      ></div>

      {bannerText && (
        <div
          className={`absolute inset-0 z-[100] flex items-center justify-center pointer-events-none transition-transform duration-300 ${
            bannerBoost ? 'scale-110' : 'scale-100'
          }`}
        >
          <span className="text-3xl font-bold text-yellow-400 neon-text bg-black/80 px-4 py-2 rounded-lg border-2 border-yellow-500 shadow-[0_0_20px_#ca8a04] max-w-[90%] break-words whitespace-normal leading-snug">
            {bannerText}
          </span>
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
      <div className="mb-2 flex justify-between items-center px-1 relative z-10">
        <div className="text-[10px] text-purple-300">
          ENERGY {energy}/{energyCap}
        </div>
        <div className="text-[10px] text-purple-300">
          FS {freeSpins} / RF {frenzySpins}
        </div>
      </div>

      <div className="relative bg-black/40 p-2 rounded z-10">
        <div className="middle-frame-overlay"></div>
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
                    className={`slot-cell ${pop ? 'pop' : ''} ${win ? 'win' : ''}`}
                  >
                    {val}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <button
        onClick={onSpin}
        disabled={isSpinning}
        className={`w-full mt-3 py-3 text-xl font-bold rounded border-b-4 active:border-b-0 active:translate-y-1 transition-all relative z-10 ${
          isSpinning
            ? 'bg-slate-600 border-slate-800 text-slate-400'
            : isFrenzy || frenzySpins > 0
              ? 'bg-purple-600 border-purple-800 hover:bg-purple-500 text-white animate-pulse'
              : 'bg-red-600 border-red-800 hover:bg-red-500 text-white'
        }`}
      >
        {isSpinning
          ? 'SPINNING...'
          : freeSpins > 0
            ? 'FREE SPIN!'
            : frenzySpins > 0
              ? 'RADIATION FRENZY!'
              : `PULL LEVER ($${bet})`}
      </button>
      {moodMsg && (
        <div className={`mt-2 text-sm relative z-10 ${moodColor}`}>{moodMsg}</div>
      )}
    </div>
  );
};
