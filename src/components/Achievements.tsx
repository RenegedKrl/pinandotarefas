import { Award, Star, Zap, Shield, Crown, Target, Coins } from 'lucide-react';
import type { Task } from './TaskList';

interface AchievementsProps {
  tasks: Task[];
  playerStats: { level: number; xp: number; hp: number };
  userId: string;
  coins: number;
}

export default function Achievements({ tasks, playerStats, userId, coins }: AchievementsProps) {
  const completedTasks = tasks.filter(t => t.completed).length;
  const hardTasks = tasks.filter(t => t.completed && t.difficulty === 'hard').length;
  const spinsStr = localStorage.getItem(`total_spins_${userId}`) || '0';
  const totalSpins = parseInt(spinsStr);

  const generateMilestones = (type: string, titlePrefix: string, descPrefix: string, icon: any, color: string, bg: string, values: number[], currentVal: number) => {
    return values.map(val => ({
      id: `${type}_${val}`,
      title: `${titlePrefix} ${val}`,
      description: `${descPrefix} ${val}.`,
      icon,
      condition: currentVal >= val,
      color,
      bg
    }));
  };

  const taskAchievements = generateMilestones('task', 'Máquina de Fazer', 'Complete um total de tarefas:', Target, 'text-blue-500', 'bg-blue-500/10', 
    [1, 5, 10, 25, 50, 100, 150, 200, 300, 400, 500, 750, 1000, 1500, 2000], completedTasks);

  const levelAchievements = generateMilestones('level', 'Herói Nível', 'Alcance o Nível', Shield, 'text-purple-500', 'bg-purple-500/10', 
    [2, 3, 4, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 60, 70, 80, 90, 95, 99, 100], playerStats.level);

  const hardAchievements = generateMilestones('hard', 'Desafio Aceito', 'Complete tarefas de Alta Prioridade (P1):', Zap, 'text-red-500', 'bg-red-500/10', 
    [1, 5, 10, 20, 50, 100, 200, 300, 500, 1000], hardTasks);

  const spinAchievements = generateMilestones('spin', 'Sorte Grande', 'Gire a Roleta Diária um total de vezes:', Star, 'text-emerald-500', 'bg-emerald-500/10', 
    [1, 5, 10, 25, 50, 100, 200, 300, 365, 500], totalSpins);

  const coinAchievements = generateMilestones('coin', 'Magnata', 'Acumule a quantidade de moedas:', Coins, 'text-yellow-500', 'bg-yellow-500/10', 
    [100, 500, 1000, 5000, 10000, 25000, 50000, 100000, 250000, 500000, 750000, 1000000], coins);

  const customAchievements = [
    {
      id: 'max_hp',
      title: 'Saúde de Ferro',
      description: 'Mantenha seu Pet com 100 HP.',
      icon: Award,
      condition: playerStats.hp === 100,
      color: 'text-pink-500',
      bg: 'bg-pink-500/10'
    },
    {
      id: 'first_blood',
      title: 'Primeira Gota de Suor',
      description: 'Bem vindo ao app. Apenas o começo!',
      icon: Crown,
      condition: completedTasks >= 1,
      color: 'text-yellow-500',
      bg: 'bg-yellow-500/10'
    }
  ];

  const achievements = [...customAchievements, ...taskAchievements, ...levelAchievements, ...hardAchievements, ...spinAchievements, ...coinAchievements];

  const unlockedCount = achievements.filter(a => a.condition).length;

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      <div className="bg-surface border border-border p-6 rounded-xl flex items-center justify-between shadow-sm relative overflow-hidden">
        <div className="absolute -right-10 -top-10 opacity-5 pointer-events-none">
          <Award className="w-64 h-64 text-text" />
        </div>
        
        <div>
          <h2 className="text-sm font-semibold text-textMuted uppercase tracking-wider mb-1">Mural de Fama</h2>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center">
              <Award className="w-6 h-6 text-yellow-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text">Conquistas</h1>
              <p className="text-sm text-textMuted">Colete medalhas ao atingir marcos importantes.</p>
            </div>
          </div>
        </div>
        
        <div className="text-right">
          <h2 className="text-sm font-semibold text-textMuted uppercase tracking-wider mb-1">Desbloqueadas</h2>
          <p className="text-3xl font-bold text-text drop-shadow-sm flex items-center gap-1 justify-end">
            {unlockedCount} <span className="text-base text-textMuted font-medium">/ {achievements.length}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {achievements.map(ach => {
          const unlocked = ach.condition;
          return (
            <div 
              key={ach.id} 
              className={`p-5 rounded-xl border flex items-center gap-4 transition-all duration-300 ${
                unlocked 
                  ? `bg-surface border-border shadow-sm` 
                  : `bg-black/5 border-transparent opacity-60 grayscale`
              }`}
            >
              <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 ${unlocked ? ach.bg : 'bg-black/10'}`}>
                <ach.icon className={`w-7 h-7 ${unlocked ? ach.color : 'text-textMuted'}`} />
              </div>
              <div className="flex-1">
                <h3 className={`font-bold text-lg ${unlocked ? 'text-text' : 'text-textMuted'}`}>{ach.title}</h3>
                <p className="text-sm text-textMuted">{ach.description}</p>
                {unlocked && (
                  <span className="inline-block mt-2 text-[10px] uppercase font-bold tracking-wider text-green-500 bg-green-500/10 px-2 py-0.5 rounded">
                    Desbloqueado
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
