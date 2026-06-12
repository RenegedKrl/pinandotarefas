import { Bell, ShieldAlert, Sparkles, AlertCircle, Clock, Trophy } from 'lucide-react';

interface NotificationsPanelProps {
  onClose: () => void;
  userId: string;
  tasks: any[];
}

export default function NotificationsPanel({ onClose, userId, tasks }: NotificationsPanelProps) {
  // Generate some dynamic notifications based on game state
  const notifications = [];

  // Check if daily spin is available
  const lastSpin = localStorage.getItem(`last_spin_date_${userId}`);
  const todayStr = new Date().toISOString().split('T')[0];
  if (lastSpin !== todayStr) {
    notifications.push({
      id: 'spin',
      title: 'A Roleta aguarda!',
      message: 'Seu giro diário gratuito está disponível. Venha tentar a sorte!',
      icon: Sparkles,
      color: 'text-purple-500',
      bg: 'bg-purple-500/10',
      time: 'Agora'
    });
  }

  // Check for active shield
  const hasShield = localStorage.getItem(`buff_shield_${userId}`) === 'true';
  if (hasShield) {
    notifications.push({
      id: 'shield',
      title: 'Proteção Divina Ativa',
      message: 'Seu escudo está ativado e protegerá você do próximo dano por atraso.',
      icon: ShieldAlert,
      color: 'text-indigo-500',
      bg: 'bg-indigo-500/10',
      time: 'Recente'
    });
  }

  // Check overdue tasks
  const overdueCount = tasks.filter(t => {
    if (t.completed || !t.due_date) return false;
    const taskDate = new Date(t.due_date);
    taskDate.setHours(0,0,0,0);
    const today = new Date();
    today.setHours(0,0,0,0);
    return taskDate.getTime() < today.getTime();
  }).length;

  if (overdueCount > 0) {
    notifications.push({
      id: 'overdue',
      title: 'Atenção! Tarefas Atrasadas',
      message: `Você tem ${overdueCount} tarefa(s) atrasada(s). Cumpra-as para evitar perder HP!`,
      icon: AlertCircle,
      color: 'text-red-500',
      bg: 'bg-red-500/10',
      time: 'Importante'
    });
  }

  // Double XP Buff
  const xpBuff = parseInt(localStorage.getItem(`buff_double_xp_${userId}`) || '0');
  if (xpBuff > 0) {
    notifications.push({
      id: 'buff',
      title: 'Elixir do Foco Ativo',
      message: `Suas próximas ${xpBuff} tarefas renderão XP em dobro!`,
      icon: Trophy,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
      time: 'Ativo'
    });
  }

  return (
    <>
      <div className="fixed inset-0 z-[90]" onClick={onClose} />
      <div className="absolute top-16 left-4 w-80 bg-surface border border-border rounded-2xl shadow-xl z-[100] flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200">
        <div className="p-4 border-b border-border flex items-center justify-between bg-black/5">
          <h3 className="font-bold text-text flex items-center gap-2">
            <Bell className="w-4 h-4" /> Notificações
          </h3>
          <span className="text-xs font-bold text-white bg-primary px-2 py-0.5 rounded-full">
            {notifications.length} novas
          </span>
        </div>
        
        <div className="max-h-[400px] overflow-y-auto custom-scrollbar flex flex-col">
          {notifications.length === 0 ? (
            <div className="p-8 flex flex-col items-center text-center text-textMuted">
              <Clock className="w-10 h-10 mb-3 opacity-20" />
              <p className="text-sm font-medium">Tudo tranquilo por aqui.</p>
              <p className="text-xs">Nenhuma notificação no momento.</p>
            </div>
          ) : (
            notifications.map(n => (
              <div key={n.id} className="p-4 border-b border-border/50 hover:bg-black/5 cursor-pointer transition-colors flex gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${n.bg}`}>
                  <n.icon className={`w-5 h-5 ${n.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-bold text-sm text-text truncate">{n.title}</h4>
                    <span className="text-[10px] font-semibold text-textMuted uppercase">{n.time}</span>
                  </div>
                  <p className="text-xs text-textMuted line-clamp-2 leading-relaxed">{n.message}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
