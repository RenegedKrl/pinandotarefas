import React, { useState, useEffect } from 'react';
import { Gift, Zap, Heart, Star, Sparkles, Coins } from 'lucide-react';
import confetti from 'canvas-confetti';

interface DailySpinProps {
  userId: string;
  coins: number;
  setCoins: React.Dispatch<React.SetStateAction<number>>;
  setPlayerStats: React.Dispatch<React.SetStateAction<{ level: number; xp: number; hp: number }>>;
}

const PRIZES = [
  { id: 1, name: '100 Moedas', type: 'coins', value: 100, color: '#F59E0B', icon: Coins },
  { id: 2, name: '+50 XP', type: 'xp', value: 50, color: '#3B82F6', icon: Star },
  { id: 3, name: '+20 HP', type: 'hp', value: 20, color: '#EF4444', icon: Heart },
  { id: 4, name: 'XP em Dobro (1 uso)', type: 'buff', value: 1, color: '#8B5CF6', icon: Zap },
  { id: 5, name: '10 Moedas', type: 'coins', value: 10, color: '#FCD34D', icon: Coins },
  { id: 6, name: '+10 XP', type: 'xp', value: 10, color: '#93C5FD', icon: Star },
];

export default function DailySpin({ userId, setCoins, setPlayerStats }: DailySpinProps) {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [lastSpinDate, setLastSpinDate] = useState<string | null>(null);
  const [prizeMsg, setPrizeMsg] = useState<string | null>(null);

  useEffect(() => {
    const savedDate = localStorage.getItem(`last_spin_date_${userId}`);
    if (savedDate) setLastSpinDate(savedDate);
  }, [userId]);

  const canSpin = () => {
    const today = new Date().toISOString().split('T')[0];
    return lastSpinDate !== today;
  };

  const handleSpin = () => {
    if (!canSpin() || spinning) return;

    setSpinning(true);
    setPrizeMsg(null);

    // Randomize prize
    const prizeIndex = Math.floor(Math.random() * PRIZES.length);
    const prize = PRIZES[prizeIndex];

    // Calculate rotation
    const sliceAngle = 360 / PRIZES.length;
    // We want the chosen prize to land at the top (which is 0 degrees in standard circle, or offset depending on drawing)
    // The top pointer is at 0 degrees.
    const targetAngle = prizeIndex * sliceAngle;
    const extraSpins = 5 * 360; // Spin 5 times
    const finalRotation = rotation + extraSpins + (360 - targetAngle) + (Math.random() * sliceAngle - sliceAngle/2);

    setRotation(finalRotation);

    setTimeout(() => {
      setSpinning(false);
      applyPrize(prize);
      const today = new Date().toISOString().split('T')[0];
      setLastSpinDate(today);
      localStorage.setItem(`last_spin_date_${userId}`, today);

      const currentSpins = parseInt(localStorage.getItem(`total_spins_${userId}`) || '0');
      localStorage.setItem(`total_spins_${userId}`, (currentSpins + 1).toString());
    }, 4000); // matches CSS transition duration
  };

  const applyPrize = (prize: typeof PRIZES[0]) => {
    setPrizeMsg(`Você ganhou: ${prize.name}!`);
    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.6 },
    });

    if (prize.type === 'coins') {
      setCoins(prev => {
        const newCoins = prev + prize.value;
        localStorage.setItem(`coins_${userId}`, newCoins.toString());
        return newCoins;
      });
    } else if (prize.type === 'xp') {
      setPlayerStats(prev => {
        let newXp = prev.xp + prize.value;
        let newLevel = prev.level;
        // Simple level up logic for spin
        while (newXp >= newLevel * 100) {
          newXp -= newLevel * 100;
          newLevel++;
        }
        return { ...prev, xp: newXp, level: newLevel };
      });
    } else if (prize.type === 'hp') {
      setPlayerStats(prev => ({
        ...prev,
        hp: Math.min(100, prev.hp + prize.value)
      }));
    } else if (prize.type === 'buff') {
      const currentBuff = parseInt(localStorage.getItem(`buff_double_xp_${userId}`) || '0');
      localStorage.setItem(`buff_double_xp_${userId}`, (currentBuff + prize.value).toString());
    }
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      <div className="bg-surface border border-border p-6 rounded-xl flex items-center justify-between shadow-sm relative overflow-hidden">
        <div className="absolute -right-10 -top-10 opacity-5 pointer-events-none">
          <Gift className="w-64 h-64 text-text" />
        </div>
        
        <div>
          <h2 className="text-sm font-semibold text-textMuted uppercase tracking-wider mb-1">Roleta da Sorte</h2>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <Gift className="w-6 h-6 text-purple-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text">Sorteio Diário</h1>
              <p className="text-sm text-textMuted">Gire a roleta uma vez por dia e ganhe prêmios!</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center py-10">
        <div className="relative w-80 h-80">
          {/* The Pointer */}
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10 text-text drop-shadow-md">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L22 20H2L12 2Z"/></svg>
          </div>
          
          {/* The Wheel */}
          <div 
            className="w-full h-full rounded-full border-4 border-border overflow-hidden relative shadow-2xl transition-transform ease-[cubic-bezier(0.2,0.8,0.2,1)]"
            style={{ 
              transform: `rotate(${rotation}deg)`,
              transitionDuration: spinning ? '4s' : '0s'
            }}
          >
            {PRIZES.map((prize, i) => {
              const sliceAngle = 360 / PRIZES.length;
              const rotationAngle = i * sliceAngle;
              return (
                <div 
                  key={prize.id}
                  className="absolute inset-0 flex items-start justify-center origin-center"
                  style={{ transform: `rotate(${rotationAngle}deg)` }}
                >
                  {/* CSS Hack for pie slices */}
                  <div 
                    className="absolute top-0 w-[200px] h-[160px] origin-bottom"
                    style={{
                      backgroundColor: prize.color,
                      transform: `translateY(-50%) rotate(${sliceAngle/2}deg) skewY(${90 - sliceAngle}deg)`,
                    }}
                  />
                  <div 
                    className="absolute top-8 flex flex-col items-center gap-2 z-10 text-white drop-shadow-md font-bold"
                  >
                    <prize.icon className="w-6 h-6" />
                    <span className="text-xs text-center w-16 leading-tight">{prize.name}</span>
                  </div>
                </div>
              );
            })}
            {/* Center Hub */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-surface rounded-full border-4 border-border shadow-inner flex items-center justify-center">
              <div className="w-8 h-8 bg-border rounded-full" />
            </div>
          </div>
        </div>

        <div className="mt-12 text-center">
          {canSpin() ? (
            <button
              onClick={handleSpin}
              disabled={spinning}
              className="px-8 py-4 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:scale-100 active:scale-95"
            >
              {spinning ? 'Girando...' : 'GIRAR AGORA!'}
            </button>
          ) : (
            <div className="bg-black/5 p-4 rounded-xl text-textMuted font-medium border border-border">
              Você já girou hoje! Volte amanhã para mais prêmios.
            </div>
          )}

          {prizeMsg && (
            <div className="mt-6 text-xl font-black text-purple-500 animate-in zoom-in slide-in-from-bottom-4 flex items-center justify-center gap-2">
              <Sparkles className="w-6 h-6" /> {prizeMsg} <Sparkles className="w-6 h-6" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
