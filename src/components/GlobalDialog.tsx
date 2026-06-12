import { useDialogStore } from '../lib/dialogs';
import { AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';

export default function GlobalDialog() {
  const { isOpen, options, close } = useDialogStore();

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (options.onConfirm) options.onConfirm();
    close();
  };

  const handleCancel = () => {
    if (options.onCancel) options.onCancel();
    close();
  };

  const Icon = () => {
    switch (options.type) {
      case 'success': return <CheckCircle className="w-8 h-8 text-emerald-500" />;
      case 'error': return <AlertCircle className="w-8 h-8 text-red-500" />;
      case 'warning': return <AlertTriangle className="w-8 h-8 text-yellow-500" />;
      default: return <Info className="w-8 h-8 text-primary" />;
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-surface w-full max-w-sm rounded-2xl shadow-2xl border border-border overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        <div className="p-6 flex flex-col items-center text-center">
          <div className="mb-4">
            <Icon />
          </div>
          <h2 className="text-xl font-bold text-text mb-2">
            {options.title || 'Atenção'}
          </h2>
          <p className="text-textMuted whitespace-pre-wrap">
            {options.message}
          </p>
        </div>

        <div className="p-4 border-t border-border bg-black/5 flex gap-3">
          {options.isConfirm ? (
            <>
              <button 
                onClick={handleCancel}
                className="flex-1 py-2 px-4 bg-black/10 hover:bg-black/20 text-textMuted font-bold rounded-lg transition-colors"
              >
                {options.cancelText || 'Cancelar'}
              </button>
              <button 
                onClick={handleConfirm}
                className="flex-1 py-2 px-4 bg-primary hover:bg-primary-hover text-white font-bold rounded-lg transition-colors shadow-lg shadow-primary/20"
              >
                {options.confirmText || 'Confirmar'}
              </button>
            </>
          ) : (
            <button 
              onClick={close}
              className="w-full py-2 px-4 bg-primary hover:bg-primary-hover text-white font-bold rounded-lg transition-colors shadow-lg shadow-primary/20"
            >
              {options.confirmText || 'OK'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
