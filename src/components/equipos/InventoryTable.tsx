import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';
import { Equipo, uploadPDF, getEquiposWithDepreciation } from '../../lib/supabaseClient';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  DocumentArrowUpIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  DocumentIcon,
  ArrowDownTrayIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import dayjs from 'dayjs';

interface InventoryTableProps {
  equipos: Equipo[];
  isLoading: boolean;
  onUpdate: (serial: string, field: keyof Equipo, value: any) => Promise<void>;
  onCreate: (equipo: Omit<Equipo, 'created_at' | 'updated_at'>) => Promise<void>;
  isUpdating: boolean;
  isCreating: boolean;
}

interface NewEquipoForm {
  serial_number: string;
  model: 'mac_pro' | 'mac_air' | 'lenovo';
  company: 'HBL' | 'AJA';
  assigned_to: string;
  insured: boolean;
  purchase_date: string;
  purchase_cost: string;
  file_url: string;
}

const MODEL_LABELS = {
  mac_air: 'Mac Air',
  mac_pro: 'Mac Pro',
  lenovo: 'Lenovo'
};

const InventoryTable: React.FC<InventoryTableProps> = ({
  equipos,
  isLoading,
  onUpdate,
  onCreate,
  isUpdating,
  isCreating
}) => {
  const theme = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCell, setEditingCell] = useState<{ serial: string; field: keyof Equipo } | null>(null);
  const [tempValue, setTempValue] = useState('');
  const [formData, setFormData] = useState<NewEquipoForm>({
    serial_number: '',
    model: 'mac_air',
    company: 'AJA',
    assigned_to: '',
    insured: false,
    purchase_date: '2024-01-01',
    purchase_cost: '25000',
    file_url: ''
  });
  const [formErrors, setFormErrors] = useState<Partial<NewEquipoForm>>({});
  const [uploadingPDF, setUploadingPDF] = useState<string | null>(null);

  // Filter equipos based on search term
  const filteredEquipos = useMemo(() => {
    if (!searchTerm) return equipos;
    
    const term = searchTerm.toLowerCase();
    return equipos.filter(equipo =>
      equipo.serial_number.toLowerCase().includes(term) ||
      MODEL_LABELS[equipo.model].toLowerCase().includes(term) ||
      (equipo.assigned_to && equipo.assigned_to.toLowerCase().includes(term)) ||
      equipo.company.toLowerCase().includes(term)
    );
  }, [equipos, searchTerm]);

  const downloadCSV = async () => {
    try {
      // Get equipment data with depreciation
      const equiposWithDepreciation = await getEquiposWithDepreciation();
      
      if (!equiposWithDepreciation || equiposWithDepreciation.length === 0) return;

      // Create CSV content with proper headers and data formatting
      const csvContent = [
        [
          'serial_number', 'model', 'company', 'assigned_to', 'insured', 
          'purchase_date', 'purchase_cost', 'depreciation_y1', 'depreciation_y2', 
          'depreciation_y3', 'depreciation_y4', 'depreciation_y5', 'valor_libro', 'file_url'
        ],
        ...equiposWithDepreciation.map(item => [
          item.serial_number || '',
          MODEL_LABELS[item.model as keyof typeof MODEL_LABELS] || item.model,
          item.company || '',
          item.assigned_to || '',
          item.insured ? 'true' : 'false',
          item.purchase_date || '',
          item.purchase_cost?.toString() || '',
          item.depreciation_y1?.toFixed(2) || '0.00',
          item.depreciation_y2?.toFixed(2) || '0.00',
          item.depreciation_y3?.toFixed(2) || '0.00',
          item.depreciation_y4?.toFixed(2) || '0.00',
          item.depreciation_y5?.toFixed(2) || '0.00',
          item.valor_libro?.toFixed(2) || '0.00',
          item.file_url || ''
        ])
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `equipos_depreciacion_${dayjs().format('YYYY-MM-DD')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading CSV:', error);
    }
  };

  const handleCellEdit = (serial: string, field: keyof Equipo, currentValue: any) => {
    setEditingCell({ serial, field });
    setTempValue(currentValue || '');
  };

  const handleCellSave = async () => {
    if (!editingCell) return;
    
    try {
      let processedValue = tempValue;
      
      // Process different field types
      if (editingCell.field === 'insured') {
        processedValue = tempValue === 'true' || tempValue === true;
      } else if (editingCell.field === 'purchase_cost') {
        processedValue = tempValue ? parseFloat(tempValue) : null;
      } else if (editingCell.field === 'purchase_date') {
        processedValue = tempValue || null;
      }
      
      await onUpdate(editingCell.serial, editingCell.field, processedValue);
      setEditingCell(null);
      setTempValue('');
    } catch (error) {
      console.error('Error saving cell:', error);
    }
  };

  const handleCellCancel = () => {
    setEditingCell(null);
    setTempValue('');
  };

  const validateForm = (): boolean => {
    const errors: Partial<NewEquipoForm> = {};
    
    if (!formData.serial_number.trim()) {
      errors.serial_number = 'Número de serie es requerido';
    }
    
    if (!formData.model) {
      errors.model = 'Modelo es requerido';
    }
    
    if (!formData.company) {
      errors.company = 'Empresa es requerida';
    }
    
    if (!formData.purchase_date) {
      errors.purchase_date = 'Fecha de compra es requerida';
    }
    
    if (!formData.purchase_cost || isNaN(parseFloat(formData.purchase_cost))) {
      errors.purchase_cost = 'Costo de compra es requerido y debe ser un número válido';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      const equipoData: Omit<Equipo, 'created_at' | 'updated_at'> = {
        serial_number: formData.serial_number.trim(),
        model: formData.model,
        company: formData.company,
        assigned_to: formData.assigned_to.trim() || null,
        insured: formData.insured,
        purchase_date: formData.purchase_date,
        purchase_cost: parseFloat(formData.purchase_cost),
        file_url: formData.file_url || null
      };
      
      await onCreate(equipoData);
      
      // Reset form
      setFormData({
        serial_number: '',
        model: 'mac_air',
        company: 'AJA',
        assigned_to: '',
        insured: false,
        purchase_date: '2024-01-01',
        purchase_cost: '25000',
        file_url: ''
      });
      setFormErrors({});
      setShowCreateForm(false);
    } catch (error) {
      console.error('Error creating equipment:', error);
    }
  };

  const handlePDFUpload = async (equipoSerial: string, file: File) => {
    setUploadingPDF(equipoSerial);
    try {
      const { publicUrl } = await uploadPDF(file, equipoSerial);
      await onUpdate(equipoSerial, 'file_url', publicUrl);
    } catch (error) {
      console.error('Error uploading PDF:', error);
      alert(`Error al subir PDF: ${(error as Error).message}`);
    } finally {
      setUploadingPDF(null);
    }
  };

  const handleFileInputChange = (equipoSerial: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handlePDFUpload(equipoSerial, file);
    }
  };

  const renderEditableCell = (equipo: Equipo, field: keyof Equipo, value: any) => {
    const isEditing = editingCell?.serial === equipo.serial_number && editingCell?.field === field;
    
    if (isEditing) {
      if (field === 'model') {
        return (
          <select
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            onBlur={handleCellSave}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCellSave();
              if (e.key === 'Escape') handleCellCancel();
            }}
            className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2"
            style={{
              backgroundColor: theme.background,
              borderColor: theme.primaryAccent,
              color: theme.textPrimary
            }}
            autoFocus
          >
            <option value="mac_air">Mac Air</option>
            <option value="mac_pro">Mac Pro</option>
            <option value="lenovo">Lenovo</option>
          </select>
        );
      } else if (field === 'company') {
        return (
          <select
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            onBlur={handleCellSave}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCellSave();
              if (e.key === 'Escape') handleCellCancel();
            }}
            className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2"
            style={{
              backgroundColor: theme.background,
              borderColor: theme.primaryAccent,
              color: theme.textPrimary
            }}
            autoFocus
          >
            <option value="HBL">HBL</option>
            <option value="AJA">AJA</option>
          </select>
        );
      } else if (field === 'insured') {
        return (
          <select
            value={tempValue.toString()}
            onChange={(e) => setTempValue(e.target.value === 'true')}
            onBlur={handleCellSave}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCellSave();
              if (e.key === 'Escape') handleCellCancel();
            }}
            className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2"
            style={{
              backgroundColor: theme.background,
              borderColor: theme.primaryAccent,
              color: theme.textPrimary
            }}
            autoFocus
          >
            <option value="false">No</option>
            <option value="true">Sí</option>
          </select>
        );
      } else if (field === 'purchase_date') {
        return (
          <input
            type="date"
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            onBlur={handleCellSave}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCellSave();
              if (e.key === 'Escape') handleCellCancel();
            }}
            className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2"
            style={{
              backgroundColor: theme.background,
              borderColor: theme.primaryAccent,
              color: theme.textPrimary
            }}
            autoFocus
          />
        );
      } else {
        return (
          <input
            type={field === 'purchase_cost' ? 'number' : 'text'}
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            onBlur={handleCellSave}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCellSave();
              if (e.key === 'Escape') handleCellCancel();
            }}
            className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2"
            style={{
              backgroundColor: theme.background,
              borderColor: theme.primaryAccent,
              color: theme.textPrimary
            }}
            autoFocus
          />
        );
      }
    }

    // Display value
    let displayValue = value;
    if (field === 'model') {
      displayValue = MODEL_LABELS[value as keyof typeof MODEL_LABELS] || value;
    } else if (field === 'insured') {
      displayValue = value ? 'Sí' : 'No';
    } else if (field === 'purchase_cost' && value) {
      displayValue = `$${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    } else if (field === 'company') {
      displayValue = (
        <span 
          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white"
          style={{ backgroundColor: value === 'HBL' ? '#3B82F6' : '#8B5CF6' }}
        >
          {value}
        </span>
      );
    }

    return (
      <div
        onClick={() => handleCellEdit(equipo.serial_number, field, value)}
        className="cursor-pointer hover:bg-opacity-50 px-2 py-1 rounded min-h-[32px] flex items-center"
        style={{ 
          backgroundColor: 'transparent',
          ':hover': { backgroundColor: `${theme.primaryAccent}10` }
        }}
      >
        {displayValue || '-'}
      </div>
    );
  };

  if (isLoading) {
    return (
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
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with search and create button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-4">
          <p style={{ color: theme.textSecondary }}>
            {filteredEquipos.length} equipos en total
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" 
              style={{ color: theme.textSecondary }} 
            />
            <input
              type="text"
              placeholder="Buscar por serie, modelo o asignado..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 w-80"
              style={{
                backgroundColor: theme.background,
                borderColor: theme.tableBorder,
                color: theme.textPrimary,
                focusRingColor: theme.primaryAccent
              }}
            />
          </div>
          
          {/* Download CSV */}
          <div className="flex items-center space-x-4">
            <button
              onClick={downloadCSV}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors"
              style={{
                borderColor: theme.tableBorder,
                color: theme.textPrimary
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = theme.surfaceAlt)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              <span>CSV con Depreciación</span>
            </button>
          </div>
          
          {/* Create button */}
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg text-white font-medium transition-colors"
            style={{ backgroundColor: theme.primaryAccent }}
            disabled={isCreating}
          >
            <PlusIcon className="h-4 w-4" />
            <span>Nuevo equipo</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="table-wrapper overflow-x-auto rounded-xl border" style={{ borderColor: theme.tableBorder }}>
        <table className="data-table w-full" style={{ backgroundColor: theme.background }}>
          <thead>
            <tr style={{ backgroundColor: theme.tableHeaderBg }}>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: theme.textSecondary }}>
                Número de Serie
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: theme.textSecondary }}>
                Modelo
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: theme.textSecondary }}>
                Empresa
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: theme.textSecondary }}>
                Asignado a
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: theme.textSecondary }}>
                Asegurado
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: theme.textSecondary }}>
                Fecha de Compra
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: theme.textSecondary }}>
                Costo de Compra
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: theme.textSecondary }}>
                % Dep. Anual
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: theme.textSecondary }}>
                Dep. Año 1
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: theme.textSecondary }}>
                Dep. Año 2
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: theme.textSecondary }}>
                Dep. Año 3
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: theme.textSecondary }}>
                Dep. Año 4
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: theme.textSecondary }}>
                Dep. Año 5
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: theme.textSecondary }}>
                <div className="flex items-center space-x-1">
                  <span>Valor Libro Hoy</span>
                  <InformationCircleIcon className="h-4 w-4" style={{ color: theme.textSecondary }} />
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: theme.textSecondary }}>
                Factura PDF
              </th>
            </tr>
          </thead>
          <tbody className="divide-y" style={{ divideColor: theme.tableBorder }}>
            {filteredEquipos.map((equipo, index) => (
              <motion.tr
                key={equipo.serial_number}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="hover:bg-opacity-50"
                style={{ 
                  backgroundColor: index % 2 === 0 ? theme.background : theme.surfaceAlt
                }}
              >
                <td className="px-4 py-3 text-sm font-medium" style={{ color: theme.textPrimary }}>
                  {equipo.serial_number}
                </td>
                <td className="px-4 py-3 text-sm" style={{ color: theme.textPrimary }}>
                  {renderEditableCell(equipo, 'model', equipo.model)}
                </td>
                <td className="px-4 py-3 text-sm" style={{ color: theme.textPrimary }}>
                  {renderEditableCell(equipo, 'company', equipo.company)}
                </td>
                <td className="px-4 py-3 text-sm" style={{ color: theme.textPrimary }}>
                  {renderEditableCell(equipo, 'assigned_to', equipo.assigned_to)}
                </td>
                <td className="px-4 py-3 text-sm" style={{ color: theme.textPrimary }}>
                  {renderEditableCell(equipo, 'insured', equipo.insured)}
                </td>
                <td className="px-4 py-3 text-sm" style={{ color: theme.textPrimary }}>
                  {renderEditableCell(equipo, 'purchase_date', equipo.purchase_date)}
                </td>
                <td className="px-4 py-3 text-sm" style={{ color: theme.textPrimary }}>
                  {renderEditableCell(equipo, 'purchase_cost', equipo.purchase_cost)}
                </td>
                <td className="px-4 py-3 text-sm font-medium" style={{ color: theme.info }}>
                  {((equipo.rate || 0) * 100).toFixed(0)}%
                </td>
                <td className="px-4 py-3 text-sm" style={{ color: theme.danger }}>
                  ${(equipo.depreciation_y1 || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </td>
                <td className="px-4 py-3 text-sm" style={{ color: theme.danger }}>
                  ${(equipo.depreciation_y2 || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </td>
                <td className="px-4 py-3 text-sm" style={{ color: theme.danger }}>
                  ${(equipo.depreciation_y3 || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </td>
                <td className="px-4 py-3 text-sm" style={{ color: theme.danger }}>
                  ${(equipo.depreciation_y4 || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </td>
                <td className="px-4 py-3 text-sm" style={{ color: theme.danger }}>
                  ${(equipo.depreciation_y5 || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </td>
                <td className="px-4 py-3 text-sm">
                  <div className="flex items-center space-x-2">
                    <span 
                      className="font-semibold"
                      style={{ color: theme.success }}
                      title={`Valor residual hoy • ${(equipo.years_exact || 0).toFixed(1)} años transcurridos`}
                    >
                      ${(equipo.book_value_today || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                    <InformationCircleIcon 
                      className="h-4 w-4 cursor-help" 
                      style={{ color: theme.textSecondary }}
                      title={`Valor residual hoy • ${(equipo.years_exact || 0).toFixed(1)} años transcurridos`}
                    />
                  </div>
                </td>
                <td className="px-4 py-3 text-sm" style={{ color: theme.textPrimary }}>
                  <div className="flex items-center space-x-2">
                    {equipo.file_url ? (
                      <div className="flex items-center space-x-2">
                        <a
                          href={equipo.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-1 text-blue-600 hover:text-blue-800"
                        >
                          <DocumentIcon className="h-4 w-4" />
                          <span className="text-xs">Ver PDF</span>
                        </a>
                        <input
                          type="file"
                          accept="application/pdf"
                          onChange={(e) => handleFileInputChange(equipo.serial_number, e)}
                          className="hidden"
                          id={`pdf-upload-${equipo.serial_number}`}
                        />
                        <label
                          htmlFor={`pdf-upload-${equipo.serial_number}`}
                          className="cursor-pointer text-xs px-2 py-1 rounded border hover:bg-gray-50"
                          style={{ borderColor: theme.tableBorder }}
                        >
                          Cambiar
                        </label>
                      </div>
                    ) : (
                      <div>
                        <input
                          type="file"
                          accept="application/pdf"
                          onChange={(e) => handleFileInputChange(equipo.serial_number, e)}
                          className="hidden"
                          id={`pdf-upload-${equipo.serial_number}`}
                          disabled={uploadingPDF === equipo.serial_number}
                        />
                        <label
                          htmlFor={`pdf-upload-${equipo.serial_number}`}
                          className="cursor-pointer flex items-center space-x-1 px-3 py-1 rounded text-white text-xs font-medium disabled:opacity-50"
                          style={{ 
                            backgroundColor: uploadingPDF === equipo.serial_number ? theme.grey : theme.primaryAccent 
                          }}
                        >
                          <DocumentArrowUpIcon className="h-4 w-4" />
                          <span>
                            {uploadingPDF === equipo.serial_number ? 'Subiendo...' : 'Subir PDF'}
                          </span>
                        </label>
                      </div>
                    )}
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

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
                  Nuevo Equipo
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
                {/* Serial Number */}
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: theme.textPrimary }}>
                    Número de Serie *
                  </label>
                  <input
                    type="text"
                    value={formData.serial_number}
                    onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                    style={{
                      backgroundColor: theme.background,
                      borderColor: formErrors.serial_number ? theme.danger : theme.tableBorder,
                      color: theme.textPrimary
                    }}
                    placeholder="Ej: D2K0WJ394W"
                  />
                  {formErrors.serial_number && (
                    <p className="text-xs mt-1" style={{ color: theme.danger }}>
                      {formErrors.serial_number}
                    </p>
                  )}
                </div>

                {/* Model */}
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: theme.textPrimary }}>
                    Modelo *
                  </label>
                  <select
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value as any })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                    style={{
                      backgroundColor: theme.background,
                      borderColor: theme.tableBorder,
                      color: theme.textPrimary
                    }}
                  >
                    <option value="mac_air">Mac Air</option>
                    <option value="mac_pro">Mac Pro</option>
                    <option value="lenovo">Lenovo</option>
                  </select>
                </div>

                {/* Company */}
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: theme.textPrimary }}>
                    Empresa *
                  </label>
                  <select
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value as any })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                    style={{
                      backgroundColor: theme.background,
                      borderColor: theme.tableBorder,
                      color: theme.textPrimary
                    }}
                  >
                    <option value="HBL">HBL</option>
                    <option value="AJA">AJA</option>
                  </select>
                </div>

                {/* Purchase Date */}
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: theme.textPrimary }}>
                    Fecha de Compra *
                  </label>
                  <input
                    type="date"
                    value={formData.purchase_date}
                    onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                    style={{
                      backgroundColor: theme.background,
                      borderColor: formErrors.purchase_date ? theme.danger : theme.tableBorder,
                      color: theme.textPrimary
                    }}
                  />
                  {formErrors.purchase_date && (
                    <p className="text-xs mt-1" style={{ color: theme.danger }}>
                      {formErrors.purchase_date}
                    </p>
                  )}
                </div>

                {/* Purchase Cost */}
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: theme.textPrimary }}>
                    Costo de Compra *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.purchase_cost}
                    onChange={(e) => setFormData({ ...formData, purchase_cost: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                    style={{
                      backgroundColor: theme.background,
                      borderColor: formErrors.purchase_cost ? theme.danger : theme.tableBorder,
                      color: theme.textPrimary
                    }}
                    placeholder="25000"
                  />
                  {formErrors.purchase_cost && (
                    <p className="text-xs mt-1" style={{ color: theme.danger }}>
                      {formErrors.purchase_cost}
                    </p>
                  )}
                </div>

                {/* Assigned To */}
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: theme.textPrimary }}>
                    Asignado a
                  </label>
                  <input
                    type="text"
                    value={formData.assigned_to}
                    onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                    style={{
                      backgroundColor: theme.background,
                      borderColor: theme.tableBorder,
                      color: theme.textPrimary
                    }}
                    placeholder="Nombre del usuario"
                  />
                </div>

                {/* Insured */}
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="insured"
                    checked={formData.insured}
                    onChange={(e) => setFormData({ ...formData, insured: e.target.checked })}
                    className="rounded"
                    style={{ accentColor: theme.primaryAccent }}
                  />
                  <label htmlFor="insured" className="text-sm" style={{ color: theme.textPrimary }}>
                    ¿Asegurado?
                  </label>
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
                    disabled={isCreating}
                    className="flex-1 px-4 py-2 rounded-lg text-white font-medium transition-colors disabled:opacity-50"
                    style={{ backgroundColor: theme.primaryAccent }}
                  >
                    {isCreating ? 'Creando...' : 'Crear Equipo'}
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

export default InventoryTable;