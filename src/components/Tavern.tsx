import React, { useState } from 'react';
import { Beer, Coins } from 'lucide-react';
import confetti from 'canvas-confetti';

interface TavernProps {
  userId: string;
  coins: number;
  setCoins: React.Dispatch<React.SetStateAction<number>>;
}

const SYMBOLS = ['🍎', '🍒', '🍋', '💎', '🔔', '7️⃣'];
const SPIN_COST = 10;

export default function Tavern({ userId, coins, setCoins }: TavernProps) {
  const [slots, setSlots] = useState(['❓', '❓', '❓']);
  const [spinning, setSpinning] = useState(false);
  const [message, setMessage] = useState('Bem-vindo à Taverna! Aposte 10 moedas e tente a sorte!');

  const handleSpin = () => {
    if (coins < SPIN_COST) {
      setMessage('Moedas insuficientes!');
      return;
    }

    setSpinning(true);
    setCoins(prev => prev - SPIN_COST);
    localStorage.setItem(`coins_${userId}`, (coins - SPIN_COST).toString());
    setMessage('Girando...');

    // Fake spin effect
    let spins = 0;
    const interval = setInterval(() => {
      setSlots([
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]
      ]);
      spins++;
      
      if (spins > 15) {
        clearInterval(interval);
        finalizeSpin();
      }
    }, 100);
  };

  const finalizeSpin = () => {
    const finalSlots = [
      SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
      SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
      SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]
    ];
    setSlots(finalSlots);
    setSpinning(false);

    // Check win
    if (finalSlots[0] === finalSlots[1] && finalSlots[1] === finalSlots[2]) {
      // Jackpot!
      let winnings = 100;
      if (finalSlots[0] === '7️⃣') winnings = 500;
      if (finalSlots[0] === '💎') winnings = 300;

      setMessage(`JACKPOT! Você ganhou ${winnings} moedas!`);
      setCoins(prev => {
        const newCoins = prev + winnings;
        localStorage.setItem(`coins_${userId}`, newCoins.toString());
        return newCoins;
      });
      confetti({ particleCount: 200, spread: 100, origin: { y: 0.6 } });
    } else if (finalSlots[0] === finalSlots[1] || finalSlots[1] === finalSlots[2] || finalSlots[0] === finalSlots[2]) {
      // Pequeno prêmio
      setMessage('Dois iguais! Você ganhou 15 moedas!');
      setCoins(prev => {
        const newCoins = prev + 15;
        localStorage.setItem(`coins_${userId}`, newCoins.toString());
        return newCoins;
      });
    } else {
      setMessage('Que pena... Tente novamente!');
    }
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      <div className="bg-surface border border-border p-6 rounded-xl flex items-center justify-between shadow-sm relative overflow-hidden">
        <div className="absolute -right-10 -top-10 opacity-5 pointer-events-none">
          <Beer className="w-64 h-64 text-text" />
        </div>
        
        <div>
          <h2 className="text-sm font-semibold text-textMuted uppercase tracking-wider mb-1">Diversão</h2>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center">
              <Beer className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text">A Taverna</h1>
              <p className="text-sm text-textMuted">Relaxe após um longo dia de tarefas. Aposte suas moedas!</p>
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

      <div className="bg-surface border border-border rounded-xl p-8 shadow-sm flex flex-col items-center">
        <h3 className="text-xl font-bold mb-8">Máquina Caça-Níqueis</h3>

        <div className="flex items-center gap-4 bg-black/10 p-6 rounded-2xl shadow-inner border-y border-white/10">
          {slots.map((s, i) => (
            <div key={i} className="w-24 h-24 bg-white dark:bg-[#202020] rounded-xl flex items-center justify-center text-6xl shadow-md border border-border overflow-hidden">
              <div className={`transition-transform ${spinning ? 'animate-bounce' : ''}`}>
                {s}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center h-12 flex items-center justify-center">
          <p className={`font-bold text-lg ${message.includes('JACKPOT') ? 'text-primary animate-pulse text-2xl' : message.includes('ganhou') ? 'text-green-500' : 'text-textMuted'}`}>
            {message}
          </p>
        </div>

        <button 
          onClick={handleSpin}
          disabled={spinning}
          className="mt-6 px-10 py-4 bg-amber-500 hover:bg-amber-600 active:scale-95 transition-all text-white font-black text-xl rounded-xl shadow-lg flex items-center gap-3 disabled:opacity-50 disabled:active:scale-100"
        >
          <Coins className="w-6 h-6" />
          Puxar Alavanca (10 Moedas)
        </button>

        <div className="mt-8 text-sm text-textMuted grid grid-cols-2 md:grid-cols-4 gap-4 w-full border-t border-border pt-6">
          <div className="flex flex-col items-center">
            <span className="text-2xl">7️⃣7️⃣7️⃣</span>
            <span>= 500 Moedas</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-2xl">💎💎💎</span>
            <span>= 300 Moedas</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-2xl">🍎🍎🍎</span>
            <span>= 100 Moedas</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-2xl">🍎🍎❓</span>
            <span>= 15 Moedas</span>
          </div>
        </div>
      </div>
    </div>
  );
}
