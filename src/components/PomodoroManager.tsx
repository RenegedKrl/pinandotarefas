import { useEffect, useRef } from 'react';
import { usePomodoroStore } from '../lib/pomodoroStore';
import { ForegroundService } from '@capawesome-team/capacitor-android-foreground-service';
import { Capacitor } from '@capacitor/core';
import { Dialogs } from '../lib/dialogs';
import confetti from 'canvas-confetti';

export default function PomodoroManager({ setPlayerStats, setCoins }: any) {
  const { 
    mode, timeLeft, isActive, currentSession,
    workTime, shortBreakTime, longBreakTime, sessionsBeforeLongBreak,
    setMode, setTimeLeft, setIsActive, setCurrentSession, setTotalFocusTime 
  } = usePomodoroStore();

  const isNative = Capacitor.isNativePlatform();
  const intervalRef = useRef<number | null>(null);
  const serviceStartedRef = useRef(false);

  // Timer logic
  useEffect(() => {
    if (isActive && timeLeft > 0) {
      intervalRef.current = window.setInterval(() => {
        setTimeLeft(timeLeft - 1);
        if (mode === 'work') {
          setTotalFocusTime((prev: number) => prev + 1);
        }
      }, 1000);
    } else if (isActive && timeLeft <= 0) {
      handlePhaseComplete();
    }
    
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, timeLeft, mode]);

  const handlePhaseComplete = async () => {
    setIsActive(false);
    try {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.play();
    } catch(e) {}

    if (mode === 'work') {
      const nextSession = currentSession + 1;
      setCurrentSession(nextSession);
      
      if (nextSession >= sessionsBeforeLongBreak) {
        setMode('longBreak');
        setTimeLeft(longBreakTime * 60);
        setCurrentSession(0);
        Dialogs.alert('Sessão de foco concluída! Hora de uma pausa longa.', 'Pomodoro', 'success');
      } else {
        setMode('shortBreak');
        setTimeLeft(shortBreakTime * 60);
        Dialogs.alert('Sessão concluída! Faça uma pausa curta.', 'Pomodoro', 'info');
      }
    } else {
      setMode('work');
      setTimeLeft(workTime * 60);
      Dialogs.alert('Pausa terminada! Hora de voltar ao foco.', 'Pomodoro', 'warning');
    }
    
    if (isNative && serviceStartedRef.current) {
      await ForegroundService.stopForegroundService();
      serviceStartedRef.current = false;
    }
  };

  // Foreground Service Sync
  useEffect(() => {
    if (!isNative) return;

    const syncService = async () => {
      if (!isActive) {
        if (serviceStartedRef.current) {
          await ForegroundService.stopForegroundService();
          serviceStartedRef.current = false;
        }
        return;
      }

      const title = mode === 'work' ? 'Pomodoro: Foco' : 'Pomodoro: Pausa';
      const body = mode === 'work' ? 'Sessão em andamento. Mantenha o foco!' : 'Pausa em andamento. Relaxe um pouco.';

      const channelId = 'pomodoro_silent_channel_v2';

      if (!serviceStartedRef.current) {
        try {
          await ForegroundService.createNotificationChannel({
            id: channelId,
            name: 'Pomodoro Timer',
            description: 'Canal silencioso',
            importance: 2
          });
        } catch (e) {
          console.warn('Could not create channel', e);
        }
      }

      const options = {
        id: 1999,
        title,
        body,
        smallIcon: 'ic_stat_pomodoro',
        serviceType: 1073741824, // specialUse type
        silent: true, 
        notificationChannelId: channelId,
        buttons: [
          { title: 'Pausar', id: 1 },
          { title: 'Parar', id: 2 }
        ]
      };

      try {
        if (!serviceStartedRef.current) {
          const permStatus = await ForegroundService.requestPermissions();
          if (permStatus.display !== 'granted') {
            console.warn('Permissão negada para Foreground Service');
          }
          await ForegroundService.startForegroundService(options);
          serviceStartedRef.current = true;
          console.log("FOREGROUND SERVICE STARTED");
        } else {
          await ForegroundService.updateForegroundService(options);
          console.log("FOREGROUND SERVICE UPDATED");
        }
      } catch (e: any) {
        console.error('Foreground Service Error', e);
      }
    };

    syncService();
  }, [isActive, mode, isNative]);

  // Handle Stop Logic globally
  useEffect(() => {
    const handleStop = () => {
      const state = usePomodoroStore.getState();
      state.setIsActive(false);
      
      // Check for rewards
      const focusedHours = state.totalFocusTime / 3600;
      if (focusedHours >= 1) {
        const hoursInt = Math.floor(focusedHours);
        const xpReward = hoursInt * 250;
        const coinReward = hoursInt * 100;

        setPlayerStats((prev: any) => ({ ...prev, xp: prev.xp + xpReward }));
        setCoins((prev: number) => prev + coinReward);
        
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 }
        });
        
        Dialogs.alert(`Parabéns! Você focou por ${hoursInt} hora(s) e ganhou ${xpReward} XP e ${coinReward} Moedas!`, 'Recompensa de Foco', 'success');
      } else if (state.totalFocusTime > 0) {
        Dialogs.alert(`Você focou por ${Math.floor(state.totalFocusTime / 60)} minutos. Foque por pelo menos 1 hora total para ganhar recompensas!`, 'Fim da Sessão', 'info');
      }

      state.setMode('idle');
      state.setTimeLeft(state.workTime * 60);
      state.setCurrentSession(0);
      state.setTotalFocusTime(0);

      if (isNative && serviceStartedRef.current) {
        ForegroundService.stopForegroundService();
        serviceStartedRef.current = false;
      }
    };

    const listener = () => handleStop();
    window.addEventListener('pomodoro:stop', listener);
    
    return () => {
      window.removeEventListener('pomodoro:stop', listener);
    };
  }, [isNative, setPlayerStats, setCoins]);

  // Dedicated useEffect for Native Buttons (Runs ONLY ONCE)
  useEffect(() => {
    let fgListener: any = null;
    
    if (isNative) {
      ForegroundService.addListener('buttonClicked', (event) => {
        const state = usePomodoroStore.getState();
        if (event.buttonId === 1) { // Pause
          state.setIsActive(false);
        } else if (event.buttonId === 2) { // Stop
          // Dispara o evento global para o outro useEffect lidar com os rewards!
          window.dispatchEvent(new CustomEvent('pomodoro:stop'));
        }
      }).then(l => fgListener = l);
    }

    return () => {
      if (fgListener) fgListener.remove();
    };
  }, [isNative]);

  return null;
}
