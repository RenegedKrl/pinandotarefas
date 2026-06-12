import { useState, useEffect } from 'react';
import { Trophy, Crown, Globe, X, Flame } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface LeaderboardProps {
  playerStats: { level: number; xp: number; hp: number };
  session: any;
  heroClass: string | null;
}

export default function Leaderboard({ playerStats, session, heroClass }: LeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);

  useEffect(() => {
    const fetchOnlineLeaderboard = async () => {
      try {
        // Fetch real players from Supabase
        const { data: realProfiles } = await supabase
          .from('profiles')
          .select('*')
          .order('level', { ascending: false })
          .order('xp', { ascending: false })
          .limit(20);

        const realPlayers = (realProfiles || [])
          .map((p: any) => ({
            id: p.id,
            name: p.display_name || (p.id === session.user.id ? (localStorage.getItem(`display_name_${session.user.id}`) || 'Você') : `Herói ${p.id.substring(0,4)}`),
            class: p.hero_class || (p.id === session.user.id ? heroClass : 'novice'),
            level: p.level,
            xp: p.xp,
            streak: p.streak || (p.id === session.user.id ? parseInt(localStorage.getItem(`hero_streak_${session.user.id}`) || '0') : 0),
            bio: p.hero_bio || (p.id === session.user.id ? localStorage.getItem(`hero_bio_${session.user.id}`) : 'Um herói misterioso e lendário.'),
            title: p.hero_title || (p.id === session.user.id ? localStorage.getItem(`hero_title_${session.user.id}`) : 'Aventureiro'),
            aura_color: p.aura_color || (p.id === session.user.id ? localStorage.getItem(`aura_color_${session.user.id}`) : 'from-primary to-xp'),
            isPlayer: p.id === session.user.id
          }));

        // If the current player is not in the top 20, add them manually
        if (!realPlayers.some((p: any) => p.id === session.user.id)) {
          realPlayers.push({
            id: session.user.id,
            name: localStorage.getItem(`display_name_${session.user.id}`) || 'Você',
            class: heroClass || 'novice',
            level: playerStats.level,
            xp: playerStats.xp,
            streak: parseInt(localStorage.getItem(`hero_streak_${session.user.id}`) || '0'),
            bio: localStorage.getItem(`hero_bio_${session.user.id}`) || 'Um herói em ascensão preparado para organizar o caos e concluir todas as missões!',
            title: localStorage.getItem(`hero_title_${session.user.id}`) || 'O Iniciante',
            aura_color: localStorage.getItem(`aura_color_${session.user.id}`) || 'from-primary to-xp',
            isPlayer: true
          });
        }

        const allPlayers = [...realPlayers];
        
        // Sort by level descending, then by xp descending
        allPlayers.sort((a, b) => {
          if (b.level !== a.level) return b.level - a.level;
          return b.xp - a.xp;
        });

        // Filter out duplicate player entries just in case
        const uniquePlayers = Array.from(new Map(allPlayers.map(item => [item.id, item])).values());
        
        // Sort again after dedup
        uniquePlayers.sort((a, b) => {
          if (b.level !== a.level) return b.level - a.level;
          return b.xp - a.xp;
        });

        setLeaderboard(uniquePlayers);
      } catch (err) {
        console.error('Failed to fetch leaderboard', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOnlineLeaderboard();
  }, [playerStats.level, playerStats.xp, session.user.id, heroClass]);

  const getClassIcon = (c: string) => {
    switch(c) {
      case 'mage': return '🧙‍♂️';
      case 'knight': return '⚔️';
      case 'support': return '💖';
      case 'archer': return '🏹';
      case 'novice': return '🔰';
      default: return c && c.length <= 2 ? c : '👤'; // Allow emoji icons
    }
  };

  const getRankStyle = (index: number) => {
    switch(index) {
      case 0: return 'bg-yellow-500/20 border-yellow-500 text-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.2)]';
      case 1: return 'bg-gray-300/20 border-gray-400 text-gray-300';
      case 2: return 'bg-amber-700/20 border-amber-700 text-amber-600';
      default: return 'bg-surface border-border text-textMuted';
    }
  };

  return (
    <div className="pb-20 animate-in fade-in duration-500">
      <div className="bg-surface border border-border p-6 rounded-xl flex items-center justify-between shadow-sm relative overflow-hidden mb-8">
        <div className="absolute -right-10 -top-10 opacity-5 pointer-events-none">
          <Trophy className="w-64 h-64 text-yellow-500" />
        </div>
        
        <div>
          <h2 className="text-sm font-semibold text-textMuted uppercase tracking-wider mb-1">Competição Global</h2>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center">
              <Globe className="w-6 h-6 text-yellow-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text flex items-center gap-2">Arena Global <span className="text-xs bg-green-500/20 text-green-500 px-2 py-1 rounded-full uppercase tracking-wider font-bold">Online</span></h1>
              <p className="text-sm text-textMuted">Suba de nível e ganhe XP para subir no ranking contra outros aventureiros.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-border bg-black/5 text-xs font-bold text-textMuted uppercase tracking-wider">
          <div className="col-span-2 md:col-span-1 text-center">Rank</div>
          <div className="col-span-6 md:col-span-7">Herói</div>
          <div className="col-span-2 text-center">Nível</div>
          <div className="col-span-2 text-right pr-4">XP Total</div>
        </div>

        <div className="flex flex-col relative min-h-[200px]">
          {loading && (
            <div className="absolute inset-0 bg-surface/50 backdrop-blur-sm flex items-center justify-center z-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          )}
          
          {leaderboard.map((entry: any, index: number) => {
            const isTop3 = index < 3;
            const rankStyle = getRankStyle(index);

            return (
              <div 
                key={entry.id} 
                onClick={() => setSelectedPlayer(entry)}
                className={`grid grid-cols-12 gap-4 p-4 items-center border-b border-border/50 cursor-pointer transition-colors ${entry.isPlayer ? 'bg-primary/5 hover:bg-primary/10' : 'hover:bg-black/5'}`}
              >
                <div className="col-span-2 md:col-span-1 flex justify-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black border-2 ${rankStyle}`}>
                    {index === 0 ? <Crown className="w-4 h-4" /> : index + 1}
                  </div>
                </div>
                
                <div className="col-span-6 md:col-span-7 flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl shadow-sm bg-gradient-to-tr ${entry.aura_color || 'from-primary to-xp'} bg-cover bg-center`} style={entry.class && entry.class.startsWith('data:image') ? { backgroundImage: `url(${entry.class})` } : undefined}>
                    {(!entry.class || !entry.class.startsWith('data:image')) && getClassIcon(entry.class)}
                  </div>
                  <div className="flex flex-col">
                    <span className={`font-bold ${entry.isPlayer ? 'text-primary text-lg' : 'text-text'}`}>
                      {entry.name} {entry.isPlayer && '(Você)'}
                    </span>
                    {isTop3 && !entry.isPlayer && <span className="text-[10px] text-yellow-500 uppercase font-bold tracking-widest">Lenda</span>}
                  </div>
                </div>
                
                <div className="col-span-2 flex justify-center">
                  <span className="bg-black/10 px-3 py-1 rounded-lg font-black text-text border border-border">
                    {entry.level}
                  </span>
                </div>
                
                <div className="col-span-2 text-right pr-4 font-semibold text-textMuted">
                  {entry.xp.toLocaleString()}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selectedPlayer && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setSelectedPlayer(null)}>
          <div 
            className="bg-surface w-full max-w-md rounded-2xl shadow-2xl border border-border overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-4 border-b border-border flex items-center justify-between bg-black/5">
              <h2 className="font-bold text-text flex items-center gap-2">
                Perfil de {selectedPlayer.name}
              </h2>
              <button onClick={() => setSelectedPlayer(null)} className="p-1 text-textMuted hover:text-text hover:bg-black/10 rounded-md transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 flex flex-col items-center">
              <div className={`w-24 h-24 rounded-full flex items-center justify-center text-5xl font-black shadow-lg mb-4 bg-gradient-to-tr ${selectedPlayer.aura_color || 'from-primary to-xp'} bg-cover bg-center ring-4 ring-background`} style={selectedPlayer.class && selectedPlayer.class.startsWith('data:image') ? { backgroundImage: `url(${selectedPlayer.class})` } : undefined}>
                {(!selectedPlayer.class || !selectedPlayer.class.startsWith('data:image')) && getClassIcon(selectedPlayer.class)}
              </div>

              <h1 className="text-2xl font-black text-text text-center">{selectedPlayer.name}</h1>
              <p className="text-sm font-bold text-primary uppercase tracking-widest mb-4">{selectedPlayer.title}</p>
              
              <div className="bg-black/5 p-4 rounded-xl text-center w-full mb-6 border border-border italic text-textMuted shadow-inner text-sm relative">
                <div className="absolute -top-3 left-4 text-3xl opacity-20 text-text">"</div>
                "{selectedPlayer.bio}"
              </div>

              <div className="grid grid-cols-3 gap-2 w-full">
                <div className="bg-black/5 border border-border rounded-xl p-3 flex flex-col items-center justify-center">
                  <span className="text-textMuted text-[10px] font-bold uppercase mb-1">Nível</span>
                  <span className="text-xl font-black text-text">{selectedPlayer.level}</span>
                </div>
                <div className="bg-black/5 border border-border rounded-xl p-3 flex flex-col items-center justify-center">
                  <span className="text-textMuted text-[10px] font-bold uppercase mb-1">XP Total</span>
                  <span className="text-xl font-black text-xp">{selectedPlayer.xp}</span>
                </div>
                <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-3 flex flex-col items-center justify-center">
                  <span className="text-orange-500 text-[10px] font-bold uppercase mb-1 flex items-center gap-1"><Flame className="w-3 h-3" /> Dias Logados</span>
                  <span className="text-xl font-black text-orange-500">{selectedPlayer.streak}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
