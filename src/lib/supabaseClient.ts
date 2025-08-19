import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://hqrobbmdvanuozzhjdun.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhxcm9iYm1kdmFudW96emhqZHVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4MjY0ODgsImV4cCI6MjA2NjQwMjQ4OH0.Pv6RDwe1-1rlxDPdEw-hD_kuxRDQsEwG4MK41QSzTdc';

export const supabase = createClient(supabaseUrl, supabaseKey);

export type ImportanceLevel = 'baja' | 'media' | 'alta' | 'critica';

export interface PendingTask {
  id: string;
  title: string;
  description?: string;
  start_date?: string;
  due_date?: string;
  importance: ImportanceLevel;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface ITChecklist {
  person_name: string;
  onboarding_date: string;
  antivirus: boolean;
  backup: boolean;
  onepassword: boolean;
  slack: boolean;
  monday: boolean;
  adobe?: boolean;
  office?: boolean;
  acrobat?: boolean;
  billboard?: boolean;
  rost?: boolean;
  canva_pro?: boolean;
  jumpcloud?: boolean;
  chatgpt?: boolean;
  updated_at?: string;
  mandatory_ok?: boolean;
  comments?: string;
}

export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Ticket {
  id: string;
  ticket_number: number;
  title: string;
  area: string;
  requester_name?: string;
  description?: string;
  status: TicketStatus;
  priority: TicketPriority;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface ComputadoraConSeguro {
  numero_de_serie: string;
  numero_de_poliza: string;
  nombre_persona: string;
  vigencia_apple_care?: string;
  vigencia_poliza_insurama: string;
  created_at: string;
}

// Función para obtener todos los checklists
export const getITChecklists = async (): Promise<ITChecklist[]> => {
  const { data, error } = await supabase
    .from('it_checklist')
    .select('*')
    .order('onboarding_date', { ascending: false });
  
  if (error) throw error;
  return data || [];
};

// Funciones para computadoras con seguro
export const getComputadorasConSeguro = async (): Promise<ComputadoraConSeguro[]> => {
  const { data, error } = await supabase
    .from('computadoras_con_seguro')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
};

export const createComputadoraConSeguro = async (computadora: Omit<ComputadoraConSeguro, 'created_at'>) => {
  const { data, error } = await supabase
    .from('computadoras_con_seguro')
    .insert([computadora])
    .select();
  
  if (error) throw error;
  return data;
};

export const updateComputadoraConSeguro = async (numero_de_serie: string, updates: Partial<ComputadoraConSeguro>) => {
  const { error } = await supabase
    .from('computadoras_con_seguro')
    .update(updates)
    .eq('numero_de_serie', numero_de_serie);
  
  if (error) throw error;
};

// Funciones para tickets
export const getTickets = async (): Promise<Ticket[]> => {
  const { data, error } = await supabase
    .from('tickets')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
};

export const createTicket = async (ticket: Omit<Ticket, 'id' | 'ticket_number' | 'created_at' | 'updated_at' | 'created_by'>) => {
  const { data, error } = await supabase
    .from('tickets')
    .insert([ticket])
    .select();
  
  if (error) throw error;
  return data;
};

export const updateTicket = async (id: string, updates: Partial<Ticket>) => {
  const { error } = await supabase
    .from('tickets')
    .update(updates)
    .eq('id', id);
  
  if (error) throw error;
};

// Función para obtener tareas pendientes
export const getPendingTasks = async (table: string): Promise<PendingTask[]> => {
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
};

// Función para actualizar una tarea
export const updateTask = async (table: string, id: string, updates: Partial<PendingTask>) => {
  const { error } = await supabase
    .from(table)
    .update(updates)
    .eq('id', id);
  
  if (error) throw error;
};

// Función para crear una nueva tarea
export const createTask = async (table: string, task: Omit<PendingTask, 'id' | 'created_at' | 'updated_at'>) => {
  const { error } = await supabase
    .from(table)
    .insert([task]);
  
  if (error) throw error;
};