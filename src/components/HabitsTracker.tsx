import { useState, useEffect } from 'react';
import { Plus, Check, Flame, Droplets, BookOpen, Dumbbell, Sun, Heart, Trophy, X } from 'lucide-react';
import confetti from 'canvas-confetti';
import { supabase } from '../lib/supabase';

interface Habit {
  id: string;
  title: string;
  icon: string;
  color: string;
  streak: number;
  lastCompleted: string | null;
}


const ICONS: Record<string, React.ElementType> = {
  droplets: Droplets,
  book: BookOpen,
  dumbbell: Dumbbell,
  sun: Sun,
  heart: Heart,
  flame: Flame,
};

interface HabitsTrackerProps {
  userId: string;
  setPlayerStats: React.Dispatch<React.SetStateAction<any>>;
}

export default function HabitsTracker({ userId, setPlayerStats }: HabitsTrackerProps) {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newIcon, setNewIcon] = useState('heart');
  const [newColor, setNewColor] = useState('#10B981');

  useEffect(() => {
    const fetchHabits = async () => {
      const { data } = await supabase.from('tasks').select('*').eq('user_id', userId).eq('list_id', 'habits');
      const todayStr = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      
      let parsedHabits: Habit[] = [];
      
      if (data && data.length > 0) {
        parsedHabits = data.map(t => {
          let meta = { icon: 'heart', color: '#10B981', streak: 0, lastCompleted: null as string | null };
          try { if (t.description) meta = JSON.parse(t.description); } catch(e){}
          
          let streak = meta.streak || 0;
          let lastCompleted = meta.lastCompleted;
          
          if (lastCompleted !== todayStr && lastCompleted !== yesterday) {
             streak = 0;
          }
          return { id: t.id, title: t.title, icon: meta.icon, color: meta.color, streak, lastCompleted };
        });
        setHabits(parsedHabits);
      } else {
        const saved = localStorage.getItem(`habits_${userId}`);
        if (saved) {
           parsedHabits = JSON.parse(saved);
           setHabits(parsedHabits);
        } else {
           // Provide defaults
           const defaults = [
             { id: crypto.randomUUID(), title: 'Beber 2L de Água', icon: 'droplets', color: '#3B82F6', streak: 0, lastCompleted: null },
             { id: crypto.randomUUID(), title: 'Leitura (15 min)', icon: 'book', color: '#8B5CF6', streak: 0, lastCompleted: null },
             { id: crypto.randomUUID(), title: 'Exercício Físico', icon: 'dumbbell', color: '#EF4444', streak: 0, lastCompleted: null },
           ];
           setHabits(defaults);
        }
      }
    };
    fetchHabits();
  }, [userId]);

  const saveToCloud = async (h: Habit) => {
    const meta = JSON.stringify({ icon: h.icon, color: h.color, streak: h.streak, lastCompleted: h.lastCompleted });
    const { error } = await supabase.from('tasks').upsert([{
      id: h.id.includes('-') ? h.id : crypto.randomUUID(), // ensure uuid
      title: h.title,
      description: meta,
      user_id: userId,
      list_id: 'habits',
      difficulty: 'easy',
      completed: false
    }]);
    if (error) console.error("Erro ao salvar hábito na nuvem", error);
  };

  const toggleHabit = async (id: string) => {
    const todayStr = new Date().toISOString().split('T')[0];
    
    let updatedHabit: Habit | null = null;
    const newHabits = habits.map(h => {
      if (h.id === id) {
        if (h.lastCompleted === todayStr) {
          updatedHabit = { ...h, streak: Math.max(0, h.streak - 1), lastCompleted: null };
        } else {
          confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
          setPlayerStats((prev: any) => ({ ...prev, xp: prev.xp + 10 }));
          updatedHabit = { ...h, streak: h.streak + 1, lastCompleted: todayStr };
        }
        return updatedHabit;
      }
      return h;
    });
    
    setHabits(newHabits);
    if (updatedHabit) saveToCloud(updatedHabit);
  };

  const addHabit = async () => {
    if (!newTitle.trim()) return;
    const newHabit: Habit = {
      id: crypto.randomUUID(),
      title: newTitle,
      icon: newIcon,
      color: newColor,
      streak: 0,
      lastCompleted: null
    };
    setHabits([...habits, newHabit]);
    setIsAdding(false);
    setNewTitle('');
    await saveToCloud(newHabit);
  };

  const deleteHabit = async (id: string) => {
    setHabits(habits.filter(h => h.id !== id));
    await supabase.from('tasks').delete().eq('id', id);
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="pb-20 animate-in fade-in duration-500">
      <div className="bg-surface border border-border p-6 rounded-xl flex items-center justify-between shadow-sm relative overflow-hidden mb-6">
        <div className="absolute -right-10 -top-10 opacity-5 pointer-events-none">
          <Trophy className="w-64 h-64 text-text" />
        </div>
        
        <div>
          <h2 className="text-sm font-semibold text-textMuted uppercase tracking-wider mb-1">Rotina de Sucesso</h2>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Sun className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text">Meus Hábitos</h1>
              <p className="text-sm text-textMuted">Construa constância e ganhe XP diariamente.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {habits.map(habit => {
          const isDone = habit.lastCompleted === todayStr;
          const Icon = ICONS[habit.icon] || Heart;
          
          return (
            <div key={habit.id} className={`p-4 rounded-2xl border transition-all flex items-center justify-between group ${isDone ? 'bg-surface/50 border-border/50 opacity-70' : 'bg-surface border-border hover:shadow-md hover:border-border/80'}`}>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => toggleHabit(habit.id)}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isDone ? 'text-white' : 'bg-black/5 text-text hover:scale-110'}`}
                  style={{ backgroundColor: isDone ? habit.color : undefined }}
                >
                  {isDone ? <Check className="w-6 h-6" /> : <Icon className="w-6 h-6" style={{ color: habit.color }} />}
                </button>
                <div>
                  <h3 className={`font-bold text-lg ${isDone ? 'line-through text-textMuted' : 'text-text'}`}>{habit.title}</h3>
                  <div className="flex items-center gap-1.5 text-sm font-medium" style={{ color: habit.streak > 0 ? habit.color : '#888' }}>
                    <Flame className="w-4 h-4" />
                    {habit.streak} dias seguidos
                  </div>
                </div>
              </div>
              <button onClick={() => deleteHabit(habit.id)} className="p-2 text-textMuted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                <X className="w-5 h-5" />
              </button>
            </div>
          );
        })}
      </div>

      {!isAdding ? (
        <button 
          onClick={() => setIsAdding(true)}
          className="w-full p-4 rounded-xl border-2 border-dashed border-border text-textMuted font-bold hover:bg-black/5 hover:text-text transition-all flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" /> Criar Novo Hábito
        </button>
      ) : (
        <div className="bg-surface border border-border p-5 rounded-2xl animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-text">Novo Hábito</h3>
            <button onClick={() => setIsAdding(false)} className="text-textMuted hover:text-text"><X className="w-5 h-5" /></button>
          </div>
          <input 
            type="text" 
            placeholder="Ex: Ler 10 páginas, Beber água..." 
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text mb-4"
            autoFocus
          />
          <div className="flex items-center justify-between gap-4">
            <div className="flex gap-2">
              {['heart', 'book', 'dumbbell', 'droplets', 'sun'].map(icon => {
                const IconComp = ICONS[icon];
                return (
                  <button 
                    key={icon}
                    onClick={() => setNewIcon(icon)}
                    className={`p-2 rounded-lg ${newIcon === icon ? 'bg-primary/20 text-primary' : 'bg-black/5 text-textMuted'}`}
                  >
                    <IconComp className="w-5 h-5" />
                  </button>
                );
              })}
            </div>
            <div className="flex gap-2">
              {['#10B981', '#3B82F6', '#8B5CF6', '#EF4444', '#F59E0B'].map(color => (
                <button 
                  key={color}
                  onClick={() => setNewColor(color)}
                  className="w-8 h-8 rounded-full border-2 transition-transform"
                  style={{ backgroundColor: color, borderColor: newColor === color ? '#fff' : 'transparent', transform: newColor === color ? 'scale(1.1)' : 'scale(1)' }}
                />
              ))}
            </div>
            <button 
              onClick={addHabit}
              className="bg-primary text-white font-bold px-6 py-2 rounded-xl"
            >
              Salvar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
