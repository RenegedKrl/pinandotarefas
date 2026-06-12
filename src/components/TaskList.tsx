import React, { useState, useEffect, useRef } from 'react';
import { Plus, CheckCircle2, Circle, Calendar as CalendarIcon, Flag, MoreHorizontal, GripVertical, Play, Trash2, Search, LayoutGrid, List, ArrowDownAZ, Clock, CalendarDays, ArrowDownUp, X, Copy, FolderInput, Inbox, Hash, Square, CheckSquare } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { scheduleTaskNotification, cancelTaskNotification } from '../lib/NotificationManager';
import type { ViewType } from '../App';
import TaskEditor from './TaskEditor';
import ReportsDashboard from './ReportsDashboard';
import StoreDashboard from './StoreDashboard';
import DailySpin from './DailySpin';
import DailyQuests from './DailyQuests';
import Achievements from './Achievements';
import Tavern from './Tavern';
import HeroProfile from './HeroProfile';
import JourneyMap from './JourneyMap';
import BossBattle from './BossBattle';
import BlackMarket from './BlackMarket';
import Leaderboard from './Leaderboard';
import FocusModal from './FocusModal';
import Grimoire from './Grimoire';
import confetti from 'canvas-confetti';
import { Dialogs } from '../lib/dialogs';

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Task {
  id: string;
  title: string;
  description?: string;
  difficulty: Difficulty;
  completed: boolean;
  due_date: string | null;
  list_id: string;
  created_at?: string;
  extras?: any;
}

interface TaskListProps {
  onTaskChange: (difficulty: Difficulty, isCompleted: boolean) => void;
  userId: string;
  currentView: ViewType;
  isGlobalAdding?: boolean;
  onGlobalAddConsumed?: () => void;
  playerStats?: { level: number; xp: number; hp: number };
  setPlayerStats?: React.Dispatch<React.SetStateAction<{ level: number; xp: number; hp: number }>>;
  coins?: number;
  setCoins?: React.Dispatch<React.SetStateAction<number>>;
  onUpdateCounts?: (counts: { today: number; project_Objetivos: number; project_Casa: number; project_Trabalho: number }) => void;
  onTasksLoaded?: (tasks: Task[]) => void;
}

const getLocalYYYYMMDD = (d: Date) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function TaskList({ 
  onTaskChange, userId, currentView, isGlobalAdding, onGlobalAddConsumed, 
  playerStats, setPlayerStats, coins, setCoins, onUpdateCounts, onTasksLoaded
}: TaskListProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isAdding, setIsAdding] = useState<string | boolean>(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [focusTask, setFocusTask] = useState<Task | null>(null);
  const [damageAlert, setDamageAlert] = useState<{damage: number, count: number, leveledDown: boolean} | null>(null);

  // Armazenar a ordem customizada das tarefas localmente
  const [taskOrder, setTaskOrder] = useState<Record<string, number>>({});
  const [upcomingLayout, setUpcomingLayout] = useState<'board' | 'list'>(() => {
    const saved = localStorage.getItem(`upcoming_layout_${userId}`);
    return (saved === 'board' || saved === 'list') ? saved : 'list';
  });
  const [sortOption, setSortOption] = useState<'custom'|'due_asc'|'alpha_asc'|'priority_desc'|'recent'>(() => {
    const saved = localStorage.getItem(`sort_option_${userId}`);
    return (saved as any) || 'custom';
  });
  const [showSortMenu, setShowSortMenu] = useState(false);

  // Seleção múltipla
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [moveMenuOpen, setMoveMenuOpen] = useState(false);
  const [availableProjects, setAvailableProjects] = useState<{id: string, name: string, color?: string}[]>([]);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wasLongPressRef = useRef(false);

  const toggleSelection = (taskId: string) => {
    setSelectedTaskIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) newSet.delete(taskId);
      else newSet.add(taskId);
      return newSet;
    });
  };

  const handlePointerDown = (taskId: string) => {
    wasLongPressRef.current = false;
    if (selectedTaskIds.size > 0) return;
    longPressTimerRef.current = setTimeout(() => {
      wasLongPressRef.current = true;
      toggleSelection(taskId);
      if (window.navigator && window.navigator.vibrate) window.navigator.vibrate(50);
    }, 500);
  };

  const handlePointerUpOrLeave = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleTaskClick = (taskId: string) => {
    if (wasLongPressRef.current) {
      wasLongPressRef.current = false;
      return;
    }
    if (selectedTaskIds.size > 0) toggleSelection(taskId);
    else setEditingTaskId(taskId);
  };

  const handleBulkComplete = async () => {
    const ids = Array.from(selectedTaskIds);
    let newTasks = [...tasks];
    let hardCompleted = 0;

    for (const t of newTasks) {
      if (ids.includes(t.id)) {
        t.completed = true;
        if (t.difficulty === 'hard') hardCompleted++;
      }
    }
    setTasks(newTasks);
    setSelectedTaskIds(new Set());
    if (onTasksLoaded) onTasksLoaded(newTasks);

    const todayStr = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const lastStreakDate = localStorage.getItem(`hero_streak_date_${userId}`);
    let currentStreak = parseInt(localStorage.getItem(`hero_streak_${userId}`) || '0');
    
    if (lastStreakDate === yesterday) {
      currentStreak++;
      localStorage.setItem(`hero_streak_${userId}`, currentStreak.toString());
      localStorage.setItem(`hero_streak_date_${userId}`, todayStr);
    } else if (lastStreakDate !== todayStr) {
      currentStreak = 1;
      localStorage.setItem(`hero_streak_${userId}`, currentStreak.toString());
      localStorage.setItem(`hero_streak_date_${userId}`, todayStr);
    }
    localStorage.setItem(`did_task_today_${userId}`, todayStr);

    if (hardCompleted > 0 && Math.random() < (0.25 * hardCompleted)) {
      setTimeout(() => {
        Dialogs.alert("🎁 Você encontrou um Baú Raro na sua limpeza em massa! (+50 XP, +30 Moedas)", 'Baú Raro Encontrado', 'success');
        if (setPlayerStats) setPlayerStats(prev => ({ ...prev, xp: prev.xp + 50 }));
        if (setCoins) setCoins(prev => prev + 30);
      }, 1000);
    }

    for (const id of ids) {
      await supabase.from('tasks').update({ completed: true }).eq('id', id);
      cancelTaskNotification(id);
    }
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedTaskIds);
    Dialogs.confirm(`Deseja apagar ${ids.length} tarefa(s)?`, 'Apagar Tarefas', async () => {
      const newTasks = tasks.filter(t => !ids.includes(t.id));
      setTasks(newTasks);
      setSelectedTaskIds(new Set());
      if (onTasksLoaded) onTasksLoaded(newTasks);
      for (const id of ids) {
        await supabase.from('tasks').delete().eq('id', id);
        cancelTaskNotification(id);
      }
    });
  };

  const handleBulkPostpone = async () => {
    const ids = Array.from(selectedTaskIds);
    let newTasks = [...tasks];
    for (const t of newTasks) {
      if (ids.includes(t.id)) {
        const dateObj = t.due_date ? new Date(t.due_date) : new Date();
        dateObj.setDate(dateObj.getDate() + 1);
        t.due_date = dateObj.toISOString();
      }
    }
    setTasks(newTasks);
    setSelectedTaskIds(new Set());
    if (onTasksLoaded) onTasksLoaded(newTasks);
    for (const id of ids) {
      const task = newTasks.find(t => t.id === id);
      if (task) await supabase.from('tasks').update({ due_date: task.due_date }).eq('id', id);
    }
  };

  const loadProjects = () => {
    try {
      const saved = localStorage.getItem(`projects_${userId}`);
      if (saved) setAvailableProjects(JSON.parse(saved));
    } catch(e) {}
  };

  const handleBulkMove = async (projectId: string) => {
    const listId = projectId;
    setTasks(tasks.map(t => selectedTaskIds.has(t.id) ? { ...t, list_id: listId } : t));
    const ids = Array.from(selectedTaskIds);
    await supabase.from('tasks').update({ list_id: listId }).in('id', ids);
    setSelectedTaskIds(new Set());
    setMoveMenuOpen(false);
  };

  const handleBulkDuplicate = async () => {
    Dialogs.confirm(`Deseja duplicar ${selectedTaskIds.size} tarefa(s)?`, 'Duplicar Tarefas', async () => {
      const tasksToDuplicate = tasks.filter(t => selectedTaskIds.has(t.id)).map(t => {
        const copy = { ...t };
        delete (copy as any).id;
        delete (copy as any).created_at;
        copy.title = `${copy.title} (Cópia)`;
        copy.completed = false;
        return copy;
      });

      const { data, error } = await supabase.from('tasks').insert(tasksToDuplicate).select();
      if (error) {
        console.error('Error duplicating tasks in Supabase:', error);
        Dialogs.alert('Erro ao duplicar as tarefas.', 'Erro', 'error');
        return;
      }

      if (data) {
        const newTasks = [...data, ...tasks];
        setTasks(newTasks);
        if (onTasksLoaded) onTasksLoaded(newTasks);
        for (const t of data) {
          scheduleTaskNotification(t);
        }
      }
      setSelectedTaskIds(new Set());
    });
  };

  const handleLayoutChange = (layout: 'board' | 'list') => {
    setUpcomingLayout(layout);
    localStorage.setItem(`upcoming_layout_${userId}`, layout);
  };

  const handleSortChange = (sort: 'custom'|'due_asc'|'alpha_asc'|'priority_desc'|'recent') => {
    setSortOption(sort);
    localStorage.setItem(`sort_option_${userId}`, sort);
    setShowSortMenu(false);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    fetchTasks();
    loadProjects();
    const savedOrder = localStorage.getItem(`task_order_${userId}`);
    if (savedOrder) setTaskOrder(JSON.parse(savedOrder));
  }, [userId]);

  useEffect(() => {
    if (isGlobalAdding) {
      if (currentView === 'upcoming') {
        // Find today's date key to open the editor in today's column
        const todayKey = getLocalYYYYMMDD(new Date());
        setIsAdding(todayKey);
      } else {
        setIsAdding(true);
      }
      if (onGlobalAddConsumed) onGlobalAddConsumed();
    }
  }, [isGlobalAdding, currentView, onGlobalAddConsumed]);

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching tasks from Supabase:', error);
        const localTasks = localStorage.getItem(`tasks_${userId}`);
        if (localTasks) setTasks(JSON.parse(localTasks));
      } else {
        setTasks(data || []);
        if (onTasksLoaded) onTasksLoaded(data || []);
        
        // Damage Check for Overdue Tasks
        if (data && playerStats && setPlayerStats) {
          const today = new Date();
          const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
          
          const overdueTasks = data.filter(t => {
            if (t.completed || !t.due_date) return false;
            const taskDate = new Date(t.due_date);
            const startOfTaskDate = new Date(taskDate.getFullYear(), taskDate.getMonth(), taskDate.getDate()).getTime();
            return startOfTaskDate < startOfToday;
          });

          if (overdueTasks.length > 0) {
            const todayString = getLocalYYYYMMDD(today);
            const lastDamageCheck = localStorage.getItem(`last_damage_check_${userId}`);
            
            if (lastDamageCheck !== todayString) {
              const hasShield = localStorage.getItem(`buff_shield_${userId}`) === 'true';

              if (hasShield) {
                // Consume shield and skip damage
                localStorage.setItem(`last_damage_check_${userId}`, todayString);
                localStorage.removeItem(`buff_shield_${userId}`);
                setDamageAlert({ damage: 0, count: overdueTasks.length, leveledDown: false, shieldUsed: true } as any);
              } else {
                const damage = overdueTasks.length * 10;
                let newHp = playerStats.hp - damage;
                let newLevel = playerStats.level;
                let leveledDown = false;
                
                if (newHp <= 0) {
                  newLevel = Math.max(1, newLevel - 1);
                  newHp = 100;
                  leveledDown = true;
                }
                
                setPlayerStats({...playerStats, hp: newHp, level: newLevel});
                supabase.from('profiles').update({ hp: newHp, level: newLevel }).eq('id', userId).then();
                localStorage.setItem(`last_damage_check_${userId}`, todayString);
                
                setDamageAlert({ damage, count: overdueTasks.length, leveledDown, shieldUsed: false } as any);
              }
            }
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTask = async (taskData: any) => {
    let finalDueDate = null;
    if (taskData.dueDate) {
      finalDueDate = new Date(taskData.dueDate + 'T12:00:00').toISOString();
    }

    if (taskData.id) {
      const extras = {
        subtasks: taskData.subtasks,
        taskTime: taskData.taskTime,
        reminderOffset: taskData.reminderOffset,
        repeatConfig: taskData.repeatConfig,
        attachment: taskData.attachment
      };

      const updatedTask = {
        title: taskData.title,
        description: taskData.description,
        difficulty: taskData.difficulty,
        due_date: finalDueDate,
        list_id: taskData.listId,
        extras: extras
      };
      
      const newTasks = tasks.map(t => t.id === taskData.id ? { ...t, ...updatedTask } as Task : t);
      setTasks(newTasks);
      if (onTasksLoaded) onTasksLoaded(newTasks);
      setEditingTaskId(null);

      const { error } = await supabase.from('tasks').update(updatedTask).eq('id', taskData.id);
      if (error) {
        console.error('Error updating task in Supabase:', error);
      } else {
        scheduleTaskNotification({ id: taskData.id, ...updatedTask });
      }
    } else {
      const extras = {
        subtasks: taskData.subtasks,
        taskTime: taskData.taskTime,
        reminderOffset: taskData.reminderOffset,
        repeatConfig: taskData.repeatConfig,
        attachment: taskData.attachment
      };

      // Criar nova tarefa
      const newTask = {
        id: crypto.randomUUID(),
        title: taskData.title,
        description: taskData.description,
        difficulty: taskData.difficulty,
        completed: false,
        user_id: userId,
        due_date: finalDueDate,
        list_id: taskData.listId,
        created_at: new Date().toISOString(),
        extras: extras
      };

      const updatedTasks = [newTask as any, ...tasks];
      setTasks(updatedTasks);
      if (onTasksLoaded) onTasksLoaded(updatedTasks);
      setIsAdding(false);

      const { error } = await supabase.from('tasks').insert([newTask]);
      if (error) {
        console.error('Error saving to Supabase:', error);
        localStorage.setItem(`tasks_${userId}`, JSON.stringify([newTask, ...tasks]));
      } else {
        scheduleTaskNotification(newTask);
      }
    }
  };

  const toggleTask = async (taskId: string, currentCompleted: boolean, difficulty: Difficulty, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const newCompleted = !currentCompleted;
    const newTasks = tasks.map(t => t.id === taskId ? { ...t, completed: newCompleted } : t);
    setTasks(newTasks);
    if (onTasksLoaded) onTasksLoaded(newTasks);
    
    if (newCompleted) {
      const todayStr = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      const lastStreakDate = localStorage.getItem(`hero_streak_date_${userId}`);
      let currentStreak = parseInt(localStorage.getItem(`hero_streak_${userId}`) || '0');
      
      if (lastStreakDate === yesterday) {
        currentStreak++;
        localStorage.setItem(`hero_streak_${userId}`, currentStreak.toString());
        localStorage.setItem(`hero_streak_date_${userId}`, todayStr);
      } else if (lastStreakDate !== todayStr) {
        currentStreak = 1;
        localStorage.setItem(`hero_streak_${userId}`, currentStreak.toString());
        localStorage.setItem(`hero_streak_date_${userId}`, todayStr);
      }

      localStorage.setItem(`did_task_today_${userId}`, todayStr);

      // Deal Damage to Boss
      const atkPower = parseInt(localStorage.getItem(`attack_power_${userId}`) || '10');
      const diffMult = difficulty === 'hard' ? 3 : difficulty === 'medium' ? 2 : 1;
      const damage = atkPower * diffMult;
      
      const currentBossHp = parseInt(localStorage.getItem(`boss_hp_${userId}`) || '2000');
      if (currentBossHp > 0) {
        localStorage.setItem(`boss_hp_${userId}`, Math.max(0, currentBossHp - damage).toString());
      }

      // Random Loot Drops
      if (difficulty === 'hard' && Math.random() < 0.25) {
        setTimeout(() => {
          alert("🎁 Você encontrou um Baú Raro por completar uma Tarefa Difícil! (+50 XP, +30 Moedas)");
          if (setPlayerStats) setPlayerStats(prev => ({ ...prev, xp: prev.xp + 50 }));
          if (setCoins) setCoins(prev => prev + 30);
        }, 1000);
      }
    }

    onTaskChange(difficulty, newCompleted);

    if (newCompleted) {
      // 🎉 Fire Confetti!
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#DC4C3E', '#F59E0B', '#10B981']
      });

      // 🎵 Play Ding!
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
        oscillator.start(audioCtx.currentTime);
        oscillator.stop(audioCtx.currentTime + 0.5);
      } catch(e) {
        // Ignore audio errors
      }
    }

    const { error } = await supabase.from('tasks').update({ completed: newCompleted }).eq('id', taskId);
    if (error) {
      const updatedTasks = tasks.map(t => t.id === taskId ? { ...t, completed: newCompleted } : t);
      localStorage.setItem(`tasks_${userId}`, JSON.stringify(updatedTasks));
    }

    if (newCompleted) {
      cancelTaskNotification(taskId);
    } else {
      const taskToReschedule = newTasks.find(t => t.id === taskId);
      if (taskToReschedule) scheduleTaskNotification(taskToReschedule);
    }
  };

  const handleDeleteTask = async (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Tem certeza que deseja apagar esta tarefa? Esta ação não pode ser desfeita.')) {
      const newTasks = tasks.filter(t => t.id !== taskId);
      setTasks(newTasks);
      if (onTasksLoaded) onTasksLoaded(newTasks);
      
      const { error } = await supabase.from('tasks').delete().eq('id', taskId);
      if (error) {
        console.error('Error deleting task in Supabase:', error);
        localStorage.setItem(`tasks_${userId}`, JSON.stringify(tasks.filter(t => t.id !== taskId)));
      }
      cancelTaskNotification(taskId);
    }
  };

  const toggleSubtask = async (taskId: string, subtaskIdOrIdx: string | number) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const extras = { ...task.extras };
    if (!extras.subtasks) return;
    
    let subtasks = [...extras.subtasks];
    if (typeof subtaskIdOrIdx === 'number') {
       const oldTitle = subtasks[subtaskIdOrIdx];
       subtasks[subtaskIdOrIdx] = { id: crypto.randomUUID(), title: oldTitle, completed: true };
    } else {
       subtasks = subtasks.map((st: any) => 
         (typeof st === 'object' && st !== null && st.id === subtaskIdOrIdx) 
           ? { ...st, completed: !st.completed } 
           : st
       );
    }
    extras.subtasks = subtasks;
    
    const newTasks = tasks.map(t => t.id === taskId ? { ...t, extras } : t);
    setTasks(newTasks);
    if (onTasksLoaded) onTasksLoaded(newTasks);
    
    const { error } = await supabase.from('tasks').update({ extras }).eq('id', taskId);
    if (error) {
       localStorage.setItem(`tasks_${userId}`, JSON.stringify(newTasks));
    }
  };

  const deleteSubtask = async (taskId: string, subtaskIdOrIdx: string | number) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const extras = { ...task.extras };
    if (!extras.subtasks) return;
    
    let subtasks = [...extras.subtasks];
    if (typeof subtaskIdOrIdx === 'number') {
       subtasks.splice(subtaskIdOrIdx, 1);
    } else {
       subtasks = subtasks.filter((st: any) => typeof st === 'string' || st.id !== subtaskIdOrIdx);
    }
    extras.subtasks = subtasks;
    
    const newTasks = tasks.map(t => t.id === taskId ? { ...t, extras } : t);
    setTasks(newTasks);
    if (onTasksLoaded) onTasksLoaded(newTasks);
    
    const { error } = await supabase.from('tasks').update({ extras }).eq('id', taskId);
    if (error) {
       localStorage.setItem(`tasks_${userId}`, JSON.stringify(newTasks));
    }
  };

  const today = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(today.getDate() - 7);

  const isToday = (dateString: string | null) => {
    if (!dateString) return false;
    const d = new Date(dateString);
    return d.getFullYear() === today.getFullYear() && 
           d.getMonth() === today.getMonth() && 
           d.getDate() === today.getDate();
  };

  const isOverdue = (task: Task, taskTime: string | undefined | null) => {
    if (task.completed || !task.due_date) return false;
    
    const taskDateObj = new Date(task.due_date);
    const dateStr = `${taskDateObj.getFullYear()}-${String(taskDateObj.getMonth()+1).padStart(2,'0')}-${String(taskDateObj.getDate()).padStart(2,'0')}`;
    
    let exactDeadline;
    if (taskTime) {
      exactDeadline = new Date(`${dateStr}T${taskTime}:00`);
    } else {
      exactDeadline = new Date(`${dateStr}T23:59:59`);
    }
    
    return new Date() > exactDeadline;
  };

  useEffect(() => {
    if (onUpdateCounts) {
      onUpdateCounts({
        today: tasks.filter(t => !t.completed && isToday(t.due_date)).length,
        project_Objetivos: tasks.filter(t => !t.completed && t.list_id === 'Objetivos').length,
        project_Casa: tasks.filter(t => !t.completed && t.list_id === 'Casa').length,
        project_Trabalho: tasks.filter(t => !t.completed && t.list_id === 'Trabalho').length,
      });
    }
  }, [tasks, onUpdateCounts]);

  let filteredTasks = tasks.filter(task => {
    // Esconder tarefas completadas há mais de 7 dias
    if (task.completed) {
      if (task.created_at) {
        const createdAt = new Date(task.created_at);
        if (createdAt < sevenDaysAgo) return false;
      } else {
        // Se não tiver data de criação no payload, apenas não mostra
        return false;
      }
    }

    if (currentView === 'inbox') return task.list_id === 'inbox' && !task.due_date;
    if (currentView === 'today') return isToday(task.due_date);
    if (currentView === 'search') {
      if (!searchQuery.trim()) return false;
      const lowerQuery = searchQuery.toLowerCase();
      return task.title.toLowerCase().includes(lowerQuery) || 
             (task.description && task.description.toLowerCase().includes(lowerQuery));
    }
    if (currentView === 'upcoming') {
      if (!task.due_date) return false;
      const d = new Date(task.due_date);
      const taskDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      return taskDate.getTime() >= todayDate.getTime();
    }
    if (currentView.startsWith('project')) {
      const projId = currentView.split('_')[1];
      return task.list_id === projId;
    }
    if (currentView === 'reports') return task.completed;
    return true;
  });

  // Aplicar ordenação selecionada
  filteredTasks.sort((a, b) => {
    if (a.completed && !b.completed) return 1;
    if (!a.completed && b.completed) return -1;

    if (sortOption === 'alpha_asc') {
      return a.title.localeCompare(b.title);
    }
    if (sortOption === 'due_asc') {
      const getExactTime = (task: Task) => {
        if (!task.due_date) return Infinity;
        const taskDateObj = new Date(task.due_date);
        const dateStr = `${taskDateObj.getFullYear()}-${String(taskDateObj.getMonth()+1).padStart(2,'0')}-${String(taskDateObj.getDate()).padStart(2,'0')}`;
        
        let taskTime = null;
        try {
          const extras = task.extras || {};
          taskTime = extras.taskTime;
        } catch(e) {}
        
        if (taskTime) {
          return new Date(`${dateStr}T${taskTime}:00`).getTime();
        }
        return new Date(`${dateStr}T23:59:59`).getTime();
      };
      return getExactTime(a) - getExactTime(b);
    }
    if (sortOption === 'priority_desc') {
      const getPrioVal = (diff: string) => diff === 'hard' ? 3 : diff === 'medium' ? 2 : 1;
      return getPrioVal(b.difficulty) - getPrioVal(a.difficulty);
    }
    if (sortOption === 'recent') {
      const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return timeB - timeA;
    }
    // 'custom' order
    const orderA = taskOrder[a.id] ?? 0;
    const orderB = taskOrder[b.id] ?? 0;
    return orderA - orderB;
  });

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isToday(dateString)) return 'Hoje';
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (date.getFullYear() === tomorrow.getFullYear() && 
        date.getMonth() === tomorrow.getMonth() && 
        date.getDate() === tomorrow.getDate()) return 'Amanhã';
    return date.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const getDifficultyColor = (diff: Difficulty) => {
    switch (diff) {
      case 'easy': return 'text-emerald-600';
      case 'medium': return 'text-amber-500';
      case 'hard': return 'text-primary';
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = filteredTasks.findIndex((t) => t.id === active.id);
      const newIndex = filteredTasks.findIndex((t) => t.id === over.id);

      const reorderedTasks = arrayMove(filteredTasks, oldIndex, newIndex);
      
      const newOrderMap = { ...taskOrder };
      reorderedTasks.forEach((task, index) => {
        newOrderMap[task.id] = index;
      });
      
      setTaskOrder(newOrderMap);
      localStorage.setItem(`task_order_${userId}`, JSON.stringify(newOrderMap));
    }
  };

  const SortableTaskItem = ({ task }: { task: Task }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging
    } = useSortable({ id: task.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      zIndex: isDragging ? 10 : 1,
      opacity: isDragging ? 0.8 : 1,
    };

    const extras = task.extras || {};
    const isGoogleConnected = localStorage.getItem('google_calendar_connected') === 'true';

    const handleAddToCalendar = (e: React.MouseEvent) => {
      e.stopPropagation();
      const title = encodeURIComponent(task.title);
      const details = encodeURIComponent(task.description || 'Tarefa do Gamified To-Do');
      const date = task.due_date ? new Date(task.due_date) : new Date(Date.now() + 86400000);
      const startDate = date.toISOString().replace(/-|:|\.\d\d\d/g, '');
      const endDate = new Date(date.getTime() + 3600000).toISOString().replace(/-|:|\.\d\d\d/g, '');
      const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startDate}/${endDate}&details=${details}`;
      window.open(url, '_blank');
    };

    if (editingTaskId === task.id) {
      return (
        <div className="mb-2">
          <TaskEditor 
            onCancel={() => setEditingTaskId(null)} 
            onSave={handleSaveTask} 
            initialTask={{...task, extras}} 
          />
        </div>
      );
    }

    const subtasks = extras?.subtasks || [];
    const taskTime = extras?.taskTime;

    return (
      <div 
        ref={setNodeRef}
        style={style}
        onPointerDown={() => handlePointerDown(task.id)}
        onPointerUp={handlePointerUpOrLeave}
        onPointerLeave={handlePointerUpOrLeave}
        onContextMenu={(e) => {
          if (window.matchMedia('(pointer: coarse)').matches) {
            e.preventDefault();
          }
        }}
        className={`group flex items-start gap-3 p-2.5 -mx-2.5 rounded-xl border transition-all cursor-pointer relative overflow-hidden ${
          selectedTaskIds.has(task.id) 
            ? 'bg-primary/10 border-primary' 
            : 'border-transparent hover:border-border hover:bg-surface hover:shadow-sm'
        } ${task.completed ? 'opacity-60 bg-black/5' : ''}`}
        onClick={() => handleTaskClick(task.id)}
      >
        <div 
          {...attributes} 
          {...listeners}
          className="mt-0.5 cursor-grab active:cursor-grabbing text-border opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={e => e.stopPropagation()}
        >
          <GripVertical className="w-[18px] h-[18px]" />
        </div>

        <button
          onClick={(e) => toggleTask(task.id, task.completed, task.difficulty, e)}
          className={`mt-0.5 flex-shrink-0 text-textMuted/50 hover:text-textMuted transition-colors`}
        >
          {task.completed ? (
            <CheckCircle2 className="w-[18px] h-[18px] text-textMuted" strokeWidth={1.5} />
          ) : (
            <Circle className={`w-[18px] h-[18px] ${getDifficultyColor(task.difficulty)}`} strokeWidth={1.5} />
          )}
        </button>
        
        <div className="flex-1 min-w-0">
          <p className={`text-[14px] leading-snug ${task.completed ? 'line-through text-textMuted' : 'text-text'}`}>
            {task.title}
          </p>
          {task.description && (
            <p className={`text-[13px] mt-0.5 line-clamp-1 ${task.completed ? 'text-textMuted/70' : 'text-textMuted'}`}>
              {task.description}
            </p>
          )}
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {task.due_date && (
              <div className={`flex items-center gap-1 text-[12px] font-medium ${task.completed ? 'text-textMuted' : (isOverdue(task, taskTime) ? 'text-red-500 font-bold' : isToday(task.due_date) ? 'text-green-600' : 'text-textMuted')}`}>
                <CalendarIcon className="w-3 h-3" strokeWidth={2} />
                {formatDate(task.due_date)} {taskTime && `às ${taskTime}`}
              </div>
            )}
            {extras?.repeatConfig && (
              <div className="flex items-center gap-1 text-[12px] text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3"><path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/></svg>
                {extras.repeatConfig.label}
              </div>
            )}
            {extras?.attachment && (
              <div className="flex items-center gap-1 text-[12px] text-blue-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                {extras.attachment}
              </div>
            )}
            <div className={`flex items-center gap-1 text-[11px] font-medium tracking-wide ${task.completed ? 'text-textMuted' : getDifficultyColor(task.difficulty)}`}>
              <Flag className="w-3 h-3" strokeWidth={2} fill="currentColor" />
              P{task.difficulty === 'hard' ? '1' : task.difficulty === 'medium' ? '2' : '3'}
            </div>
            <div className="text-[11px] text-textMuted ml-1">
              # {task.list_id === 'inbox' ? 'Entrada' : (availableProjects.find(p => p.id === task.list_id)?.name || task.list_id)}
            </div>
          </div>
          {subtasks.length > 0 && !task.completed && (
            <div className="mt-2 space-y-1 pl-1">
              {subtasks.map((st: any, idx: number) => {
                const isObj = typeof st === 'object' && st !== null;
                const title = isObj ? st.title : st;
                const completed = isObj ? st.completed : false;
                return (
                  <div key={isObj ? st.id : idx} className={`flex items-center gap-2 text-[12px] group/subtask transition-all ${completed ? 'text-textMuted/50 line-through' : 'text-textMuted'}`}>
                    <button 
                      onClick={(e) => { e.stopPropagation(); toggleSubtask(task.id, isObj ? st.id : idx); }}
                      className="hover:text-primary transition-colors focus:outline-none"
                    >
                      {completed ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                    </button>
                    <span className="flex-1 truncate">{title}</span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); deleteSubtask(task.id, isObj ? st.id : idx); }}
                      className="ml-auto opacity-0 group-hover/subtask:opacity-100 text-textMuted hover:text-red-500 transition-colors"
                      title="Excluir subtarefa"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        <div className="opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity flex items-center gap-1 mt-1 lg:mt-0" onClick={e => e.stopPropagation()}>
          {!task.completed && (
            <button 
              onClick={() => setFocusTask(task)}
              className="p-1.5 text-textMuted hover:text-primary hover:bg-primary/10 rounded-md transition-colors"
              title="Modo Foco"
            >
              <Play className="w-4 h-4 fill-current" />
            </button>
          )}
          {isGoogleConnected && !task.completed && (
            <button 
              onClick={handleAddToCalendar}
              className="p-1.5 text-textMuted hover:text-blue-500 hover:bg-blue-500/10 rounded-md transition-colors"
              title="Adicionar ao Google Agenda"
            >
              <CalendarIcon className="w-4 h-4" />
            </button>
          )}
          <button 
            onClick={(e) => { e.stopPropagation(); setEditingTaskId(task.id); }}
            className="p-1.5 text-textMuted hover:bg-black/5 rounded-md transition-colors"
            title="Editar Tarefa"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
          <button 
            onClick={(e) => handleDeleteTask(task.id, e)}
            className="p-1.5 text-textMuted hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors"
            title="Apagar Tarefa"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  const renderSortableList = (taskList: Task[]) => (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={taskList.map(t => t.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-0.5">
          {taskList.map((task) => <SortableTaskItem key={task.id} task={task} />)}
        </div>
      </SortableContext>
    </DndContext>
  );

  if (currentView === 'reports') {
    return (
      <ReportsDashboard 
        tasks={tasks} 
        playerStats={playerStats || { level: 1, xp: 0, hp: 100 }} 
      />
    );
  }

  if (currentView === 'store') {
    return (
      <StoreDashboard 
        userId={userId}
        playerStats={playerStats || { level: 1, xp: 0, hp: 100 }}
        setPlayerStats={setPlayerStats || (() => {})}
        coins={coins || 0}
        setCoins={setCoins || (() => {})}
      />
    );
  }

  if (currentView === 'daily_spin') {
    return (
      <DailySpin 
        userId={userId}
        coins={coins || 0}
        setCoins={setCoins || (() => {})}
        setPlayerStats={setPlayerStats || (() => {})}
      />
    );
  }

  if (currentView === 'daily_quests') {
    return (
      <DailyQuests 
        userId={userId}
        tasks={tasks}
        coins={coins || 0}
        setCoins={setCoins || (() => {})}
        setPlayerStats={setPlayerStats || (() => {})}
      />
    );
  }

  if (currentView === 'achievements') {
    return (
      <Achievements 
        tasks={tasks}
        playerStats={playerStats || { level: 1, xp: 0, hp: 100 }}
        userId={userId}
        coins={coins || 0}
      />
    );
  }

  if (currentView === 'tavern') {
    return (
      <Tavern 
        userId={userId}
        coins={coins || 0}
        setCoins={setCoins || (() => {})}
      />
    );
  }

  if (currentView === 'hero_profile') {
    return (
      <HeroProfile 
        playerStats={playerStats || { level: 1, xp: 0, hp: 100 }}
        userId={userId}
      />
    );
  }

  if (currentView === 'journey_map') {
    return (
      <JourneyMap 
        userId={userId}
        tasks={tasks}
      />
    );
  }

  if (currentView === 'boss_battle') {
    return (
      <BossBattle 
        userId={userId}
        coins={coins || 0}
        setCoins={setCoins || (() => {})}
        playerStats={playerStats || { level: 1, xp: 0, hp: 100 }}
        setPlayerStats={setPlayerStats || (() => {})}
      />
    );
  }

  if (currentView === 'black_market') {
    return (
      <BlackMarket 
        userId={userId}
        coins={coins || 0}
        setCoins={setCoins || (() => {})}
      />
    );
  }

  if (currentView === 'leaderboard') {
    return (
      <Leaderboard 
        playerStats={playerStats || { level: 1, xp: 0, hp: 100 }}
        session={{ user: { id: userId, email: '' } }} // Mock session for localstorage
        heroClass={localStorage.getItem(`hero_class_${userId}`)}
      />
    );
  }

  if (currentView === 'grimoire') {
    return <Grimoire userId={userId} />;
  }

  if (currentView === 'filters') {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div>
          <h3 className="font-bold text-primary mb-3 flex items-center gap-2">
            <Flag className="w-4 h-4 fill-current" />
            Prioridade P1 (Difícil)
          </h3>
          {tasks.filter(t => t.difficulty === 'hard' && !t.completed).length === 0 ? (
            <p className="text-textMuted text-sm">Nenhuma tarefa P1.</p>
          ) : (
            renderSortableList(tasks.filter(t => t.difficulty === 'hard' && !t.completed))
          )}
        </div>
        <div>
          <h3 className="font-bold text-amber-500 mb-3 flex items-center gap-2">
            <Flag className="w-4 h-4 fill-current" />
            Prioridade P2 (Média)
          </h3>
          {tasks.filter(t => t.difficulty === 'medium' && !t.completed).length === 0 ? (
            <p className="text-textMuted text-sm">Nenhuma tarefa P2.</p>
          ) : (
            renderSortableList(tasks.filter(t => t.difficulty === 'medium' && !t.completed))
          )}
        </div>
        <div>
          <h3 className="font-bold text-emerald-600 mb-3 flex items-center gap-2">
            <Flag className="w-4 h-4 fill-current" />
            Prioridade P3 (Fácil)
          </h3>
          {tasks.filter(t => t.difficulty === 'easy' && !t.completed).length === 0 ? (
            <p className="text-textMuted text-sm">Nenhuma tarefa P3.</p>
          ) : (
            renderSortableList(tasks.filter(t => t.difficulty === 'easy' && !t.completed))
          )}
        </div>
      </div>
    );
  }

  const groupedTasks = filteredTasks.reduce((groups: any, task) => {
    let dateKey = 'Sem Data';
    if (task.due_date) {
      const d = new Date(task.due_date);
      dateKey = getLocalYYYYMMDD(d);
    }
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(task);
    return groups;
  }, {});

  return (
    <div className="space-y-4 relative">
      {currentView !== 'upcoming' && currentView !== 'reports' && currentView !== 'search' && (
        <div className="flex justify-end mb-2 relative">
          <button 
            onClick={() => setShowSortMenu(!showSortMenu)}
            className="flex items-center gap-2 text-[13px] text-textMuted hover:text-text transition-colors bg-surface px-3 py-1.5 rounded-lg border border-border shadow-sm"
          >
            <ArrowDownUp className="w-4 h-4" />
            {sortOption === 'custom' && 'Personalizado'}
            {sortOption === 'due_asc' && 'Vence Antes'}
            {sortOption === 'alpha_asc' && 'Alfabética'}
            {sortOption === 'priority_desc' && 'Prioridade'}
            {sortOption === 'recent' && 'Recentes'}
          </button>
          
          {showSortMenu && (
            <div className="absolute top-full right-0 mt-2 w-56 bg-surface border border-border rounded-lg shadow-xl z-50 py-1">
              <button onClick={() => handleSortChange('custom')} className={`w-full flex items-center gap-3 px-4 py-2.5 text-[14px] text-left hover:bg-black/5 transition-colors ${sortOption === 'custom' ? 'text-primary font-medium bg-primary/5' : 'text-text'}`}>
                <GripVertical className={`w-4 h-4 ${sortOption === 'custom' ? 'opacity-100' : 'opacity-40'}`} /> Personalizado (Drag)
              </button>
              <button onClick={() => handleSortChange('due_asc')} className={`w-full flex items-center gap-3 px-4 py-2.5 text-[14px] text-left hover:bg-black/5 transition-colors ${sortOption === 'due_asc' ? 'text-primary font-medium bg-primary/5' : 'text-text'}`}>
                <Clock className={`w-4 h-4 ${sortOption === 'due_asc' ? 'opacity-100' : 'opacity-40'}`} /> Vence Antes
              </button>
              <button onClick={() => handleSortChange('alpha_asc')} className={`w-full flex items-center gap-3 px-4 py-2.5 text-[14px] text-left hover:bg-black/5 transition-colors ${sortOption === 'alpha_asc' ? 'text-primary font-medium bg-primary/5' : 'text-text'}`}>
                <ArrowDownAZ className={`w-4 h-4 ${sortOption === 'alpha_asc' ? 'opacity-100' : 'opacity-40'}`} /> Ordem Alfabética
              </button>
              <button onClick={() => handleSortChange('priority_desc')} className={`w-full flex items-center gap-3 px-4 py-2.5 text-[14px] text-left hover:bg-black/5 transition-colors ${sortOption === 'priority_desc' ? 'text-primary font-medium bg-primary/5' : 'text-text'}`}>
                <Flag className={`w-4 h-4 ${sortOption === 'priority_desc' ? 'opacity-100' : 'opacity-40'}`} /> Prioridade Alta
              </button>
              <button onClick={() => handleSortChange('recent')} className={`w-full flex items-center gap-3 px-4 py-2.5 text-[14px] text-left hover:bg-black/5 transition-colors ${sortOption === 'recent' ? 'text-primary font-medium bg-primary/5' : 'text-text'}`}>
                <CalendarDays className={`w-4 h-4 ${sortOption === 'recent' ? 'opacity-100' : 'opacity-40'}`} /> Mais Recentes
              </button>
            </div>
          )}
        </div>
      )}
      {currentView === 'search' && (
        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-textMuted" />
          </div>
          <input
            type="text"
            autoFocus
            className="block w-full pl-10 pr-3 py-3 border border-border rounded-xl leading-5 bg-surface text-text placeholder-textMuted focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
            placeholder="Buscar por nome ou descrição..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      )}
      {loading ? (
        <div className="py-8 text-textMuted animate-pulse text-sm">Carregando tarefas...</div>
      ) : (
        <>
          {currentView === 'search' && filteredTasks.length === 0 && searchQuery.trim() !== '' && (
            <div className="text-center py-10 text-textMuted text-sm">
              Nenhuma tarefa encontrada para "{searchQuery}".
            </div>
          )}
          {currentView === 'search' && searchQuery.trim() === '' && (
            <div className="text-center py-20 text-textMuted text-sm flex flex-col items-center gap-3">
              <Search className="w-8 h-8 opacity-20" />
              Comece a digitar para buscar suas tarefas...
            </div>
          )}
          {currentView === 'upcoming' ? (
            <div className="flex flex-col h-full">
              <div className="flex justify-end mb-4">
                <div className="flex bg-surface border border-border rounded-lg overflow-hidden">
                  <button 
                    onClick={() => handleLayoutChange('board')} 
                    className={`p-1.5 ${upcomingLayout === 'board' ? 'bg-black/5 text-primary' : 'text-textMuted hover:text-text'}`}
                    title="Visualização em Colunas"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleLayoutChange('list')} 
                    className={`p-1.5 ${upcomingLayout === 'list' ? 'bg-black/5 text-primary' : 'text-textMuted hover:text-text'}`}
                    title="Visualização em Lista"
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className={upcomingLayout === 'board' ? "flex gap-6 overflow-x-auto pb-6 custom-scrollbar snap-x" : "flex flex-col gap-8 pb-6"}>
                {Object.keys(groupedTasks).sort((a,b) => {
                if (a === 'Sem Data') return 1;
                if (b === 'Sem Data') return -1;
                return new Date(a + 'T12:00:00').getTime() - new Date(b + 'T12:00:00').getTime();
              }).map(dateKey => {
                let isTdy = false;
                let dayStr = '';
                let weekDay = '';
                let formDateStr = '';

                if (dateKey === 'Sem Data') {
                  dayStr = 'Sem Data';
                } else {
                  const dateObj = new Date(dateKey + 'T12:00:00');
                  formDateStr = dateKey;
                  isTdy = isToday(dateObj.toISOString());
                  dayStr = dateObj.toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' });
                  weekDay = isTdy ? 'Hoje' : dateObj.toLocaleDateString('pt-BR', { weekday: 'short' });
                }
                
                return (
                  <div key={dateKey} className={upcomingLayout === 'board' ? "min-w-[300px] w-[300px] snap-start shrink-0" : "w-full"}>
                    <h3 className="font-bold border-b border-border pb-2 mb-3 text-[13px] flex items-center gap-1">
                      {dayStr} {weekDay && <span className="text-textMuted font-normal ml-1">· {weekDay}</span>}
                    </h3>
                    
                    {renderSortableList(groupedTasks[dateKey])}

                    {isAdding === dateKey ? (
                      <TaskEditor 
                        onCancel={() => setIsAdding(false)}
                        onSave={handleSaveTask}
                        initialDate={formDateStr}
                      />
                    ) : (
                      <button 
                        onClick={() => setIsAdding(dateKey)}
                        className="flex items-center gap-2 text-textMuted hover:text-primary transition-colors mt-2 py-2 -mx-2 px-2 text-[13px] w-full group rounded-lg hover:bg-black/5"
                      >
                        <Plus className="w-4 h-4" />
                        Adicionar tarefa
                      </button>
                    )}
                  </div>
                );
              })}
              </div>
            </div>
          ) : (
            <div className="space-y-0.5">
              {filteredTasks.length === 0 && !isAdding && (
                 <div className="text-center py-16 flex flex-col items-center">
                   <div className="w-24 h-24 mb-4 opacity-50 grayscale bg-[url('https://todoist.b-cdn.net/assets/images/f34fb1a6a57db127fb9ed9f51888ba30.png')] bg-contain bg-no-repeat bg-center"></div>
                   <p className="text-textMuted text-sm mb-4">Nenhuma tarefa por aqui.</p>
                   <button 
                     onClick={() => setIsAdding(true)}
                     className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-md hover:bg-primary-hover transition-colors"
                   >
                     Adicionar tarefa
                   </button>
                 </div>
              )}
              
              {renderSortableList(filteredTasks)}
            </div>
          )}

          {(!isAdding && currentView !== 'upcoming') && (
            <button 
              onClick={() => setIsAdding(true)}
              className="flex items-center gap-2 text-textMuted hover:text-primary transition-colors py-2 -mx-2 px-2 text-[13px] w-full group rounded-lg hover:bg-black/5"
            >
              <div className="w-[18px] h-[18px] rounded-full flex items-center justify-center text-primary transition-colors">
                <Plus className="w-4 h-4" strokeWidth={2.5} />
              </div>
              Adicionar tarefa
            </button>
          )}

          {(isAdding && currentView !== 'upcoming') && (
            <TaskEditor 
              onCancel={() => setIsAdding(false)}
              onSave={handleSaveTask}
              initialDate={currentView === 'today' ? getLocalYYYYMMDD(new Date()) : ''}
              initialListId={currentView === 'project' ? 'project' : 'inbox'}
            />
          )}

          {focusTask && (
            <FocusModal 
              task={focusTask}
              onClose={() => setFocusTask(null)}
              onComplete={() => toggleTask(focusTask.id, false, focusTask.difficulty)}
            />
          )}

          {damageAlert && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
              {(damageAlert as any).shieldUsed ? (
                <div className="bg-surface w-full max-w-sm rounded-2xl shadow-2xl p-6 flex flex-col items-center text-center border-2 border-indigo-500/50 animate-in zoom-in-95 duration-300">
                  <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mb-4">
                    <div className="text-4xl">🛡️</div>
                  </div>
                  <h2 className="text-2xl font-black text-indigo-500 mb-2 uppercase">Escudo Ativado!</h2>
                  <p className="text-text font-medium mb-4">
                    Você deixou <strong className="text-primary">{damageAlert.count} missões</strong> acumularem e perderem o prazo.
                  </p>
                  <p className="text-sm text-textMuted bg-black/10 p-3 rounded-lg mb-6">
                    Seu <strong>Escudo Divino</strong> protegeu você do dano, mas agora foi destruído! Cuidado da próxima vez.
                  </p>
                  <button 
                    onClick={() => setDamageAlert(null)}
                    className="w-full py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold transition-colors"
                  >
                    Ufa! Continuar
                  </button>
                </div>
              ) : (
                <div className="bg-surface w-full max-w-sm rounded-2xl shadow-2xl p-6 flex flex-col items-center text-center border-2 border-red-500/50 animate-in zoom-in-95 duration-300">
                  <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
                    <div className="text-4xl">💀</div>
                  </div>
                  <h2 className="text-2xl font-black text-red-500 mb-2 uppercase">Você sofreu Dano!</h2>
                  <p className="text-text font-medium mb-4">
                    Você deixou <strong className="text-primary">{damageAlert.count} missões</strong> acumularem e perderem o prazo.
                  </p>
                  <div className="bg-red-500/10 text-red-500 px-4 py-2 rounded-lg font-bold text-lg mb-6">
                    - {damageAlert.damage} HP
                  </div>
                  {damageAlert.leveledDown && (
                    <p className="text-sm text-textMuted bg-black/10 p-3 rounded-lg mb-6">
                      Seus pontos de vida chegaram a zero. Você perdeu um Nível como penalidade e seu HP foi restaurado.
                    </p>
                  )}
                  <button 
                    onClick={() => setDamageAlert(null)}
                    className="w-full py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold transition-colors"
                  >
                    Continuar Jornada
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}
      {selectedTaskIds.size > 0 && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-surface border border-border shadow-[0_8px_30px_rgb(0,0,0,0.4)] rounded-2xl px-3 sm:px-6 py-2 sm:py-3 flex items-center gap-2 sm:gap-4 z-[100] animate-in slide-in-from-bottom-5 w-[95vw] sm:w-max overflow-x-auto custom-scrollbar no-scrollbar-on-mobile">
          <span className="text-sm font-bold text-primary whitespace-nowrap bg-primary/10 px-2 sm:px-3 py-1.5 rounded-lg flex items-center gap-1 shrink-0">
            {selectedTaskIds.size} <span className="text-[10px] uppercase tracking-wider font-semibold opacity-70">Sel.</span>
          </span>
          <div className="h-8 w-px bg-border shrink-0"></div>
          
          <button onClick={handleBulkComplete} className="flex flex-col items-center gap-1 text-textMuted hover:text-green-500 transition-colors p-1.5 shrink-0" title="Concluir">
            <CheckCircle2 className="w-5 h-5" />
            <span className="text-[9px] sm:text-[10px] font-bold">Concluir</span>
          </button>
          
          <button onClick={handleBulkPostpone} className="flex flex-col items-center gap-1 text-textMuted hover:text-blue-500 transition-colors p-1.5 shrink-0" title="Adiar para amanhã">
            <CalendarDays className="w-5 h-5" />
            <span className="text-[9px] sm:text-[10px] font-bold">Adiar</span>
          </button>
          
          <div className="relative shrink-0">
            <button 
              onClick={() => {
                if (!moveMenuOpen) loadProjects();
                setMoveMenuOpen(!moveMenuOpen);
              }} 
              className={`flex flex-col items-center gap-1 transition-colors p-1.5 ${moveMenuOpen ? 'text-primary' : 'text-textMuted hover:text-primary'}`} 
              title="Mover"
            >
              <FolderInput className="w-5 h-5" />
              <span className="text-[9px] sm:text-[10px] font-bold">Mover</span>
            </button>
            
            {moveMenuOpen && (
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-surface border border-border shadow-xl rounded-xl w-48 py-2 animate-in zoom-in-95 origin-bottom">
                <div className="px-3 pb-2 text-[10px] font-bold text-textMuted uppercase tracking-wider border-b border-border mb-1">Mover para...</div>
                <button 
                  onClick={() => handleBulkMove('inbox')}
                  className="w-full text-left px-3 py-2 text-sm text-text hover:bg-black/5 flex items-center gap-2"
                >
                  <Inbox className="w-4 h-4 text-blue-500" /> Caixa de Entrada
                </button>
                {availableProjects.map(proj => (
                  <button 
                    key={proj.id}
                    onClick={() => handleBulkMove(proj.id)}
                    className="w-full text-left px-3 py-2 text-sm text-text hover:bg-black/5 flex items-center gap-2"
                  >
                    <Hash className="w-4 h-4" style={{ color: proj.color || '#888' }} /> {proj.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button onClick={handleBulkDuplicate} className="flex flex-col items-center gap-1 text-textMuted hover:text-primary transition-colors p-1.5 shrink-0" title="Duplicar">
            <Copy className="w-5 h-5" />
            <span className="text-[9px] sm:text-[10px] font-bold">Duplicar</span>
          </button>

          <button onClick={handleBulkDelete} className="flex flex-col items-center gap-1 text-textMuted hover:text-red-500 transition-colors p-1.5 shrink-0" title="Excluir">
            <Trash2 className="w-5 h-5" />
            <span className="text-[9px] sm:text-[10px] font-bold">Excluir</span>
          </button>
          
          <div className="h-8 w-px bg-border shrink-0"></div>
          
          <button onClick={() => setSelectedTaskIds(new Set())} className="flex flex-col items-center gap-1 text-textMuted hover:text-text transition-colors p-1.5 shrink-0" title="Cancelar seleção">
            <X className="w-5 h-5" />
            <span className="text-[9px] sm:text-[10px] font-bold">Fechar</span>
          </button>
        </div>
      )}
    </div>
  );
}
