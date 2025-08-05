import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hqrobbmdvanuozzhjdun.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhxcm9iYm1kdmFudW96emhqZHVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4MjY0ODgsImV4cCI6MjA2NjQwMjQ4OH0.Pv6RDwe1-1rlxDPdEw-hD_kuxRDQsEwG4MK41QSzTdc';

export const supabase = createClient(supabaseUrl, supabaseKey);

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
  updated_at?: string;
  mandatory_ok?: boolean;
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