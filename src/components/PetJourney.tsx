import { Heart, Sparkles, Star, ChevronLeft } from 'lucide-react';

interface PetJourneyProps {
  playerStats: { level: number; xp: number; hp: number };
  onBack: () => void;
}

export default function PetJourney({ playerStats, onBack }: PetJourneyProps) {
  const getStageInfo = (level: number) => {
    if (level < 5) return { stage: 'Ovo Misterioso', desc: 'Seu mascote ainda está dormindo. Continue completando tarefas para chocá-arlo!', nextStageAt: 5, icon: '🥚', color: 'from-slate-400 to-slate-500' };
    if (level < 10) return { stage: 'Bebê', desc: 'Ele acabou de nascer! Está aprendendo sobre produtividade com você.', nextStageAt: 10, icon: '🐣', color: 'from-emerald-400 to-emerald-600' };
    if (level < 20) return { stage: 'Jovem Aventureiro', desc: 'Crescendo rápido! Agora ele já tem energia para explorar.', nextStageAt: 20, icon: '🦅', color: 'from-blue-400 to-blue-600' };
    return { stage: 'Companheiro Lendário', desc: 'Uma criatura majestosa. O laço de vocês é inquebrável!', nextStageAt: 50, icon: '🐉', color: 'from-purple-500 to-fuchsia-600' };
  };

  const info = getStageInfo(playerStats.level);
  const petName = localStorage.getItem('pet_name') || 'Seu Mascote';

  const progressToNextStage = Math.min(100, (playerStats.level / info.nextStageAt) * 100);

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300 pb-16">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-textMuted hover:text-text transition-colors self-start mb-2"
      >
        <ChevronLeft className="w-5 h-5" />
        <span className="font-semibold">Voltar para o Mundo</span>
      </button>

      <div className={`w-full rounded-3xl bg-gradient-to-br ${info.color} p-1`}>
        <div className="bg-surface/90 backdrop-blur-md w-full h-full rounded-[23px] p-6 sm:p-10 flex flex-col items-center text-center">
          <div className="w-32 h-32 sm:w-40 sm:h-40 bg-black/10 dark:bg-white/10 rounded-full flex items-center justify-center text-7xl sm:text-8xl mb-6 shadow-inner relative">
            <span className="drop-shadow-lg animate-bounce-slow">{info.icon}</span>
            <div className="absolute -bottom-2 -right-2 bg-surface rounded-full p-2 shadow-lg border border-border flex items-center gap-1 text-xs font-bold text-red-500">
              <Heart className="w-3 h-3 fill-current" /> {playerStats.hp}%
            </div>
          </div>
          
          <h2 className="text-3xl font-black text-text mb-2 tracking-tight">{petName}</h2>
          <p className="text-primary font-bold uppercase tracking-widest text-sm mb-4">{info.stage}</p>
          
          <p className="text-textMuted max-w-md text-[15px] leading-relaxed mb-8">
            {info.desc}
          </p>

          <div className="w-full max-w-md bg-black/5 dark:bg-white/5 rounded-2xl p-5 border border-border shadow-inner">
            <div className="flex items-center justify-between text-xs font-bold text-textMuted mb-2 uppercase tracking-wider">
              <span>Nível Atual: {playerStats.level}</span>
              <span>Próxima Evolução: Nvl {info.nextStageAt}</span>
            </div>
            <div className="w-full h-4 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden shadow-inner">
              <div 
                className={`h-full bg-gradient-to-r ${info.color} transition-all duration-1000 ease-out relative`}
                style={{ width: `${progressToNextStage}%` }}
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-surface border border-border rounded-2xl p-5 flex items-start gap-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-full bg-yellow-500/10 text-yellow-500 flex items-center justify-center shrink-0">
            <Star className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-text text-lg">Amizade</h4>
            <p className="text-sm text-textMuted leading-relaxed">
              Quanto mais tarefas você conclui e mais alto o seu nível, mais próximo você fica do seu mascote.
            </p>
          </div>
        </div>
        <div className="bg-surface border border-border rounded-2xl p-5 flex items-start gap-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-text text-lg">Evolução</h4>
            <p className="text-sm text-textMuted leading-relaxed">
              O mascote evolui nos níveis 5, 10 e 20. Cada evolução muda sua aparência e status!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
