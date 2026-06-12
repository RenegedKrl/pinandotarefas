import { Trophy, Target, Zap, Shield, Sword, Crown } from 'lucide-react';
import type { Task } from './TaskList';

interface ReportsDashboardProps {
  tasks: Task[];
  playerStats: { level: number; xp: number; hp: number };
}

const getRankDetails = (level: number) => {
  if (level < 5) return { title: 'Novato', icon: Shield, color: 'text-gray-400', bg: 'bg-gray-400/10' };
  if (level < 10) return { title: 'Aventureiro', icon: Sword, color: 'text-emerald-500', bg: 'bg-emerald-500/10' };
  if (level < 20) return { title: 'Guerreiro', icon: Zap, color: 'text-blue-500', bg: 'bg-blue-500/10' };
  if (level < 50) return { title: 'Mestre das Tarefas', icon: Target, color: 'text-purple-500', bg: 'bg-purple-500/10' };
  return { title: 'Lenda Produtiva', icon: Crown, color: 'text-amber-500', bg: 'bg-amber-500/10' };
};

export default function ReportsDashboard({ tasks, playerStats }: ReportsDashboardProps) {
  const completedTasks = tasks.filter(t => t.completed);
  const pendingTasks = tasks.filter(t => !t.completed);
  
  const rank = getRankDetails(playerStats.level);
  const RankIcon = rank.icon;

  const getCompletionRate = () => {
    if (tasks.length === 0) return 0;
    return Math.round((completedTasks.length / tasks.length) * 100);
  };

  const calculateTotalXPFromTasks = () => {
    return completedTasks.reduce((acc, t) => {
      if (t.difficulty === 'hard') return acc + 30;
      if (t.difficulty === 'medium') return acc + 20;
      return acc + 10;
    }, 0);
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="bg-surface border border-border p-6 rounded-xl flex items-center justify-between shadow-sm relative overflow-hidden">
        <div className="absolute -right-10 -top-10 opacity-5 pointer-events-none">
          <RankIcon className="w-64 h-64 text-text" />
        </div>
        
        <div>
          <h2 className="text-sm font-semibold text-textMuted uppercase tracking-wider mb-1">Patente Atual</h2>
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${rank.bg}`}>
              <RankIcon className={`w-6 h-6 ${rank.color}`} />
            </div>
            <div>
              <h1 className={`text-2xl font-bold ${rank.color}`}>{rank.title}</h1>
              <p className="text-sm text-textMuted">Nível {playerStats.level}</p>
            </div>
          </div>
        </div>
        
        <div className="text-right">
          <h2 className="text-sm font-semibold text-textMuted uppercase tracking-wider mb-1">XP Total Acumulado</h2>
          <p className="text-3xl font-bold text-xp drop-shadow-sm flex items-center gap-1 justify-end">
            {calculateTotalXPFromTasks()} <span className="text-base text-textMuted">XP</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-surface border border-border p-5 rounded-xl text-center shadow-sm">
          <div className="w-10 h-10 mx-auto bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mb-3">
            <Trophy className="w-5 h-5" />
          </div>
          <p className="text-3xl font-bold text-text mb-1">{completedTasks.length}</p>
          <p className="text-xs text-textMuted uppercase font-semibold">Missões Concluídas</p>
        </div>
        <div className="bg-surface border border-border p-5 rounded-xl text-center shadow-sm">
          <div className="w-10 h-10 mx-auto bg-blue-500/10 text-blue-500 rounded-full flex items-center justify-center mb-3">
            <Target className="w-5 h-5" />
          </div>
          <p className="text-3xl font-bold text-text mb-1">{pendingTasks.length}</p>
          <p className="text-xs text-textMuted uppercase font-semibold">Missões Pendentes</p>
        </div>
        <div className="bg-surface border border-border p-5 rounded-xl text-center shadow-sm">
          <div className="w-10 h-10 mx-auto bg-purple-500/10 text-purple-500 rounded-full flex items-center justify-center mb-3">
            <Zap className="w-5 h-5" />
          </div>
          <p className="text-3xl font-bold text-text mb-1">{getCompletionRate()}%</p>
          <p className="text-xs text-textMuted uppercase font-semibold">Taxa de Sucesso</p>
        </div>
      </div>

      <div className="bg-surface border border-border p-6 rounded-xl shadow-sm">
        <h3 className="text-lg font-bold text-text mb-4">Registro de Aventuras</h3>
        <div className="space-y-3">
          {completedTasks.slice(0, 5).map((t) => (
            <div key={t.id} className="flex items-center justify-between p-3 rounded-lg bg-black/[0.02] border border-border/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-text line-clamp-1">{t.title}</p>
                  <p className="text-xs text-textMuted">Inimigo derrotado</p>
                </div>
              </div>
              <span className="text-xs font-bold text-xp bg-xp/10 px-2 py-1 rounded-md">
                +{t.difficulty === 'hard' ? 30 : t.difficulty === 'medium' ? 20 : 10} XP
              </span>
            </div>
          ))}
          {completedTasks.length === 0 && (
            <p className="text-center text-sm text-textMuted py-4">Sua lenda ainda não começou. Conclua uma missão!</p>
          )}
        </div>
      </div>
    </div>
  );
}
