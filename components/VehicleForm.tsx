import React, { useState, useMemo, useEffect } from 'react';
import { Vehicle, VehicleStatus, Chauffeur, DocumentType, Document, User, UserRole, ChauffeurType } from '../types';

const inputFieldStyle = "bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-500 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm rounded-lg p-2.5 transition-colors duration-200 disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed";
const labelStyle = "block text-sm font-medium text-gray-300 mb-1.5";
const tabStyle = "px-4 py-2.5 text-sm font-semibold rounded-t-lg transition-colors duration-200 ease-in-out border-b-2";
const activeTabStyle = "text-primary-400 border-primary-500";
const inactiveTabStyle = "text-gray-400 hover:text-gray-200 border-transparent hover:border-gray-500";

const initialVehicleFormState: Omit<Vehicle, 'id' | 'imageUrl'> = {
  vin: '',
  make: 'Mercedes-Benz',
  model: '',
  year: new Date().getFullYear(),
  licensePlate: '',
  status: VehicleStatus.ACTIVE,
  mileage: 0,
  assignedChauffeurId: null,
  assignedEmployeeId: null,
  carType: "M-Car",
  fuelCardNumber: "",
  color: "",
  location: "Bangalore",
  engineNumber: "",
  dateOfRegistration: new Date().toISOString().split('T')[0],
  leaseCloseDate: "",
  isStd: false,
  isNonStd: false,
  starEaseMaintenance: "Not Applicable",
  ownershipType: "Owned",
  carVendorName: "",
  distanceSinceMaintenance: 0,
  documents: [
    { type: DocumentType.RC, expiryDate: '' },
    { type: DocumentType.INSURANCE, expiryDate: '' },
    { type: DocumentType.PUC, expiryDate: '' },
  ],
};

interface VehicleFormProps {
  onSubmit: (vehicle: Omit<Vehicle, 'id' | 'imageUrl'>, transferReason?: string) => void;
  onCancel: () => void;
  initialData?: Vehicle | null;
  chauffeurs: Chauffeur[]; 
  users: User[];
  vehicles: Vehicle[];
  isOnboarding?: boolean;
}

const VehicleForm: React.FC<VehicleFormProps> = ({ onSubmit, onCancel, initialData, chauffeurs, users, vehicles, isOnboarding = false }) => {
  const [formData, setFormData] = useState<Omit<Vehicle, 'id' | 'imageUrl'>>(() => {
    const baseData = initialData ? JSON.parse(JSON.stringify(initialData)) : { ...initialVehicleFormState };
    // Ensure essential documents exist
    const requiredDocs: DocumentType[] = [DocumentType.RC, DocumentType.INSURANCE, DocumentType.PUC];
    let docs = baseData.documents ? [...baseData.documents] : [];
    requiredDocs.forEach(docType => {
      if (!docs.some(d => d.type === docType)) {
        docs.push({ type: docType, expiryDate: '' });
      }
    });
    baseData.documents = docs;
    return baseData;
  });
  
  const [activeTab, setActiveTab] = useState('general');
  const [transferReason, setTransferReason] = useState('');

  useEffect(() => {
    // When carType changes, reset assignments to avoid invalid states
    setFormData(prev => ({
        ...prev,
        assignedEmployeeId: null,
        assignedChauffeurId: null,
    }));
  }, [formData.carType]);

  const assigneeOptions = useMemo(() => {
    let potentialAssignees: User[] = [];

    if (formData.carType === 'M-Car') {
        potentialAssignees = users.filter(u => u.role === UserRole.EMPLOYEE);
    } else if (formData.carType === 'Test Cars') {
        potentialAssignees = users.filter(u => u.role === UserRole.FLEET_MANAGER || u.role === UserRole.ADMIN);
    } else {
        return []; // No options for Pool Car
    }
    
    // Logic to only show available assignees
    const assignedIds = new Set(vehicles.map(v => v.assignedEmployeeId).filter(Boolean));
    if (initialData?.assignedEmployeeId) {
        assignedIds.delete(initialData.assignedEmployeeId);
    }
    return potentialAssignees.filter(u => !assignedIds.has(u.id));

  }, [users, vehicles, formData.carType, initialData]);

  const chauffeurOptions = useMemo(() => {
    let potentialChauffeurs: Chauffeur[] = [];
    if (formData.carType === 'M-Car') {
        potentialChauffeurs = chauffeurs.filter(c => c.chauffeurType === ChauffeurType.M_CAR);
    } else if (formData.carType === 'Pool Cars') {
        potentialChauffeurs = chauffeurs.filter(c => c.chauffeurType === ChauffeurType.POOL);
    } else {
        return []; // No chauffeurs for Test Cars
    }

    // Logic to show only available chauffeurs
    return potentialChauffeurs.filter(c => !c.assignedVehicleId || c.id === initialData?.assignedChauffeurId);
  }, [chauffeurs, formData.carType, initialData]);


  const isTransfer = initialData && 
                     initialData.assignedEmployeeId && 
                     formData.assignedEmployeeId !== initialData.assignedEmployeeId &&
                     formData.assignedEmployeeId !== null;

  const selectedEmployeeDetails = useMemo(() => {
    if (!formData.assignedEmployeeId) return null;
    return users.find(u => u.id === formData.assignedEmployeeId);
  }, [formData.assignedEmployeeId, users]);

  const totalMonthsUsed = useMemo(() => {
    if (!formData.dateOfRegistration) return '0.0';
    const regDate = new Date(formData.dateOfRegistration);
    const today = new Date();
    if (isNaN(regDate.getTime()) || regDate > today) return '0.0';
    let years = today.getFullYear() - regDate.getFullYear();
    let months = today.getMonth() - regDate.getMonth();
    if (today.getDate() < regDate.getDate()) { months--; }
    if (months < 0) { years--; months += 12; }
    const totalMonths = years * 12 + months;
    return (totalMonths / 12).toFixed(1);
  }, [formData.dateOfRegistration]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === 'checkbox';
    const checked = isCheckbox ? (e.target as HTMLInputElement).checked : undefined;
    
    if (name === "inactive") {
      setFormData(prev => ({ ...prev, status: checked ? VehicleStatus.INACTIVE : VehicleStatus.ACTIVE }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: isCheckbox ? checked : type === 'number' ? parseFloat(value) || 0 : value
      }));
    }
  };

  const handleDocumentChange = (type: DocumentType, field: keyof Document, value: string) => {
    setFormData(prev => {
        const newDocs = [...(prev.documents || [])];
        const docIndex = newDocs.findIndex(d => d.type === type);
        if (docIndex > -1) {
            (newDocs[docIndex] as any)[field] = value;
        } else {
            // This case shouldn't happen with the initial setup, but as a fallback
            newDocs.push({ type, expiryDate: '', [field]: value });
        }
        return { ...prev, documents: newDocs };
    });
  };

  const getDocValue = (type: DocumentType, field: keyof Document) => {
    const doc = formData.documents?.find(d => d.type === type);
    return doc ? doc[field] || '' : '';
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData, transferReason);
  };

  const assigneeLabel = formData.carType === 'Test Cars' ? 'Driver Name (Fleet Manager)' : 'Employee Name';
  const isAssigneeSelectDisabled = formData.carType === 'Pool Cars';
  const isChauffeurDisabled = formData.carType === 'Test Cars';
  const isEmployeeDetailsDisabled = formData.carType === 'Pool Cars' || formData.carType === 'Test Cars';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Top Section */}
      <fieldset className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg border-gray-700">
        <legend className="text-sm font-medium text-gray-400 px-1">Primary Details</legend>
        <div><label htmlFor="licensePlate" className={labelStyle}>Registration Number *</label><input type="text" name="licensePlate" value={formData.licensePlate} onChange={handleChange} required className={inputFieldStyle} /></div>
        <div><label htmlFor="model" className={labelStyle}>Model *</label><input type="text" name="model" value={formData.model} onChange={handleChange} required className={inputFieldStyle} /></div>
        <div><label htmlFor="carType" className={labelStyle}>Car Type</label><select name="carType" value={formData.carType} onChange={handleChange} className={inputFieldStyle}><option>M-Car</option><option>Pool Cars</option><option>Test Cars</option></select></div>
        <div><label htmlFor="fuelCardNumber" className={labelStyle}>Fuel Card Number</label><input type="text" name="fuelCardNumber" value={formData.fuelCardNumber} onChange={handleChange} className={inputFieldStyle} /></div>
        <div><label htmlFor="color" className={labelStyle}>Color</label><input type="text" name="color" value={formData.color} onChange={handleChange} className={inputFieldStyle} /></div>
        <div><label htmlFor="location" className={labelStyle}>Location</label><select name="location" value={formData.location} onChange={handleChange} className={inputFieldStyle}><option>Bangalore</option><option>Mumbai</option><option>Delhi</option></select></div>
        <div className="flex items-center pt-6"><input type="checkbox" id="inactive" name="inactive" checked={formData.status === VehicleStatus.INACTIVE} onChange={handleChange} className="h-4 w-4 rounded border-gray-500 text-primary-600 focus:ring-primary-500" /><label htmlFor="inactive" className="ml-2 text-sm text-gray-300">Inactive</label></div>
      </fieldset>

      {/* Tabs */}
      <div className="border-b border-gray-700">
        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
          <button type="button" onClick={() => setActiveTab('general')} className={`${tabStyle} ${activeTab === 'general' ? activeTabStyle : inactiveTabStyle}`}>General</button>
          <button type="button" onClick={() => setActiveTab('ownership')} className={`${tabStyle} ${activeTab === 'ownership' ? activeTabStyle : inactiveTabStyle}`}>Ownership</button>
          <button type="button" onClick={() => setActiveTab('documents')} className={`${tabStyle} ${activeTab === 'documents' ? activeTabStyle : inactiveTabStyle}`}>Documentation</button>
          <button type="button" onClick={() => setActiveTab('expenses')} className={`${tabStyle} ${activeTab === 'expenses' ? activeTabStyle : inactiveTabStyle}`}>Expenses</button>
        </nav>
      </div>

      <div className={activeTab === 'general' ? 'block' : 'hidden'}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div><label htmlFor="engineNumber" className={labelStyle}>Engine Number</label><input type="text" name="engineNumber" value={formData.engineNumber} onChange={handleChange} className={inputFieldStyle} /></div>
            <div><label htmlFor="dateOfRegistration" className={labelStyle}>Date of Registration</label><input type="date" name="dateOfRegistration" value={formData.dateOfRegistration || ''} onChange={handleChange} className={`${inputFieldStyle} dark:[color-scheme:dark]`} /></div>
            <div><label htmlFor="mileage" className={labelStyle}>Total Distance Travelled (km)</label><input type="number" name="mileage" value={formData.mileage} onChange={handleChange} className={inputFieldStyle} /></div>
            <div><label className={labelStyle}>Total Months (Years)</label><input type="text" value={totalMonthsUsed} readOnly className={`${inputFieldStyle} bg-gray-600`} /></div>
            <div><label htmlFor="leaseCloseDate" className={labelStyle}>Lease Close Date</label><input type="date" name="leaseCloseDate" value={formData.leaseCloseDate || ''} onChange={handleChange} className={`${inputFieldStyle} dark:[color-scheme:dark]`} /></div>
            <div><label htmlFor="starEaseMaintenance" className={labelStyle}>StarEase Maintenance</label><select name="starEaseMaintenance" value={formData.starEaseMaintenance} onChange={handleChange} className={inputFieldStyle}><option>Yes</option><option>No</option><option>Not Applicable</option></select></div>
            <div><label htmlFor="vin" className={labelStyle}>Chassis Number</label><input type="text" name="vin" value={formData.vin} onChange={handleChange} className={inputFieldStyle} /></div>
            <div><label htmlFor="ownershipType" className={labelStyle}>Ownership</label><select name="ownershipType" value={formData.ownershipType} onChange={handleChange} className={inputFieldStyle}><option>Owned</option><option>Leased</option><option>Rented</option></select></div>
            <div><label htmlFor="carVendorName" className={labelStyle}>Car Vendor Name</label><input type="text" name="carVendorName" value={formData.carVendorName || ''} onChange={handleChange} className={inputFieldStyle} /></div>
            <div><label htmlFor="distanceSinceMaintenance" className={labelStyle}>Distance Since Last Maintenance</label><input type="number" name="distanceSinceMaintenance" value={formData.distanceSinceMaintenance} onChange={handleChange} className={inputFieldStyle} /></div>
            <div className="col-span-3 flex gap-x-8 pt-4">
                <div className="flex items-center"><input type="checkbox" id="isStd" name="isStd" checked={!!formData.isStd} onChange={handleChange} className="h-4 w-4 rounded border-gray-500 text-primary-600 focus:ring-primary-500" /><label htmlFor="isStd" className="ml-2 text-sm text-gray-300">Std</label></div>
                <div className="flex items-center"><input type="checkbox" id="isNonStd" name="isNonStd" checked={!!formData.isNonStd} onChange={handleChange} className="h-4 w-4 rounded border-gray-500 text-primary-600 focus:ring-primary-500" /><label htmlFor="isNonStd" className="ml-2 text-sm text-gray-300">Non-Std</label></div>
            </div>
        </div>
      </div>

      <div className={activeTab === 'ownership' ? 'block' : 'hidden'}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label htmlFor="assignedEmployeeId" className={labelStyle}>{assigneeLabel}</label>
              <select 
                name="assignedEmployeeId" 
                id="assignedEmployeeId"
                value={formData.assignedEmployeeId || ''} 
                onChange={handleChange} 
                className={inputFieldStyle}
                disabled={isAssigneeSelectDisabled}
              >
                  <option value="">{`Select ${formData.carType === 'Test Cars' ? 'Manager' : 'Employee'}`}</option>
                  {assigneeOptions.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  {initialData?.assignedEmployeeId && !assigneeOptions.some(e => e.id === initialData.assignedEmployeeId) && (
                      <option value={initialData.assignedEmployeeId}>
                          {users.find(u => u.id === initialData.assignedEmployeeId)?.name}
                      </option>
                  )}
              </select>
            </div>
            <div><label className={labelStyle}>Employee Level</label><input type="text" value={selectedEmployeeDetails?.level || ''} readOnly disabled={isEmployeeDetailsDisabled} className={inputFieldStyle} /></div>
            <div><label className={labelStyle}>Emp ID</label><input type="text" value={selectedEmployeeDetails?.empId || ''} readOnly disabled={isEmployeeDetailsDisabled} className={inputFieldStyle} /></div>
            <div><label className={labelStyle}>Department</label><input type="text" value={selectedEmployeeDetails?.department || ''} readOnly disabled={isEmployeeDetailsDisabled} className={inputFieldStyle} /></div>
            <div><label className={labelStyle}>User Cost Center</label><input type="text" value={selectedEmployeeDetails?.costCenter || ''} readOnly disabled={isEmployeeDetailsDisabled} className={inputFieldStyle} /></div>
            <div>
              <label htmlFor="assignedChauffeurId" className={labelStyle}>Driver Name</label>
              <select 
                name="assignedChauffeurId" 
                id="assignedChauffeurId"
                value={formData.assignedChauffeurId || ''} 
                onChange={handleChange} 
                className={inputFieldStyle}
                disabled={isChauffeurDisabled}
              >
                  <option value="">Select Driver</option>
                  {chauffeurOptions.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
        </div>
        {isTransfer && (
          <div className="mt-6 pt-4 border-t border-gray-700">
            <label htmlFor="transferReason" className={`${labelStyle} text-red-400 font-semibold`}>Reason for Transfer *</label>
            <textarea
              name="transferReason"
              id="transferReason"
              rows={3}
              value={transferReason}
              onChange={(e) => setTransferReason(e.target.value)}
              required
              className={`${inputFieldStyle} border-red-500 focus:border-red-500 focus:ring-red-500`}
              placeholder="e.g., Employee promotion, location change, policy completion."
            />
            <p className="text-xs text-gray-500 mt-1">Please provide a reason for changing the assigned employee. This will be logged in the vehicle's history.</p>
          </div>
        )}
      </div>

      <div className={activeTab === 'documents' ? 'block' : 'hidden'}>
        {/* PUC */}
        <fieldset className="p-3 border border-gray-600 rounded-lg mb-4"><legend className="font-medium text-gray-200">PUC Certificate</legend>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div><label className={labelStyle}>PUC Doc File</label><input type="text" value={getDocValue(DocumentType.PUC, 'fileName') as string} onChange={e => handleDocumentChange(DocumentType.PUC, 'fileName', e.target.value)} className={inputFieldStyle} placeholder="puc_cert.pdf" /></div>
              <div><label className={labelStyle}>Start Date</label><input type="date" value={getDocValue(DocumentType.PUC, 'startDate') as string} onChange={e => handleDocumentChange(DocumentType.PUC, 'startDate', e.target.value)} className={`${inputFieldStyle} dark:[color-scheme:dark]`} /></div>
              <div><label className={labelStyle}>End Date</label><input type="date" value={getDocValue(DocumentType.PUC, 'expiryDate') as string} onChange={e => handleDocumentChange(DocumentType.PUC, 'expiryDate', e.target.value)} className={`${inputFieldStyle} dark:[color-scheme:dark]`} /></div>
          </div>
        </fieldset>
        {/* Insurance */}
        <fieldset className="p-3 border border-gray-600 rounded-lg mb-4"><legend className="font-medium text-gray-200">Insurance</legend>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div><label className={labelStyle}>Policy Number</label><input type="text" value={getDocValue(DocumentType.INSURANCE, 'number') as string} onChange={e => handleDocumentChange(DocumentType.INSURANCE, 'number', e.target.value)} className={inputFieldStyle} /></div>
              <div><label className={labelStyle}>Start Date</label><input type="date" value={getDocValue(DocumentType.INSURANCE, 'startDate') as string} onChange={e => handleDocumentChange(DocumentType.INSURANCE, 'startDate', e.target.value)} className={`${inputFieldStyle} dark:[color-scheme:dark]`} /></div>
              <div><label className={labelStyle}>Expiry Date</label><input type="date" value={getDocValue(DocumentType.INSURANCE, 'expiryDate') as string} onChange={e => handleDocumentChange(DocumentType.INSURANCE, 'expiryDate', e.target.value)} className={`${inputFieldStyle} dark:[color-scheme:dark]`} /></div>
              <div><label className={labelStyle}>Vendor</label><input type="text" value={getDocValue(DocumentType.INSURANCE, 'vendor') as string} onChange={e => handleDocumentChange(DocumentType.INSURANCE, 'vendor', e.target.value)} className={inputFieldStyle} /></div>
              <div className="md:col-span-4"><label className={labelStyle}>Insurance Doc File</label><input type="text" value={getDocValue(DocumentType.INSURANCE, 'fileName') as string} onChange={e => handleDocumentChange(DocumentType.INSURANCE, 'fileName', e.target.value)} className={inputFieldStyle} placeholder="insurance_policy.pdf" /></div>
          </div>
        </fieldset>
        {/* RC */}
        <fieldset className="p-3 border border-gray-600 rounded-lg"><legend className="font-medium text-gray-200">Registration Certificate (RC)</legend>
          <div><label className={labelStyle}>RC Doc File</label><input type="text" value={getDocValue(DocumentType.RC, 'fileName') as string} onChange={e => handleDocumentChange(DocumentType.RC, 'fileName', e.target.value)} className={inputFieldStyle} placeholder="rc_book.pdf" /></div>
        </fieldset>
      </div>

      <div className={activeTab === 'expenses' ? 'block' : 'hidden'}>
        <p className="text-gray-500">Expense tracking for this vehicle will be available here after onboarding.</p>
      </div>

      <div className="flex justify-end space-x-3 pt-5 border-t border-gray-700">
        <button type="button" onClick={onCancel} className="bg-gray-600 py-2 px-4 border border-gray-500 rounded-md shadow-sm text-sm font-medium text-gray-300 hover:bg-gray-500">Cancel</button>
        <button type="submit" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700">
          {initialData ? 'Update Vehicle' : 'Onboard Vehicle'}
        </button>
      </div>
    </form>
  );
};

export default VehicleForm;
