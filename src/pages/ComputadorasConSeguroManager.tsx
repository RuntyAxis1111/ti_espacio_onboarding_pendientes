import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import { 
  ComputerDesktopIcon,
  PlusIcon, 
  XMarkIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { supabase, ComputadoraConSeguro, getComputadorasConSeguro, createComputadoraConSeguro } from '../lib/supabaseClient';

interface NewComputadoraForm {
  numero_de_serie: string;
  numero_de_poliza: string;
  nombre_persona: string;
  vigencia_apple_care: string;
  vigencia_poliza_insurama: string;
}

const ComputadorasConSeguroManager: React.FC = () => {
  const queryClient = useQueryClient();
  const theme = useTheme();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState<NewComputadoraForm>({
    numero_de_serie: '',
    numero_de_poliza: '',
    nombre_persona: '',
    vigencia_apple_care: '',
    vigencia_poliza_insurama: ''
  });
  const [formErrors, setFormErrors] = useState<Partial<NewComputadoraForm>>({});

  const { data: computadoras = [], isLoading, error } = useQuery({
    queryKey: ['computadoras_con_seguro'],
    queryFn: getComputadorasConSeguro,
    refetchInterval: 30000,
  });

  // Real-time subscriptions
  useEffect(() => {
    const channel = supabase
      .channel('computadoras_con_seguro_channel')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'computadoras_con_seguro' 
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['computadoras_con_seguro'] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (computadora: NewComputadoraForm) => {
      console.log(`💻 Creating computadora con seguro:`, computadora);
      
      const computadoraData = {
        numero_de_serie: computadora.numero_de_serie,
        numero_de_poliza: computadora.numero_de_poliza,
        nombre_persona: computadora.nombre_persona,
        vigencia_apple_care: computadora.vigencia_apple_care || null,
        vigencia_poliza_insurama: computadora.vigencia_poliza_insurama
      };
      
      console.log(`💻 Computadora data to insert:`, computadoraData);
      const result = await createComputadoraConSeguro(computadoraData);
      console.log(`✅ Computadora created successfully:`, result);
      return result;
    },
    onSuccess: () => {
      console.log(`✅ Computadora creation success`);
      queryClient.invalidateQueries({ queryKey: ['computadoras_con_seguro'] });
      setShowCreateForm(false);
      setFormData({
        numero_de_serie: '',
        numero_de_poliza: '',
        nombre_persona: '',
        vigencia_apple_care: '',
        vigencia_poliza_insurama: ''
      });
      setFormErrors({});
    },
    onError: (error: any) => {
      console.error(`❌ Computadora creation error:`, error);
      if (error.code === '23505') {
        setFormErrors({ numero_de_serie: 'Este número de serie ya existe' });
      }
    }
  });

  const validateForm = (): boolean => {
    const errors: Partial<NewComputadoraForm> = {};
    
    if (!formData.numero_de_serie.trim()) {
      errors.numero_de_serie = 'Número de serie es requerido';
    }
    
    if (!formData.numero_de_poliza.trim()) {
      errors.numero_de_poliza = 'Número de póliza es requerido';
    }
    
    if (!formData.nombre_persona.trim()) {
      errors.nombre_persona = 'Nombre de la persona es requerido';
    }
    
    if (!formData.vigencia_poliza_insurama.trim()) {
      errors.vigencia_poliza_insurama = 'Vigencia póliza Insurama es requerida';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    createMutation.mutate(formData);
  };

  // Calculate stats
  const totalComputadoras = computadoras.length;
  const conAppleCare = computadoras.filter(c => c.vigencia_apple_care).length;

  // Check if insurance is expiring soon (within 30 days)
  const isExpiringSoon = (date: string) => {
    if (!date) return false;
    const expiryDate = new Date(date);
    const today = new Date();
    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30 && diffDays >= 0;
  };

  const isExpired = (date: string) => {
    if (!date) return false;
    const expiryDate = new Date(date);
    const today = new Date();
    return expiryDate < today;
  };

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="px-6 py-4 rounded-xl bg-red-50 border border-red-200 text-red-700">
          Error al cargar las computadoras: {(error as Error).message}
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
            <ShieldCheckIcon className="h-8 w-8 mr-3 text-slate-700" />
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Computadoras con Seguro
              </h1>
              <p className="text-slate-500">
                Gestión de equipos asegurados y pólizas
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center space-x-4">
            <div className="px-4 py-2 rounded-full text-sm font-medium bg-blue-100 text-blue-700 border border-blue-200">
              💻 {totalComputadoras} computadoras
            </div>
            <div className="px-4 py-2 rounded-full text-sm font-medium bg-green-100 text-green-700 border border-green-200">
              🍎 {conAppleCare} con Apple Care
            </div>

            {/* Create button */}
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg text-white font-medium transition-colors bg-slate-900 hover:bg-slate-800"
              disabled={createMutation.isPending}
            >
              <PlusIcon className="h-4 w-4" />
              <span>Nueva Computadora</span>
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
          <div className="overflow-x-auto table-wrapper" style={{ maxHeight: 'calc(100vh - 250px)' }}>
            <table className="w-full data-table">
              <thead className="sticky top-0 z-20 bg-slate-50">
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider sticky left-0 z-30 bg-slate-50" style={{ width: '180px' }}>
                    Número de Serie
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-40">
                    Número de Póliza
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-48">
                    Persona Asignada
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-40">
                    Vigencia Apple Care
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-40">
                    Vigencia Póliza Insurama
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-32">
                    Registrado
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {computadoras.map((computadora) => (
                  <tr
                    key={computadora.numero_de_serie}
                    className="transition-all duration-300 hover:bg-slate-50"
                  >
                    <td className="px-6 py-4 text-sm font-bold text-slate-900 sticky left-0 z-10 bg-white" style={{ width: '180px' }}>
                      {computadora.numero_de_serie}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {computadora.numero_de_poliza}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">
                        {computadora.nombre_persona}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {computadora.vigencia_apple_care ? (
                        <div className={`px-2 py-1 rounded text-xs font-medium ${
                          isExpired(computadora.vigencia_apple_care) 
                            ? 'bg-red-100 text-red-700 border border-red-300'
                            : isExpiringSoon(computadora.vigencia_apple_care)
                            ? 'bg-yellow-100 text-yellow-700 border border-yellow-300'
                            : 'bg-green-100 text-green-700 border border-green-300'
                        }`}>
                          {new Date(computadora.vigencia_apple_care).toLocaleDateString('es-ES')}
                        </div>
                      ) : (
                        <span className="text-slate-400">Sin Apple Care</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className={`px-2 py-1 rounded text-xs font-medium ${
                        isExpired(computadora.vigencia_poliza_insurama) 
                          ? 'bg-red-100 text-red-700 border border-red-300'
                          : isExpiringSoon(computadora.vigencia_poliza_insurama)
                          ? 'bg-yellow-100 text-yellow-700 border border-yellow-300'
                          : 'bg-green-100 text-green-700 border border-green-300'
                      }`}>
                        {new Date(computadora.vigencia_poliza_insurama).toLocaleDateString('es-ES')}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {new Date(computadora.created_at).toLocaleDateString('es-ES')}
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
                  Nueva Computadora con Seguro
                </h3>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-500"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleCreateSubmit} className="space-y-4">
                {/* Número de Serie */}
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900">
                    Número de Serie *
                  </label>
                  <input
                    type="text"
                    value={formData.numero_de_serie}
                    onChange={(e) => setFormData({ ...formData, numero_de_serie: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 text-slate-900"
                    placeholder="Ej: C02XK0AAJGH5"
                  />
                  {formErrors.numero_de_serie && (
                    <p className="text-xs mt-1 text-red-600">
                      {formErrors.numero_de_serie}
                    </p>
                  )}
                </div>

                {/* Número de Póliza */}
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900">
                    Número de Póliza *
                  </label>
                  <input
                    type="text"
                    value={formData.numero_de_poliza}
                    onChange={(e) => setFormData({ ...formData, numero_de_poliza: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 text-slate-900"
                    placeholder="Ej: POL-2024-001"
                  />
                  {formErrors.numero_de_poliza && (
                    <p className="text-xs mt-1 text-red-600">
                      {formErrors.numero_de_poliza}
                    </p>
                  )}
                </div>

                {/* Nombre Persona */}
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900">
                    Persona Asignada *
                  </label>
                  <input
                    type="text"
                    value={formData.nombre_persona}
                    onChange={(e) => setFormData({ ...formData, nombre_persona: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 text-slate-900"
                    placeholder="Ej: Juan Pérez"
                  />
                  {formErrors.nombre_persona && (
                    <p className="text-xs mt-1 text-red-600">
                      {formErrors.nombre_persona}
                    </p>
                  )}
                </div>

                {/* Vigencia Apple Care */}
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900">
                    Vigencia Apple Care (Opcional)
                  </label>
                  <input
                    type="date"
                    value={formData.vigencia_apple_care}
                    onChange={(e) => setFormData({ ...formData, vigencia_apple_care: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 text-slate-900"
                  />
                </div>

                {/* Vigencia Póliza Insurama */}
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900">
                    Vigencia Póliza Insurama *
                  </label>
                  <input
                    type="date"
                    value={formData.vigencia_poliza_insurama}
                    onChange={(e) => setFormData({ ...formData, vigencia_poliza_insurama: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 text-slate-900"
                  />
                  {formErrors.vigencia_poliza_insurama && (
                    <p className="text-xs mt-1 text-red-600">
                      {formErrors.vigencia_poliza_insurama}
                    </p>
                  )}
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
                    {createMutation.isPending ? 'Creando...' : 'Crear Computadora'}
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

export default ComputadorasConSeguroManager;