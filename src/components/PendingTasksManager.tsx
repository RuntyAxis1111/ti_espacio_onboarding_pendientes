import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import { 
  PlusIcon, 
  XMarkIcon,
  ClipboardDocumentListIcon 
} from '@heroicons/react/24/outline';
import { supabase, PendingTask, ImportanceLevel, getPendingTasks, updateTask, createTask } from '../lib/supabaseClient';

interface PendingTasksManagerProps {
  tableName: string;
  title: string;
}

interface NewTaskForm {
  title: string;
  description: string;
  start_date: string;
  due_date: string;
  importance: ImportanceLevel;
}

const importanceColors = {
  baja: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300' },
  media: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-300' },
  alta: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300' },
  critica: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' },
};

const PendingTasksManager: React.FC<PendingTasksManagerProps> = ({ tableName, title }) => {
  const queryClient = useQueryClient();
  const theme = useTheme();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState<NewTaskForm>({
    title: '',
    description: '',
    start_date: '',
    due_date: '',
    importance: 'media'
  });
  const [formErrors, setFormErrors] = useState<Partial<NewTaskForm>>({});

  const { data: tasks = [], isLoading, error } = useQuery({
    queryKey: ['pending_tasks', tableName],
    queryFn: () => getPendingTasks(tableName),
    refetchInterval: 30000,
  });

  // Real-time subscriptions
  useEffect(() => {
    const channel = supabase
      .channel(`${tableName}_channel`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: tableName 
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['pending_tasks', tableName] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, tableName]);

  // Update field function
  const updateField = async (id: string, field: string, value: any) => {
    try {
      console.log(`Updating task ${id}: ${field} = ${value}`);
      
      await updateTask(tableName, id, { [field]: value });
      
      console.log(`Successfully updated task ${id}: ${field} = ${value}`);
      
      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['pending_tasks', tableName] });
      
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (task: NewTaskForm) => {
      await createTask(tableName, {
        ...task,
        completed: false
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending_tasks', tableName] });
      setShowCreateForm(false);
      setFormData({
        title: '',
        description: '',
        start_date: '',
        due_date: '',
        importance: 'media'
      });
      setFormErrors({});
    },
    onError: (error: any) => {
      console.error('Error creating task:', error);
    }
  });

  const validateForm = (): boolean => {
    const errors: Partial<NewTaskForm> = {};
    
    if (!formData.title.trim()) {
      errors.title = 'Título es requerido';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    createMutation.mutate(formData);
  };

  // Calculate progress
  const completedCount = tasks.filter(t => t.completed).length;
  const totalCount = tasks.length;

  // Simple Toggle Component
  const Toggle: React.FC<{ 
    checked: boolean; 
    onChange: () => void; 
  }> = ({ checked, onChange }) => (
    <button
      onClick={onChange}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-slate-400/50 cursor-pointer ${
        checked ? 'bg-slate-700' : 'bg-slate-300'
      }`}
    >
      <span
        className={`inline-block h-3 w-3 transform rounded-full bg-slate-50 transition-transform duration-300 ${
          checked ? 'translate-x-5' : 'translate-x-1'
        }`}
      />
    </button>
  );

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="px-6 py-4 rounded-xl bg-red-50 border border-red-200 text-red-700">
          Error al cargar las tareas: {(error as Error).message}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <ClipboardDocumentListIcon className="h-8 w-8 mr-3 text-slate-700" />
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                {title}
              </h1>
              <p className="text-slate-500">
                Gestión de tareas pendientes
              </p>
            </div>
          </div>

          {/* Progress Badge */}
          <div className="flex items-center space-x-4">
            <div className="px-4 py-2 rounded-full text-sm font-medium bg-emerald-100 text-emerald-700 border border-emerald-200">
              📋 {completedCount} / {totalCount} completadas
            </div>

            {/* Create button */}
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg text-white font-medium transition-colors bg-slate-900 hover:bg-slate-800"
              disabled={createMutation.isPending}
            >
              <PlusIcon className="h-4 w-4" />
              <span>Nueva tarea</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-4">
          <div className="animate-pulse">
            <div className="h-10 bg-slate-200 rounded"></div>
            <div className="mt-4 space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-slate-100 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-16">
                    ✅ Done
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Título
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Descripción
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-32">
                    Comienzo
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-32">
                    Límite
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-24">
                    Nivel
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {tasks.map((task) => (
                  <tr
                    key={task.id}
                    className={`transition-all duration-300 hover:bg-slate-50 ${
                      task.completed ? 'opacity-60' : ''
                    }`}
                  >
                    <td className="px-6 py-4">
                      <Toggle
                        checked={task.completed}
                        onChange={() => updateField(task.id, 'completed', !task.completed)}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div
                        className={`font-bold text-slate-900 ${
                          task.completed ? 'line-through' : ''
                        }`}
                      >
                        {task.title}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div
                        className={`text-slate-600 text-sm ${
                          task.completed ? 'line-through' : ''
                        }`}
                        style={{ wordWrap: 'break-word' }}
                      >
                        {task.description || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {task.start_date ? new Date(task.start_date).toLocaleDateString('es-ES') : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {task.due_date ? new Date(task.due_date).toLocaleDateString('es-ES') : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={task.importance}
                        onChange={(e) => updateField(task.id, 'importance', e.target.value)}
                        className={`px-2 py-1 rounded text-xs font-medium border cursor-pointer ${
                          importanceColors[task.importance].bg
                        } ${importanceColors[task.importance].text} ${
                          importanceColors[task.importance].border
                        }`}
                      >
                        <option value="baja">Baja</option>
                        <option value="media">Media</option>
                        <option value="alta">Alta</option>
                        <option value="critica">Crítica</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Form Modal */}
      <AnimatePresence>
        {showCreateForm && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-xl p-6 w-full max-w-md"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-slate-900">
                  Nueva Tarea
                </h3>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-500"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleCreateSubmit} className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900">
                    Título *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 text-slate-900"
                    placeholder="Ej: Revisar documentación"
                  />
                  {formErrors.title && (
                    <p className="text-xs mt-1 text-red-600">
                      {formErrors.title}
                    </p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900">
                    Descripción
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 text-slate-900"
                    rows={3}
                    placeholder="Descripción opcional..."
                  />
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-slate-900">
                      Fecha inicio
                    </label>
                    <input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-slate-900">
                      Fecha límite
                    </label>
                    <input
                      type="date"
                      value={formData.due_date}
                      onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 text-slate-900"
                    />
                  </div>
                </div>

                {/* Importance */}
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900">
                    Importancia
                  </label>
                  <select
                    value={formData.importance}
                    onChange={(e) => setFormData({ ...formData, importance: e.target.value as ImportanceLevel })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 text-slate-900"
                  >
                    <option value="baja">Baja</option>
                    <option value="media">Media</option>
                    <option value="alta">Alta</option>
                    <option value="critica">Crítica</option>
                  </select>
                </div>

                {/* Buttons */}
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="flex-1 px-4 py-2 border border-slate-300 rounded-lg font-medium transition-colors text-slate-700 hover:bg-slate-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending}
                    className="flex-1 px-4 py-2 rounded-lg text-white font-medium transition-colors disabled:opacity-50 bg-slate-900 hover:bg-slate-800"
                  >
                    {createMutation.isPending ? 'Creando...' : 'Crear Tarea'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PendingTasksManager;