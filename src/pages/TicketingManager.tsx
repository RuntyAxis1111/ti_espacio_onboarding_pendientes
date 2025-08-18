import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import { 
  TicketIcon,
  PlusIcon, 
  XMarkIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';
import { supabase, Ticket, TicketStatus, TicketPriority, getTickets, createTicket, updateTicket } from '../lib/supabaseClient';

interface NewTicketForm {
  title: string;
  area: string;
  description: string;
  priority: TicketPriority;
}

const statusColors = {
  open: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' },
  in_progress: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300' },
  resolved: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' },
  closed: { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300' },
};

const priorityColors = {
  low: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300' },
  medium: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-300' },
  high: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300' },
  urgent: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' },
};

const areas = [
  'IT Support',
  'Hardware',
  'Software',
  'Network',
  'Security',
  'Access',
  'Email',
  'Phone',
  'Printer',
  'Other'
];

const TicketingManager: React.FC = () => {
  const queryClient = useQueryClient();
  const theme = useTheme();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState<NewTicketForm>({
    title: '',
    area: '',
    description: '',
    priority: 'medium'
  });
  const [formErrors, setFormErrors] = useState<Partial<NewTicketForm>>({});

  const { data: tickets = [], isLoading, error } = useQuery({
    queryKey: ['tickets'],
    queryFn: getTickets,
    refetchInterval: 30000,
  });

  // Real-time subscriptions
  useEffect(() => {
    const channel = supabase
      .channel('tickets_channel')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'tickets' 
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['tickets'] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Update ticket status
  const updateTicketStatus = async (id: string, status: TicketStatus) => {
    try {
      console.log(`🎫 Updating ticket ${id}: status = ${status}`);
      await updateTicket(id, { status });
      console.log(`✅ Successfully updated ticket ${id}: status = ${status}`);
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    } catch (error) {
      console.error('❌ Error updating ticket status:', error);
    }
  };

  // Update ticket priority
  const updateTicketPriority = async (id: string, priority: TicketPriority) => {
    try {
      console.log(`🎫 Updating ticket ${id}: priority = ${priority}`);
      await updateTicket(id, { priority });
      console.log(`✅ Successfully updated ticket ${id}: priority = ${priority}`);
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    } catch (error) {
      console.error('❌ Error updating ticket priority:', error);
    }
  };

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (ticket: NewTicketForm) => {
      console.log(`🎫 Creating new ticket:`, ticket);
      
      const ticketData = {
        title: ticket.title,
        area: ticket.area,
        description: ticket.description || null,
        priority: ticket.priority,
        status: 'open' as TicketStatus
      };
      
      console.log(`🎫 Ticket data to insert:`, ticketData);
      const result = await createTicket(ticketData);
      console.log(`✅ Ticket created successfully:`, result);
      return result;
    },
    onSuccess: () => {
      console.log(`✅ Ticket creation success`);
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      setShowCreateForm(false);
      setFormData({
        title: '',
        area: '',
        description: '',
        priority: 'medium'
      });
      setFormErrors({});
    },
    onError: (error: any) => {
      console.error(`❌ Ticket creation error:`, error);
    }
  });

  const validateForm = (): boolean => {
    const errors: Partial<NewTicketForm> = {};
    
    if (!formData.title.trim()) {
      errors.title = 'Título es requerido';
    }
    
    if (!formData.area.trim()) {
      errors.area = 'Área es requerida';
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
  const openTickets = tickets.filter(t => t.status === 'open').length;
  const totalTickets = tickets.length;

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="px-6 py-4 rounded-xl bg-red-50 border border-red-200 text-red-700">
          Error al cargar los tickets: {(error as Error).message}
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
            <TicketIcon className="h-8 w-8 mr-3 text-slate-700" />
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Sistema de Tickets
              </h1>
              <p className="text-slate-500">
                Gestión de solicitudes y soporte técnico
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center space-x-4">
            <div className="px-4 py-2 rounded-full text-sm font-medium bg-blue-100 text-blue-700 border border-blue-200">
              🎫 {openTickets} tickets abiertos
            </div>
            <div className="px-4 py-2 rounded-full text-sm font-medium bg-slate-100 text-slate-700 border border-slate-200">
              📊 {totalTickets} total
            </div>

            {/* Create button */}
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg text-white font-medium transition-colors bg-slate-900 hover:bg-slate-800"
              disabled={createMutation.isPending}
            >
              <PlusIcon className="h-4 w-4" />
              <span>Nuevo Ticket</span>
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
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider sticky left-0 z-30 bg-slate-50" style={{ width: '100px' }}>
                    # Ticket
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Título
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-32">
                    Área
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Descripción
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-32">
                    Estado
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-24">
                    Prioridad
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-32">
                    Creado
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {tickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    className="transition-all duration-300 hover:bg-slate-50"
                  >
                    <td className="px-6 py-4 text-sm font-bold text-slate-900 sticky left-0 z-10 bg-white" style={{ width: '100px' }}>
                      #{ticket.ticket_number}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">
                        {ticket.title}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {ticket.area}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-600 text-sm max-w-xs truncate">
                        {ticket.description || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={ticket.status}
                        onChange={(e) => updateTicketStatus(ticket.id, e.target.value as TicketStatus)}
                        className={`px-2 py-1 rounded text-xs font-medium border cursor-pointer ${
                          statusColors[ticket.status].bg
                        } ${statusColors[ticket.status].text} ${
                          statusColors[ticket.status].border
                        }`}
                      >
                        <option value="open">Abierto</option>
                        <option value="in_progress">En Progreso</option>
                        <option value="resolved">Resuelto</option>
                        <option value="closed">Cerrado</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={ticket.priority}
                        onChange={(e) => updateTicketPriority(ticket.id, e.target.value as TicketPriority)}
                        className={`px-2 py-1 rounded text-xs font-medium border cursor-pointer ${
                          priorityColors[ticket.priority].bg
                        } ${priorityColors[ticket.priority].text} ${
                          priorityColors[ticket.priority].border
                        }`}
                      >
                        <option value="low">Baja</option>
                        <option value="medium">Media</option>
                        <option value="high">Alta</option>
                        <option value="urgent">Urgente</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {new Date(ticket.created_at).toLocaleDateString('es-ES')}
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
                  Nuevo Ticket
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
                    Título del Ticket *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 text-slate-900"
                    placeholder="Ej: Problema con impresora"
                  />
                  {formErrors.title && (
                    <p className="text-xs mt-1 text-red-600">
                      {formErrors.title}
                    </p>
                  )}
                </div>

                {/* Area */}
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900">
                    Área *
                  </label>
                  <select
                    value={formData.area}
                    onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 text-slate-900"
                  >
                    <option value="">Seleccionar área...</option>
                    {areas.map(area => (
                      <option key={area} value={area}>{area}</option>
                    ))}
                  </select>
                  {formErrors.area && (
                    <p className="text-xs mt-1 text-red-600">
                      {formErrors.area}
                    </p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900">
                    Descripción (Opcional)
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 text-slate-900"
                    rows={3}
                    placeholder="Describe el problema o solicitud..."
                  />
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900">
                    Prioridad
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as TicketPriority })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 text-slate-900"
                  >
                    <option value="low">Baja</option>
                    <option value="medium">Media</option>
                    <option value="high">Alta</option>
                    <option value="urgent">Urgente</option>
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
                    {createMutation.isPending ? 'Creando...' : 'Crear Ticket'}
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

export default TicketingManager;