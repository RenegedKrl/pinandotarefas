import { useState } from 'react';
import { X, User, Edit3, Settings, ShieldAlert, LogOut, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ProfileModalProps {
  onClose: () => void;
  session: any;
  playerStats: { level: number; xp: number; hp: number };
  onLogout: () => void;
  onReset: () => void;
  displayName: string;
  setDisplayName: (name: string) => void;
  avatarIcon: string;
  setAvatarIcon: (icon: string) => void;
}

const AVATAR_OPTIONS = ['🧙‍♂️', '🥷', '🦸‍♂️', '🧟', '🧛', '🧝', '🚀', '⭐', '💀', '👽', '👑', '🔥'];

export default function ProfileModal({ 
  onClose, session, playerStats, onLogout, onReset, 
  displayName, setDisplayName, avatarIcon, setAvatarIcon 
}: ProfileModalProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'settings'>('profile');
  const [petName, setPetName] = useState(localStorage.getItem('pet_name') || 'Mascote');
  const [tempName, setTempName] = useState(displayName);
  const [tempAvatar, setTempAvatar] = useState(avatarIcon);
  const [googleConnected, setGoogleConnected] = useState(localStorage.getItem('google_calendar_connected') === 'true');

  const toggleGoogleCalendar = () => {
    const newState = !googleConnected;
    setGoogleConnected(newState);
    localStorage.setItem('google_calendar_connected', newState.toString());
    if (newState) {
      alert('Conectado ao Google Agenda com sucesso! Agora você pode enviar tarefas pelo botão nas opções da tarefa.');
    } else {
      alert('Desconectado do Google Agenda.');
    }
  };

  const handleSaveProfile = async () => {
    localStorage.setItem(`display_name_${session.user.id}`, tempName);
    localStorage.setItem(`avatar_icon_${session.user.id}`, tempAvatar);
    setDisplayName(tempName);
    setAvatarIcon(tempAvatar);

    // Save to Supabase for the online leaderboard
    try {
      await supabase.from('profiles').update({ 
        display_name: tempName, 
        hero_class: tempAvatar 
      }).eq('id', session.user.id);
    } catch (e) {
      console.error(e);
    }

    alert('Perfil atualizado com sucesso!');
  };

  const handleSavePetName = () => {
    localStorage.setItem('pet_name', petName);
    alert('Nome do mascote atualizado com sucesso!');
  };

  const getXpForNextLevel = (level: number) => level * 100;
  const xpNeeded = getXpForNextLevel(playerStats.level);
  const xpPercentage = Math.min(100, Math.max(0, (playerStats.xp / xpNeeded) * 100));

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="bg-surface w-full max-w-md rounded-2xl shadow-2xl border border-border overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 border-b border-border flex items-center justify-between bg-black/5">
          <h2 className="font-bold text-text flex items-center gap-2">
            <User className="w-5 h-5" />
            Perfil do Herói
          </h2>
          <button onClick={onClose} className="p-1 text-textMuted hover:text-text hover:bg-black/10 rounded-md transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex border-b border-border">
          <button 
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${activeTab === 'profile' ? 'text-primary border-b-2 border-primary' : 'text-textMuted hover:bg-black/5'}`}
            onClick={() => setActiveTab('profile')}
          >
            Estatísticas
          </button>
          <button 
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${activeTab === 'settings' ? 'text-primary border-b-2 border-primary' : 'text-textMuted hover:bg-black/5'}`}
            onClick={() => setActiveTab('settings')}
          >
            Configurações
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh] custom-scrollbar">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div className="bg-black/5 border border-border p-5 rounded-xl">
                <h3 className="font-bold text-text mb-4 text-sm flex items-center gap-2">
                  <User className="w-4 h-4" /> Personalizar Herói
                </h3>
                
                <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-primary to-xp text-white flex items-center justify-center text-3xl font-bold shadow-md cursor-pointer hover:scale-105 transition-transform" title="Escolha um avatar abaixo">
                      {tempAvatar}
                    </div>
                  </div>
                  
                  <div className="flex-1 w-full space-y-3">
                    <div>
                      <label className="text-xs font-bold text-textMuted uppercase">Nome do Herói</label>
                      <input 
                        type="text" 
                        value={tempName}
                        onChange={e => setTempName(e.target.value)}
                        className="w-full bg-white dark:bg-[#202020] border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-textMuted uppercase mb-1 block">Escolha o Ícone</label>
                      <div className="flex flex-wrap gap-2">
                        {AVATAR_OPTIONS.map(emoji => (
                          <button
                            key={emoji}
                            onClick={() => setTempAvatar(emoji)}
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-lg hover:bg-black/10 transition-colors ${tempAvatar === emoji ? 'ring-2 ring-primary bg-primary/10' : ''}`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex justify-end">
                  <button 
                    onClick={handleSaveProfile}
                    className="px-4 py-2 bg-primary text-white text-sm font-bold rounded-lg hover:bg-primary-hover transition-colors"
                  >
                    Salvar Perfil
                  </button>
                </div>
              </div>

              <div className="space-y-4 bg-black/5 p-4 rounded-xl border border-border">
                <div>
                  <div className="flex justify-between text-sm font-bold text-text mb-1">
                    <span>Experiência (XP)</span>
                    <span className="text-xp">{playerStats.xp} / {xpNeeded}</span>
                  </div>
                  <div className="h-2.5 bg-black/10 rounded-full overflow-hidden">
                    <div className="h-full bg-xp transition-all duration-500" style={{ width: `${xpPercentage}%` }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm font-bold text-text mb-1">
                    <span>Vida (HP)</span>
                    <span className="text-red-500">{playerStats.hp} / 100</span>
                  </div>
                  <div className="h-2.5 bg-black/10 rounded-full overflow-hidden">
                    <div className={`h-full transition-all duration-500 ${playerStats.hp <= 20 ? 'bg-red-500 animate-pulse' : 'bg-red-400'}`} style={{ width: `${playerStats.hp}%` }}></div>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-bold text-textMuted mb-2 flex items-center gap-2">
                  <Edit3 className="w-4 h-4" /> Nome do seu Mascote
                </label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={petName}
                    onChange={e => setPetName(e.target.value)}
                    className="flex-1 bg-black/5 border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-primary transition-colors"
                  />
                  <button 
                    onClick={handleSavePetName}
                    className="px-4 py-2 bg-primary text-white text-sm font-bold rounded-lg hover:bg-primary-hover transition-colors"
                  >
                    Salvar
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-4">
              <div className="p-4 bg-black/5 rounded-xl border border-border space-y-4">
                <h3 className="font-bold text-text flex items-center gap-2 mb-2">
                  <Settings className="w-5 h-5" /> Preferências
                </h3>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-text">Sons de Conclusão</p>
                    <p className="text-xs text-textMuted">Tocar "Ding!" ao completar tarefas</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
              </div>

              <div className="p-4 bg-black/5 rounded-xl border border-border space-y-4">
                <h3 className="font-bold text-blue-500 flex items-center gap-2 mb-2">
                  <Calendar className="w-5 h-5" /> Integrações
                </h3>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-text">Google Agenda</p>
                    <p className="text-xs text-textMuted">Habilita botão para exportar tarefas</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={googleConnected} onChange={toggleGoogleCalendar} />
                    <div className="w-11 h-6 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <h3 className="font-bold text-red-500 flex items-center gap-2 mb-4">
                  <ShieldAlert className="w-5 h-5" /> Zona de Perigo
                </h3>
                <button 
                  onClick={() => { onClose(); onLogout(); }}
                  className="w-full flex items-center justify-between p-3 rounded-lg border border-border text-text hover:bg-black/5 transition-colors font-semibold mb-3"
                >
                  <span className="flex items-center gap-2"><LogOut className="w-4 h-4" /> Sair da Conta</span>
                </button>
                <button 
                  onClick={() => { onClose(); onReset(); }}
                  className="w-full flex items-center justify-between p-3 rounded-lg border border-red-500/30 text-red-500 bg-red-500/5 hover:bg-red-500/10 transition-colors font-semibold"
                >
                  <span className="flex items-center gap-2"><ShieldAlert className="w-4 h-4" /> Zerar Conta (Reset)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
