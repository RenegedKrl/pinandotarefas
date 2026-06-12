import { ShoppingBag, Ghost, Swords, Beer, Gift, Target, Trophy, Map, Hash, Inbox, Calendar, CalendarDays, Filter, BarChart2, Award, Plus, MoreHorizontal, BookOpen, Timer, LayoutGrid } from 'lucide-react';
import type { ViewType } from '../App';
import type { CustomProject } from './ProjectModal';

interface MobileHubProps {
  type: 'world' | 'projects';
  setCurrentView: (view: ViewType) => void;
  customProjects: CustomProject[];
  badgeCounts: Record<string, number>;
  onAddProject: () => void;
  onEditProject: (proj: CustomProject) => void;
}

export default function MobileHub({ type, setCurrentView, customProjects, badgeCounts, onAddProject, onEditProject }: MobileHubProps) {
  
  const worldItems = [
    { id: 'pet_journey', label: 'Meu Mascote', icon: Target, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { id: 'tavern', label: 'A Taverna', icon: Beer, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { id: 'daily_quests', label: 'Desafios Diários', icon: Target, color: 'text-rose-500', bg: 'bg-rose-500/10' },
    { id: 'daily_spin', label: 'Roleta Diária', icon: Gift, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { id: 'grimoire', label: 'Grimório', icon: BookOpen, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
    { id: 'store', label: 'A Loja', icon: ShoppingBag, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { id: 'black_market', label: 'O Contrabandista', icon: Ghost, color: 'text-purple-700', bg: 'bg-purple-700/10' },
    { id: 'pomodoro', label: 'Pomodoro', icon: Timer, color: 'text-rose-600', bg: 'bg-rose-600/10' },
    { id: 'boss_battle', label: 'Raid do Chefe', icon: Swords, color: 'text-red-500', bg: 'bg-red-500/10' },
    { id: 'leaderboard', label: 'Arena dos Heróis', icon: Trophy, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
    { id: 'journey_map', label: 'Mapa de Aventuras', icon: Map, color: 'text-green-500', bg: 'bg-green-500/10' },
    { id: 'achievements', label: 'Conquistas', icon: Award, color: 'text-yellow-600', bg: 'bg-yellow-600/10' },
  ];

  const projectItems = [
    { id: 'inbox', label: 'Entrada', icon: Inbox, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { id: 'today', label: 'Hoje', icon: Calendar, color: 'text-green-600', bg: 'bg-green-600/10', badge: badgeCounts.today },
    { id: 'upcoming', label: 'Em breve', icon: CalendarDays, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { id: 'filters', label: 'Filtros e Etiquetas', icon: Filter, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { id: 'reports', label: 'Relatórios', icon: BarChart2, color: 'text-gray-500', bg: 'bg-gray-500/10' },
    { id: 'eisenhower', label: 'Matriz de Eisenhower', icon: LayoutGrid, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
  ];

  if (type === 'world') {
    return (
      <div className="p-4 pb-24 grid grid-cols-2 sm:grid-cols-3 gap-4">
        {worldItems.map((item) => (
          <button 
            key={item.id}
            onClick={() => setCurrentView(item.id as ViewType)}
            className="flex flex-col items-center justify-center p-6 rounded-2xl bg-surface border border-border shadow-sm active:scale-95 transition-transform gap-3"
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${item.bg} ${item.color}`}>
              <item.icon className="w-6 h-6" />
            </div>
            <span className="font-semibold text-text text-[13px] text-center">{item.label}</span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 pb-24 space-y-6">
      <div className="space-y-2">
        <h3 className="text-[13px] font-bold text-textMuted uppercase tracking-wider px-2">Visualizações</h3>
        <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm">
          {projectItems.map((item, idx) => (
            <button 
              key={item.id}
              onClick={() => setCurrentView(item.id as ViewType)}
              className={`w-full flex items-center justify-between p-4 bg-surface active:bg-black/5 transition-colors ${idx !== projectItems.length - 1 ? 'border-b border-border' : ''}`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${item.bg} ${item.color}`}>
                  <item.icon className="w-4 h-4" />
                </div>
                <span className="font-semibold text-text text-[15px]">{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="bg-primary text-white text-[11px] font-bold px-2 py-0.5 rounded-full">{item.badge}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-[13px] font-bold text-textMuted uppercase tracking-wider">Meus Projetos</h3>
          <button onClick={onAddProject} className="p-1 rounded hover:bg-black/5 text-textMuted hover:text-text transition-colors">
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm">
          {customProjects.map((proj, idx) => (
            <div key={proj.id} className={`w-full flex items-center justify-between p-4 bg-surface active:bg-black/5 transition-colors group/proj ${idx !== customProjects.length - 1 ? 'border-b border-border' : ''}`}>
              <button 
                onClick={() => setCurrentView(`project_${proj.id}` as ViewType)}
                className="flex-1 flex items-center gap-3 text-left"
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-black/5" style={{ color: proj.color }}>
                  <Hash className="w-4 h-4" />
                </div>
                <span className="font-semibold text-text text-[15px]">{proj.name}</span>
              </button>
              <div className="flex items-center gap-2">
                {badgeCounts[`project_${proj.id}`] > 0 && (
                  <span className="bg-primary text-white text-[11px] font-bold px-2 py-0.5 rounded-full">{badgeCounts[`project_${proj.id}`]}</span>
                )}
                <button 
                  onClick={() => onEditProject(proj)}
                  className="p-1.5 rounded text-textMuted hover:bg-black/10 hover:text-text transition-colors"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {customProjects.length === 0 && (
            <div className="p-4 text-center text-textMuted text-[14px]">
              Nenhum projeto criado.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
