import { supabase } from './supabase';

// Função utilitária para enviar o estado local (localStorage) para a nuvem
export const syncLocalToCloud = async (userId: string, currentXp?: number, currentLevel?: number, currentHp?: number) => {
  if (!userId) return;
  
  const coins = parseInt(localStorage.getItem(`coins_${userId}`) || '0');
  const streak = parseInt(localStorage.getItem(`hero_streak_${userId}`) || '0');
  const streakDate = localStorage.getItem(`hero_streak_date_${userId}`);
  const bossHp = parseInt(localStorage.getItem(`boss_hp_${userId}`) || '2000');
  const projects = JSON.parse(localStorage.getItem(`projects_${userId}`) || '[]');
  
  const displayName = localStorage.getItem(`display_name_${userId}`);
  const heroClass = localStorage.getItem(`avatar_icon_${userId}`) || localStorage.getItem(`hero_class_${userId}`);
  const auraColor = localStorage.getItem(`aura_color_${userId}`);
  const heroTitle = localStorage.getItem(`hero_title_${userId}`);
  const appThemeColor = localStorage.getItem(`app_theme_color_${userId}`);
  const appWallpaper = localStorage.getItem(`app_wallpaper_${userId}`);
  const heroBio = localStorage.getItem(`hero_bio_${userId}`);
  const petName = localStorage.getItem(`pet_name_${userId}`);
  
  const payload: any = {
    coins,
    streak,
    last_streak_date: streakDate,
    boss_hp: bossHp,
    custom_projects: projects
  };

  if (displayName !== null) payload.display_name = displayName;
  if (heroClass !== null) payload.hero_class = heroClass;
  if (auraColor !== null) payload.aura_color = auraColor;
  if (heroTitle !== null) payload.hero_title = heroTitle;
  if (appThemeColor !== null) payload.app_theme_color = appThemeColor;
  if (appWallpaper !== null) payload.app_wallpaper = appWallpaper;
  if (heroBio !== null) payload.hero_bio = heroBio;
  if (petName !== null) payload.pet_name = petName;
  
  if (currentXp !== undefined) payload.xp = currentXp;
  if (currentLevel !== undefined) payload.level = currentLevel;
  if (currentHp !== undefined) payload.hp = currentHp;

  try {
    const { error } = await supabase.from('profiles').update(payload).eq('id', userId);
    if (error) {
      console.error('[Sync API Error]', error);
    } else {
      console.log('[Sync] Estado do RPG sincronizado com as Nuvens!');
    }
  } catch (error) {
    console.error('[Sync Network Error]', error);
  }
};
