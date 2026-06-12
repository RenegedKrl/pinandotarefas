import { Timer, Settings2, Play, Pause, Square, Trophy, Coins, ChevronLeft } from 'lucide-react';
import { usePomodoroStore } from '../lib/pomodoroStore';

interface PomodoroProps {
  onBack: () => void;
}

export default function Pomodoro({ onBack }: PomodoroProps) {
  const { 
    mode, timeLeft, isActive, totalFocusTime, currentSession,
    workTime, shortBreakTime, longBreakTime, sessionsBeforeLongBreak,
    setMode, setTimeLeft, setIsActive, setSettings
  } = usePomodoroStore();



  const startTimer = () => {
    if (mode === 'idle') {
      setMode('work');
      setTimeLeft(workTime * 60);
    }
    setIsActive(true);
  };

  const pauseTimer = () => {
    setIsActive(false);
  };

  const stopTimer = () => {
    // A recompensa é processada pelo PomodoroManager agora quando clicam no botão da notificação ou aqui.
    // Mas pera, o Manager só escuta o botão da notificação. 
    // Vou colocar a checagem da recompensa aqui E lá ou chamar uma função global.
    // Pra simplificar, vou deixar o Pomodoro.tsx apenas mandar setIsActive(false), e a lógica da recompensa global fica no Manager?
    // Na verdade vou jogar um evento global pro Manager!
    // Ou simplesmente despachar a mudança de estado e deixar o Manager reagir?
    // Melhor exportar a logica de reward ou colocar no Manager.
    window.dispatchEvent(new CustomEvent('pomodoro:stop'));
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getModeTitle = () => {
    switch(mode) {
      case 'work': return 'Tempo de Foco';
      case 'shortBreak': return 'Pausa Curta';
      case 'longBreak': return 'Pausa Longa';
      default: return 'Pronto para começar';
    }
  };

  return (
    <div className="pb-20 animate-in fade-in duration-500">
      <div className="bg-surface border border-border p-6 rounded-xl flex items-center justify-between shadow-sm relative overflow-hidden mb-8">
        <div className="absolute -right-10 -top-10 opacity-5 pointer-events-none">
          <Timer className="w-64 h-64 text-red-500" />
        </div>
        
        <div className="flex-1">
          <button onClick={onBack} className="mb-4 text-textMuted hover:text-text flex items-center gap-1 font-medium transition-colors">
            <ChevronLeft className="w-4 h-4" /> Voltar
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center">
              <Timer className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text">Santuário do Foco</h1>
              <p className="text-sm text-textMuted">Complete horas de foco para ganhar XP e Ouro.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Timer Area */}
        <div className="lg:col-span-2 bg-surface border border-border rounded-2xl p-8 flex flex-col items-center justify-center shadow-sm relative overflow-hidden">
          <h2 className={`text-xl font-bold uppercase tracking-widest mb-6 ${
            mode === 'work' ? 'text-red-500' : mode === 'idle' ? 'text-textMuted' : 'text-blue-500'
          }`}>
            {getModeTitle()}
          </h2>

          <div className="text-[6rem] sm:text-[8rem] font-black text-text leading-none mb-8 font-mono tabular-nums tracking-tighter shadow-sm">
            {formatTime(timeLeft)}
          </div>

          <div className="flex items-center gap-4">
            {!isActive ? (
              <button onClick={startTimer} className="w-20 h-20 rounded-full bg-primary hover:bg-primary-hover flex items-center justify-center text-white shadow-lg shadow-primary/20 transition-transform active:scale-95">
                <Play className="w-8 h-8 ml-2" />
              </button>
            ) : (
              <button onClick={pauseTimer} className="w-20 h-20 rounded-full bg-amber-500 hover:bg-amber-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/20 transition-transform active:scale-95">
                <Pause className="w-8 h-8" />
              </button>
            )}
            
            {(isActive || mode !== 'idle') && (
              <button onClick={stopTimer} className="w-16 h-16 rounded-full bg-surface border-2 border-border hover:bg-black/5 flex items-center justify-center text-text shadow-sm transition-transform active:scale-95">
                <Square className="w-6 h-6 fill-current" />
              </button>
            )}
          </div>
          
          <div className="mt-8 flex gap-2">
            {Array.from({ length: sessionsBeforeLongBreak }).map((_, i) => (
              <div key={i} className={`w-3 h-3 rounded-full ${i < currentSession ? 'bg-red-500' : 'bg-border'}`}></div>
            ))}
          </div>

          {totalFocusTime > 0 && (
            <div className="mt-6 text-sm font-medium text-textMuted bg-black/5 px-4 py-2 rounded-lg border border-border">
              Foco total hoje: <span className="text-primary font-bold">{Math.floor(totalFocusTime / 60)} min</span>
            </div>
          )}
        </div>

        {/* Settings Area */}
        <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-text mb-6 flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-textMuted" /> Configurações do Ritual
          </h3>

          <div className="space-y-6">
            <div>
              <label className="flex justify-between text-sm font-bold text-textMuted mb-2">
                <span>Tempo de Foco</span>
                <span className="text-text">{workTime} min</span>
              </label>
              <input 
                type="range" min="1" max="90" value={workTime} 
                onChange={(e) => {
                  setSettings({ workTime: parseInt(e.target.value) });
                  if (mode === 'idle') setTimeLeft(parseInt(e.target.value) * 60);
                }}
                disabled={mode !== 'idle'}
                className="w-full accent-red-500"
              />
            </div>

            <div>
              <label className="flex justify-between text-sm font-bold text-textMuted mb-2">
                <span>Pausa Curta</span>
                <span className="text-text">{shortBreakTime} min</span>
              </label>
              <input 
                type="range" min="1" max="30" value={shortBreakTime} 
                onChange={(e) => setSettings({ shortBreakTime: parseInt(e.target.value) })}
                disabled={mode !== 'idle'}
                className="w-full accent-blue-500"
              />
            </div>

            <div>
              <label className="flex justify-between text-sm font-bold text-textMuted mb-2">
                <span>Pausa Longa</span>
                <span className="text-text">{longBreakTime} min</span>
              </label>
              <input 
                type="range" min="5" max="60" value={longBreakTime} 
                onChange={(e) => setSettings({ longBreakTime: parseInt(e.target.value) })}
                disabled={mode !== 'idle'}
                className="w-full accent-blue-600"
              />
            </div>

            <div>
              <label className="flex justify-between text-sm font-bold text-textMuted mb-2">
                <span>Ciclos p/ Pausa Longa</span>
                <span className="text-text">{sessionsBeforeLongBreak}</span>
              </label>
              <input 
                type="range" min="1" max="10" value={sessionsBeforeLongBreak} 
                onChange={(e) => setSettings({ sessionsBeforeLongBreak: parseInt(e.target.value) })}
                disabled={mode !== 'idle'}
                className="w-full accent-primary"
              />
            </div>
          </div>

          <div className="mt-8 bg-black/5 p-4 rounded-xl border border-border">
            <h4 className="font-bold text-sm text-text flex items-center gap-2 mb-2">
              <Trophy className="w-4 h-4 text-yellow-500" /> Recompensas
            </h4>
            <p className="text-xs text-textMuted leading-relaxed">
              Complete ao menos <strong className="text-text">1 hora de foco total</strong> antes de parar para ganhar:
            </p>
            <div className="flex gap-4 mt-3">
              <span className="flex items-center gap-1 text-sm font-bold text-primary bg-primary/10 px-2 py-1 rounded-lg">
                250 XP/hr
              </span>
              <span className="flex items-center gap-1 text-sm font-bold text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded-lg">
                <Coins className="w-3 h-3" /> 100/hr
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
