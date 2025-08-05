import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import { 
  CheckCircleIcon, 
  PlusIcon, 
  XMarkIcon,
  UserPlusIcon 
} from '@heroicons/react/24/outline';
import { supabase, ITChecklist, getITChecklists } from '../lib/supabaseClient';

interface NewEmployeeForm {
  person_name: string;
  onboarding_date: string;
}

const ITChecklistManager: React.FC = () => {
  const queryClient = useQueryClient();
  const theme = useTheme();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState<NewEmployeeForm>({
    person_name: '',
    onboarding_date: new Date().toISOString().split('T')[0]
  });
  const [formErrors, setFormErrors] = useState<Partial<NewEmployeeForm>>({});

  const { data: checklists = [], isLoading, error } = useQuery({
    queryKey: ['it_checklists'],
    queryFn: getITChecklists,
    refetchInterval: 30000,
  });

  // Sort checklists alphabetically by person_name
  const sortedChecklists = [...checklists].sort((a, b) => 
    a.person_name.localeCompare(b.person_name, 'es', { sensitivity: 'base' })
  );

  // Real-time subscriptions
  useEffect(() => {
    const channel = supabase
      .channel('it_checklist_channel')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'it_checklist' 
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['it_checklists'] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Simple update function
  const updateField = async (person_name: string, field: string, value: boolean) => {
    try {
      console.log(`Updating ${person_name}: ${field} = ${value}`);
      
      const { error } = await supabase
        .from('it_checklist')
        .update({ [field]: value })
        .eq('person_name', person_name);
      
      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      console.log(`Successfully updated ${person_name}: ${field} = ${value}`);
      
      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['it_checklists'] });
      
    } catch (error) {
      console.error('Error updating field:', error);
    }
  };

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (employee: NewEmployeeForm) => {
      const { error } = await supabase
        .from('it_checklist')
        .insert([{
          person_name: employee.person_name,
          onboarding_date: employee.onboarding_date,
          antivirus: false,
          backup: false,
          onepassword: false,
          slack: false,
          monday: false,
          adobe: false,
          office: false,
          acrobat: false,
          billboard: false,
          rost: false,
          canva_pro: false,
          jumpcloud: false
        }]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['it_checklists'] });
      setShowCreateForm(false);
      setFormData({
        person_name: '',
        onboarding_date: new Date().toISOString().split('T')[0]
      });
      setFormErrors({});
    },
    onError: (error: any) => {
      console.error('Error creating employee:', error);
      if (error.code === '23505') {
        setFormErrors({ person_name: 'Este empleado ya existe' });
      }
    }
  });

  const validateForm = (): boolean => {
    const errors: Partial<NewEmployeeForm> = {};
    
    if (!formData.person_name.trim()) {
      errors.person_name = 'Nombre es requerido';
    }
    
    if (!formData.onboarding_date) {
      errors.onboarding_date = 'Fecha de onboarding es requerida';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    createMutation.mutate(formData);
  };

  const getRowStyle = (checklist: ITChecklist) => {
    if (checklist.jumpcloud) {
      return {
        backgroundColor: '#FFD700', // Gold
        color: '#0f172a' // slate-900
      };
    } else if (checklist.mandatory_ok) {
      return {
        backgroundColor: '#dcfce7', // emerald-100
        color: '#064e3b' // emerald-900
      };
    } else {
      return {
        backgroundColor: '#fecaca', // rose-100
        color: '#7f1d1d' // rose-900
      };
    }
  };

  // Simple Toggle Component
  const Toggle: React.FC<{ 
    checked: boolean; 
    onChange: () => void; 
  }> = ({ checked, onChange }) => (
    <button
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 focus:outline-none cursor-pointer ${
        checked ? 'bg-blue-600' : 'bg-gray-200'
      }`}
      style={{ 
        backgroundColor: checked ? theme.primaryAccent : '#e5e7eb'
      }}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );

  // Calculate progress
  const completedCount = sortedChecklists.filter(c => c.mandatory_ok).length;
  const totalCount = sortedChecklists.length;

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 min-h-screen" style={{ backgroundColor: theme.background }}>
        <div className="px-6 py-4 rounded-xl" style={{
          backgroundColor: `${theme.danger}20`,
          border: `1px solid ${theme.danger}30`,
          color: theme.danger
        }}>
          Error al cargar los checklists: {(error as Error).message}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 min-h-screen" style={{ backgroundColor: theme.background }}>
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <img 
              src="https://upload.wikimedia.org/wikipedia/commons/a/af/Tux.png"
              alt="Tux" 
              className="h-8 w-8 mr-2 inline-block" 
            />
            <CheckCircleIcon className="h-8 w-8 mr-3" style={{ color: theme.primaryAccent }} />
            <div>
              <h1 className="inline-block text-3xl font-bold" style={{ color: theme.textPrimary }}>
                IT Checklist Manager
              </h1>
              <p style={{ color: theme.textSecondary }}>
                Gestión de onboarding de empleados
              </p>
            </div>
          </div>

          {/* Progress Badge */}
          <div className="flex items-center space-x-4">
            <div 
              className="px-4 py-2 rounded-full text-sm font-medium"
              style={{
                backgroundColor: `${theme.success}20`,
                color: theme.success,
                border: `1px solid ${theme.success}30`
              }}
            >
              {completedCount} / {totalCount} checklist completos
            </div>

            {/* Create button */}
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg text-white font-medium transition-colors"
              style={{ backgroundColor: theme.primaryAccent }}
              disabled={createMutation.isPending}
            >
              <PlusIcon className="h-4 w-4" />
              <span>Nuevo empleado</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-4">
          <div className="animate-pulse">
            <div className="h-10 rounded" style={{ backgroundColor: theme.surfaceAlt }}></div>
            <div className="mt-4 space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 rounded" style={{ backgroundColor: theme.surfaceAlt }}></div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="table-wrapper overflow-x-auto rounded-xl border" style={{ borderColor: theme.tableBorder }}>
          <table className="data-table w-full" style={{ backgroundColor: theme.background }}>
            <thead>
              <tr style={{ backgroundColor: theme.tableHeaderBg }}>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider sticky left-0 z-10"
                  style={{ 
                    color: theme.textSecondary,
                    backgroundColor: theme.tableHeaderBg,
                    width: '220px',
                    minWidth: '220px'
                  }}
                >
                  Empleado
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: theme.textSecondary }}>
                  Fecha Onboarding
                </th>
                {/* Mandatory columns */}
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider" style={{ color: theme.textSecondary, width: '80px' }}>
                  Antivirus
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider" style={{ color: theme.textSecondary, width: '80px' }}>
                  Backup
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider" style={{ color: theme.textSecondary, width: '80px' }}>
                  1Password
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider" style={{ color: theme.textSecondary, width: '80px' }}>
                  Slack
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider" style={{ color: theme.textSecondary, width: '80px' }}>
                  Monday
                </th>
                {/* Extras sub-header */}
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider" style={{ color: '#6b7280', width: '80px' }}>
                  <span className="text-gray-500 font-semibold">Extras</span><br />
                  Adobe
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider" style={{ color: theme.textSecondary, width: '80px' }}>
                  Office
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider" style={{ color: theme.textSecondary, width: '80px' }}>
                  Acrobat
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider" style={{ color: theme.textSecondary, width: '80px' }}>
                  Billboard
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider" style={{ color: theme.textSecondary, width: '80px' }}>
                  Rost
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider" style={{ color: theme.textSecondary, width: '80px' }}>
                  Canva Pro
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider" style={{ color: theme.textSecondary, width: '80px' }}>
                  JumpCloud
                </th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ divideColor: theme.tableBorder }}>
              {sortedChecklists.map((checklist) => {
                const rowStyle = getRowStyle(checklist);
                return (
                  <tr
                    key={checklist.person_name}
                    style={{ ...rowStyle, transition: 'background-color 0.3s ease, color 0.3s ease' }}
                    className="transition-colors duration-300"
                  >
                    <td 
                      className="px-4 py-3 text-sm font-medium sticky left-0 z-10"
                      style={{ 
                        ...rowStyle,
                        width: '220px',
                        minWidth: '220px'
                      }}
                    >
                      {checklist.person_name}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {new Date(checklist.onboarding_date).toLocaleDateString('es-ES')}
                    </td>
                    {/* Mandatory toggles */}
                    <td className="px-4 py-3 text-center">
                      <Toggle
                        checked={checklist.antivirus}
                        onChange={() => updateField(checklist.person_name, 'antivirus', !checklist.antivirus)}
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Toggle
                        checked={checklist.backup}
                        onChange={() => updateField(checklist.person_name, 'backup', !checklist.backup)}
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Toggle
                        checked={checklist.onepassword}
                        onChange={() => updateField(checklist.person_name, 'onepassword', !checklist.onepassword)}
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Toggle
                        checked={checklist.slack}
                        onChange={() => updateField(checklist.person_name, 'slack', !checklist.slack)}
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Toggle
                        checked={checklist.monday}
                        onChange={() => updateField(checklist.person_name, 'monday', !checklist.monday)}
                      />
                    </td>
                    {/* Optional toggles */}
                    <td className="px-4 py-3 text-center">
                      <Toggle
                        checked={checklist.adobe || false}
                        onChange={() => updateField(checklist.person_name, 'adobe', !(checklist.adobe || false))}
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Toggle
                        checked={checklist.office || false}
                        onChange={() => updateField(checklist.person_name, 'office', !(checklist.office || false))}
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Toggle
                        checked={checklist.acrobat || false}
                        onChange={() => updateField(checklist.person_name, 'acrobat', !(checklist.acrobat || false))}
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Toggle
                        checked={checklist.billboard || false}
                        onChange={() => updateField(checklist.person_name, 'billboard', !(checklist.billboard || false))}
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Toggle
                        checked={checklist.rost || false}
                        onChange={() => updateField(checklist.person_name, 'rost', !(checklist.rost || false))}
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Toggle
                        checked={checklist.canva_pro || false}
                        onChange={() => updateField(checklist.person_name, 'canva_pro', !(checklist.canva_pro || false))}
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Toggle
                        checked={checklist.jumpcloud || false}
                        onChange={() => updateField(checklist.person_name, 'jumpcloud', !(checklist.jumpcloud || false))}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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
              className="rounded-xl p-6 w-full max-w-md"
              style={{ backgroundColor: theme.background }}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold" style={{ color: theme.textPrimary }}>
                  Nuevo Empleado
                </h3>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="p-1 rounded-lg hover:bg-opacity-10"
                  style={{ color: theme.textSecondary }}
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleCreateSubmit} className="space-y-4">
                {/* Person Name */}
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: theme.textPrimary }}>
                    Nombre del Empleado *
                  </label>
                  <input
                    type="text"
                    value={formData.person_name}
                    onChange={(e) => setFormData({ ...formData, person_name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                    style={{
                      backgroundColor: theme.background,
                      borderColor: formErrors.person_name ? theme.danger : theme.tableBorder,
                      color: theme.textPrimary
                    }}
                    placeholder="Ej: Juan Pérez"
                  />
                  {formErrors.person_name && (
                    <p className="text-xs mt-1" style={{ color: theme.danger }}>
                      {formErrors.person_name}
                    </p>
                  )}
                </div>

                {/* Onboarding Date */}
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: theme.textPrimary }}>
                    Fecha de Onboarding *
                  </label>
                  <input
                    type="date"
                    value={formData.onboarding_date}
                    onChange={(e) => setFormData({ ...formData, onboarding_date: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                    style={{
                      backgroundColor: theme.background,
                      borderColor: formErrors.onboarding_date ? theme.danger : theme.tableBorder,
                      color: theme.textPrimary
                    }}
                  />
                  {formErrors.onboarding_date && (
                    <p className="text-xs mt-1" style={{ color: theme.danger }}>
                      {formErrors.onboarding_date}
                    </p>
                  )}
                </div>

                {/* Buttons */}
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="flex-1 px-4 py-2 border rounded-lg font-medium transition-colors"
                    style={{
                      borderColor: theme.tableBorder,
                      color: theme.textSecondary
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending}
                    className="flex-1 px-4 py-2 rounded-lg text-white font-medium transition-colors disabled:opacity-50"
                    style={{ backgroundColor: theme.primaryAccent }}
                  >
                    {createMutation.isPending ? 'Creando...' : 'Crear Empleado'}
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

export default ITChecklistManager;