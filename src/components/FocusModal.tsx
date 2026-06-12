import { useState, useEffect } from 'react';
import { X, Play, Pause, CheckCircle2, CloudRain, Flame, Music, VolumeX } from 'lucide-react';
import type { Task } from './TaskList';

interface FocusModalProps {
  task: Task;
  onClose: () => void;
  onComplete: () => void;
}

export default function FocusModal({ task, onClose, onComplete }: FocusModalProps) {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [ambientSound, setAmbientSound] = useState<'none' | 'rain' | 'fire' | 'lofi'>('none');
  
  const audioUrls = {
    rain: 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c1539c.mp3',
    fire: 'https://cdn.pixabay.com/download/audio/2021/08/09/audio_b2f91b72e5.mp3',
    lofi: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf589.mp3'
  };

  useEffect(() => {
    let interval: any = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      // Play a sound or show a notification
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  // Handle Audio Playback
  useEffect(() => {
    const audio = document.getElementById('ambient-audio') as HTMLAudioElement;
    if (audio) {
      if (isActive && ambientSound !== 'none') {
        audio.play().catch(e => console.log('Audio play failed:', e));
      } else {
        audio.pause();
      }
    }
  }, [isActive, ambientSound]);

  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  const minutes = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const seconds = (timeLeft % 60).toString().padStart(2, '0');

  const progress = ((25 * 60 - timeLeft) / (25 * 60)) * 100;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-surface w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-border flex flex-col">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold text-text text-lg">Modo Foco</h2>
          <button onClick={onClose} className="p-1.5 text-textMuted hover:bg-black/5 rounded-md transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 flex flex-col items-center">
          <p className="text-center text-text font-medium mb-6 line-clamp-2">
            Mantenha o foco em:<br/>
            <span className="text-primary font-bold text-lg">{task.title}</span>
          </p>

          <div className="relative w-48 h-48 mb-8 flex items-center justify-center">
            {/* Background ring */}
            <svg className="absolute inset-0 w-full h-full -rotate-90">
              <circle
                cx="96" cy="96" r="88"
                className="stroke-border fill-none"
                strokeWidth="12"
              />
              <circle
                cx="96" cy="96" r="88"
                className="stroke-primary fill-none transition-all duration-1000 ease-linear"
                strokeWidth="12"
                strokeDasharray="553"
                strokeDashoffset={553 - (553 * progress) / 100}
                strokeLinecap="round"
              />
            </svg>
            <div className="relative z-10 text-5xl font-bold tracking-tighter text-text">
              {minutes}:{seconds}
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 mb-8 w-full">
            <button onClick={() => setAmbientSound('none')} className={`p-2 rounded-lg transition-colors ${ambientSound === 'none' ? 'bg-primary text-white' : 'bg-surface border border-border text-textMuted hover:text-text'}`} title="Sem Som">
              <VolumeX className="w-5 h-5" />
            </button>
            <button onClick={() => setAmbientSound('rain')} className={`p-2 rounded-lg transition-colors ${ambientSound === 'rain' ? 'bg-blue-500 text-white' : 'bg-surface border border-border text-textMuted hover:text-blue-500'}`} title="Chuva">
              <CloudRain className="w-5 h-5" />
            </button>
            <button onClick={() => setAmbientSound('fire')} className={`p-2 rounded-lg transition-colors ${ambientSound === 'fire' ? 'bg-orange-500 text-white' : 'bg-surface border border-border text-textMuted hover:text-orange-500'}`} title="Fogueira">
              <Flame className="w-5 h-5" />
            </button>
            <button onClick={() => setAmbientSound('lofi')} className={`p-2 rounded-lg transition-colors ${ambientSound === 'lofi' ? 'bg-purple-500 text-white' : 'bg-surface border border-border text-textMuted hover:text-purple-500'}`} title="Música Lofi">
              <Music className="w-5 h-5" />
            </button>
          </div>
          
          <audio id="ambient-audio" src={ambientSound !== 'none' ? audioUrls[ambientSound] : ''} loop />

          <div className="flex items-center gap-4 w-full">
            <button
              onClick={toggleTimer}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-lg transition-colors ${
                isActive 
                  ? 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20' 
                  : 'bg-primary text-white hover:bg-primary-hover shadow-md hover:shadow-lg'
              }`}
            >
              {isActive ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current" />}
              {isActive ? 'Pausar' : 'Focar'}
            </button>
            
            <button
              onClick={() => {
                onComplete();
                onClose();
              }}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-lg bg-emerald-500 text-white hover:bg-emerald-600 shadow-md hover:shadow-lg transition-colors"
            >
              <CheckCircle2 className="w-6 h-6" />
              Concluir
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
