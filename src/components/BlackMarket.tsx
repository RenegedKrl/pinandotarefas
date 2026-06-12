import { useState, useEffect } from 'react';
import { Ghost, Plus, Sparkles, Coins, ShoppingCart, Trash2 } from 'lucide-react';
import confetti from 'canvas-confetti';

interface CustomReward {
  id: string;
  title: string;
  cost: number;
  emoji: string;
}

interface BlackMarketProps {
  userId: string;
  coins: number;
  setCoins: (coins: number) => void;
}

export default function BlackMarket({ userId, coins, setCoins }: BlackMarketProps) {
  const [rewards, setRewards] = useState<CustomReward[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCost, setNewCost] = useState('');
  const [newEmoji, setNewEmoji] = useState('🎮');

  const STORAGE_KEY = `black_market_rewards_${userId}`;

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setRewards(JSON.parse(saved));
    } else {
      // Default rewards
      const defaults = [
        { id: '1', title: 'Jogar 1h de Videogame', cost: 1500, emoji: '🎮' },
        { id: '2', title: 'Assistir 1 Ep. de Série', cost: 800, emoji: '📺' },
        { id: '3', title: 'Comer um Doce', cost: 2000, emoji: '🍫' }
      ];
      setRewards(defaults);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
    }
  }, [userId, STORAGE_KEY]);

  const saveRewards = (newRewards: CustomReward[]) => {
    setRewards(newRewards);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newRewards));
  };

  const handleAddReward = () => {
    if (!newTitle || !newCost) return;
    
    const newReward: CustomReward = {
      id: Date.now().toString(),
      title: newTitle,
      cost: parseInt(newCost) || 100,
      emoji: newEmoji || '✨'
    };

    saveRewards([...rewards, newReward]);
    setNewTitle('');
    setNewCost('');
    setIsAdding(false);
  };

  const handleDeleteReward = (id: string) => {
    if (confirm('O contrabandista não liga. Quer mesmo apagar este item?')) {
      saveRewards(rewards.filter(r => r.id !== id));
    }
  };

  const handleBuy = (reward: CustomReward) => {
    if (coins >= reward.cost) {
      if (confirm(`O contrabandista sorri. Você quer mesmo gastar ${reward.cost} moedas para [ ${reward.title} ] na vida real?`)) {
        setCoins(coins - reward.cost);
        localStorage.setItem(`coins_${userId}`, (coins - reward.cost).toString());
        
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#8B5CF6', '#10B981', '#000000']
        });
      }
    } else {
      alert('O contrabandista ri da sua pobreza. Moedas insuficientes.');
    }
  };

  return (
    <div className="pb-20 animate-in fade-in duration-500">
      <div className="bg-surface border border-border p-6 rounded-xl flex items-center justify-between shadow-sm relative overflow-hidden mb-8">
        <div className="absolute -right-10 -top-10 opacity-5 pointer-events-none">
          <Ghost className="w-64 h-64 text-purple-500" />
        </div>
        
        <div>
          <h2 className="text-sm font-semibold text-textMuted uppercase tracking-wider mb-1">O Beco Obscuro</h2>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <Ghost className="w-6 h-6 text-purple-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text">O Contrabandista</h1>
              <p className="text-sm text-textMuted">Gaste suas moedas digitais para comprar recompensas na VIDA REAL. Você define as regras.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Merchant Lore Area */}
        <div className="bg-surface border border-border rounded-2xl p-6 relative overflow-hidden flex flex-col items-center border-t-4 border-t-purple-500">
          <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 to-transparent pointer-events-none"></div>
          
          <h3 className="font-bold text-xl text-purple-400 mb-6 w-full text-center tracking-widest uppercase">
            Psst... Tem moedas?
          </h3>

          <div className="relative w-48 h-48 rounded-full overflow-hidden border-4 border-purple-900/50 shadow-[0_0_30px_rgba(139,92,246,0.3)] mb-6">
            <img 
              src="/assets/merchant.png" 
              alt="O Contrabandista"
              className="w-full h-full object-cover animate-pulse"
            />
          </div>

          <p className="text-textMuted text-center text-sm italic mb-4">
            "Eu vendo exatamente o que você deseja... contanto que você tenha o ouro."
          </p>

          <div className="bg-black/20 w-full p-4 rounded-xl border border-purple-500/20 flex flex-col items-center">
            <span className="text-xs text-textMuted font-bold uppercase mb-1">Seu Saldo</span>
            <div className="text-3xl font-black text-yellow-500 flex items-center gap-2 drop-shadow-md">
              <Coins className="w-6 h-6" /> {coins}
            </div>
          </div>
        </div>

        {/* Custom Rewards Grid */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center bg-surface p-4 rounded-xl border border-border">
            <h3 className="font-bold text-text flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-purple-500" /> Produtos do Contrabandista
            </h3>
            <button 
              onClick={() => setIsAdding(!isAdding)}
              className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white font-bold rounded-lg transition-colors flex items-center gap-2 text-sm"
            >
              {isAdding ? 'Cancelar' : <><Plus className="w-4 h-4" /> Criar Contrato</>}
            </button>
          </div>

          {isAdding && (
            <div className="bg-black/5 border border-purple-500/30 p-6 rounded-xl animate-in zoom-in-95 duration-200">
              <h4 className="font-bold text-purple-400 mb-4">Novo Contrato de Recompensa Real</h4>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-textMuted uppercase mb-1">O que você quer fazer?</label>
                  <input 
                    type="text" 
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    placeholder="Ex: Assistir filme"
                    className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-text focus:outline-none focus:border-purple-500 transition-colors"
                    maxLength={40}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-textMuted uppercase mb-1">Custo (Moedas)</label>
                  <input 
                    type="number" 
                    value={newCost}
                    onChange={e => setNewCost(e.target.value)}
                    placeholder="Ex: 500"
                    className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-text focus:outline-none focus:border-purple-500 transition-colors"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-textMuted uppercase mb-1">Emoji</label>
                  <input 
                    type="text" 
                    value={newEmoji}
                    onChange={e => setNewEmoji(e.target.value)}
                    className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-text focus:outline-none focus:border-purple-500 transition-colors text-center text-xl"
                    maxLength={2}
                  />
                </div>
              </div>
              <button 
                onClick={handleAddReward}
                disabled={!newTitle || !newCost}
                className="w-full py-3 bg-purple-500 hover:bg-purple-600 disabled:opacity-50 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" /> Forjar Contrato
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {rewards.map(reward => {
              const canAfford = coins >= reward.cost;
              return (
                <div 
                  key={reward.id} 
                  className={`relative p-5 rounded-xl border-2 transition-all flex flex-col h-full ${
                    canAfford 
                      ? 'bg-surface border-purple-500/30 hover:border-purple-500 shadow-sm hover:shadow-[0_0_15px_rgba(139,92,246,0.2)]' 
                      : 'bg-black/10 border-border/50 grayscale opacity-80'
                  }`}
                >
                  <button 
                    onClick={() => handleDeleteReward(reward.id)}
                    className="absolute top-2 right-2 p-1.5 text-textMuted hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="text-4xl mb-3">{reward.emoji}</div>
                  <h3 className="font-bold text-text text-lg leading-tight mb-2 flex-1 pr-6">{reward.title}</h3>
                  
                  <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between">
                    <div className="flex items-center gap-1 font-bold text-yellow-500">
                      <Coins className="w-4 h-4" /> {reward.cost}
                    </div>
                    
                    <button 
                      onClick={() => handleBuy(reward)}
                      className={`px-4 py-2 rounded-lg font-bold text-sm transition-all active:scale-95 ${
                        canAfford 
                          ? 'bg-purple-500 hover:bg-purple-600 text-white shadow-md' 
                          : 'bg-black/10 text-textMuted cursor-not-allowed'
                      }`}
                    >
                      {canAfford ? 'Comprar' : 'Pobre'}
                    </button>
                  </div>
                </div>
              );
            })}
            
            {rewards.length === 0 && !isAdding && (
              <div className="col-span-full py-12 text-center text-textMuted border-2 border-dashed border-border rounded-xl">
                O Beco está vazio. Adicione recompensas reais para gastar seu ouro.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
