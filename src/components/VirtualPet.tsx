import { Heart, Zap, Sparkles } from 'lucide-react';

interface VirtualPetProps {
  level: number;
  hp: number;
}

export default function VirtualPet({ level, hp }: VirtualPetProps) {
  // Determine pet stage based on level
  const getStage = () => {
    if (level < 5) return 'egg';
    if (level < 10) return 'baby';
    if (level < 20) return 'teen';
    return 'adult';
  };

  // Determine emotion based on HP
  const getEmotion = () => {
    if (hp <= 20) return 'sad';
    if (hp <= 60) return 'neutral';
    return 'happy';
  };

  const stage = getStage();
  const emotion = getEmotion();

  const getPetName = () => {
    return localStorage.getItem('pet_name') || 'Mascote';
  };

  return (
    <div className="bg-surface border border-border rounded-xl p-2 lg:p-4 flex flex-col items-center relative overflow-hidden shadow-sm group">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
      
      <div className="flex justify-between w-full mb-1 lg:mb-2">
        <span className="text-[10px] lg:text-xs font-bold text-text uppercase tracking-wider">{getPetName()}</span>
        <span className="text-[10px] lg:text-xs font-bold text-primary">Nv. {Math.floor(level/5) + 1}</span>
      </div>
      
      <div className="relative w-12 h-12 lg:w-24 lg:h-24 flex items-center justify-center my-1 lg:my-2">
        {/* Simple Pet rendering using emoji for now, we can make this an SVG if we want later */}
        <div className="text-4xl lg:text-6xl animate-bounce" style={{ animationDuration: hp < 30 ? '3s' : '1.5s' }}>
          {stage === 'egg' && '🥚'}
          {stage === 'baby' && (emotion === 'happy' ? '🐣' : emotion === 'sad' ? '🤒' : '🐥')}
          {stage === 'teen' && (emotion === 'happy' ? '🐉' : emotion === 'sad' ? '🦎' : '🦖')}
          {stage === 'adult' && (emotion === 'happy' ? '🐲' : emotion === 'sad' ? '🐊' : '🐉')}
        </div>
        
        {/* Status Particles */}
        {emotion === 'happy' && <Sparkles className="absolute -top-2 -right-2 text-amber-500 w-5 h-5 animate-pulse" />}
        {emotion === 'sad' && <div className="absolute -top-2 -right-2 text-blue-500 text-sm font-bold">Zzz</div>}
      </div>

      <div className="w-full space-y-2 mt-2 z-10">
        <div className="flex items-center gap-2">
          <Heart className="w-3 h-3 text-red-500" fill="currentColor" />
          <div className="flex-1 h-1.5 bg-black/10 rounded-full overflow-hidden">
            <div className={`h-full ${hp <= 20 ? 'bg-red-500' : 'bg-red-400'}`} style={{ width: `${hp}%` }} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Zap className="w-3 h-3 text-blue-500" fill="currentColor" />
          <div className="flex-1 h-1.5 bg-black/10 rounded-full overflow-hidden">
            <div className="h-full bg-blue-400" style={{ width: `${Math.min(100, (level % 5) * 20)}%` }} />
          </div>
        </div>
      </div>
      
      <p className="text-[10px] text-textMuted text-center mt-2 lg:mt-3 font-medium line-clamp-1 lg:line-clamp-none">
        {hp > 50 ? "Seu pet está saudável e feliz!" : "Seu pet está cansado. Cumpra tarefas para curá-lo!"}
      </p>
    </div>
  );
}
