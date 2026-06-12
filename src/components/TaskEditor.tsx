import React, { useState, useRef, useEffect } from 'react';
import { 
  Calendar, Flag, Clock, MoreHorizontal, Inbox, ChevronDown, 
  Image as ImageIcon, Smile, ListTodo, Repeat, X, Check, Bell, Square, CheckSquare
} from 'lucide-react';

type Difficulty = 'easy' | 'medium' | 'hard';

interface TaskEditorProps {
  onCancel: () => void;
  onSave: (task: {
    id?: string;
    title: string;
    description: string;
    difficulty: Difficulty;
    dueDate: string;
    listId: string;
    subtasks: any[];
    taskTime: string;
    reminderOffset: string;
    repeatConfig: any;
    attachment: string | null;
  }) => void;
  initialDate?: string;
  initialListId?: string;
  initialTask?: any;
}

export default function TaskEditor({ onCancel, onSave, initialDate = '', initialListId = 'inbox', initialTask }: TaskEditorProps) {
  const [title, setTitle] = useState(initialTask?.title || '');
  const [description, setDescription] = useState(initialTask?.description || '');
  const [difficulty, setDifficulty] = useState<Difficulty>(initialTask?.difficulty || 'easy');
  
  // if initialTask has due_date, format it to YYYY-MM-DD
  const defaultDueDate = initialTask?.due_date 
    ? new Date(initialTask.due_date).toISOString().split('T')[0] 
    : initialDate;
  
  const [dueDate, setDueDate] = useState(defaultDueDate);
  const [listId, setListId] = useState(initialTask?.list_id || initialListId);
  
  const [customProjects, setCustomProjects] = useState<any[]>([
    { id: 'Objetivos', name: 'Objetivos', color: '#f43f5e' },
    { id: 'Casa', name: 'Casa', color: '#10b981' },
    { id: 'Trabalho', name: 'Trabalho', color: '#f59e0b' }
  ]);
  useEffect(() => {
    const key = Object.keys(localStorage).find(k => k.startsWith('projects_'));
    if (key) {
      try {
        const parsed = JSON.parse(localStorage.getItem(key) || '[]');
        if (parsed.length > 0 && typeof parsed[0] === 'string') {
           setCustomProjects(parsed.map((p: string) => ({ id: p, name: p, color: '#f59e0b' })));
        } else {
           setCustomProjects(parsed);
        }
      } catch (e) {}
    }
  }, []);

  const [showPriorityMenu, setShowPriorityMenu] = useState(false);
  
  // Subtarefas
  const [subtasks, setSubtasks] = useState<any[]>(initialTask?.extras?.subtasks || []);
  const [showSubtasks, setShowSubtasks] = useState((initialTask?.extras?.subtasks?.length || 0) > 0);
  const [newSubtask, setNewSubtask] = useState('');
  
  // Lembretes e Hora
  const [showReminderMenu, setShowReminderMenu] = useState(false);
  const [taskTime, setTaskTime] = useState(initialTask?.extras?.taskTime || '');
  const [reminderOffset, setReminderOffset] = useState(initialTask?.extras?.reminderOffset || '0'); // in minutes
  
  // Repetir
  const [showRepeatMenu, setShowRepeatMenu] = useState(false);
  const [showCustomRepeat, setShowCustomRepeat] = useState(false);
  const [repeatLabel, setRepeatLabel] = useState<string>(initialTask?.extras?.repeatConfig?.label || '');
  const [customRepeatFreq, setCustomRepeatFreq] = useState(initialTask?.extras?.repeatConfig?.custom?.freq || '1');
  const [customRepeatUnit, setCustomRepeatUnit] = useState(initialTask?.extras?.repeatConfig?.custom?.unit || 'Dia');
  const [customRepeatEnds, setCustomRepeatEnds] = useState(initialTask?.extras?.repeatConfig?.custom?.ends || 'Nunca');
  const [customRepeatDays, setCustomRepeatDays] = useState<number[]>(initialTask?.extras?.repeatConfig?.custom?.days || []);

  // Extras
  const [attachmentName, setAttachmentName] = useState<string | null>(initialTask?.extras?.attachment || null);
  const [showEmojiMenu, setShowEmojiMenu] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const quickEmojis = [
    '🚀', '🎯', '🔥', '📚', '💻', '💡', '✅', '⭐', '🏃', '🏋️', 
    '🧘', '🍎', '💰', '🎮', '🛠️', '🎨', '🛒', '🧹', '📞', '✈️',
    '🎉', '🏆', '🍕', '☕', '🎵', '🐶', '🐱', '✨', '🧠', '⚡'
  ];

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [description]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    
    let finalSubtasks = [...subtasks];
    if (newSubtask.trim()) {
      finalSubtasks.push({ id: crypto.randomUUID(), title: newSubtask.trim(), completed: false });
      setNewSubtask('');
    }
    
    const repeatConfig = repeatLabel ? {
      label: repeatLabel,
      custom: repeatLabel === 'Personalizado' ? { freq: customRepeatFreq, unit: customRepeatUnit, ends: customRepeatEnds, days: customRepeatDays } : null
    } : null;

    onSave({ 
      id: initialTask?.id,
      title, 
      description, 
      difficulty, 
      dueDate, 
      listId,
      subtasks: finalSubtasks,
      taskTime,
      reminderOffset,
      repeatConfig,
      attachment: attachmentName
    });
  };

  const handleAddSubtask = (e?: React.MouseEvent) => {
    e?.preventDefault();
    if (newSubtask.trim()) {
      setSubtasks([...subtasks, { id: crypto.randomUUID(), title: newSubtask.trim(), completed: false }]);
      setNewSubtask('');
    }
  };

  const handleSubtaskKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSubtask();
    }
  };

  const removeSubtask = (index: number) => {
    setSubtasks(subtasks.filter((_, i) => i !== index));
  };

  const toggleSubtaskCompletion = (index: number) => {
    setSubtasks(subtasks.map((st, i) => {
      if (i === index) {
        if (typeof st === 'object' && st !== null) {
          return { ...st, completed: !st.completed };
        } else {
          return { id: crypto.randomUUID(), title: st, completed: true };
        }
      }
      return st;
    }));
  };

  const appendEmoji = (emoji: string) => {
    setTitle((prev: string) => prev + emoji);
    setShowEmojiMenu(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setAttachmentName(e.target.files[0].name);
    }
  };

  const PillButton = ({ icon: Icon, label, onClick, active }: { icon: any, label: string, onClick?: () => void, active?: boolean }) => (
    <button 
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded border ${
        active 
          ? 'bg-primary/10 border-primary/20 text-primary' 
          : 'border-border text-textMuted hover:bg-black/5 hover:text-text'
      } text-[13px] font-medium transition-colors`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );

  return (
    <div className="relative">
      <form onSubmit={handleSubmit} className="border border-border rounded-xl bg-surface shadow-sm overflow-visible flex flex-col mt-2">
        <div className="p-3 pb-2 flex flex-col gap-2">
          <input
            type="text"
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Nome da tarefa"
            className="w-full bg-transparent border-none text-[15px] font-semibold text-text focus:outline-none placeholder:text-textMuted"
          />
          <textarea
            ref={textareaRef}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descrição"
            rows={1}
            className="w-full bg-transparent border-none text-[13px] text-text focus:outline-none placeholder:text-textMuted/70 resize-none overflow-hidden min-h-[20px]"
          />

          {/* Subtarefas */}
          {showSubtasks && (
            <div className="mt-2 pl-2 border-l-2 border-border/50 flex flex-col gap-2">
              {subtasks.map((st, i) => {
                const isObj = typeof st === 'object' && st !== null;
                const title = isObj ? st.title : st;
                const completed = isObj ? st.completed : false;
                return (
                  <div key={i} className={`flex items-start gap-2 group ${completed ? 'opacity-50 line-through' : ''}`}>
                    <button type="button" onClick={() => toggleSubtaskCompletion(i)} className="focus:outline-none hover:text-primary transition-colors text-textMuted/50 mt-0.5 shrink-0">
                      {completed ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                    </button>
                    <span className="text-[13px] text-text flex-1 break-words leading-tight">{title}</span>
                    <button type="button" onClick={() => removeSubtask(i)} className="text-textMuted hover:text-red-500 opacity-100 md:opacity-0 group-hover:opacity-100 p-0.5 transition-colors">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
              <div className="flex items-center gap-2 mt-1">
                <input 
                  type="text"
                  value={newSubtask}
                  onChange={(e) => setNewSubtask(e.target.value)}
                  onKeyDown={handleSubtaskKeyDown}
                  placeholder="Nova subtarefa..."
                  className="bg-black/5 dark:bg-[#202020] border border-transparent focus:border-primary/30 rounded px-2.5 py-1.5 text-[13px] focus:outline-none flex-1 text-text placeholder:text-textMuted/60 transition-colors"
                />
                <button 
                  type="button" 
                  onClick={handleAddSubtask}
                  disabled={!newSubtask.trim()}
                  className="bg-primary hover:bg-primary-hover text-white text-[12px] font-semibold px-3 py-1.5 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Adicionar
                </button>
              </div>
            </div>
          )}

          {/* Anexos */}
          {attachmentName && (
            <div className="mt-2 flex items-center gap-2 bg-black/5 w-fit px-2 py-1 rounded text-[12px] text-textMuted">
              <ImageIcon className="w-3.5 h-3.5" />
              <span className="truncate max-w-[150px]">{attachmentName}</span>
              <button type="button" onClick={() => setAttachmentName(null)} className="hover:text-primary ml-1"><X className="w-3 h-3" /></button>
            </div>
          )}
        </div>

        <div className="px-3 pb-3 flex flex-wrap gap-2 relative">
          {/* Data */}
          <div className="relative flex items-center">
            <input 
              type="date" 
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <PillButton icon={Calendar} label={dueDate ? new Date(dueDate).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : "Hoje"} />
          </div>

          {/* Prioridade */}
          <div className="relative">
            <PillButton 
              icon={Flag} 
              label={difficulty === 'hard' ? 'Alta (P1)' : difficulty === 'medium' ? 'Média (P2)' : 'Baixa (P3)'} 
              onClick={() => {
                setShowPriorityMenu(!showPriorityMenu);
                setShowReminderMenu(false); setShowRepeatMenu(false); setShowEmojiMenu(false);
              }}
              active={difficulty !== 'easy'}
            />
            {showPriorityMenu && (
              <div className="absolute top-full left-0 mt-1 w-56 bg-surface border border-border rounded-lg shadow-lg py-1 z-50">
                <button type="button" onClick={() => { setDifficulty('hard'); setShowPriorityMenu(false); }} className="w-full text-left px-3 py-2 text-[13px] hover:bg-black/5 flex items-center gap-2 text-primary">
                  <Flag className="w-4 h-4 fill-current" /> Alta Prioridade (30xp) {difficulty === 'hard' && <Check className="w-3 h-3 ml-auto" />}
                </button>
                <button type="button" onClick={() => { setDifficulty('medium'); setShowPriorityMenu(false); }} className="w-full text-left px-3 py-2 text-[13px] hover:bg-black/5 flex items-center gap-2 text-amber-500">
                  <Flag className="w-4 h-4 fill-current" /> Média Prioridade (20xp) {difficulty === 'medium' && <Check className="w-3 h-3 ml-auto" />}
                </button>
                <button type="button" onClick={() => { setDifficulty('easy'); setShowPriorityMenu(false); }} className="w-full text-left px-3 py-2 text-[13px] hover:bg-black/5 flex items-center gap-2 text-emerald-600">
                  <Flag className="w-4 h-4" /> Baixa Prioridade (10xp) {difficulty === 'easy' && <Check className="w-3 h-3 ml-auto" />}
                </button>
              </div>
            )}
          </div>
          
          {/* Hora e Lembrete */}
          <div className="relative">
            <PillButton 
              icon={Clock} 
              label={taskTime ? `${taskTime} ${reminderOffset !== '0' ? '🔔' : ''}` : "Lembretes"} 
              onClick={() => {
                setShowReminderMenu(!showReminderMenu);
                setShowPriorityMenu(false); setShowRepeatMenu(false); setShowEmojiMenu(false);
              }}
              active={!!taskTime}
            />
            {showReminderMenu && (
              <div className="absolute top-full left-0 mt-1 w-64 bg-surface border border-border rounded-lg shadow-lg p-3 z-50 flex flex-col gap-3">
                <div>
                  <label className="text-[12px] font-bold text-textMuted mb-1 block">Hora da tarefa</label>
                  <input 
                    type="time" 
                    value={taskTime}
                    onChange={(e) => setTaskTime(e.target.value)}
                    className="w-full bg-black/5 border border-transparent rounded-md px-2 py-1.5 text-[13px] text-text focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[12px] font-bold text-textMuted mb-1 block flex items-center gap-1"><Bell className="w-3 h-3"/> Alarme antecipado</label>
                  <select 
                    value={reminderOffset} 
                    onChange={(e) => setReminderOffset(e.target.value)}
                    className="w-full bg-black/5 dark:bg-[#202020] dark:text-white border border-transparent rounded-md px-2 py-1.5 text-[13px] text-text focus:outline-none focus:border-primary cursor-pointer [&>option]:bg-white dark:[&>option]:bg-[#202020]"
                  >
                    <option value="0">Na hora exata</option>
                    <option value="5">5 minutos antes</option>
                    <option value="15">15 minutos antes</option>
                    <option value="30">30 minutos antes</option>
                    <option value="60">1 hora antes</option>
                    <option value="120">2 horas antes</option>
                    <option value="1440">1 dia antes</option>
                  </select>
                </div>
                <button type="button" onClick={() => setShowReminderMenu(false)} className="w-full bg-primary text-white rounded py-1.5 text-[12px] font-bold mt-1 hover:bg-primary-hover">
                  Salvar Lembrete
                </button>
              </div>
            )}
          </div>

          {/* Repetir */}
          <div className="relative">
            <PillButton 
              icon={Repeat} 
              label={repeatLabel || "Repetir"} 
              onClick={() => {
                setShowRepeatMenu(!showRepeatMenu);
                setShowPriorityMenu(false); setShowReminderMenu(false); setShowEmojiMenu(false);
              }} 
              active={!!repeatLabel} 
            />
            {showRepeatMenu && !showCustomRepeat && (
              <div className="absolute top-full left-0 mt-1 w-56 bg-surface border border-border rounded-lg shadow-lg py-1 z-50">
                <button type="button" onClick={() => { setRepeatLabel(''); setShowRepeatMenu(false); }} className="w-full text-left px-3 py-2 text-[13px] hover:bg-black/5 text-textMuted">Não repetir</button>
                <button type="button" onClick={() => { setRepeatLabel('Todo dia'); setShowRepeatMenu(false); }} className="w-full text-left px-3 py-2 text-[13px] hover:bg-black/5 text-text">Todo dia</button>
                <button type="button" onClick={() => { setRepeatLabel('Toda semana'); setShowRepeatMenu(false); }} className="w-full text-left px-3 py-2 text-[13px] hover:bg-black/5 text-text">Toda semana</button>
                <button type="button" onClick={() => { setRepeatLabel('Todo dia útil (Seg - Sex)'); setShowRepeatMenu(false); }} className="w-full text-left px-3 py-2 text-[13px] hover:bg-black/5 text-text">Todo dia útil (Seg - Sex)</button>
                <button type="button" onClick={() => { setRepeatLabel('Todo mês'); setShowRepeatMenu(false); }} className="w-full text-left px-3 py-2 text-[13px] hover:bg-black/5 text-text">Todo mês</button>
                <button type="button" onClick={() => { setRepeatLabel('Todo ano'); setShowRepeatMenu(false); }} className="w-full text-left px-3 py-2 text-[13px] hover:bg-black/5 text-text">Todo ano</button>
                <div className="h-[1px] bg-border my-1"></div>
                <button type="button" onClick={() => { setShowCustomRepeat(true); setShowRepeatMenu(false); }} className="w-full text-left px-3 py-2 text-[13px] hover:bg-black/5 text-text font-medium">Personalizar...</button>
              </div>
            )}
          </div>
          
          {/* Subtarefas */}
          <PillButton 
            icon={ListTodo} 
            label="Subtarefas" 
            onClick={() => {
              setShowSubtasks(!showSubtasks);
              setShowPriorityMenu(false); setShowReminderMenu(false); setShowRepeatMenu(false); setShowEmojiMenu(false);
            }} 
            active={showSubtasks || subtasks.length > 0} 
          />
          
          {/* Fotos */}
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
          <PillButton icon={ImageIcon} label="Fotos" onClick={() => fileInputRef.current?.click()} active={!!attachmentName} />
          
          {/* Emoji */}
          <div className="relative">
            <PillButton 
              icon={Smile} 
              label="Emoji" 
              onClick={() => {
                setShowEmojiMenu(!showEmojiMenu);
                setShowPriorityMenu(false); setShowReminderMenu(false); setShowRepeatMenu(false);
              }} 
            />
            {showEmojiMenu && (
              <div className="absolute top-full left-0 mt-1 bg-surface border border-border rounded-lg shadow-lg p-2 z-50 flex flex-wrap gap-1 w-64">
                {quickEmojis.map(em => (
                  <button key={em} type="button" onClick={() => appendEmoji(em)} className="w-7 h-7 hover:bg-black/10 rounded flex items-center justify-center text-[16px]">
                    {em}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex-1"></div>
          <button type="button" className="p-1.5 rounded border border-border text-textMuted hover:bg-black/5 transition-colors">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>

        <div className="px-3 py-2 border-t border-border bg-black/[0.02] flex items-center justify-between rounded-b-xl">
          <div className="relative flex items-center">
             <select 
               value={listId}
               onChange={(e) => setListId(e.target.value)}
               className="absolute inset-0 w-full h-full opacity-0 cursor-pointer [&>option]:bg-white dark:[&>option]:bg-[#202020] dark:[&>option]:text-white"
             >
               <option value="inbox">Entrada</option>
               {customProjects.map(proj => (
                 <option key={proj.id} value={proj.id}>{proj.name}</option>
               ))}
             </select>
             <button type="button" className="flex items-center gap-1.5 px-2 py-1.5 rounded hover:bg-black/5 text-[13px] font-medium text-text transition-colors">
               <Inbox className="w-4 h-4 text-blue-500" />
               {listId === 'inbox' ? 'Entrada' : customProjects.find(p => p.id === listId)?.name || listId}
               <ChevronDown className="w-3.5 h-3.5 text-textMuted" />
             </button>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-3 py-1.5 text-[13px] font-semibold bg-transparent hover:bg-black/5 rounded-md transition-colors text-text"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="px-3 py-1.5 text-[13px] font-semibold bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-md transition-colors"
            >
              {initialTask ? 'Salvar' : 'Adicionar tarefa'}
            </button>
          </div>
        </div>
      </form>

      {/* Modal Custom Repeat */}
      {showCustomRepeat && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="bg-[#202020] text-[#EEEEEE] rounded-xl shadow-2xl w-[320px] overflow-hidden border border-white/10">
            <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
              <h3 className="font-bold text-[14px]">Repetição personalizada</h3>
              <button type="button" onClick={() => setShowCustomRepeat(false)} className="text-white/50 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-4 space-y-4 text-[13px]">
              <div>
                <label className="font-bold mb-2 block">Com base na:</label>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="base" defaultChecked className="accent-primary" />
                    Data agendada
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="base" className="accent-primary" />
                    Data de conclusão
                  </label>
                </div>
              </div>

              <div>
                <label className="font-bold mb-2 block">Cada</label>
                <div className="flex gap-2">
                  <input 
                    type="number" 
                    min="1" 
                    value={customRepeatFreq} 
                    onChange={e => setCustomRepeatFreq(e.target.value)} 
                    className="w-16 bg-transparent border border-white/20 rounded px-2 py-1 text-white focus:outline-none focus:border-primary" 
                  />
                  <select 
                    value={customRepeatUnit} 
                    onChange={e => setCustomRepeatUnit(e.target.value)} 
                    className="flex-1 bg-transparent border border-white/20 rounded px-2 py-1 text-white focus:outline-none focus:border-primary cursor-pointer [&>option]:bg-[#202020] [&>option]:text-white"
                  >
                    <option value="Dia">Dia</option>
                    <option value="Semana">Semana</option>
                    <option value="Mês">Mês</option>
                    <option value="Ano">Ano</option>
                  </select>
                </div>
              </div>

              {customRepeatUnit === 'Semana' && (
                <div>
                  <label className="font-bold mb-2 block">Repetir nos dias:</label>
                  <div className="flex justify-between gap-1">
                    {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, i) => {
                      const isSelected = customRepeatDays.includes(i);
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => {
                            if (isSelected) setCustomRepeatDays(customRepeatDays.filter(d => d !== i));
                            else setCustomRepeatDays([...customRepeatDays, i]);
                          }}
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold transition-colors ${isSelected ? 'bg-primary text-white' : 'bg-white/10 text-white/60 hover:bg-white/20'}`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <label className="font-bold mb-2 block">Termina em</label>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="ends" 
                      checked={customRepeatEnds === 'Nunca'} 
                      onChange={() => setCustomRepeatEnds('Nunca')} 
                      className="accent-primary" 
                    />
                    Nunca
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="ends" 
                      checked={customRepeatEnds !== 'Nunca'} 
                      onChange={() => setCustomRepeatEnds('No vencimento')} 
                      className="accent-primary" 
                    />
                    No vencimento (incluído)
                  </label>
                </div>
              </div>
            </div>

            <div className="px-4 py-3 flex justify-end gap-2 border-t border-white/10">
              <button type="button" onClick={() => setShowCustomRepeat(false)} className="px-3 py-1.5 rounded bg-white/5 hover:bg-white/10 font-semibold text-[13px]">
                Cancelar
              </button>
              <button type="button" onClick={() => { setRepeatLabel('Personalizado'); setShowCustomRepeat(false); }} className="px-3 py-1.5 rounded bg-primary hover:bg-primary-hover text-white font-semibold text-[13px]">
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
