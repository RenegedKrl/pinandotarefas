import { supabase } from './supabase';

// Função utilitária para enviar o estado local (localStorage) para a nuvem
export const syncLocalToCloud = async (userId: string, currentXp?: number, currentLevel?: number, currentHp?: number) => {
  if (!userId) return;
  
  const coins = parseInt(localStorage.getItem(`coins_${userId}`) || '0');
  const streak = parseInt(localStorage.getItem(`hero_streak_${userId}`) || '0');
  const streakDate = localStorage.getItem(`hero_streak_date_${userId}`);
  const bossHp = parseInt(localStorage.getItem(`boss_hp_${userId}`) || '2000');
  const heroClass = localStorage.getItem(`hero_class_${userId}`);
  const projects = JSON.parse(localStorage.getItem(`projects_${userId}`) || '[]');
  
  const payload: any = {
    coins,
    streak,
    last_streak_date: streakDate,
    boss_hp: bossHp,
    hero_class: heroClass,
    custom_projects: projects
  };
  
  if (currentXp !== undefined) payload.xp = currentXp;
  if (currentLevel !== undefined) payload.level = currentLevel;
  if (currentHp !== undefined) payload.hp = currentHp;

  try {
    await supabase.from('profiles').update(payload).eq('id', userId);
    console.log('[Sync] Estado do RPG sincronizado com as Nuvens!');
  } catch (error) {
    console.error('[Sync Error]', error);
  }
};
