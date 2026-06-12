import React from 'react';
import { Sparkles, Trophy, Flame, Star } from 'lucide-react';

interface DailyQuestsProps {
  userId: string;
  tasks: any[];
  coins: number;
  setCoins: React.Dispatch<React.SetStateAction<number>>;
  setPlayerStats: React.Dispatch<React.SetStateAction<{ level: number; xp: number; hp: number }>>;
}

// These are simulated quests for now based on actual task data
// Since we don't have a backend table for daily quests, we'll derive them from local tasks completed today
export default function DailyQuests({ userId, tasks, setCoins, setPlayerStats }: DailyQuestsProps) {
  const getLocalYYYYMMDD = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayStr = getLocalYYYYMMDD(new Date());

  const tasksCompletedToday = tasks.filter(t => 
    t.completed && 
    t.created_at && // Simplified checking
    t.due_date && 
    getLocalYYYYMMDD(new Date(t.due_date)) === todayStr
  ).length;

  const hardTasksCompletedToday = tasks.filter(t => 
    t.completed && 
    t.difficulty === 'hard' && 
    t.due_date && 
    getLocalYYYYMMDD(new Date(t.due_date)) === todayStr
  ).length;

  const quests = [
    {
      id: 1,
      title: "Iniciando o Dia",
      description: "Complete 1 tarefa hoje",
      target: 1,
      progress: tasksCompletedToday,
      reward: { coins: 20, xp: 10 },
      icon: Sparkles,
      color: "text-blue-500",
      bg: "bg-blue-500/10"
    },
    {
      id: 2,
      title: "Produtividade Máxima",
      description: "Complete 5 tarefas hoje",
      target: 5,
      progress: tasksCompletedToday,
      reward: { coins: 50, xp: 50 },
      icon: Flame,
      color: "text-orange-500",
      bg: "bg-orange-500/10"
    },
    {
      id: 3,
      title: "Caçador de Chefões",
      description: "Complete 2 tarefas de Alta Prioridade (P1) hoje",
      target: 2,
      progress: hardTasksCompletedToday,
      reward: { coins: 100, xp: 100 },
      icon: Trophy,
      color: "text-amber-500",
      bg: "bg-amber-500/10"
    }
  ];

  const claimReward = (questId: number, reward: { coins: number, xp: number }) => {
    const claimedKey = `quest_claimed_${userId}_${todayStr}_${questId}`;
    if (localStorage.getItem(claimedKey)) return;

    setCoins(prev => {
      const newCoins = prev + reward.coins;
      localStorage.setItem(`coins_${userId}`, newCoins.toString());
      return newCoins;
    });

    setPlayerStats(prev => {
      let newXp = prev.xp + reward.xp;
      let newLevel = prev.level;
      while (newXp >= newLevel * 100) {
        newXp -= newLevel * 100;
        newLevel++;
      }
      return { ...prev, xp: newXp, level: newLevel };
    });

    localStorage.setItem(claimedKey, 'true');
    // Force re-render would naturally happen if state was here, 
    // but since we read localStorage in render, it'll update automatically.
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      <div className="bg-surface border border-border p-6 rounded-xl flex items-center justify-between shadow-sm relative overflow-hidden">
        <div className="absolute -right-10 -top-10 opacity-5 pointer-events-none">
          <Trophy className="w-64 h-64 text-text" />
        </div>
        
        <div>
          <h2 className="text-sm font-semibold text-textMuted uppercase tracking-wider mb-1">Missões</h2>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Trophy className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text">Desafios Diários</h1>
              <p className="text-sm text-textMuted">Cumpra os objetivos e resgate recompensas extras.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {quests.map(quest => {
          const isCompleted = quest.progress >= quest.target;
          const claimedKey = `quest_claimed_${userId}_${todayStr}_${quest.id}`;
          const isClaimed = localStorage.getItem(claimedKey) === 'true';

          return (
            <div key={quest.id} className="bg-surface border border-border p-5 rounded-xl flex items-center gap-4 shadow-sm hover:border-primary/30 transition-colors">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 ${quest.bg}`}>
                <quest.icon className={`w-7 h-7 ${quest.color}`} />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-text text-lg">{quest.title}</h3>
                <p className="text-sm text-textMuted mb-2">{quest.description}</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-black/5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-1000 ${isCompleted ? 'bg-green-500' : 'bg-primary'}`} 
                      style={{ width: `${Math.min(100, (quest.progress / quest.target) * 100)}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-textMuted w-10 text-right">
                    {Math.min(quest.progress, quest.target)}/{quest.target}
                  </span>
                </div>
              </div>
              <div className="shrink-0 flex flex-col items-center gap-2 ml-4">
                <div className="flex items-center gap-2 text-xs font-bold">
                  <span className="text-amber-500 flex items-center"><span className="w-3 h-3 rounded-full bg-amber-500 text-white flex items-center justify-center text-[8px] mr-1">$</span>{quest.reward.coins}</span>
                  <span className="text-blue-500 flex items-center"><Star className="w-3 h-3 mr-1 fill-current"/>{quest.reward.xp}</span>
                </div>
                {isClaimed ? (
                  <button disabled className="px-4 py-1.5 rounded-lg bg-green-500/20 text-green-600 font-bold text-sm w-full opacity-50 cursor-not-allowed">
                    Resgatado
                  </button>
                ) : isCompleted ? (
                  <button onClick={() => claimReward(quest.id, quest.reward)} className="px-4 py-1.5 rounded-lg bg-green-500 hover:bg-green-600 text-white font-bold text-sm w-full transition-colors animate-pulse">
                    Resgatar!
                  </button>
                ) : (
                  <button disabled className="px-4 py-1.5 rounded-lg bg-black/5 text-textMuted font-bold text-sm w-full cursor-not-allowed">
                    Em Progresso
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
