

import React, { useState, useMemo, useCallback } from 'react';
import { CostEntry, Vehicle, CostCategory } from '../../types';
import Modal from '../../components/Modal';
import { CreditCardIcon, ArrowDownTrayIcon } from '../../constants';
import { exportToCsv } from '../../services/reportService';


interface VehicleCostEntryPageProps {
  costEntries: CostEntry[];
  vehicles: Vehicle[];
  categories: CostCategory[];
  addCostEntry: (entry: Omit<CostEntry, 'id'>) => void;
  updateCostEntry: (entry: CostEntry) => void;
  deleteCostEntry: (entryId: string) => void;
}

const initialCostFormState: Omit<CostEntry, 'id'> = {
  date: new Date().toISOString().split('T')[0], 
  costCategoryId: '',
  vehicleId: '',
  tripId: null,
  amount: 0,
  description: '',
  vendor: '',
  receiptFileName: '',
};

// Common dark theme styles
const inputFieldStyle = "bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-500 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm rounded-lg p-2.5";
const labelStyle = "block text-sm font-medium text-gray-300 mb-1";
const buttonPrimaryStyle = "px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-md transition-colors";
const buttonSecondaryStyle = "px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-lg shadow-sm transition-colors";

interface CostFormProps {
  onSubmit: (entry: Omit<CostEntry, 'id'>) => void;
  onCancel: () => void;
  initialData?: CostEntry | null;
  vehicles: Vehicle[];
  categories: CostCategory[];
}

const CostForm: React.FC<CostFormProps> = ({ onSubmit, onCancel, initialData, vehicles, categories }) => {
  const [formData, setFormData] = useState<Omit<CostEntry, 'id'>>(
    initialData ? { ...initialData, tripId: null } : { ...initialCostFormState }
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.date || !formData.costCategoryId || !formData.vehicleId || formData.amount <= 0) {
      alert("Please fill in Date, Category, Vehicle, and a valid Amount.");
      return;
    }
    onSubmit({...formData, tripId: null});
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="date" className={labelStyle}>Date of Cost *</label>
          <input type="date" name="date" id="date" value={formData.date} onChange={handleChange} required className={`${inputFieldStyle} mt-1 dark:[color-scheme:dark]`} />
        </div>
        <div>
          <label htmlFor="vehicleId" className={labelStyle}>Vehicle *</label>
          <select name="vehicleId" id="vehicleId" value={formData.vehicleId || ''} onChange={handleChange} required className={`${inputFieldStyle} mt-1 pr-8`}>
            <option value="">Select Vehicle</option>
            {vehicles.map(v => (
              <option key={v.id} value={v.id}>{v.make} {v.model} ({v.licensePlate})</option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
         <div>
          <label htmlFor="costCategoryId" className={labelStyle}>Cost Category *</label>
          <select name="costCategoryId" id="costCategoryId" value={formData.costCategoryId} onChange={handleChange} required className={`${inputFieldStyle} mt-1 pr-8`}>
            <option value="">Select Category</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="amount" className={labelStyle}>Amount (INR) *</label>
          <input type="number" name="amount" id="amount" value={formData.amount} onChange={handleChange} required min="0.01" step="0.01" className={`${inputFieldStyle} mt-1`} />
        </div>
      </div>
      <div>
        <label htmlFor="description" className={labelStyle}>Description</label>
        <textarea name="description" id="description" value={formData.description || ''} onChange={handleChange} rows={2} className={`${inputFieldStyle} mt-1`} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="vendor" className={labelStyle}>Vendor/Supplier</label>
          <input type="text" name="vendor" id="vendor" value={formData.vendor || ''} onChange={handleChange} className={`${inputFieldStyle} mt-1`} />
        </div>
        <div>
          <label htmlFor="receiptFileName" className={labelStyle}>Receipt/Invoice File Name (Mock)</label>
          <input type="text" name="receiptFileName" id="receiptFileName" value={formData.receiptFileName || ''} placeholder="e.g., bill_123.pdf" className={`${inputFieldStyle} mt-1`} />
        </div>
      </div>
      <div className="flex justify-end space-x-3 pt-4">
        <button type="button" onClick={onCancel} className={buttonSecondaryStyle}>Cancel</button>
        <button type="submit" className={buttonPrimaryStyle}>{initialData ? 'Update Cost' : 'Add Cost Entry'}</button>
      </div>
    </form>
  );
};


const VehicleCostEntryPage: React.FC<VehicleCostEntryPageProps> = ({ costEntries, vehicles, categories, addCostEntry, updateCostEntry, deleteCostEntry }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<CostEntry | null>(null);
  const [filterVehicleId, setFilterVehicleId] = useState<string>('ALL');
  const [filterCategoryId, setFilterCategoryId] = useState<string>('ALL');

  const openAddModal = () => { setEditingEntry(null); setIsModalOpen(true); };
  const openEditModal = (entry: CostEntry) => { setEditingEntry(entry); setIsModalOpen(true); };
  const closeModal = () => { setIsModalOpen(false); setEditingEntry(null); };

  const handleFormSubmit = (entryData: Omit<CostEntry, 'id'>) => {
    if (editingEntry) {
      updateCostEntry({ ...editingEntry, ...entryData });
    } else {
      addCostEntry(entryData);
    }
    closeModal();
  };

  const handleDeleteEntry = (entryId: string) => {
    if (window.confirm('Are you sure you want to delete this cost entry?')) {
      deleteCostEntry(entryId);
    }
  };

  const filteredCostEntries = useMemo(() => {
    return costEntries.filter(entry => 
        (filterVehicleId === 'ALL' || entry.vehicleId === filterVehicleId) &&
        (filterCategoryId === 'ALL' || entry.costCategoryId === filterCategoryId) &&
        !entry.tripId 
    ).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [costEntries, filterVehicleId, filterCategoryId]);

  const getVehicleName = useCallback((vehicleId?: string | null) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    return vehicle ? `${vehicle.make} ${vehicle.model} (${vehicle.licensePlate})` : 'N/A';
  }, [vehicles]);
  const getCategoryName = useCallback((categoryId: string) => categories.find(c => c.id === categoryId)?.name || 'N/A', [categories]);
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-IN');

  const handleDownloadReport = useCallback(() => {
    const dataToExport = filteredCostEntries.map(entry => ({
        date: formatDate(entry.date),
        vehicle: getVehicleName(entry.vehicleId),
        category: getCategoryName(entry.costCategoryId),
        amount: entry.amount,
        description: entry.description || 'N/A',
        vendor: entry.vendor || 'N/A',
    }));

    const headers = [
      { key: 'date', label: 'Date' },
      { key: 'vehicle', label: 'Vehicle' },
      { key: 'category', label: 'Category' },
      { key: 'amount', label: 'Amount (INR)' },
      { key: 'description', label: 'Description' },
      { key: 'vendor', label: 'Vendor' },
    ];
    
    exportToCsv(`fleetpro_costs_report_${new Date().toISOString().split('T')[0]}.csv`, dataToExport, headers);
  }, [filteredCostEntries, getVehicleName, getCategoryName]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4 mb-6">
        <h1 className="text-3xl font-bold text-gray-100 flex items-center">
            <CreditCardIcon className="w-8 h-8 mr-3 text-primary-400"/> General Vehicle Costs
        </h1>
        <div className="flex items-center gap-4">
            <button onClick={handleDownloadReport} className="bg-gray-700 hover:bg-gray-600 text-gray-200 font-semibold py-2.5 px-5 rounded-lg shadow-md transition-colors duration-150 ease-in-out flex items-center">
                <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
                Download Report
            </button>
            <button onClick={openAddModal} className={`${buttonPrimaryStyle} flex items-center`}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-2"><path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" /></svg>
              Add Vehicle Cost
            </button>
        </div>
      </div>
      <p className="text-sm text-gray-400 -mt-4 mb-6">Log and manage non-trip specific costs for individual vehicles.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-800 rounded-lg shadow">
        <div>
          <label htmlFor="filterVehicleId" className={labelStyle}>Filter by Vehicle</label>
          <select id="filterVehicleId" value={filterVehicleId} onChange={(e) => setFilterVehicleId(e.target.value)} className={`${inputFieldStyle} mt-1 pr-8`}>
            <option value="ALL">All Vehicles</option>
            {vehicles.map(v => <option key={v.id} value={v.id}>{v.make} {v.model} ({v.licensePlate})</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="filterCategoryId" className={labelStyle}>Filter by Category</label>
          <select id="filterCategoryId" value={filterCategoryId} onChange={(e) => setFilterCategoryId(e.target.value)} className={`${inputFieldStyle} mt-1 pr-8`}>
            <option value="ALL">All Categories</option>
            {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-gray-800 shadow-xl rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-gray-750">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Vehicle</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Category</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Amount (₹)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Description</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Vendor</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Receipt</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-gray-800 divide-y divide-gray-700">
            {filteredCostEntries.map(entry => (
              <tr key={entry.id} className="hover:bg-gray-750 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{formatDate(entry.date)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{getVehicleName(entry.vehicleId)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{getCategoryName(entry.costCategoryId)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-100 font-semibold text-right">{entry.amount.toLocaleString()}</td>
                <td className="px-6 py-4 whitespace-normal max-w-xs text-sm text-gray-400 truncate" title={entry.description}>{entry.description || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{entry.vendor || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{entry.receiptFileName || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button onClick={() => openEditModal(entry)} className="text-indigo-400 hover:text-indigo-300">Edit</button>
                  <button onClick={() => handleDeleteEntry(entry.id)} className="text-red-400 hover:text-red-300">Delete</button>
                </td>
              </tr>
            ))}
            {filteredCostEntries.length === 0 && (
                <tr><td colSpan={8} className="text-center py-10 text-gray-500">No vehicle cost entries found matching filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingEntry ? 'Edit Vehicle Cost' : 'Add Vehicle Cost'} size="lg">
        <CostForm onSubmit={handleFormSubmit} onCancel={closeModal} initialData={editingEntry} vehicles={vehicles} categories={categories} />
      </Modal>
    </div>
  );
};

export default VehicleCostEntryPage;
