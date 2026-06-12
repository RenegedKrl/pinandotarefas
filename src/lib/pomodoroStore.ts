import { create } from 'zustand';

type Mode = 'work' | 'shortBreak' | 'longBreak' | 'idle';

interface PomodoroState {
  mode: Mode;
  timeLeft: number;
  isActive: boolean;
  currentSession: number;
  totalFocusTime: number; // in seconds
  
  workTime: number;
  shortBreakTime: number;
  longBreakTime: number;
  sessionsBeforeLongBreak: number;
  
  setMode: (mode: Mode) => void;
  setTimeLeft: (time: number) => void;
  setIsActive: (active: boolean) => void;
  setCurrentSession: (session: number) => void;
  setTotalFocusTime: (time: number | ((prev: number) => number)) => void;
  
  setSettings: (settings: { workTime?: number, shortBreakTime?: number, longBreakTime?: number, sessionsBeforeLongBreak?: number }) => void;
}

export const usePomodoroStore = create<PomodoroState>((set) => ({
  mode: 'idle',
  timeLeft: 25 * 60,
  isActive: false,
  currentSession: 0,
  totalFocusTime: 0,
  
  workTime: 25,
  shortBreakTime: 5,
  longBreakTime: 15,
  sessionsBeforeLongBreak: 4,
  
  setMode: (mode) => set({ mode }),
  setTimeLeft: (timeLeft) => set({ timeLeft }),
  setIsActive: (isActive) => set({ isActive }),
  setCurrentSession: (currentSession) => set({ currentSession }),
  setTotalFocusTime: (update) => set((state) => ({ 
    totalFocusTime: typeof update === 'function' ? update(state.totalFocusTime) : update 
  })),
  
  setSettings: (settings) => set((state) => ({ ...state, ...settings })),
}));
