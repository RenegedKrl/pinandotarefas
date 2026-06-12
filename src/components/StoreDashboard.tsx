import React, { useState } from 'react';
import { ShoppingBag, Heart, Star, Sparkles, AlertCircle, History } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface StoreDashboardProps {
  playerStats: { level: number; xp: number; hp: number };
  setPlayerStats: React.Dispatch<React.SetStateAction<{ level: number; xp: number; hp: number }>>;
  coins: number;
  setCoins: React.Dispatch<React.SetStateAction<number>>;
  userId: string;
}

export default function StoreDashboard({ playerStats, setPlayerStats, coins, setCoins, userId }: StoreDashboardProps) {
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  const buyPotion = async () => {
    if (coins < 50) {
      showMessage('Moedas insuficientes!', 'error');
      return;
    }
    if (playerStats.hp >= 100) {
      showMessage('Seu HP já está no máximo!', 'error');
      return;
    }

    const newHp = Math.min(100, playerStats.hp + 50);
    const newCoins = coins - 50;
    
    setCoins(newCoins);
    localStorage.setItem(`coins_${userId}`, newCoins.toString());
    
    setPlayerStats(prev => ({ ...prev, hp: newHp }));
    await supabase.from('profiles').update({ hp: newHp }).eq('id', userId);
    
    showMessage('Poção consumida! +50 HP', 'success');
  };

  const buyDoubleXp = () => {
    if (coins < 150) {
      showMessage('Moedas insuficientes!', 'error');
      return;
    }
    
    const newCoins = coins - 150;
    setCoins(newCoins);
    localStorage.setItem(`coins_${userId}`, newCoins.toString());
    
    // Set buff in localstorage
    localStorage.setItem(`buff_double_xp_${userId}`, '3'); // 3 tasks duration
    showMessage('Buff ativado! Suas próximas 3 missões darão XP em Dobro!', 'success');
  };

  const buyPetFood = async () => {
    if (coins < 100) {
      showMessage('Moedas insuficientes!', 'error');
      return;
    }
    if (playerStats.hp >= 100) {
      showMessage('Seu pet e você já estão com vida máxima!', 'error');
      return;
    }
    const newCoins = coins - 100;
    setCoins(newCoins);
    localStorage.setItem(`coins_${userId}`, newCoins.toString());
    
    setPlayerStats(prev => ({ ...prev, hp: 100 }));
    await supabase.from('profiles').update({ hp: 100 }).eq('id', userId);
    
    showMessage('Comida Premium consumida! HP totalmente restaurado!', 'success');
  };

  const buyShield = () => {
    if (coins < 200) {
      showMessage('Moedas insuficientes!', 'error');
      return;
    }
    const newCoins = coins - 200;
    setCoins(newCoins);
    localStorage.setItem(`coins_${userId}`, newCoins.toString());
    localStorage.setItem(`buff_shield_${userId}`, 'true');
    showMessage('Escudo ativado! Você não perderá HP na sua próxima falha diária!', 'success');
  };

  const buyStreakRecovery = async () => {
    if (coins < 500) {
      showMessage('Moedas insuficientes!', 'error');
      return;
    }
    
    const lastBought = localStorage.getItem(`last_streak_recovery_${userId}`);
    if (lastBought) {
      const daysSince = (Date.now() - parseInt(lastBought)) / (1000 * 60 * 60 * 24);
      if (daysSince < 14) {
        showMessage(`Este item raro só reabastece a cada 14 dias! Tente novamente em ${Math.ceil(14 - daysSince)} dia(s).`, 'error');
        return;
      }
    }

    const newCoins = coins - 500;
    setCoins(newCoins);
    localStorage.setItem(`coins_${userId}`, newCoins.toString());
    
    const currentStreak = parseInt(localStorage.getItem(`hero_streak_${userId}`) || '0');
    const newStreak = currentStreak + 1;
    localStorage.setItem(`hero_streak_${userId}`, newStreak.toString());
    
    // Reset the streak date to today so they don't immediately lose it again tomorrow if they haven't done it
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem(`hero_streak_date_${userId}`, today);
    
    localStorage.setItem(`last_streak_recovery_${userId}`, Date.now().toString());
    
    await supabase.from('profiles').update({ streak: newStreak, last_streak_date: today }).eq('id', userId);
    
    showMessage('⏳ Relíquia do Tempo usada! Seu combo foi protegido e incrementado!', 'success');
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="bg-surface border border-border p-6 rounded-xl flex items-center justify-between shadow-sm relative overflow-hidden">
        <div className="absolute -right-10 -top-10 opacity-5 pointer-events-none">
          <ShoppingBag className="w-64 h-64 text-text" />
        </div>
        
        <div>
          <h2 className="text-sm font-semibold text-textMuted uppercase tracking-wider mb-1">Loja do Aventureiro</h2>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <ShoppingBag className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text">Mercado Negro</h1>
              <p className="text-sm text-textMuted">Troque suas moedas por vantagens</p>
            </div>
          </div>
        </div>
        
        <div className="text-right">
          <h2 className="text-sm font-semibold text-textMuted uppercase tracking-wider mb-1">Seu Saldo</h2>
          <p className="text-3xl font-bold text-amber-500 drop-shadow-sm flex items-center gap-2 justify-end">
            <span className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center border-2 border-white/20 text-white text-sm font-black">$</span>
            {coins}
          </p>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-lg flex items-center gap-2 font-medium animate-in fade-in slide-in-from-top-2 ${
          message.type === 'success' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-red-500/10 text-red-600 border border-red-500/20'
        }`}>
          {message.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Poção de HP */}
        <div className="bg-surface border border-border p-5 rounded-xl flex flex-col items-center text-center shadow-sm hover:border-red-500/30 transition-colors group">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Heart className="w-8 h-8 text-red-500" fill="currentColor" />
          </div>
          <h3 className="font-bold text-lg text-text mb-1">Poção de Cura</h3>
          <p className="text-sm text-textMuted mb-6 flex-1">Restaura 50 pontos de vida (HP). Use isso se tiver tomado muito dano por atrasar tarefas!</p>
          <button 
            onClick={buyPotion}
            className="w-full py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold flex items-center justify-center gap-2 transition-colors shadow-sm"
          >
            Comprar <span className="text-amber-200">|</span> 50 Moedas
          </button>
        </div>

        {/* Poção de XP */}
        <div className="bg-surface border border-border p-5 rounded-xl flex flex-col items-center text-center shadow-sm hover:border-blue-500/30 transition-colors group">
          <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Star className="w-8 h-8 text-blue-500" fill="currentColor" />
          </div>
          <h3 className="font-bold text-lg text-text mb-1">Elixir do Foco</h3>
          <p className="text-sm text-textMuted mb-6 flex-1">Suas próximas 3 tarefas renderão o DOBRO de XP. Ideal para subir de nível rapidamente!</p>
          <button 
            onClick={buyDoubleXp}
            className="w-full py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold flex items-center justify-center gap-2 transition-colors shadow-sm"
          >
            Comprar <span className="text-amber-200">|</span> 150 Moedas
          </button>
        </div>

        {/* Pet Food */}
        <div className="bg-surface border border-border p-5 rounded-xl flex flex-col items-center text-center shadow-sm hover:border-green-500/30 transition-colors group">
          <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <span className="text-3xl">🍗</span>
          </div>
          <h3 className="font-bold text-lg text-text mb-1">Comida Premium</h3>
          <p className="text-sm text-textMuted mb-6 flex-1">Restaura 100% da vida (HP). Seu mascote ficará muito feliz!</p>
          <button 
            onClick={buyPetFood}
            className="w-full py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold flex items-center justify-center gap-2 transition-colors shadow-sm"
          >
            Comprar <span className="text-amber-200">|</span> 100 Moedas
          </button>
        </div>

        {/* Escudo */}
        <div className="bg-surface border border-border p-5 rounded-xl flex flex-col items-center text-center shadow-sm hover:border-indigo-500/30 transition-colors group">
          <div className="w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <span className="text-3xl">🛡️</span>
          </div>
          <h3 className="font-bold text-lg text-text mb-1">Escudo Divino</h3>
          <p className="text-sm text-textMuted mb-6 flex-1">Ignora completamente o dano de HP da sua próxima falha diária.</p>
          <button 
            onClick={buyShield}
            className="w-full py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold flex items-center justify-center gap-2 transition-colors shadow-sm"
          >
            Comprar <span className="text-amber-200">|</span> 200 Moedas
          </button>
        </div>

        {/* Recuperação de Streak */}
        <div className="bg-surface border border-border p-5 rounded-xl flex flex-col items-center text-center shadow-sm hover:border-purple-500/30 transition-colors group sm:col-span-2">
          <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <History className="w-8 h-8 text-purple-500" />
          </div>
          <h3 className="font-bold text-lg text-purple-500 mb-1">Relíquia do Tempo (Item Raro)</h3>
          <p className="text-sm text-textMuted mb-6 flex-1 max-w-lg">Restaura seu combo perdido e o aumenta em +1, resetando seu dia de hoje como "concluído". <br/>⚠️ O contrabandista só consegue uma dessas a cada <strong>14 dias</strong>.</p>
          <button 
            onClick={buyStreakRecovery}
            className="w-full max-w-sm py-2.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold flex items-center justify-center gap-2 transition-colors shadow-sm"
          >
            Comprar <span className="text-purple-300">|</span> 500 Moedas
          </button>
        </div>
      </div>
    </div>
  );
}

