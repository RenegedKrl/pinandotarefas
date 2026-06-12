import { useState } from 'react';
import { X, User, Edit3, Settings, ShieldAlert, LogOut, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Dialogs } from '../lib/dialogs';

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
  auraColor: string;
  setAuraColor: (color: string) => void;
  heroTitle: string;
  setHeroTitle: (title: string) => void;
  appThemeColor: string;
  setAppThemeColor: (color: string) => void;
  appWallpaper: string;
  setAppWallpaper: (url: string) => void;
  heroBio: string;
  setHeroBio: (bio: string) => void;
}

const AVATAR_OPTIONS = ['🧙‍♂️', '🥷', '🦸‍♂️', '🧟', '🧛', '🧝', '🚀', '⭐', '💀', '👽', '👑', '🔥'];
const TITLES = ['O Iniciante', 'Caçador de Tarefas', 'Mestre Produtivo', 'Cavaleiro Solitário', 'Mago das Horas', 'A Lenda', 'Rei dos Hábitos', 'Procrastinador Redimido', 'A Sombra', 'O Destemido'];
const AURA_OPTIONS = [
  { label: 'Original', class: 'from-primary to-xp', color: 'bg-gradient-to-tr from-primary to-xp' },
  { label: 'Fogo', class: 'from-red-500 to-orange-500', color: 'bg-gradient-to-tr from-red-500 to-orange-500' },
  { label: 'Gelo', class: 'from-cyan-400 to-blue-600', color: 'bg-gradient-to-tr from-cyan-400 to-blue-600' },
  { label: 'Natureza', class: 'from-emerald-400 to-green-600', color: 'bg-gradient-to-tr from-emerald-400 to-green-600' },
  { label: 'Arcano', class: 'from-fuchsia-500 to-purple-600', color: 'bg-gradient-to-tr from-fuchsia-500 to-purple-600' },
  { label: 'Luz', class: 'from-yellow-300 to-yellow-500', color: 'bg-gradient-to-tr from-yellow-300 to-yellow-500' },
  { label: 'Trevas', class: 'from-slate-700 to-slate-900', color: 'bg-gradient-to-tr from-slate-700 to-slate-900' }
];
const PASTEL_COLORS = [
  '#DC4C3E', // Padrão
  '#FFB3BA', // Rosa Pastel
  '#FFDFBA', // Laranja Pastel
  '#FFFFBA', // Amarelo Pastel
  '#BAFFC9', // Verde Pastel
  '#BAE1FF', // Azul Pastel
  '#D4C4FB', // Roxo Pastel
  '#FFC8DD', // Rosa Escuro Pastel
  '#A0E8AF', // Menta
];

export default function ProfileModal({ 
  onClose, session, playerStats, onLogout, onReset, 
  displayName, setDisplayName, avatarIcon, setAvatarIcon,
  auraColor, setAuraColor, heroTitle, setHeroTitle,
  appThemeColor, setAppThemeColor, appWallpaper, setAppWallpaper, heroBio, setHeroBio
}: ProfileModalProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'settings'>('profile');
  const [petName, setPetName] = useState(localStorage.getItem('pet_name') || 'Mascote');
  const [tempName, setTempName] = useState(displayName);
  const [tempAvatar, setTempAvatar] = useState(avatarIcon);
  const [tempAura, setTempAura] = useState(auraColor);
  const [tempTitle, setTempTitle] = useState(heroTitle);
  const [tempThemeColor, setTempThemeColor] = useState(appThemeColor);
  const [tempWallpaper, setTempWallpaper] = useState(appWallpaper);
  const [tempBio, setTempBio] = useState(heroBio);
  const [googleConnected, setGoogleConnected] = useState(localStorage.getItem('google_calendar_connected') === 'true');

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        Dialogs.alert('A imagem é muito grande! Escolha uma menor que 2MB.', 'Erro de Upload', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setter(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleGoogleCalendar = () => {
    const newState = !googleConnected;
    setGoogleConnected(newState);
    localStorage.setItem('google_calendar_connected', newState.toString());
    if (newState) {
      Dialogs.alert('Conectado ao Google Agenda com sucesso! Agora você pode enviar tarefas pelo botão nas opções da tarefa.', 'Google Agenda', 'success');
    } else {
      Dialogs.alert('Desconectado do Google Agenda.', 'Google Agenda', 'info');
    }
  };

  const handleSaveProfile = async () => {
    localStorage.setItem(`display_name_${session.user.id}`, tempName);
    localStorage.setItem(`avatar_icon_${session.user.id}`, tempAvatar);
    localStorage.setItem(`aura_color_${session.user.id}`, tempAura);
    localStorage.setItem(`hero_title_${session.user.id}`, tempTitle);
    localStorage.setItem(`app_theme_color_${session.user.id}`, tempThemeColor);
    localStorage.setItem(`app_wallpaper_${session.user.id}`, tempWallpaper);
    localStorage.setItem(`hero_bio_${session.user.id}`, tempBio);
    
    setDisplayName(tempName);
    setAvatarIcon(tempAvatar);
    setAuraColor(tempAura);
    setHeroTitle(tempTitle);
    setAppThemeColor(tempThemeColor);
    setAppWallpaper(tempWallpaper);
    setHeroBio(tempBio);

    // Save to Supabase for the online leaderboard
    try {
      await supabase.from('profiles').update({ 
        display_name: tempName, 
        hero_class: tempAvatar,
        hero_bio: tempBio,
        hero_title: tempTitle,
        aura_color: tempAura,
        app_theme_color: tempThemeColor,
        app_wallpaper: tempWallpaper
      }).eq('id', session.user.id);
    } catch (e) {
      console.error(e);
    }

    Dialogs.alert('Perfil atualizado com sucesso!', 'Sucesso', 'success');
  };

  const handleSavePetName = async () => {
    localStorage.setItem(`pet_name_${session.user.id}`, petName);
    localStorage.setItem('pet_name', petName); // retrocompatibilidade
    try {
      await supabase.from('profiles').update({ pet_name: petName }).eq('id', session.user.id);
    } catch (e) {}
    Dialogs.alert('Nome do mascote atualizado com sucesso!', 'Sucesso', 'success');
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
                  <div className="flex flex-col items-center gap-2 relative group">
                    <div 
                      className={`w-16 h-16 rounded-full bg-gradient-to-tr ${tempAura} text-white flex items-center justify-center text-3xl font-bold shadow-md cursor-pointer transition-transform overflow-hidden bg-cover bg-center ring-2 ring-transparent group-hover:ring-primary/50`} 
                      style={tempAvatar.length > 5 ? { backgroundImage: `url(${tempAvatar})` } : undefined}
                      title="Escolha um avatar abaixo ou faça upload"
                      onClick={() => document.getElementById('avatar-upload')?.click()}
                    >
                      {tempAvatar.length <= 5 && tempAvatar}
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Edit3 className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    <input 
                      type="file" 
                      id="avatar-upload" 
                      className="hidden" 
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, setTempAvatar)}
                    />
                    <button 
                      onClick={() => setTempAvatar('')} 
                      className="text-[10px] text-textMuted hover:text-red-500"
                    >Remover Foto</button>
                  </div>
                  
                  <div className="flex-1 w-full space-y-4">
                    <div>
                      <label className="text-xs font-bold text-textMuted uppercase mb-1 block">Nome do Herói</label>
                      <input 
                        type="text" 
                        value={tempName}
                        onChange={e => setTempName(e.target.value)}
                        className="w-full bg-white dark:bg-[#202020] border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>
                    
                    <div>
                      <label className="text-xs font-bold text-textMuted uppercase mb-1 block">Título</label>
                      <select 
                        value={tempTitle}
                        onChange={e => setTempTitle(e.target.value)}
                        className="w-full bg-white dark:bg-[#202020] border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-primary transition-colors appearance-none"
                      >
                        {TITLES.map(title => (
                          <option key={title} value={title}>{title}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-textMuted uppercase mb-1 block">Biografia / Lore</label>
                      <textarea 
                        value={tempBio}
                        onChange={e => setTempBio(e.target.value)}
                        className="w-full bg-white dark:bg-[#202020] border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-primary transition-colors min-h-[60px] resize-y"
                        placeholder="Escreva a lenda do seu herói..."
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-textMuted uppercase mb-1 block">Aura Elementar</label>
                      <div className="flex flex-wrap gap-2">
                        {AURA_OPTIONS.map(aura => (
                          <button
                            key={aura.label}
                            onClick={() => setTempAura(aura.class)}
                            title={aura.label}
                            className={`w-6 h-6 rounded-full border-2 transition-all ${aura.color} ${tempAura === aura.class ? 'border-text scale-110' : 'border-transparent hover:scale-110'}`}
                          />
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-textMuted uppercase mb-1 block">Ícone do Personagem</label>
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
                  <Settings className="w-5 h-5" /> Aparência do App
                </h3>
                
                <div className="space-y-3 border-b border-border pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-text">Cor Principal</p>
                      <p className="text-xs text-textMuted">Tons pastéis deixam o app mais leve</p>
                    </div>
                    <button 
                      onClick={() => setTempThemeColor('#DC4C3E')}
                      className="text-[10px] font-bold text-red-500 hover:text-white bg-red-500/10 hover:bg-red-500 px-2 py-1 rounded transition-colors"
                    >
                      Restaurar
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {PASTEL_COLORS.map(color => (
                      <button
                        key={color}
                        onClick={() => setTempThemeColor(color)}
                        className={`w-8 h-8 rounded-full border-2 transition-transform ${tempThemeColor === color ? 'border-text scale-110' : 'border-transparent hover:scale-110'}`}
                        style={{ backgroundColor: color }}
                        title={color === '#DC4C3E' ? 'Padrão' : color}
                      />
                    ))}
                    <label className="w-8 h-8 rounded-full border-2 border-dashed border-textMuted flex items-center justify-center cursor-pointer hover:border-text transition-colors" title="Cor Customizada">
                      <input 
                        type="color" 
                        value={tempThemeColor}
                        onChange={(e) => setTempThemeColor(e.target.value)}
                        className="sr-only"
                      />
                      <span className="text-textMuted text-xs font-bold">+</span>
                    </label>
                  </div>
                </div>

                <div className="space-y-2">
                  <div>
                    <p className="text-sm font-bold text-text">Plano de Fundo (Wallpaper)</p>
                    <p className="text-xs text-textMuted">Sua imagem preenchendo o fundo do App!</p>
                  </div>
                  
                  {tempWallpaper ? (
                    <div className="relative w-full h-24 rounded-lg overflow-hidden border border-border group">
                      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${tempWallpaper})` }} />
                      <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity gap-2">
                        <button 
                          onClick={() => setTempWallpaper('')}
                          className="px-3 py-1 bg-red-500 text-white rounded text-xs font-bold hover:bg-red-600"
                        >Remover</button>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full">
                      <input 
                        type="file" 
                        id="wallpaper-upload" 
                        className="hidden" 
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, setTempWallpaper)}
                      />
                      <button 
                        onClick={() => document.getElementById('wallpaper-upload')?.click()}
                        className="w-full py-3 border-2 border-dashed border-primary/50 text-primary font-bold text-sm rounded-lg hover:bg-primary/10 transition-colors"
                      >
                        + Escolher Imagem de Fundo
                      </button>
                    </div>
                  )}
                </div>
              </div>

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
                
                <div className="mt-4 flex justify-end">
                  <button 
                    onClick={handleSaveProfile}
                    className="px-4 py-2 bg-primary text-white text-sm font-bold rounded-lg hover:bg-primary-hover transition-colors"
                  >
                    Salvar Alterações
                  </button>
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
