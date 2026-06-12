import { useEffect, useState } from 'react';
import { Map, Flag, MapPin, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';

interface JourneyMapProps {
  userId: string;
  tasks: any[];
}

// A simple snake-like layout generation for the map nodes
const generateMapNodes = (totalNodes: number) => {
  const nodes = [];
  let x = 50; // starts at 50%
  let direction = 1; // 1 for right, -1 for left
  
  for (let i = 0; i < totalNodes; i++) {
    nodes.push({ id: i + 1, x });
    
    // Zig-zag logic
    x += 25 * direction;
    if (x > 80) {
      x = 80;
      direction = -1;
    } else if (x < 20) {
      x = 20;
      direction = 1;
    }
  }
  return nodes;
};

const TOTAL_NODES = 50;
const MAP_NODES = generateMapNodes(TOTAL_NODES);

export default function JourneyMap({ userId, tasks }: JourneyMapProps) {
  const [currentStep, setCurrentStep] = useState(parseInt(localStorage.getItem(`journey_step_${userId}`) || '1'));
  const [lastAdvance, setLastAdvance] = useState(localStorage.getItem(`last_journey_date_${userId}`));

  useEffect(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    
    const didTaskToday = localStorage.getItem(`did_task_today_${userId}`) === todayStr;

    if (didTaskToday && lastAdvance !== todayStr) {
      // Advance step!
      const nextStep = Math.min(currentStep + 1, TOTAL_NODES);
      setCurrentStep(nextStep);
      setLastAdvance(todayStr);
      
      localStorage.setItem(`journey_step_${userId}`, nextStep.toString());
      localStorage.setItem(`last_journey_date_${userId}`, todayStr);

      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#10B981', '#3B82F6', '#F59E0B']
      });
    }
  }, [tasks, userId, currentStep, lastAdvance]);

  return (
    <div className="pb-20 animate-in fade-in duration-500">
      <div className="bg-surface border border-border p-6 rounded-xl flex items-center justify-between shadow-sm relative overflow-hidden mb-8">
        <div className="absolute -right-10 -top-10 opacity-5 pointer-events-none">
          <Map className="w-64 h-64 text-text" />
        </div>
        
        <div>
          <h2 className="text-sm font-semibold text-textMuted uppercase tracking-wider mb-1">Caminho do Sucesso</h2>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
              <Map className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text">A Jornada</h1>
              <p className="text-sm text-textMuted">Cumpra pelo menos 1 tarefa por dia para avançar no mapa.</p>
            </div>
          </div>
        </div>

        <div className="text-right flex flex-col items-end">
          <h2 className="text-sm font-semibold text-textMuted uppercase tracking-wider mb-1">Progresso</h2>
          <div className="flex items-center gap-2">
            <Flag className="w-5 h-5 text-green-500" />
            <span className="text-3xl font-black text-text">{currentStep}</span>
            <span className="text-lg font-medium text-textMuted">/ {TOTAL_NODES}</span>
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <div className="relative w-full max-w-md py-10 flex flex-col items-center">
          {/* Path Line */}
          <div className="absolute top-0 bottom-0 left-1/2 w-2 bg-black/5 -translate-x-1/2 rounded-full z-0"></div>

          {/* Map Nodes reversed to show progress going upwards like Duolingo */}
          {[...MAP_NODES].reverse().map((node) => {
            const isCompleted = node.id < currentStep;
            const isCurrent = node.id === currentStep;

            return (
              <div 
                key={node.id} 
                className="relative w-full h-24 flex items-center z-10"
              >
                {/* Connector line (horizontal curve effect) */}
                <div 
                  className="absolute left-1/2 top-1/2 h-2 -translate-y-1/2 z-0"
                  style={{
                    width: Math.abs(50 - node.x) + '%',
                    left: Math.min(50, node.x) + '%',
                    backgroundColor: isCompleted ? '#10B981' : 'rgba(0,0,0,0.05)',
                    borderTopLeftRadius: node.x < 50 ? '20px' : '0',
                    borderBottomLeftRadius: node.x < 50 ? '20px' : '0',
                    borderTopRightRadius: node.x > 50 ? '20px' : '0',
                    borderBottomRightRadius: node.x > 50 ? '20px' : '0',
                  }}
                />

                <div 
                  className={`absolute top-1/2 -translate-y-1/2 transition-all duration-500 flex flex-col items-center ${isCurrent ? 'scale-125 z-20' : 'z-10'}`}
                  style={{ left: `${node.x}%`, transform: 'translate(-50%, -50%)' }}
                >
                  {isCurrent && (
                    <div className="absolute -top-10 bg-primary text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-lg flex items-center gap-1 animate-bounce whitespace-nowrap">
                      Você está aqui! <MapPin className="w-3 h-3" />
                      {/* Arrow down */}
                      <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-primary rotate-45"></div>
                    </div>
                  )}

                  <div 
                    className={`w-16 h-16 rounded-full border-4 flex items-center justify-center shadow-lg transition-colors ${
                      isCompleted ? 'bg-green-500 border-green-600 text-white' :
                      isCurrent ? 'bg-primary border-primary-hover text-white ring-4 ring-primary/30' :
                      'bg-surface border-border text-textMuted'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-8 h-8" />
                    ) : isCurrent ? (
                      <span className="text-xl font-black">{node.id}</span>
                    ) : (
                      <span className="text-xl font-bold opacity-50">{node.id}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
