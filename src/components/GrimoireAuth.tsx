import { useState, useEffect } from 'react';
import { Lock, Unlock, Mail, ShieldAlert, KeyRound } from 'lucide-react';
import Grimoire from './Grimoire';
import { supabase } from '../lib/supabase';
import { Dialogs } from '../lib/dialogs';

interface GrimoireAuthProps {
  userId: string;
}

// Simple SHA-256 hashing function
async function hashPassword(password: string) {
  const msgBuffer = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export default function GrimoireAuth({ userId }: GrimoireAuthProps) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [hasPassword, setHasPassword] = useState(true);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const savedHash = localStorage.getItem(`grimoire_hash_${userId}`);
    if (!savedHash) {
      setHasPassword(false);
    }
  }, [userId]);

  const handleCreatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 4) {
      setError('A senha deve ter pelo menos 4 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setLoading(true);
    const hash = await hashPassword(password);
    localStorage.setItem(`grimoire_hash_${userId}`, hash);
    setHasPassword(true);
    setIsUnlocked(true);
    setLoading(false);
  };

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const savedHash = localStorage.getItem(`grimoire_hash_${userId}`);
    const inputHash = await hashPassword(password);

    if (savedHash === inputHash) {
      setIsUnlocked(true);
    } else {
      setError('Senha incorreta. O Grimório permanece trancado.');
      setPassword('');
    }
    setLoading(false);
  };

  const handleForgotPassword = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) throw new Error("Email do usuário não encontrado.");
      
      // We use Supabase's built-in email reset feature
      const { error } = await supabase.auth.resetPasswordForEmail(user.email);
      if (error) throw error;
      
      // Clear the local grimoire hash so they can recreate it after resetting their main account
      localStorage.removeItem(`grimoire_hash_${userId}`);
      
      Dialogs.alert(
        "Um e-mail de recuperação foi enviado para " + user.email + ". Por segurança, você redefinirá a senha principal da sua conta. A senha do Grimório foi desvinculada e você poderá criar uma nova agora.",
        "E-mail Enviado!",
        "success"
      );
      setHasPassword(false);
    } catch (err: any) {
      setError(err.message || 'Erro ao enviar e-mail.');
    } finally {
      setLoading(false);
    }
  };

  if (isUnlocked) {
    return (
      <div className="relative animate-in fade-in duration-500">
        <div className="absolute top-4 right-4 z-50">
          <button 
            onClick={() => setIsUnlocked(false)}
            className="flex items-center gap-2 px-3 py-1.5 bg-surface border border-border rounded-lg text-sm font-bold text-textMuted hover:text-red-500 transition-colors shadow-sm"
          >
            <Lock className="w-4 h-4" /> Trancar Grimório
          </button>
        </div>
        <Grimoire userId={userId} />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] animate-in fade-in zoom-in-95 duration-500 p-4">
      <div className="w-full max-w-md bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
        
        <div className="p-8 flex flex-col items-center">
          <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mb-6 border border-indigo-500/30 shadow-[0_0_30px_rgba(99,102,241,0.2)]">
            {hasPassword ? <Lock className="w-10 h-10 text-indigo-500" /> : <KeyRound className="w-10 h-10 text-indigo-500" />}
          </div>
          
          <h2 className="text-2xl font-black text-text mb-2 text-center">
            {hasPassword ? 'Grimório Trancado' : 'Proteger Grimório'}
          </h2>
          <p className="text-textMuted text-center mb-8 text-sm">
            {hasPassword 
              ? 'Insira sua senha secreta para acessar suas anotações mais valiosas e segredos da jornada.' 
              : 'Crie uma senha forte. Suas anotações no Grimório são confidenciais e serão protegidas por criptografia.'}
          </p>

          {error && (
            <div className="w-full p-3 mb-6 rounded-lg bg-red-500/10 text-red-500 border border-red-500/20 text-sm flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!hasPassword ? (
            <form onSubmit={handleCreatePassword} className="w-full space-y-4">
              <div>
                <input
                  type="password"
                  placeholder="Nova senha secreta"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-background/50 border border-border rounded-xl px-4 py-3 text-text text-center text-lg tracking-widest focus:outline-none focus:border-indigo-500 transition-colors"
                  required
                />
              </div>
              <div>
                <input
                  type="password"
                  placeholder="Confirmar senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-background/50 border border-border rounded-xl px-4 py-3 text-text text-center text-lg tracking-widest focus:outline-none focus:border-indigo-500 transition-colors"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50"
              >
                {loading ? 'Criptografando...' : 'Trancar e Salvar'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleUnlock} className="w-full space-y-4">
              <div>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-background/50 border border-border rounded-xl px-4 py-3 text-text text-center text-2xl tracking-[0.5em] focus:outline-none focus:border-indigo-500 transition-colors"
                  required
                  autoFocus
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Unlock className="w-5 h-5" />
                {loading ? 'Descriptografando...' : 'Destrancar Grimório'}
              </button>
            </form>
          )}

          {hasPassword && (
            <button
              onClick={handleForgotPassword}
              disabled={loading}
              className="mt-6 text-sm text-textMuted hover:text-indigo-400 transition-colors flex items-center gap-2"
            >
              <Mail className="w-4 h-4" />
              Esqueci a senha
            </button>
          )}
        </div>
        
        <div className="bg-black/10 p-4 border-t border-border flex items-center justify-center gap-2 text-xs text-textMuted">
          <ShieldAlert className="w-3 h-3" /> Proteção Criptográfica Ativa (SHA-256)
        </div>
      </div>
    </div>
  );
}
