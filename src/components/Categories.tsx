import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X, Tags, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Category } from '../types';
import { cn } from '../lib/utils';
import { useDataSync } from '../hooks/useDataSync';

interface CategoriesProps {
  onViewProducts?: (categoryId: number) => void;
}

export default function Categories({ onViewProducts }: CategoriesProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    prefix: '',
    description: ''
  });

  const fetchCategories = () => {
    fetch('/api/categories')
      .then(res => res.json())
      .then(setCategories);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useDataSync(fetchCategories);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingCategory ? `/api/categories/${editingCategory.id}` : '/api/categories';
    const method = editingCategory ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    if (res.ok) {
      setIsModalOpen(false);
      setEditingCategory(null);
      setFormData({ name: '', prefix: '', description: '' });
      fetchCategories();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Categorías</h2>
          <p className="text-sm text-gray-500">Organiza tus productos por categorías y prefijos.</p>
        </div>
        <button 
          onClick={() => {
            setEditingCategory(null);
            setFormData({ name: '', prefix: '', description: '' });
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 transition-colors shadow-lg shadow-green-500/20"
        >
          <Plus size={20} />
          Nueva Categoría
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input 
          type="text"
          placeholder="Buscar categoría..."
          className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 transition-all shadow-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.filter(c => c.name.toLowerCase().includes(search.toLowerCase())).map((cat) => (
          <div key={cat.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-green-600">
                <Tags size={24} />
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => {
                    setEditingCategory(cat);
                    setFormData({ name: cat.name, prefix: cat.prefix, description: cat.description || '' });
                    setIsModalOpen(true);
                  }}
                  className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Edit size={18} />
                </button>
                <button 
                  onClick={async () => {
                    if (confirm('¿Estás seguro de eliminar esta categoría?')) {
                      const res = await fetch(`/api/categories/${cat.id}`, { method: 'DELETE' });
                      if (res.ok) fetchCategories();
                    }
                  }}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-gray-900">{cat.name}</h3>
                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-bold uppercase rounded-md">
                  {cat.prefix}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">{cat.description || 'Sin descripción'}</p>
            </div>
            <div className="mt-6 pt-4 border-t border-gray-50 flex items-center justify-between">
              <span className="text-xs text-gray-400">Estado: <span className="text-green-600 font-bold capitalize">{cat.status}</span></span>
              <button 
                onClick={() => onViewProducts?.(cat.id)}
                className="text-xs text-green-600 font-bold hover:underline"
              >
                Ver productos
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">
                  {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-gray-700">Nombre de la Categoría</label>
                  <input 
                    required
                    type="text"
                    placeholder="Ej. Lácteos"
                    className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-green-500"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-gray-700">Prefijo (2-3 letras)</label>
                  <input 
                    required
                    maxLength={3}
                    type="text"
                    placeholder="Ej. LC"
                    className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-green-500 uppercase"
                    value={formData.prefix || ''}
                    onChange={(e) => setFormData({...formData, prefix: e.target.value.toUpperCase()})}
                  />
                  <p className="text-[10px] text-gray-400 font-medium">Se usará para generar códigos automáticos (Ej. LC001)</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-gray-700">Descripción</label>
                  <textarea 
                    rows={3}
                    className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-green-500"
                    value={formData.description || ''}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                  />
                </div>

                <div className="mt-8 flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-6 py-3 bg-gray-100 text-gray-600 font-bold rounded-2xl hover:bg-gray-200 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 px-6 py-3 bg-green-500 text-white font-bold rounded-2xl shadow-lg shadow-green-500/20 hover:bg-green-600 transition-colors"
                  >
                    {editingCategory ? 'Guardar Cambios' : 'Crear Categoría'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
