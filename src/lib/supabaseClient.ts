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

// Función para obtener todos los checklists
export const getITChecklists = async (): Promise<ITChecklist[]> => {
  const { data, error } = await supabase
    .from('it_checklist')
    .select('*')
    .order('onboarding_date', { ascending: false });
  
  if (error) throw error;
  return data || [];
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