import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Mail, Lock, UserPlus, LogIn, Swords } from 'lucide-react';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      if (isRegistering) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setMessage({ text: 'Conta criada! Você já pode fazer login.', type: 'success' });
        setIsRegistering(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        // The App component will detect the session change and redirect
      }
    } catch (error: any) {
      setMessage({ text: error.message || 'Ocorreu um erro.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-surface to-background">
      <div className="glass p-8 rounded-2xl w-full max-w-md shadow-2xl relative overflow-hidden">
        {/* Neon accent line */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-secondary"></div>
        
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-4 border border-primary/50 shadow-[0_0_15px_rgba(139,92,246,0.5)]">
            <Swords className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
            Task RPG
          </h1>
          <p className="text-textMuted mt-2">
            {isRegistering ? 'Crie sua conta para começar sua jornada' : 'Faça login para continuar sua jornada'}
          </p>
        </div>

        {message.text && (
          <div className={`p-3 rounded-lg mb-6 text-sm ${message.type === 'error' ? 'bg-accent/20 text-accent border border-accent/50' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-textMuted mb-1">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-textMuted" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-background/50 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                placeholder="heroi@guilda.com"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-textMuted mb-1">Senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-textMuted" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-background/50 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white rounded-lg font-medium shadow-[0_0_15px_rgba(139,92,246,0.3)] hover:shadow-[0_0_25px_rgba(139,92,246,0.5)] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <span className="animate-pulse">Processando...</span>
            ) : isRegistering ? (
              <><UserPlus className="w-5 h-5" /> Criar Conta</>
            ) : (
              <><LogIn className="w-5 h-5" /> Entrar</>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-sm text-textMuted hover:text-white transition-colors"
          >
            {isRegistering ? 'Já tem uma conta? Faça login' : 'Ainda não é um herói? Crie sua conta'}
          </button>
        </div>
      </div>
    </div>
  );
}
