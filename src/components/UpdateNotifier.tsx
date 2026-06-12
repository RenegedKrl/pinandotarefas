import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Download, X } from 'lucide-react';

// A versão atual compilada deste aplicativo.
// Quando você gerar um novo APK, aumente esse número (ex: 1.0.1, 1.0.2)
const CURRENT_VERSION = '1.0.0';

export default function UpdateNotifier() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateData, setUpdateData] = useState<{ version: string, update_url: string, mandatory: boolean } | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const checkUpdate = async () => {
      try {
        const { data } = await supabase
          .from('app_versions')
          .select('*')
          .eq('id', 1)
          .single();

        if (data && data.version !== CURRENT_VERSION) {
          // Simplistic version comparison (assumes format x.y.z)
          const currentParts = CURRENT_VERSION.split('.').map(Number);
          const latestParts = data.version.split('.').map(Number);
          
          let isNewer = false;
          for (let i = 0; i < Math.max(currentParts.length, latestParts.length); i++) {
            const curr = currentParts[i] || 0;
            const latest = latestParts[i] || 0;
            if (latest > curr) {
              isNewer = true;
              break;
            } else if (latest < curr) {
              break;
            }
          }

          if (isNewer) {
            setUpdateData(data);
            setUpdateAvailable(true);
          }
        }
      } catch (err) {
        console.error('Failed to check for updates', err);
      }
    };

    checkUpdate();
  }, []);

  if (!updateAvailable || !updateData) return null;
  if (dismissed && !updateData.mandatory) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-surface w-full max-w-sm rounded-2xl p-6 shadow-2xl border border-primary/20 relative">
        {!updateData.mandatory && (
          <button 
            onClick={() => setDismissed(true)}
            className="absolute top-4 right-4 text-textMuted hover:text-text"
          >
            <X className="w-5 h-5" />
          </button>
        )}
        
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 mx-auto">
          <Download className="w-8 h-8 text-primary" />
        </div>
        
        <h2 className="text-xl font-bold text-center text-text mb-2">
          Atualização Disponível!
        </h2>
        
        <p className="text-center text-textMuted text-sm mb-6">
          Uma nova versão do aplicativo (<strong>v{updateData.version}</strong>) está disponível para download. 
          {updateData.mandatory ? " Esta atualização é obrigatória para continuar usando o app." : " Baixe agora para ter acesso aos novos recursos e correções."}
        </p>

        <a 
          href={updateData.update_url}
          target="_blank"
          rel="noreferrer"
          className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white font-bold py-3 rounded-xl transition-colors"
        >
          <Download className="w-5 h-5" />
          Baixar Atualização
        </a>
      </div>
    </div>
  );
}
