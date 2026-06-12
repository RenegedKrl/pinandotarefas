import { useState } from 'react';
import { Shield, Wand2, Heart, Target as TargetIcon, Zap, Flame, Egg, Sparkles, Ghost } from 'lucide-react';

interface HeroProfileProps {
  playerStats: { level: number; xp: number; hp: number };
  userId: string;
}

const CLASSES = [
  { id: 'mage', name: 'Mago Supremo', icon: Wand2, img: '/assets/mage.png', color: '#8B5CF6', shadow: 'rgba(139, 92, 246, 0.5)' },
  { id: 'knight', name: 'Cavaleiro', icon: Shield, img: '/assets/knight.png', color: '#3B82F6', shadow: 'rgba(59, 130, 246, 0.5)' },
  { id: 'support', name: 'Curandeiro', icon: Heart, img: '/assets/support.png', color: '#10B981', shadow: 'rgba(16, 185, 129, 0.5)' },
  { id: 'archer', name: 'Arqueiro', icon: TargetIcon, img: '/assets/archer.png', color: '#F59E0B', shadow: 'rgba(245, 158, 11, 0.5)' },
];

export default function HeroProfile({ playerStats, userId }: HeroProfileProps) {
  const [heroClass, setHeroClass] = useState<string | null>(localStorage.getItem(`hero_class_${userId}`));
  const [streak] = useState(() => {
    let s = parseInt(localStorage.getItem(`hero_streak_${userId}`) || '0');
    if (s === 0) {
      const journeyStep = parseInt(localStorage.getItem(`journey_step_${userId}`) || '1');
      if (journeyStep > 1) {
        s = journeyStep;
        localStorage.setItem(`hero_streak_${userId}`, s.toString());
      } else {
        const todayStr = new Date().toISOString().split('T')[0];
        if (localStorage.getItem(`did_task_today_${userId}`) === todayStr) {
          s = 1;
          localStorage.setItem(`hero_streak_${userId}`, '1');
          localStorage.setItem(`hero_streak_date_${userId}`, todayStr);
        }
      }
    }
    return s;
  });

  const heroTitle = localStorage.getItem(`hero_title_${userId}`) || 'O Iniciante';
  const heroBio = localStorage.getItem(`hero_bio_${userId}`) || 'Um herói em ascensão preparado para organizar o caos e concluir todas as missões!';
  const displayName = localStorage.getItem(`display_name_${userId}`) || 'Herói';

  const handleSelectClass = (classId: string) => {
    setHeroClass(classId);
    localStorage.setItem(`hero_class_${userId}`, classId);
  };

  const getXpForNextLevel = (level: number) => level * 100;
  const xpNeeded = getXpForNextLevel(playerStats.level);
  const xpPercentage = Math.min(100, Math.max(0, (playerStats.xp / xpNeeded) * 100));

  const selectedClass = CLASSES.find(c => c.id === heroClass) || CLASSES[0];

  const getMascot = () => {
    if (playerStats.level < 5) return { name: 'Ovo Misterioso', icon: Egg, color: '#f59e0b', desc: 'Choca no Nv. 5' };
    if (playerStats.level < 15) return { name: 'Slime Companheiro', icon: Ghost, color: '#10B981', desc: 'Evolui no Nv. 15' };
    return { name: 'Espírito Ancestral', icon: Sparkles, color: '#8B5CF6', desc: 'Mascote Supremo' };
  };
  const mascot = getMascot();

  if (!heroClass) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500 pb-20">
        <div className="text-center">
          <h2 className="text-3xl font-black text-text mb-2">Escolha sua Classe</h2>
          <p className="text-textMuted">Qual caminho de aura você irá trilhar na sua jornada de produtividade?</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {CLASSES.map(c => (
            <div 
              key={c.id}
              onClick={() => handleSelectClass(c.id)}
              className="bg-surface border border-border p-6 rounded-2xl cursor-pointer hover:scale-105 transition-all shadow-sm hover:shadow-xl group"
              style={{ '--hover-color': c.color } as React.CSSProperties}
            >
              <div className="aspect-square w-full rounded-xl mb-4 overflow-hidden relative">
                <img src={c.img} alt={c.name} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                <div className="absolute bottom-4 left-4 flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white">
                    <c.icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-xl text-white">{c.name}</h3>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Pokémon GO Style Arc calculation
  const radius = 120;
  const circumference = Math.PI * radius; // Half circle
  const dashoffset = circumference - (xpPercentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center animate-in fade-in zoom-in-95 duration-500 pb-20">
      <div className="w-full flex justify-between items-center mb-8 bg-surface p-4 border border-border rounded-xl">
        <div>
          <h2 className="font-bold text-lg text-text">Perfil do Herói</h2>
          <p className="text-sm text-textMuted">Status e Mascotes</p>
        </div>
        <button 
          onClick={() => setHeroClass(null)}
          className="text-sm font-semibold text-textMuted hover:text-text px-4 py-2 rounded-lg bg-black/5 transition-colors"
        >
          Trocar Classe
        </button>
      </div>

      <div className="w-full flex justify-center gap-4 mb-8">
        <div className="flex flex-col items-center bg-surface border border-border p-4 rounded-2xl flex-1 max-w-[150px]">
          <Flame className="w-8 h-8 text-orange-500 mb-2 animate-pulse" />
          <span className="text-2xl font-black text-text">{streak}</span>
          <span className="text-xs font-bold text-textMuted uppercase tracking-wider">Ofensiva</span>
        </div>
        <div className="flex flex-col items-center bg-surface border border-border p-4 rounded-2xl flex-1 max-w-[150px]">
          <mascot.icon className="w-8 h-8 mb-2" style={{ color: mascot.color }} />
          <span className="text-sm font-bold text-text text-center leading-tight">{mascot.name}</span>
          <span className="text-[10px] font-bold text-textMuted uppercase tracking-wider text-center mt-1">{mascot.desc}</span>
        </div>
      </div>

      {/* Pokemon GO Style Character Display */}
      <div className="relative w-full max-w-[400px] flex flex-col items-center mt-10">
        
        {/* XP Arc (Half Circle) */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-[20%] w-[320px] h-[160px] overflow-hidden pointer-events-none">
          <svg className="w-[320px] h-[320px] transform rotate-180" viewBox="0 0 300 300">
            {/* Background Arc */}
            <path
              d="M 30,150 A 120,120 0 0,1 270,150"
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="20"
              strokeLinecap="round"
            />
            {/* Foreground Arc */}
            <path
              d="M 30,150 A 120,120 0 0,1 270,150"
              fill="none"
              stroke={selectedClass.color}
              strokeWidth="20"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashoffset}
              className="transition-all duration-1000 ease-out drop-shadow-lg"
              style={{ filter: `drop-shadow(0 0 8px ${selectedClass.color})` }}
            />
          </svg>
        </div>

        {/* Level Badge placed at the top center of the arc */}
        <div className="absolute -top-[45px] left-1/2 -translate-x-1/2 z-10 flex flex-col items-center">
          <div className="w-14 h-14 rounded-full bg-surface border-4 border-background flex items-center justify-center shadow-xl" style={{ borderColor: selectedClass.color }}>
            <span className="font-black text-2xl" style={{ color: selectedClass.color }}>{playerStats.level}</span>
          </div>
        </div>

        {/* Character Image with "Farming Aura" animation */}
        <div className="relative z-0 mt-8">
          <style>
            {`
              @keyframes float-aura {
                0% { transform: translateY(0px); filter: drop-shadow(0 0 15px ${selectedClass.shadow}); }
                50% { transform: translateY(-10px); filter: drop-shadow(0 0 35px ${selectedClass.shadow}); }
                100% { transform: translateY(0px); filter: drop-shadow(0 0 15px ${selectedClass.shadow}); }
              }
              .animate-aura {
                animation: float-aura 4s ease-in-out infinite;
              }
            `}
          </style>
          
          <div className="w-64 h-64 rounded-full overflow-hidden border-4 border-black/10 relative z-10 bg-black/40">
            <img 
              src={selectedClass.img} 
              alt={selectedClass.name}
              className="w-full h-full object-cover animate-aura"
            />
          </div>
          
          {/* Base shadow effect */}
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-48 h-8 bg-black/40 blur-xl rounded-[100%]"></div>
        </div>

        {/* Stats and Info */}
        <div className="mt-8 text-center space-y-4 w-full">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-widest" style={{ color: selectedClass.color, textShadow: `0 0 20px ${selectedClass.shadow}` }}>
              {displayName}
            </h1>
            <p className="text-lg font-bold text-text uppercase opacity-80 mt-1">
              {heroTitle}
            </p>
          </div>
          
          <div className="bg-surface/50 border border-border p-4 rounded-xl text-textMuted text-sm italic shadow-inner">
            "{heroBio}"
          </div>

          <div className="pt-2">
            <p className="text-lg font-bold text-text mb-2">
              {playerStats.xp} / {xpNeeded} XP
            </p>
            <div className="flex items-center justify-center gap-2 text-textMuted bg-black/10 px-4 py-2 rounded-full font-medium w-max mx-auto">
              <Zap className="w-4 h-4 text-yellow-500" />
              Classe: {selectedClass.name}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
