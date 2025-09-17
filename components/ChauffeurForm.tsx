import React, { useState, useMemo, useEffect } from 'react';
import { Chauffeur, Vehicle, ChauffeurOnboardingStatus, ChauffeurType, User, UserRole } from '../types';

const initialChauffeurFormState: Omit<Chauffeur, 'id' | 'imageUrl'> = {
  name: '',
  licenseNumber: '',
  contact: '',
  assignedVehicleId: null,
  dlExpiryDate: '',
  empId: '',
  email: '',
  gender: 'Male',
  office: '',
  team: '',
  reportingManager: '',
  onboardingStatus: ChauffeurOnboardingStatus.INVITED,
  chauffeurType: ChauffeurType.POOL,
  aadharCardFileName: '',
  panCardFileName: '',
  policeVerificationFileName: '',
};

const inputFieldStyle = "bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-500 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm rounded-lg p-2.5";
const labelStyle = "block text-sm font-medium text-gray-300 mb-1";
const buttonPrimaryStyle = "px-6 py-2.5 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-md transition-colors";
const buttonSecondaryStyle = "px-6 py-2.5 text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-lg shadow-sm transition-colors";

interface ChauffeurFormProps {
  onSubmit: (chauffeur: Omit<Chauffeur, 'id' | 'imageUrl' | 'onboardingStatus'>) => void;
  onCancel: () => void;
  initialData?: Chauffeur | null;
  vehicles: Vehicle[];
  users: User[];
}

const ChauffeurForm: React.FC<ChauffeurFormProps> = ({ onSubmit, onCancel, initialData, vehicles, users }) => {
  const [formData, setFormData] = useState<Omit<Chauffeur, 'id' | 'imageUrl'>>(
    initialData ? { ...initialChauffeurFormState, ...initialData } : initialChauffeurFormState
  );

  const availableReportingManagers = useMemo(() => {
    const employeesWithChauffeur = new Set(
        vehicles
            .filter(v => v.assignedChauffeurId && v.assignedEmployeeId)
            .map(v => v.assignedEmployeeId)
    );

    if (initialData?.reportingManager) {
        employeesWithChauffeur.delete(initialData.reportingManager);
    }

    return users.filter(u => 
        u.role === UserRole.EMPLOYEE && !employeesWithChauffeur.has(u.id)
    );
  }, [users, vehicles, initialData]);

  useEffect(() => {
    if (formData.chauffeurType === ChauffeurType.M_CAR && formData.reportingManager) {
        const assignedEmployeeId = formData.reportingManager;
        const vehicle = vehicles.find(v => v.assignedEmployeeId === assignedEmployeeId);
        if (vehicle) {
            setFormData(prev => ({ ...prev, assignedVehicleId: vehicle.id }));
        } else {
            setFormData(prev => ({ ...prev, assignedVehicleId: null }));
        }
    } else if (formData.chauffeurType === ChauffeurType.POOL) {
        setFormData(prev => ({ ...prev, reportingManager: '', assignedVehicleId: null, office: '' }));
    }
  }, [formData.chauffeurType, formData.reportingManager, vehicles]);

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
        ...prev,
        [name]: value,
        reportingManager: '',
        office: '',
        assignedVehicleId: null
    }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value === "" && name === "assignedVehicleId" ? null : value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.licenseNumber || !formData.contact) {
        alert("Please fill in Name, License Number, and Contact fields.");
        return;
    }
    const { onboardingStatus, ...dataToSubmit } = formData;
    onSubmit(dataToSubmit);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-200 border-b border-gray-600 pb-2">Personal Details</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="name" className={labelStyle}>Full Name *</label>
          <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className={inputFieldStyle} />
        </div>
        <div>
          <label htmlFor="empId" className={labelStyle}>Employee ID</label>
          <input type="text" name="empId" id="empId" value={formData.empId || ''} onChange={handleChange} className={inputFieldStyle} />
        </div>
      </div>
       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
         <div>
          <label htmlFor="email" className={labelStyle}>Email Address</label>
          <input type="email" name="email" id="email" value={formData.email || ''} onChange={handleChange} className={inputFieldStyle} />
        </div>
        <div>
          <label htmlFor="contact" className={labelStyle}>Phone Number *</label>
          <input type="tel" name="contact" id="contact" value={formData.contact} onChange={handleChange} required className={inputFieldStyle} />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
            <label htmlFor="gender" className={labelStyle}>Gender</label>
            <select name="gender" id="gender" value={formData.gender} onChange={handleChange} className={inputFieldStyle}>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
            </select>
        </div>
      </div>

       <h3 className="text-lg font-semibold text-gray-200 border-b border-gray-600 pb-2 pt-4">Assignment Details</h3>
        <div>
            <label htmlFor="chauffeurType" className={labelStyle}>Type of Chauffeur *</label>
            <select name="chauffeurType" id="chauffeurType" value={formData.chauffeurType || ChauffeurType.POOL} onChange={handleTypeChange} required className={inputFieldStyle}>
                {Object.values(ChauffeurType).map(type => (
                    <option key={type} value={type}>{type}</option>
                ))}
            </select>
        </div>

        {formData.chauffeurType === ChauffeurType.M_CAR && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 p-4 border border-gray-600 rounded-md bg-gray-750">
                <div>
                    <label htmlFor="reportingManager" className={labelStyle}>Assigned Employee (Manager) *</label>
                    <select name="reportingManager" id="reportingManager" value={formData.reportingManager || ''} onChange={handleChange} required className={inputFieldStyle}>
                        <option value="">Select an Employee</option>
                        {availableReportingManagers.map(user => (
                            <option key={user.id} value={user.id}>{user.name}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label htmlFor="office" className={labelStyle}>Location</label>
                    <input type="text" name="office" id="office" value={formData.office || ''} onChange={handleChange} className={inputFieldStyle} />
                </div>
            </div>
        )}

        <div>
            <label htmlFor="assignedVehicleId" className={labelStyle}>Assign Vehicle</label>
            <select 
            name="assignedVehicleId" 
            id="assignedVehicleId" 
            value={formData.assignedVehicleId || ""} 
            onChange={handleChange} 
            className={`${inputFieldStyle} mt-1 pr-8`}
            disabled={formData.chauffeurType === ChauffeurType.M_CAR}
            >
            <option value="">No Vehicle Assigned</option>
            {vehicles.map(v => (
                <option key={v.id} value={v.id} disabled={v.assignedChauffeurId !== null && v.assignedChauffeurId !== initialData?.id}>
                    {v.make} {v.model} ({v.licensePlate}) {v.assignedChauffeurId && v.assignedChauffeurId !== initialData?.id ? '(Assigned)' : '(Available)'}
                </option>
            ))}
            </select>
             {formData.chauffeurType === ChauffeurType.M_CAR && <p className="text-xs text-gray-400 mt-1">Vehicle is automatically assigned based on the selected employee.</p>}
        </div>

      <h3 className="text-lg font-semibold text-gray-200 border-b border-gray-600 pb-2 pt-4">License & Documents</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="licenseNumber" className={labelStyle}>License Number *</label>
          <input type="text" name="licenseNumber" id="licenseNumber" value={formData.licenseNumber} onChange={handleChange} required className={inputFieldStyle} />
        </div>
        <div>
          <label htmlFor="dlExpiryDate" className={labelStyle}>DL Expiry Date</label>
          <input type="date" name="dlExpiryDate" id="dlExpiryDate" value={formData.dlExpiryDate || ''} onChange={handleChange} className={`${inputFieldStyle} dark:[color-scheme:dark]`} />
        </div>
      </div>
       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
                <label htmlFor="aadharCardFileName" className={labelStyle}>Aadhar Card (File Name)</label>
                <input type="text" name="aadharCardFileName" value={formData.aadharCardFileName || ''} onChange={handleChange} className={inputFieldStyle} placeholder="aadhar.pdf" />
            </div>
            <div>
                <label htmlFor="panCardFileName" className={labelStyle}>PAN Card (File Name)</label>
                <input type="text" name="panCardFileName" value={formData.panCardFileName || ''} onChange={handleChange} className={inputFieldStyle} placeholder="pan_card.jpg" />
            </div>
            <div>
                <label htmlFor="policeVerificationFileName" className={labelStyle}>Police Verification (File Name)</label>
                <input type="text" name="policeVerificationFileName" value={formData.policeVerificationFileName || ''} onChange={handleChange} className={inputFieldStyle} placeholder="police_verification.pdf" />
            </div>
        </div>
      
      <div className="flex justify-end space-x-3 pt-4">
        <button type="button" onClick={onCancel} className={buttonSecondaryStyle}>Cancel</button>
        <button type="submit" className={buttonPrimaryStyle}>
          {initialData ? 'Update Chauffeur' : 'Add Chauffeur'}
        </button>
      </div>
    </form>
  );
};

export default ChauffeurForm;
