import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';

export interface CustomProject {
  id: string;
  name: string;
  color: string;
}

const PRESET_COLORS = [
  '#f43f5e', '#ef4444', '#f97316', '#f59e0b', '#eab308', 
  '#84cc16', '#22c55e', '#10b981', '#14b8a6', '#06b6d4', 
  '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', 
  '#d946ef', '#ec4899', '#64748b', '#71717a', '#78716c'
];

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (project: CustomProject) => void;
  onDelete?: (projectId: string) => void;
  initialProject: CustomProject | null;
}

export default function ProjectModal({ isOpen, onClose, onSave, onDelete, initialProject }: ProjectModalProps) {
  const [name, setName] = useState('');
  const [color, setColor] = useState(PRESET_COLORS[0]);

  useEffect(() => {
    if (isOpen) {
      if (initialProject) {
        setName(initialProject.name);
        setColor(initialProject.color || PRESET_COLORS[0]);
      } else {
        setName('');
        setColor(PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)]);
      }
    }
  }, [isOpen, initialProject]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      id: initialProject?.id || `proj_${Date.now()}`,
      name: name.trim(),
      color
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-surface w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-lg font-bold text-text">
            {initialProject ? 'Editar Projeto' : 'Novo Projeto'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-black/5 text-textMuted transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-bold text-textMuted mb-1.5">Nome do projeto</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Faculdade, Reforma, Finanças..."
              autoFocus
              className="w-full bg-black/5 border border-transparent rounded-lg px-4 py-2.5 text-[15px] text-text focus:outline-none focus:border-primary focus:bg-transparent transition-all placeholder:text-textMuted/50 font-medium"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-textMuted mb-2">Cor de identificação</label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
                  style={{ backgroundColor: c }}
                >
                  {color === c && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <button 
              type="submit" 
              disabled={!name.trim()}
              className="w-full py-2.5 bg-primary hover:bg-primary-hover text-white rounded-lg font-bold text-[15px] transition-colors disabled:opacity-50"
            >
              {initialProject ? 'Salvar Alterações' : 'Criar Projeto'}
            </button>
            
            {initialProject && onDelete && (
              <button 
                type="button" 
                onClick={() => {
                  if (confirm('Tem certeza que deseja excluir este projeto? Suas tarefas continuarão existindo na Entrada.')) {
                    onDelete(initialProject.id);
                    onClose();
                  }
                }}
                className="w-full py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg font-bold text-[15px] transition-colors"
              >
                Excluir Projeto
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
