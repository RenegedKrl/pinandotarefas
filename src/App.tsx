import { useEffect, useState } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { LocalNotifications } from '@capacitor/local-notifications';
import { supabase } from './lib/supabase';
import { setupLocalNotifications } from './lib/NotificationManager';
import { syncLocalToCloud } from './lib/syncManager';
import Auth from './components/Auth';
import TaskList from './components/TaskList';
import VirtualPet from './components/VirtualPet';
import ProfileModal from './components/ProfileModal';
import NotificationsPanel from './components/NotificationsPanel';
import ProjectModal from './components/ProjectModal';
import type { CustomProject } from './components/ProjectModal';
import GlobalDialog from './components/GlobalDialog';
import { Dialogs } from './lib/dialogs';
import MobileHub from './components/MobileHub';
import Pomodoro from './components/Pomodoro';
import PomodoroManager from './components/PomodoroManager';
import PetJourney from './components/PetJourney';
import EisenhowerMatrix from './components/EisenhowerMatrix';
import UpdateNotifier from './components/UpdateNotifier';
import { 
  LogOut, 
  Inbox, 
  CheckCircle2,
  Calendar, 
  CalendarDays, 
  LayoutGrid, 
  Hash, 
  Plus, 
  Search, 
  Filter, 
  BarChart2, 
  Settings,
  Bell,
  Moon,
  Sun,
  ShoppingBag,
  Gift,
  Shield,
  Map,
  Award,
  Beer,
  Ghost,
  Target,
  Trophy,
  Menu,
  Swords,
  Timer,
  BookOpen
} from 'lucide-react';

// Gamification calculations
const getXpForNextLevel = (level: number) => level * 100;

export type ViewType = 'inbox' | 'today' | 'upcoming' | 'search' | 'project' | 'project_Objetivos' | 'project_Casa' | 'project_Trabalho' | 'filters' | 'reports' | 'store' | 'daily_spin' | 'daily_quests' | 'achievements' | 'tavern' | 'hero_profile' | 'journey_map' | 'boss_battle' | 'black_market' | 'leaderboard' | 'projects_hub' | 'world_hub' | 'pomodoro' | 'pet_journey' | 'eisenhower' | string;

function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<ViewType>('today');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (!mobile) setIsSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setIsGlobalAdding(false);
  }, [currentView]);

  useEffect(() => {
    try {
      LocalNotifications.addListener('localNotificationReceived', (notification) => {
        // Se o usuário estiver com o app aberto na hora do alarme, vamos forçar um alerta na tela
        alert(`⏰ LEMBRETE!\n\n${notification.title}\n${notification.body}`);
      });
    } catch (e) {
      console.warn("LocalNotifications listener error:", e);
    }
  }, []);

  const [customProjects, setCustomProjects] = useState<CustomProject[]>([
    { id: 'Objetivos', name: 'Objetivos', color: '#f43f5e' },
    { id: 'Casa', name: 'Casa', color: '#10b981' },
    { id: 'Trabalho', name: 'Trabalho', color: '#f59e0b' }
  ]);
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<CustomProject | null>(null);
  
  useEffect(() => {
    if (session?.user?.id) {
      setupLocalNotifications();
      const saved = localStorage.getItem(`projects_${session.user.id}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.length > 0 && typeof parsed[0] === 'string') {
            const migrated = parsed.map((p: string) => ({ id: p, name: p, color: '#f59e0b' }));
            setCustomProjects(migrated);
            localStorage.setItem(`projects_${session.user.id}`, JSON.stringify(migrated));
          } else {
            setCustomProjects(parsed);
          }
        } catch (e) {}
      }
    }
  }, [session]);

  const handleSaveProject = (project: CustomProject) => {
    let newProjects = [...customProjects];
    if (editingProject) {
      newProjects = newProjects.map(p => p.id === project.id ? project : p);
    } else {
      newProjects.push(project);
    }
    setCustomProjects(newProjects);
    if (session?.user?.id) {
      localStorage.setItem(`projects_${session.user.id}`, JSON.stringify(newProjects));
      supabase.from('profiles').update({ custom_projects: newProjects }).eq('id', session.user.id).then();
    }
  };

  const handleDeleteProject = (projectId: string) => {
    const newProjects = customProjects.filter(p => p.id !== projectId);
    setCustomProjects(newProjects);
    if (session?.user?.id) {
      localStorage.setItem(`projects_${session.user.id}`, JSON.stringify(newProjects));
      supabase.from('profiles').update({ custom_projects: newProjects }).eq('id', session.user.id).then();
    }
    if (currentView === `project_${projectId}`) {
      setCurrentView('inbox');
    }
  };

  const [isGlobalAdding, setIsGlobalAdding] = useState(false);
  const [coins, setCoins] = useState(0);
  const [badgeCounts, setBadgeCounts] = useState<Record<string, number>>({ today: 0 });
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetInput, setResetInput] = useState('');
  
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [tasksForNotifications, setTasksForNotifications] = useState<any[]>([]);

  // Profile Customization
  const [displayName, setDisplayName] = useState('');
  const [avatarIcon, setAvatarIcon] = useState('');
  const [auraColor, setAuraColor] = useState('from-primary to-xp');
  const [heroTitle, setHeroTitle] = useState('O Iniciante');
  const [appThemeColor, setAppThemeColor] = useState('#DC4C3E');
  const [appWallpaper, setAppWallpaper] = useState('');
  const [heroBio, setHeroBio] = useState('Um herói em ascensão preparado para organizar o caos e concluir todas as missões!');
  
  // Gamification State
  const [playerStats, setPlayerStats] = useState({
    level: 1,
    xp: 0,
    hp: 100,
  });

  // Theme State
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) return savedTheme === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    document.documentElement.style.setProperty('--color-prim', appThemeColor);
    document.documentElement.style.setProperty('--color-prim-hov', appThemeColor);
  }, [appThemeColor]);

  useEffect(() => {
    if (appWallpaper) {
      document.body.style.backgroundImage = `url(${appWallpaper})`;
      document.body.style.backgroundSize = 'cover';
      document.body.style.backgroundPosition = 'center';
      document.body.style.backgroundAttachment = 'fixed';
    } else {
      document.body.style.backgroundImage = '';
    }
  }, [appWallpaper]);

  // Sistema de Sincronização Automática (A cada 10 segundos)
  useEffect(() => {
    if (!session?.user?.id) return;
    const interval = setInterval(() => {
      syncLocalToCloud(session.user.id, playerStats.xp, playerStats.level, playerStats.hp);
    }, 10000);
    return () => clearInterval(interval);
  }, [session, playerStats]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id);
        const storedCoins = localStorage.getItem(`coins_${session.user.id}`);
        if (storedCoins) setCoins(parseInt(storedCoins));

        setDisplayName(localStorage.getItem(`display_name_${session.user.id}`) || session.user.email?.split('@')[0] || 'Herói');
        setAvatarIcon(localStorage.getItem(`avatar_icon_${session.user.id}`) || session.user.email?.[0].toUpperCase() || 'H');
        setAuraColor(localStorage.getItem(`aura_color_${session.user.id}`) || 'from-primary to-xp');
        setHeroTitle(localStorage.getItem(`hero_title_${session.user.id}`) || 'O Iniciante');
        setAppThemeColor(localStorage.getItem(`app_theme_color_${session.user.id}`) || '#DC4C3E');
        setAppWallpaper(localStorage.getItem(`app_wallpaper_${session.user.id}`) || '');
        setHeroBio(localStorage.getItem(`hero_bio_${session.user.id}`) || 'Um herói em ascensão preparado para organizar o caos e concluir todas as missões!');
      } else {
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id);
        const storedCoins = localStorage.getItem(`coins_${session.user.id}`);
        if (storedCoins) setCoins(parseInt(storedCoins));
        
        setDisplayName(localStorage.getItem(`display_name_${session.user.id}`) || session.user.email?.split('@')[0] || 'Herói');
        setAvatarIcon(localStorage.getItem(`avatar_icon_${session.user.id}`) || session.user.email?.[0].toUpperCase() || 'H');
        setAuraColor(localStorage.getItem(`aura_color_${session.user.id}`) || 'from-primary to-xp');
        setHeroTitle(localStorage.getItem(`hero_title_${session.user.id}`) || 'O Iniciante');
        setAppThemeColor(localStorage.getItem(`app_theme_color_${session.user.id}`) || '#DC4C3E');
        setAppWallpaper(localStorage.getItem(`app_wallpaper_${session.user.id}`) || '');
        setHeroBio(localStorage.getItem(`hero_bio_${session.user.id}`) || 'Um herói em ascensão preparado para organizar o caos e concluir todas as missões!');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Handler do Botão de Voltar Nativo do Android
  useEffect(() => {
    const handleBack = () => {
      // Prioridade 1: Fechar Modais e Menus Laterais
      if (isSidebarOpen) {
        setIsSidebarOpen(false);
        return;
      }
      if (showProfileMenu) {
        setShowProfileMenu(false);
        return;
      }
      if (projectModalOpen) {
        setProjectModalOpen(false);
        return;
      }
      if (isGlobalAdding) {
        setIsGlobalAdding(false);
        return;
      }
      if (showNotifications) {
        setShowNotifications(false);
        return;
      }
      
      // Prioridade 2: Voltar Navegação
      setCurrentView(prevView => {
        // Se estiver em sub-telas do Mundo RPG, volta pro Mundo RPG
        if (['pet_journey', 'boss_battle', 'store', 'black_market', 'daily_spin', 'daily_quests', 'tavern', 'pomodoro', 'grimoire', 'journey_map', 'leaderboard', 'hero_profile'].includes(prevView)) {
          return 'world_hub';
        }
        
        // Se estiver em um projeto específico ou tela de projetos, volta pro projetos hub ou hoje
        if (prevView.startsWith('project_')) {
          return 'projects_hub';
        }
        
        // Se estiver no Hubs principais, volta pro Hoje
        if (prevView === 'world_hub' || prevView === 'projects_hub') {
          return 'today';
        }
        
        // Se estiver em qualquer outra aba que não seja Hoje, volta pro Hoje
        if (prevView !== 'today') {
          return 'today';
        }
        
        // Se já estiver no Hoje e não tiver modal aberto, sai do app
        CapacitorApp.exitApp();
        return prevView;
      });
    };

    const backListener = CapacitorApp.addListener('backButton', handleBack);
    return () => {
      backListener.then(listener => listener.remove());
    };
  }, [projectModalOpen, isGlobalAdding, showNotifications, isSidebarOpen, showProfileMenu]);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (error) {
        const localStats = localStorage.getItem(`profile_${userId}`);
        if (localStats) setPlayerStats(JSON.parse(localStats));
      } else if (data) {
        setPlayerStats({ level: data.level, xp: data.xp, hp: data.hp });
        
        // Sincroniza os novos dados da nuvem para o localStorage (apenas na inicialização)
        if (data.coins !== null) {
          setCoins(data.coins);
          localStorage.setItem(`coins_${userId}`, data.coins.toString());
        }
        if (data.display_name) {
          setDisplayName(data.display_name);
          localStorage.setItem(`display_name_${userId}`, data.display_name);
        }
        if (data.hero_class) {
          setAvatarIcon(data.hero_class);
          localStorage.setItem(`avatar_icon_${userId}`, data.hero_class);
          localStorage.setItem(`hero_class_${userId}`, data.hero_class);
        }
        if (data.hero_title) {
          setHeroTitle(data.hero_title);
          localStorage.setItem(`hero_title_${userId}`, data.hero_title);
        }
        if (data.hero_bio) {
          setHeroBio(data.hero_bio);
          localStorage.setItem(`hero_bio_${userId}`, data.hero_bio);
        }
        if (data.aura_color) {
          setAuraColor(data.aura_color);
          localStorage.setItem(`aura_color_${userId}`, data.aura_color);
        }
        if (data.streak !== null) localStorage.setItem(`hero_streak_${userId}`, data.streak.toString());
        if (data.last_streak_date) localStorage.setItem(`hero_streak_date_${userId}`, data.last_streak_date);
        if (data.boss_hp !== null) localStorage.setItem(`boss_hp_${userId}`, data.boss_hp.toString());
        if (data.custom_projects && Array.isArray(data.custom_projects)) {
          setCustomProjects(data.custom_projects);
          localStorage.setItem(`projects_${userId}`, JSON.stringify(data.custom_projects));
        }
        if (data.app_theme_color) {
          setAppThemeColor(data.app_theme_color);
          localStorage.setItem(`app_theme_color_${userId}`, data.app_theme_color);
        }
        if (data.app_wallpaper) {
          setAppWallpaper(data.app_wallpaper);
          localStorage.setItem(`app_wallpaper_${userId}`, data.app_wallpaper);
        }
        if (data.pet_name) {
          localStorage.setItem(`pet_name_${userId}`, data.pet_name);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskChange = async (difficulty: 'easy' | 'medium' | 'hard', isCompleted: boolean) => {
    let xpBase = 0;
    switch (difficulty) {
      case 'easy': xpBase = 10; break;
      case 'medium': xpBase = 20; break;
      case 'hard': xpBase = 30; break;
    }

    // Double XP Buff Check
    let doubleXpMultiplier = 1;
    const doubleXpBuff = parseInt(localStorage.getItem(`buff_double_xp_${session?.user?.id}`) || '0');
    if (doubleXpBuff > 0 && isCompleted) {
      doubleXpMultiplier = 2;
      localStorage.setItem(`buff_double_xp_${session?.user?.id}`, (doubleXpBuff - 1).toString());
    }

    const xpChange = isCompleted ? xpBase * doubleXpMultiplier : -xpBase;
    const coinsChange = isCompleted ? xpBase : -xpBase;

    setCoins(prev => {
      const newCoins = Math.max(0, prev + coinsChange);
      if (session?.user?.id) localStorage.setItem(`coins_${session.user.id}`, newCoins.toString());
      return newCoins;
    });

    setPlayerStats(prev => {
      let newXp = prev.xp + xpChange;
      let newLevel = prev.level;

      while (newXp >= getXpForNextLevel(newLevel)) {
        newXp -= getXpForNextLevel(newLevel);
        newLevel += 1;
      }

      while (newXp < 0 && newLevel > 1) {
        newLevel -= 1;
        newXp += getXpForNextLevel(newLevel);
      }

      if (newXp < 0 && newLevel === 1) {
        newXp = 0;
      }

      const newStats = { ...prev, xp: newXp, level: newLevel };
      
      if (session?.user) {
        supabase.from('profiles').update({
          xp: newXp,
          level: newLevel,
        }).eq('id', session.user.id).then(({ error }) => {
          if (error) {
             localStorage.setItem(`profile_${session.user.id}`, JSON.stringify(newStats));
          }
        });
      }

      return newStats;
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleResetAccount = () => {
    setShowResetModal(true);
    setResetInput('');
  };

  const handleEnableNotifications = async () => {
    try {
      const permStatus = await LocalNotifications.requestPermissions();
      if (permStatus.display === 'granted') {
        Dialogs.alert('Notificações ativadas com sucesso!', 'Notificações', 'success');
        await LocalNotifications.schedule({
          notifications: [
            {
              title: 'Notificações Ativas!',
              body: 'Tudo pronto. Você será avisado sobre suas tarefas e jornadas.',
              id: 1,
              schedule: { at: new Date(Date.now() + 1000 * 3) }
            }
          ]
        });
      } else {
        Dialogs.alert('Permissão para notificações foi negada.', 'Notificações', 'warning');
      }
    } catch (e) {
      Dialogs.alert('Erro ao configurar notificações (só funciona no celular/APK): ' + e, 'Erro', 'error');
    }
  };

  const confirmResetAccount = async () => {
    if (resetInput !== session.user.email) {
      Dialogs.alert('Email incorreto. O reset foi cancelado de forma segura.', 'Cancelado', 'error');
      setShowResetModal(false);
      return;
    }
    
    // 1. Delete all tasks
    await supabase.from('tasks').delete().eq('user_id', session.user.id);
    
    // 2. Reset profile
    await supabase.from('profiles').update({ level: 1, xp: 0, hp: 100 }).eq('id', session.user.id);
    
    // 3. Clear local storage
    const keys = Object.keys(localStorage);
    for (const key of keys) {
      if (key.includes(session.user.id)) {
        localStorage.removeItem(key);
      }
    }
    
    // Hard refresh
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!session) {
    return <Auth />;
  }

  const xpNeeded = getXpForNextLevel(playerStats.level);
  const xpPercentage = Math.min(100, Math.max(0, (playerStats.xp / xpNeeded) * 100));
  const hpPercentage = Math.min(100, Math.max(0, (playerStats.hp / 100) * 100));

  const NavItem = ({ icon: Icon, label, view, badge, colorClass = "text-textMuted", colorHex, onEdit }: { icon: any, label: string, view: ViewType, badge?: number, colorClass?: string, colorHex?: string, onEdit?: () => void }) => (
    <div className="relative group/nav flex items-center w-full">
      <button 
        onClick={() => {
          setCurrentView(view);
          if (isMobile) setIsSidebarOpen(false);
        }}
        className={`flex items-center justify-between w-full px-3 py-1.5 rounded-md transition-colors text-[15px] ${
          currentView === view 
          ? 'bg-[#FFEDE8] dark:bg-primary/20 text-primary font-medium' 
          : 'hover:bg-black/5 text-text'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <Icon className={`w-[18px] h-[18px] ${currentView === view ? 'text-primary' : (colorHex ? '' : colorClass)}`} style={colorHex ? { color: currentView === view ? undefined : colorHex } : undefined} strokeWidth={1.5} />
          <span>{label}</span>
        </div>
        {badge !== undefined && (
          <span className="text-xs text-textMuted">{badge}</span>
        )}
      </button>
      {onEdit && (
        <button 
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
          className="absolute right-2 opacity-0 group-hover/nav:opacity-100 p-1 hover:bg-black/10 rounded text-textMuted hover:text-text transition-all"
        >
          <div className="w-1 h-1 bg-current rounded-full mb-0.5"></div>
          <div className="w-1 h-1 bg-current rounded-full mb-0.5"></div>
          <div className="w-1 h-1 bg-current rounded-full"></div>
        </button>
      )}
    </div>
  );

  return (
    <div className="bg-background text-text flex h-[100dvh] overflow-hidden font-sans relative">
      {/* Mobile Overlay */}
      {isMobile && isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`bg-sidebar flex flex-col border-r border-border z-50 flex-shrink-0 transition-transform duration-300
          ${isMobile ? 'fixed inset-y-0 left-0 w-[280px] shadow-2xl' : 'w-[280px] relative'}
          ${isMobile && !isSidebarOpen ? '-translate-x-full' : 'translate-x-0'}
      `}>
        
        {/* Profile Section */}
        <div 
          onClick={() => setShowProfileMenu(true)}
          className="p-3 pb-2 flex items-center justify-between group cursor-pointer bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border border-transparent dark:border-white/5 hover:border-border/50 dark:hover:border-white/20 rounded-xl mx-2 mt-2 transition-all relative"
        >
          <div className="flex items-center gap-2 overflow-hidden">
            <div className={`w-6 h-6 rounded-full bg-gradient-to-tr ${auraColor} text-white flex items-center justify-center text-xs font-bold shadow-sm relative shrink-0 bg-cover bg-center`} style={avatarIcon.length > 5 ? { backgroundImage: `url(${avatarIcon})` } : undefined}>
              {avatarIcon.length <= 5 && avatarIcon}
              <div className="absolute -bottom-1 -right-1 bg-surface border border-border text-[8px] text-text font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center">
                {playerStats.level}
              </div>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-semibold text-[13px] truncate">{displayName}</span>
              <span className="text-[10px] uppercase font-bold text-primary tracking-widest leading-none mb-1 truncate" title={heroTitle}>
                {heroTitle}
              </span>
              <div className="flex items-center gap-1">
                <div className="w-12 h-1 bg-black/10 rounded-full overflow-hidden">
                  <div className="h-full bg-hp" style={{ width: `${hpPercentage}%` }}></div>
                </div>
                <div className="w-12 h-1 bg-black/10 rounded-full overflow-hidden">
                  <div className="h-full bg-xp" style={{ width: `${xpPercentage}%` }}></div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={(e) => { e.stopPropagation(); setShowNotifications(!showNotifications); }}
              className="text-textMuted hover:text-primary p-1 rounded-md hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            >
              <Bell className="w-4 h-4" />
            </button>
            <div className="text-textMuted group-hover:text-primary transition-colors p-1 bg-black/5 dark:bg-white/10 rounded-md">
              <Settings className="w-4 h-4" />
            </div>
          </div>
        </div>

        {showNotifications && (
          <NotificationsPanel 
            onClose={() => setShowNotifications(false)}
            userId={session.user.id}
            tasks={tasksForNotifications}
          />
        )}
        
        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto custom-scrollbar">
          
          <button 
            onClick={() => setIsGlobalAdding(true)}
            className="flex items-center gap-2.5 w-full px-3 py-1.5 rounded-md transition-colors text-sm text-primary hover:bg-black/5 mb-2 font-medium"
          >
            <div className="w-[18px] h-[18px] rounded-full bg-primary text-white flex items-center justify-center">
              <Plus className="w-3.5 h-3.5" strokeWidth={3} />
            </div>
            Adicionar tarefa
          </button>

          <NavItem icon={Search} label="Buscar" view="search" />
          <NavItem icon={Inbox} label="Entrada" view="inbox" colorClass="text-blue-500" />
          <NavItem icon={Calendar} label="Hoje" view="today" badge={badgeCounts.today > 0 ? badgeCounts.today : undefined} colorClass="text-green-600" />
          <NavItem icon={CalendarDays} label="Em breve" view="upcoming" colorClass="text-purple-500" />
          <NavItem icon={Filter} label="Filtros e Etiquetas" view="filters" colorClass="text-orange-500" />
          <NavItem icon={BarChart2} label="Relatórios" view="reports" colorClass="text-gray-500" />
          <NavItem icon={LayoutGrid} label="Matriz de Eisenhower" view="eisenhower" colorClass="text-indigo-500" />
          <NavItem icon={Timer} label="Pomodoro" view="pomodoro" colorClass="text-red-500" />
          <NavItem icon={Award} label="Conquistas" view="achievements" colorClass="text-yellow-500" />
          
          <div className="pt-5 pb-1 px-3 text-[13px] font-semibold text-textMuted flex items-center justify-between group cursor-pointer hover:bg-black/5 rounded-md">
            Minha Jornada
          </div>
          <NavItem icon={Shield} label="Meu Herói" view="hero_profile" colorClass="text-purple-500" />
          <NavItem icon={BookOpen} label="Grimório" view="grimoire" colorClass="text-indigo-500" />
          <NavItem icon={Map} label="Mapa de Aventuras" view="journey_map" colorClass="text-green-500" />
          <NavItem icon={Trophy} label="Arena dos Heróis" view="leaderboard" colorClass="text-yellow-500" />

          <div className="pt-5 pb-1 px-3 text-[13px] font-semibold text-textMuted flex items-center justify-between group cursor-pointer hover:bg-black/5 rounded-md">
            Mercado & Eventos
          </div>
          <NavItem icon={ShoppingBag} label="A Loja" view="store" colorClass="text-amber-500" />
          <NavItem icon={Ghost} label="O Contrabandista" view="black_market" colorClass="text-purple-500" />
          <NavItem icon={Swords} label="Raid do Chefe" view="boss_battle" colorClass="text-red-500" />
          <NavItem icon={Beer} label="A Taverna" view="tavern" colorClass="text-orange-500" />
          <NavItem icon={Gift} label="Roleta Diária" view="daily_spin" colorClass="text-purple-500" />
          <NavItem icon={Target} label="Desafios Diários" view="daily_quests" colorClass="text-rose-500" />
          
          <div className="pt-5 pb-1 px-3 text-[13px] font-semibold text-textMuted flex items-center justify-between group cursor-pointer hover:bg-black/5 rounded-md">
            Meus projetos
            <div className="flex gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
              <button onClick={() => { setEditingProject(null); setProjectModalOpen(true); }} className="p-0.5 hover:bg-black/10 rounded text-textMuted hover:text-text transition-colors">
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          {customProjects.map((proj) => (
             <NavItem key={proj.id} icon={Hash} label={proj.name} view={`project_${proj.id}` as ViewType} badge={badgeCounts[`project_${proj.id}`] > 0 ? badgeCounts[`project_${proj.id}`] : undefined} colorHex={proj.color} onEdit={() => { setEditingProject(proj); setProjectModalOpen(true); }} />
          ))}
        </nav>

        <div className="px-3 pb-2 mt-auto">
          <VirtualPet 
            level={playerStats.level} 
            hp={playerStats.hp} 
            onClick={() => {
              setCurrentView('pet_journey');
            }} 
          />
        </div>

        <div className="p-3 border-t border-border flex flex-col gap-1">
          <button 
            onClick={handleEnableNotifications}
            className="flex items-center gap-2.5 w-full px-3 py-1.5 rounded-md text-textMuted hover:text-text hover:bg-black/5 transition-colors text-[15px]"
          >
            <Bell className="w-[18px] h-[18px]" strokeWidth={1.5} />
            <span>Ativar Notificações</span>
          </button>
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="flex items-center gap-2.5 w-full px-3 py-1.5 rounded-md text-textMuted hover:text-text hover:bg-black/5 transition-colors text-sm"
          >
            {isDarkMode ? <Sun className="w-[18px] h-[18px]" strokeWidth={1.5} /> : <Moon className="w-[18px] h-[18px]" strokeWidth={1.5} />}
            <span>{isDarkMode ? 'Tema Claro' : 'Tema Escuro'}</span>
          </button>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2.5 w-full px-3 py-1.5 rounded-md text-textMuted hover:text-text hover:bg-black/5 transition-colors text-sm"
          >
            <LogOut className="w-[18px] h-[18px]" strokeWidth={1.5} />
            <span>Sair</span>
          </button>
          <button 
            onClick={handleResetAccount}
            className="flex items-center gap-2.5 w-full px-3 py-1.5 rounded-md text-red-500 hover:bg-red-500/10 transition-colors text-sm font-semibold mt-4"
          >
            <span>Zerar Conta (Reset)</span>
          </button>
        </div>
      </aside>

      {showProfileMenu && (
        <ProfileModal 
          session={session}
          playerStats={playerStats}
          onClose={() => setShowProfileMenu(false)}
          onLogout={handleLogout}
          onReset={handleResetAccount}
          displayName={displayName}
          setDisplayName={setDisplayName}
          avatarIcon={avatarIcon}
          setAvatarIcon={setAvatarIcon}
          auraColor={auraColor}
          setAuraColor={setAuraColor}
          heroTitle={heroTitle}
          setHeroTitle={setHeroTitle}
          appThemeColor={appThemeColor}
          setAppThemeColor={setAppThemeColor}
          appWallpaper={appWallpaper}
          setAppWallpaper={setAppWallpaper}
          heroBio={heroBio}
          setHeroBio={setHeroBio}
        />
      )}

      <ProjectModal
        isOpen={projectModalOpen}
        onClose={() => setProjectModalOpen(false)}
        onSave={handleSaveProject}
        onDelete={handleDeleteProject}
        initialProject={editingProject}
      />

      <GlobalDialog />
      <PomodoroManager 
        setPlayerStats={setPlayerStats}
        setCoins={setCoins}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-[100dvh] pb-16 lg:pb-0 overflow-hidden bg-background">
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="max-w-[800px] w-full mx-auto p-4 md:p-8 lg:px-12 lg:py-10">
            <header className="mb-6 flex items-center gap-3">
              {isMobile && currentView !== 'projects_hub' && currentView !== 'world_hub' && (
                <button 
                  onClick={() => setIsSidebarOpen(true)}
                  className="p-2 -ml-2 rounded-lg hover:bg-black/5 text-text transition-colors lg:hidden"
                >
                  <Menu className="w-6 h-6" />
                </button>
              )}
              <div className="flex items-end gap-2">
                <h1 className="text-[26px] font-bold text-text leading-none">
                {currentView === 'inbox' && 'Entrada'}
                {currentView === 'today' && 'Hoje'}
                {currentView === 'upcoming' && 'Em breve'}
                {currentView === 'filters' && 'Filtros e Etiquetas'}
                {currentView === 'reports' && 'Relatórios'}
                {currentView === 'store' && 'A Loja'}
                {currentView === 'daily_spin' && 'Roleta da Sorte'}
                {currentView === 'daily_quests' && 'Desafios Diários'}
                {currentView === 'achievements' && 'Conquistas'}
                {currentView === 'tavern' && 'A Taverna'}
                {currentView === 'hero_profile' && 'Perfil do Herói'}
                {currentView === 'journey_map' && 'A Jornada'}
                {currentView === 'boss_battle' && 'Raid do Chefe'}
                {currentView === 'black_market' && 'Beco Obscuro'}
                {currentView === 'leaderboard' && 'Arena dos Heróis'}
                {currentView === 'projects_hub' && 'Meus Projetos'}
                {currentView === 'world_hub' && 'Mundo RPG'}
                {currentView === 'grimoire' && 'Grimório'}
                {currentView === 'pomodoro' && 'Pomodoro'}
                {currentView === 'pet_journey' && 'Jornada do Mascote'}
                {currentView === 'eisenhower' && 'Matriz de Eisenhower'}
                {currentView.startsWith('project_') && currentView.replace('project_', '')}
              </h1>
              {currentView === 'today' && (
                <span className="text-xs text-textMuted font-medium mb-1">
                  {badgeCounts.today || 0} tarefa{badgeCounts.today !== 1 ? 's' : ''}
                </span>
              )}
              </div>
            </header>

            {(currentView === 'world_hub' || currentView === 'projects_hub') ? (
              <MobileHub 
                type={currentView === 'world_hub' ? 'world' : 'projects'} 
                setCurrentView={setCurrentView} 
                customProjects={customProjects} 
                badgeCounts={badgeCounts} 
                onAddProject={() => { setEditingProject(null); setProjectModalOpen(true); }}
                onEditProject={(proj) => { setEditingProject(proj); setProjectModalOpen(true); }}
              />
            ) : currentView === 'pomodoro' ? (
              <Pomodoro 
                onBack={() => setCurrentView('world_hub')}
              />
            ) : currentView === 'pet_journey' ? (
              <PetJourney 
                playerStats={playerStats}
                onBack={() => setCurrentView('world_hub')}
              />
            ) : currentView === 'eisenhower' ? (
              <EisenhowerMatrix userId={session.user.id} />
            ) : (
              <TaskList 
                onTaskChange={handleTaskChange} 
                userId={session.user.id} 
                currentView={currentView}
                isGlobalAdding={isGlobalAdding}
                onGlobalAddConsumed={() => setIsGlobalAdding(false)}
                playerStats={playerStats}
                setPlayerStats={setPlayerStats}
                coins={coins}
                setCoins={setCoins}
                onUpdateCounts={setBadgeCounts}
                onTasksLoaded={setTasksForNotifications}
              />
            )}
          </div>
        </div>

        {/* Bottom Navigation for Mobile */}
        {isMobile && (
          <nav className="fixed bottom-0 left-0 right-0 h-16 bg-surface border-t border-border flex items-center justify-around px-2 z-[90]">
            <button onClick={() => setCurrentView('today')} className={`flex flex-col items-center justify-center w-16 h-full gap-1 ${currentView === 'inbox' || currentView === 'today' ? 'text-primary' : 'text-textMuted'}`}>
              <CheckCircle2 className="w-6 h-6" />
              <span className="text-[10px] font-bold">Tarefas</span>
            </button>
            <button onClick={() => setCurrentView('projects_hub')} className={`flex flex-col items-center justify-center w-16 h-full gap-1 ${currentView === 'projects_hub' || currentView.startsWith('project_') ? 'text-primary' : 'text-textMuted'}`}>
              <Hash className="w-6 h-6" />
              <span className="text-[10px] font-bold">Projetos</span>
            </button>
            <button onClick={() => setCurrentView('world_hub')} className={`flex flex-col items-center justify-center w-16 h-full gap-1 ${currentView === 'world_hub' ? 'text-primary' : 'text-textMuted'}`}>
              <Swords className="w-6 h-6" />
              <span className="text-[10px] font-bold">Mundo</span>
            </button>
            <button onClick={() => setCurrentView('hero_profile')} className={`flex flex-col items-center justify-center w-16 h-full gap-1 ${currentView === 'hero_profile' ? 'text-primary' : 'text-textMuted'}`}>
              <Shield className="w-6 h-6" />
              <span className="text-[10px] font-bold">Herói</span>
            </button>
            <button onClick={() => setIsSidebarOpen(true)} className="flex flex-col items-center justify-center w-16 h-full gap-1 text-textMuted">
              <Menu className="w-6 h-6" />
              <span className="text-[10px] font-bold">Menu</span>
            </button>
          </nav>
        )}

        {/* Floating Action Button */}
        <button
          onClick={() => setIsGlobalAdding(true)}
          className={`fixed right-6 lg:right-10 w-14 h-14 bg-primary text-white rounded-full flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.2)] hover:scale-110 active:scale-95 transition-all z-40 hover:bg-primary-hover ${isMobile ? 'bottom-20' : 'bottom-6 lg:bottom-10'}`}
          title="Nova Tarefa"
        >
          <Plus className="w-6 h-6" strokeWidth={2.5} />
        </button>
      </main>

      {/* Reset Account Modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-surface w-full max-w-md rounded-2xl shadow-2xl p-6 border-2 border-red-500/50 animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold text-red-500 mb-4 flex items-center gap-2">
              ⚠️ ATENÇÃO PERIGO ⚠️
            </h2>
            <p className="text-text mb-4 text-[15px] leading-relaxed font-medium">
              Isso vai apagar todas as tarefas, moedas, conquistas, xp, nível e o seu mascote. <strong className="text-red-500">NÃO TEM VOLTA.</strong>
            </p>
            <p className="text-textMuted mb-2 text-[14px]">
              Para confirmar o reset, digite exatamente o seu email da conta:<br/>
              <strong className="text-text">{session.user.email}</strong>
            </p>
            <input 
              type="text" 
              value={resetInput} 
              onChange={e => setResetInput(e.target.value)} 
              className="w-full bg-black/5 border border-border rounded-xl px-4 py-3 text-text focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors mb-6"
              placeholder="Digite seu email..."
              autoFocus
            />
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setShowResetModal(false)}
                className="px-5 py-2.5 rounded-xl border border-border text-text hover:bg-black/5 font-semibold transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmResetAccount}
                disabled={resetInput !== session.user.email}
                className="px-5 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold transition-all shadow-md active:scale-95"
              >
                Zerar Conta
              </button>
            </div>
          </div>
        </div>
      )}

      <UpdateNotifier />
    </div>
  );
}

export default App;
