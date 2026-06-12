import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { LayoutGrid, AlertCircle, Clock, Search, Briefcase } from 'lucide-react';
import type { Task } from './TaskList';

interface EisenhowerMatrixProps {
  userId: string;
}

export default function EisenhowerMatrix({ userId }: EisenhowerMatrixProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .eq('completed', false);
        
      if (data) {
        setTasks(data as Task[]);
      }
      setLoading(false);
    };
    fetchTasks();
  }, [userId]);

  // A Matrix classifies by Urgency (due soon) and Importance (difficulty/priority)
  // For simplicity, we define:
  // Urgent: due today or overdue
  // Important: Medium or Hard difficulty
  
  const getCategories = () => {
    const today = new Date().toISOString().split('T')[0];
    
    return {
      doFirst: tasks.filter(t => t.due_date && t.due_date <= today && (t.difficulty === 'hard' || t.difficulty === 'medium')),
      schedule: tasks.filter(t => (!t.due_date || t.due_date > today) && (t.difficulty === 'hard' || t.difficulty === 'medium')),
      delegate: tasks.filter(t => t.due_date && t.due_date <= today && t.difficulty === 'easy'),
      dontDo: tasks.filter(t => (!t.due_date || t.due_date > today) && t.difficulty === 'easy'),
    };
  };

  const cats = getCategories();

  const TaskItem = ({ task }: { task: Task }) => (
    <div className="bg-surface/50 border border-border/50 rounded p-2 text-sm text-text mb-2 shadow-sm truncate">
      {task.title}
    </div>
  );

  if (loading) {
    return <div className="p-8 text-center text-textMuted">Analisando suas tarefas...</div>;
  }

  return (
    <div className="animate-in fade-in pb-16">
      <div className="bg-primary/10 border border-primary/20 rounded-2xl p-6 mb-6">
        <h2 className="text-xl font-bold text-primary flex items-center gap-2 mb-2">
          <LayoutGrid className="w-6 h-6" /> Matriz de Eisenhower
        </h2>
        <p className="text-sm text-textMuted leading-relaxed">
          Esta é uma ferramenta estratégica para tomada de decisões. Ela analisa todas as suas missões ativas e as divide em 4 quadrantes cruzando <strong>Urgência</strong> (Prazo) e <strong>Importância</strong> (Dificuldade).
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-5 flex flex-col h-[300px]">
          <h3 className="font-bold text-red-500 flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5" /> Fazer Agora (Urgente e Importante)
          </h3>
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
            {cats.doFirst.length === 0 && <p className="text-xs text-textMuted italic">Nada pegando fogo aqui!</p>}
            {cats.doFirst.map(t => <TaskItem key={t.id} task={t} />)}
          </div>
        </div>

        <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-5 flex flex-col h-[300px]">
          <h3 className="font-bold text-blue-500 flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5" /> Agendar (Importante, não Urgente)
          </h3>
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
            {cats.schedule.length === 0 && <p className="text-xs text-textMuted italic">Nenhum plano a longo prazo.</p>}
            {cats.schedule.map(t => <TaskItem key={t.id} task={t} />)}
          </div>
        </div>

        <div className="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-5 flex flex-col h-[300px]">
          <h3 className="font-bold text-orange-500 flex items-center gap-2 mb-4">
            <Briefcase className="w-5 h-5" /> Delegar/Resolver Rápido (Urgente, não Importante)
          </h3>
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
            {cats.delegate.length === 0 && <p className="text-xs text-textMuted italic">Sem distrações urgentes.</p>}
            {cats.delegate.map(t => <TaskItem key={t.id} task={t} />)}
          </div>
        </div>

        <div className="bg-gray-500/10 border border-gray-500/30 rounded-2xl p-5 flex flex-col h-[300px]">
          <h3 className="font-bold text-gray-500 flex items-center gap-2 mb-4">
            <Search className="w-5 h-5" /> Eliminar/Pausar (Não Urgente, não Importante)
          </h3>
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
            {cats.dontDo.length === 0 && <p className="text-xs text-textMuted italic">Sua lista está otimizada.</p>}
            {cats.dontDo.map(t => <TaskItem key={t.id} task={t} />)}
          </div>
        </div>
      </div>
    </div>
  );
}
