import { useState, useEffect } from 'react';
import { BookOpen, Plus, Search, Trash2, Edit2, X, ChevronLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Task } from './TaskList';

interface GrimoireProps {
  userId: string;
}

export default function Grimoire({ userId }: GrimoireProps) {
  const [notes, setNotes] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [viewingNote, setViewingNote] = useState<Task | null>(null);
  const [editingNote, setEditingNote] = useState<Task | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  useEffect(() => {
    fetchNotes();
  }, [userId]);

  const fetchNotes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .eq('list_id', 'journal')
      .order('created_at', { ascending: false });
      
    if (!error && data) {
      setNotes(data);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!title.trim()) return;

    if (editingNote) {
      const updated = { ...editingNote, title, description: content };
      setNotes(notes.map(n => n.id === editingNote.id ? updated : n));
      await supabase.from('tasks').update({ title, description: content }).eq('id', editingNote.id);
      setEditingNote(null);
      setViewingNote(updated); // Volta para o modo de leitura atualizado
    } else {
      const newNote = {
        id: crypto.randomUUID(),
        title,
        description: content,
        difficulty: 'easy',
        completed: false,
        user_id: userId,
        list_id: 'journal',
        created_at: new Date().toISOString(),
        due_date: null
      };
      setNotes([newNote as unknown as Task, ...notes]);
      await supabase.from('tasks').insert([newNote]);
      setIsAdding(false);
      setViewingNote(newNote as unknown as Task); // Já abre para leitura
    }
    setTitle('');
    setContent('');
  };

  const handleDeleteFromViewer = async () => {
    if (!viewingNote) return;
    if (!confirm('Deseja queimar esta página do grimório?')) return;
    setNotes(notes.filter(n => n.id !== viewingNote.id));
    await supabase.from('tasks').delete().eq('id', viewingNote.id);
    setViewingNote(null);
  };

  const handleEditFromViewer = () => {
    if (viewingNote) {
      setEditingNote(viewingNote);
      setTitle(viewingNote.title);
      setContent(viewingNote.description || '');
      setViewingNote(null);
    }
  };

  const openViewer = (note: Task) => {
    setViewingNote(note);
  };

  const cancelEdit = () => {
    if (editingNote) {
      setViewingNote(editingNote);
    }
    setEditingNote(null);
    setIsAdding(false);
    setTitle('');
    setContent('');
  };

  const filteredNotes = notes.filter(n => 
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (n.description && n.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (viewingNote) {
    return (
      <div className="animate-in fade-in zoom-in-95 duration-200 h-full flex flex-col pb-20">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => setViewingNote(null)} className="py-2 pr-4 pl-2 bg-surface border border-border rounded-xl hover:bg-black/5 transition-colors flex items-center gap-1 text-textMuted hover:text-text font-medium">
            <ChevronLeft className="w-5 h-5" /> Voltar
          </button>
          <div className="flex gap-2">
            <button onClick={handleEditFromViewer} className="p-2 bg-primary/10 text-primary border border-primary/20 rounded-xl hover:bg-primary/20 transition-colors" title="Editar">
              <Edit2 className="w-5 h-5" />
            </button>
            <button onClick={handleDeleteFromViewer} className="p-2 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl hover:bg-red-500/20 transition-colors" title="Apagar">
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="bg-surface border border-border rounded-2xl p-6 flex-1 overflow-y-auto custom-scrollbar shadow-sm">
          <h2 className="text-3xl font-black text-text mb-2 leading-tight">{viewingNote.title}</h2>
          <div className="text-[11px] text-textMuted/50 font-medium uppercase tracking-wider mb-8 flex items-center gap-1 border-b border-border pb-4">
            <BookOpen className="w-3 h-3" /> 
            Adicionado em {new Date(viewingNote.created_at || '').toLocaleDateString('pt-BR')}
          </div>
          <div className="text-text leading-relaxed whitespace-pre-wrap text-[15px]">
            {viewingNote.description || <span className="italic opacity-50 text-textMuted">Sem conteúdo escrito. Apenas um título ao vento...</span>}
          </div>
        </div>
      </div>
    );
  }

  if (isAdding || editingNote) {
    return (
      <div className="animate-in fade-in zoom-in-95 duration-200 h-full flex flex-col pb-20">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-black flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-primary" />
            {editingNote ? 'Editando Encantamento' : 'Nova Anotação'}
          </h2>
          <button onClick={cancelEdit} className="p-2 bg-surface border border-border rounded-xl hover:bg-black/5 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <input
          autoFocus
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Título da Anotação..."
          className="w-full bg-surface border border-border rounded-xl px-4 py-4 text-xl font-bold text-text mb-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-sm"
        />
        
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Escreva os detalhes da sua aventura, códigos, magias..."
          className="w-full flex-1 bg-surface border border-border rounded-xl px-4 py-4 text-text resize-none focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-sm"
        />
        
        <button 
          onClick={handleSave}
          disabled={!title.trim()}
          className="w-full mt-4 py-4 rounded-xl font-bold bg-primary hover:bg-primary/90 text-white transition-colors disabled:opacity-50 shadow-lg"
        >
          Salvar no Grimório
        </button>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500 pb-20">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-black text-text flex items-center gap-2">
            <BookOpen className="w-8 h-8 text-primary" />
            Grimório
          </h2>
          <p className="text-textMuted mt-1">Suas anotações, diário e feitiços</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="w-12 h-12 rounded-xl bg-primary hover:bg-primary/90 text-white flex items-center justify-center shadow-lg hover:shadow-primary/25 hover:-translate-y-1 transition-all"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-textMuted" />
        <input
          type="text"
          placeholder="Buscar no grimório..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-surface border border-border rounded-xl pl-10 pr-4 py-3 text-text placeholder:text-textMuted/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-sm"
        />
      </div>

      {loading ? (
        <div className="text-center py-10 text-textMuted font-medium animate-pulse">Folheando páginas...</div>
      ) : filteredNotes.length === 0 ? (
        <div className="text-center py-16 bg-surface border border-border rounded-2xl border-dashed">
          <BookOpen className="w-12 h-12 text-textMuted/30 mx-auto mb-3" />
          <p className="text-textMuted font-medium">Seu grimório está vazio.</p>
          <p className="text-sm text-textMuted/60 mt-1">Anote os detalhes das suas aventuras!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredNotes.map(note => (
            <div 
              key={note.id}
              onClick={() => openViewer(note)}
              className="bg-surface border border-border rounded-2xl p-5 hover:shadow-lg hover:border-primary/50 transition-all cursor-pointer group flex flex-col active:scale-[0.98]"
            >
              <h3 className="font-bold text-lg text-text line-clamp-1 mb-2">{note.title}</h3>
              <p className="text-sm text-textMuted line-clamp-4 flex-1 whitespace-pre-wrap">
                {note.description || <span className="italic opacity-50">Sem conteúdo...</span>}
              </p>
              <div className="mt-4 text-[10px] text-textMuted/50 font-medium uppercase tracking-wider flex items-center gap-1">
                <Edit2 className="w-3 h-3" /> 
                {new Date(note.created_at || '').toLocaleDateString('pt-BR')}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
