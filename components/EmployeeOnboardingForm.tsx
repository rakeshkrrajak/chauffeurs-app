import React, { useState } from 'react';
import { User, Vehicle, Chauffeur } from '../types';

const inputFieldStyle = "bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-500 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm rounded-lg p-2.5";
const labelStyle = "block text-sm font-medium text-gray-300 mb-1";
const buttonPrimaryStyle = "px-6 py-2.5 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-md transition-colors";
const buttonSecondaryStyle = "px-6 py-2.5 text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-lg shadow-sm transition-colors";

interface EmployeeOnboardingFormProps {
  onSubmit: (userData: Omit<User, 'id' | 'createdAt' | 'status' | 'role'>, vehicleId: string | null, chauffeurId: string | null) => void;
  onCancel: () => void;
  availableVehicles: Vehicle[];
  availableChauffeurs: Chauffeur[];
}

const EmployeeOnboardingForm: React.FC<EmployeeOnboardingFormProps> = ({ onSubmit, onCancel, availableVehicles, availableChauffeurs }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    empId: '',
    contact: '',
    address: '',
    officeAddress: '',
    department: '',
    level: '',
    costCenter: '',
    vehicleId: '',
    chauffeurId: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.empId) {
      alert("Please fill in the required employee details: Name, Email, and Employee ID.");
      return;
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      alert("Please enter a valid email address.");
      return;
    }
    
    const { vehicleId, chauffeurId, ...userData } = formData;
    onSubmit(userData, vehicleId || null, chauffeurId || null);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-lg font-medium leading-6 text-gray-100 border-b border-gray-600 pb-2 mb-4">Employee Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label htmlFor="name" className={labelStyle}>Full Name *</label>
                <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className={inputFieldStyle} />
            </div>
            <div>
                <label htmlFor="email" className={labelStyle}>Email Address *</label>
                <input type="email" name="email" id="email" value={formData.email} onChange={handleChange} required className={inputFieldStyle} />
            </div>
            <div>
                <label htmlFor="empId" className={labelStyle}>Employee ID *</label>
                <input type="text" name="empId" id="empId" value={formData.empId} onChange={handleChange} required className={inputFieldStyle} />
            </div>
             <div>
                <label htmlFor="contact" className={labelStyle}>Contact Number</label>
                <input type="tel" name="contact" id="contact" value={formData.contact} onChange={handleChange} className={inputFieldStyle} />
            </div>
        </div>
        <div className="mt-4">
             <label htmlFor="address" className={labelStyle}>Personal Address</label>
             <textarea name="address" id="address" value={formData.address} onChange={handleChange} rows={2} className={inputFieldStyle} />
        </div>
         <div className="mt-4">
             <label htmlFor="officeAddress" className={labelStyle}>Working Office Address</label>
             <textarea name="officeAddress" id="officeAddress" value={formData.officeAddress} onChange={handleChange} rows={2} className={inputFieldStyle} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
             <div>
                <label htmlFor="department" className={labelStyle}>Department</label>
                <input type="text" name="department" id="department" value={formData.department} onChange={handleChange} className={inputFieldStyle} />
            </div>
            <div>
                <label htmlFor="level" className={labelStyle}>Level</label>
                <input type="text" name="level" id="level" value={formData.level} onChange={handleChange} className={inputFieldStyle} />
            </div>
            <div>
                <label htmlFor="costCenter" className={labelStyle}>Cost Center</label>
                <input type="text" name="costCenter" id="costCenter" value={formData.costCenter} onChange={handleChange} className={inputFieldStyle} />
            </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium leading-6 text-gray-100 border-b border-gray-600 pb-2 mb-4">Vehicle & Chauffeur Assignment (Optional)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label htmlFor="vehicleId" className={labelStyle}>Assign Vehicle</label>
                <select name="vehicleId" id="vehicleId" value={formData.vehicleId} onChange={handleChange} className={inputFieldStyle}>
                    <option value="">No Vehicle</option>
                    {availableVehicles.map(v => (
                        <option key={v.id} value={v.id}>{v.make} {v.model} ({v.licensePlate})</option>
                    ))}
                </select>
            </div>
            <div>
                <label htmlFor="chauffeurId" className={labelStyle}>Assign Chauffeur</label>
                <select name="chauffeurId" id="chauffeurId" value={formData.chauffeurId} onChange={handleChange} className={inputFieldStyle}>
                    <option value="">No Chauffeur</option>
                    {availableChauffeurs.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
            </div>
        </div>
        <p className="text-xs text-gray-400 mt-2">Note: Assigning a vehicle and chauffeur will link them together in the system.</p>
      </div>

      <div className="flex justify-end space-x-3 pt-5 border-t border-gray-600">
        <button type="button" onClick={onCancel} className={buttonSecondaryStyle}>Cancel</button>
        <button type="submit" className={buttonPrimaryStyle}>Onboard Employee</button>
      </div>
    </form>
  );
};

export default EmployeeOnboardingForm;