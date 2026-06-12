import { useState, useEffect } from 'react';
import { Trophy, Crown, Globe } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface LeaderboardProps {
  playerStats: { level: number; xp: number; hp: number };
  session: any;
  heroClass: string | null;
}

export default function Leaderboard({ playerStats, session, heroClass }: LeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
          .filter((p: any) => p.display_name || p.id === session.user.id)
          .map((p: any) => ({
            id: p.id,
            name: p.display_name || (p.id === session.user.id ? (localStorage.getItem(`display_name_${session.user.id}`) || 'Você') : `Herói ${p.id.substring(0,4)}`),
            class: p.hero_class || (p.id === session.user.id ? heroClass : 'novice'),
            level: p.level,
            xp: p.xp,
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
  }, [playerStats, session, heroClass]);

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
                className={`grid grid-cols-12 gap-4 p-4 items-center border-b border-border/50 transition-colors ${entry.isPlayer ? 'bg-primary/5 hover:bg-primary/10' : 'hover:bg-black/5'}`}
              >
                <div className="col-span-2 md:col-span-1 flex justify-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black border-2 ${rankStyle}`}>
                    {index === 0 ? <Crown className="w-4 h-4" /> : index + 1}
                  </div>
                </div>
                
                <div className="col-span-6 md:col-span-7 flex items-center gap-3">
                  <div className="text-2xl" title={entry.class}>{getClassIcon(entry.class)}</div>
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
    </div>
  );
}
