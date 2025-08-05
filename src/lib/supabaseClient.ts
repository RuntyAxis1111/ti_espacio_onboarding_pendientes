import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hqrobbmdvanuozzhjdun.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhxcm9iYm1kdmFudW96emhqZHVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4MjY0ODgsImV4cCI6MjA2NjQwMjQ4OH0.Pv6RDwe1-1rlxDPdEw-hD_kuxRDQsEwG4MK41QSzTdc';

export const supabase = createClient(supabaseUrl, supabaseKey);

export interface Equipo {
  serial_number: string;
  model: 'mac_pro' | 'mac_air' | 'lenovo';
  company: 'HBL' | 'AJA';
  assigned_to: string | null;
  insured: boolean;
  purchase_date: string | null;
  purchase_cost: number | null;
  file_url: string | null;
  created_at?: string;
  updated_at?: string;
  // Campos calculados de depreciación
  book_value_today?: number;
  rate?: number;
  depreciation_y1?: number;
  depreciation_y2?: number;
  depreciation_y3?: number;
  depreciation_y4?: number;
  depreciation_y5?: number;
  years_elapsed?: number;
  years_exact?: number;
}

export interface DepreciacionData {
  serial_number: string;
  year_number: number;
  depreciation_year: number;
  book_value_end_year: number;
}

// Función para obtener equipos con datos de depreciación en tiempo real
export const getEquiposWithDepreciation = async (): Promise<Equipo[]> => {
  // Obtener equipos con depreciación usando la vista v2
  const { data: equiposDepreciacion, error: depError } = await supabase
    .from('equipos_depreciacion_v2')
    .select('serial_number, purchase_cost, purchase_date, model, year_number, rate, residual_pct, depreciation_year, book_value_end_year')
    .order('serial_number', { ascending: true });
  
  if (depError) throw depError;
  if (!equiposDepreciacion) return [];

  // Obtener datos adicionales de equipos_ti que no están en la vista live
  const { data: equiposBase, error: baseError } = await supabase
    .from('equipos_ti')
    .select('serial_number, company, assigned_to, insured, file_url, created_at, updated_at')
    .order('serial_number', { ascending: true });
  
  if (baseError) throw baseError;

  // Agrupar datos de depreciación por serial_number
  const equiposGrouped = equiposDepreciacion.reduce((acc, item) => {
    if (!acc[item.serial_number]) {
      acc[item.serial_number] = {
        serial_number: item.serial_number,
        model: item.model,
        purchase_date: item.purchase_date,
        purchase_cost: item.purchase_cost,
        rate: item.rate,
        residual_pct: item.residual_pct,
        depreciation_year: item.depreciation_year,
        years_by_number: {}
      };
    }
    acc[item.serial_number].years_by_number[item.year_number] = item;
    return acc;
  }, {} as Record<string, any>);

  // Combinar todos los datos
  return Object.values(equiposGrouped).map(equipoData => {
    const equipoBase = equiposBase?.find(e => e.serial_number === equipoData.serial_number);
    
    // Calcular años transcurridos exactos (con decimales)
    const yearsExact = equipoData.purchase_date 
      ? Math.min(5, (new Date().getTime() - new Date(equipoData.purchase_date).getTime()) / (1000 * 60 * 60 * 24 * 365))
      : 0;
    
    // Calcular años transcurridos (enteros para referencia)
    const yearsElapsed = Math.floor(yearsExact);
    
    // Calcular valor libro en tiempo real
    const bookValueToday = equipoData.purchase_cost && equipoData.rate
      ? Math.max(
          equipoData.purchase_cost - (equipoData.purchase_cost * equipoData.rate * yearsExact),
          equipoData.purchase_cost * equipoData.residual_pct
        )
      : equipoData.purchase_cost || 0;
    
    // Obtener depreciaciones por año
    const depreciation_y1 = equipoData.years_by_number[1]?.depreciation_year || 0;
    const depreciation_y2 = equipoData.years_by_number[2]?.depreciation_year || 0;
    const depreciation_y3 = equipoData.years_by_number[3]?.depreciation_year || 0;
    const depreciation_y4 = equipoData.years_by_number[4]?.depreciation_year || 0;
    const depreciation_y5 = equipoData.years_by_number[5]?.depreciation_year || 0;

    return {
      // Datos base del equipo
      serial_number: equipoData.serial_number,
      model: equipoData.model,
      purchase_date: equipoData.purchase_date,
      purchase_cost: equipoData.purchase_cost,
      company: equipoBase?.company || 'AJA',
      assigned_to: equipoBase?.assigned_to || null,
      insured: equipoBase?.insured || false,
      file_url: equipoBase?.file_url || null,
      created_at: equipoBase?.created_at,
      updated_at: equipoBase?.updated_at,
      
      // Datos de depreciación en tiempo real
      rate: equipoData.rate,
      book_value_today: bookValueToday,
      years_exact: yearsExact,
      
      // Depreciaciones por año (fijas)
      depreciation_y1,
      depreciation_y2,
      depreciation_y3,
      depreciation_y4,
      depreciation_y5,
      years_elapsed: yearsElapsed
    };
  });
};

export const uploadPDF = async (file: File, equipoSerial: string) => {
  // Validate file type
  if (file.type !== 'application/pdf') {
    throw new Error('Solo se permiten archivos PDF');
  }
  
  // Validate file size (20MB limit)
  if (file.size > 20 * 1024 * 1024) {
    throw new Error('El archivo no puede ser mayor a 20MB');
  }
  
  const fileName = `${equipoSerial}_${Date.now()}.pdf`;
  const filePath = `facturas/${fileName}`;
  
  const { data, error } = await supabase.storage
    .from('facturas')
    .upload(filePath, file, { upsert: false });
  
  if (error) throw error;
  
  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('facturas')
    .getPublicUrl(filePath);
  
  return { path: data.path, publicUrl };
};

export const getPublicUrl = (filePath: string) => {
  const { data: { publicUrl } } = supabase.storage
    .from('facturas')
    .getPublicUrl(filePath);
  
  return publicUrl;
};