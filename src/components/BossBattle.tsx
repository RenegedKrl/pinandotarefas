import { useState, useEffect } from 'react';
import { Sword, Flame, Trophy, ShieldAlert, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface BossBattleProps {
  userId: string;
  coins: number;
  setCoins: (coins: number) => void;
  playerStats: { level: number; xp: number; hp: number };
  setPlayerStats: (stats: any) => void;
}

const BASE_BOSS_HP = 2000;

export default function BossBattle({ userId, coins, setCoins, playerStats, setPlayerStats }: BossBattleProps) {
  const [bossHp, setBossHp] = useState(() => parseInt(localStorage.getItem(`boss_hp_${userId}`) || BASE_BOSS_HP.toString()));
  const [bossLevel, setBossLevel] = useState(() => parseInt(localStorage.getItem(`boss_level_${userId}`) || '1'));
  const [attackPower, setAttackPower] = useState(() => parseInt(localStorage.getItem(`attack_power_${userId}`) || '10'));
  
  const maxBossHp = BASE_BOSS_HP * Math.pow(1.5, bossLevel - 1);
  const isDead = bossHp <= 0;

  const upgradeCost = attackPower * 5;

  useEffect(() => {
    localStorage.setItem(`boss_hp_${userId}`, bossHp.toString());
    localStorage.setItem(`boss_level_${userId}`, bossLevel.toString());
    localStorage.setItem(`attack_power_${userId}`, attackPower.toString());
  }, [bossHp, bossLevel, attackPower, userId]);

  const handleUpgradeWeapon = () => {
    if (coins >= upgradeCost) {
      setCoins(coins - upgradeCost);
      localStorage.setItem(`coins_${userId}`, (coins - upgradeCost).toString());
      setAttackPower(prev => prev + 5);
      
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#F59E0B', '#FCD34D']
      });
    } else {
      alert('Moedas insuficientes para forjar a melhoria!');
    }
  };

  const claimLoot = () => {
    if (!isDead) return;

    // Rewards
    const coinReward = 500 * bossLevel;
    const xpReward = 1000 * bossLevel;

    setCoins(coins + coinReward);
    localStorage.setItem(`coins_${userId}`, (coins + coinReward).toString());
    
    setPlayerStats({
      ...playerStats,
      xp: playerStats.xp + xpReward
    });

    confetti({
      particleCount: 200,
      spread: 100,
      origin: { y: 0.5 },
      colors: ['#10B981', '#3B82F6', '#F59E0B', '#8B5CF6']
    });

    // Spawn new boss
    setBossLevel(prev => prev + 1);
    setBossHp(BASE_BOSS_HP * Math.pow(1.5, bossLevel)); // next level HP
  };

  const hpPercentage = Math.max(0, (bossHp / maxBossHp) * 100);

  return (
    <div className="pb-20 animate-in fade-in duration-500">
      <div className="bg-surface border border-border p-6 rounded-xl flex items-center justify-between shadow-sm relative overflow-hidden mb-8">
        <div className="absolute -right-10 -top-10 opacity-5 pointer-events-none">
          <Flame className="w-64 h-64 text-red-500" />
        </div>
        
        <div>
          <h2 className="text-sm font-semibold text-textMuted uppercase tracking-wider mb-1">Chefe de Mundo</h2>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center">
              <ShieldAlert className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text">Dragão da Procrastinação</h1>
              <p className="text-sm text-textMuted">Conclua tarefas para causar dano ao Chefe. Derrote-o para ganhar tesouros épicos!</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Boss Area */}
        <div className="lg:col-span-2 bg-surface border border-border rounded-2xl p-8 relative overflow-hidden flex flex-col items-center justify-center min-h-[400px]">
          <div className="absolute inset-0 bg-black/40 z-0"></div>
          
          <div className="relative z-10 w-full max-w-md">
            <div className="flex justify-between text-white font-bold mb-2 text-lg">
              <span>{isDead ? 'Derrotado!' : `Nível ${bossLevel}`}</span>
              <span>{Math.floor(bossHp)} / {Math.floor(maxBossHp)} HP</span>
            </div>
            
            {/* HP Bar */}
            <div className="w-full h-6 bg-black/50 rounded-full overflow-hidden border-2 border-black/80 shadow-inner mb-8">
              <div 
                className={`h-full transition-all duration-1000 ${isDead ? 'bg-transparent' : 'bg-gradient-to-r from-red-600 to-red-400'}`}
                style={{ width: `${hpPercentage}%` }}
              ></div>
            </div>
            
            {/* Boss Sprite */}
            <div className="flex justify-center relative">
              <style>
                {`
                  @keyframes boss-float {
                    0%, 100% { transform: translateY(0) scale(1); filter: drop-shadow(0 0 20px rgba(239,68,68,0.3)); }
                    50% { transform: translateY(-15px) scale(1.02); filter: drop-shadow(0 0 40px rgba(239,68,68,0.6)); }
                  }
                  .boss-anim {
                    animation: boss-float 4s ease-in-out infinite;
                  }
                  .boss-dead {
                    filter: grayscale(100%) brightness(0.5);
                    transform: scale(0.9) translateY(20px);
                    transition: all 1s;
                  }
                `}
              </style>
              <img 
                src="/assets/boss_dragon.png" 
                alt="Boss Dragon"
                className={`w-64 h-64 object-cover rounded-full border-4 border-red-900/50 shadow-2xl ${isDead ? 'boss-dead' : 'boss-anim'}`}
              />
              
              {isDead && (
                <button 
                  onClick={claimLoot}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-yellow-500 text-black font-black px-8 py-4 rounded-xl text-xl hover:scale-110 transition-transform shadow-[0_0_30px_rgba(234,179,8,0.5)] border-2 border-yellow-200 flex items-center gap-2 animate-bounce"
                >
                  <Trophy className="w-6 h-6" /> Resgatar Tesouro!
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Blacksmith Area */}
        <div className="bg-surface border border-border rounded-2xl p-6 flex flex-col relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 opacity-5 pointer-events-none">
            <Sword className="w-48 h-48 text-text" />
          </div>
          
          <h3 className="text-xl font-bold text-text mb-2 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-500" /> A Forja
          </h3>
          <p className="text-sm text-textMuted mb-6">Melhore sua arma para causar mais dano ao Chefe por cada tarefa concluída.</p>
          
          <div className="flex-1 flex flex-col items-center justify-center gap-6">
            <img 
              src="/assets/epic_sword.png" 
              alt="Epic Sword"
              className="w-32 h-32 object-cover rounded-2xl border-2 border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.2)]"
            />
            
            <div className="text-center w-full bg-black/5 rounded-xl p-4 border border-border">
              <span className="text-xs text-textMuted uppercase font-bold tracking-wider">Poder de Ataque Atual</span>
              <p className="text-3xl font-black text-amber-500 flex items-center justify-center gap-2 mt-1">
                <Sword className="w-6 h-6" /> {attackPower} <span className="text-sm font-medium text-textMuted">/tarefa</span>
              </p>
            </div>
            
            <button 
              onClick={handleUpgradeWeapon}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-4 rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 group"
            >
              Melhorar Arma 
              <span className="bg-black/20 px-2 py-1 rounded-md text-sm flex items-center gap-1 group-hover:bg-black/30 transition-colors">
                {upgradeCost} Moedas
              </span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
