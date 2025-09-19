import React, { useState, useMemo, useCallback } from 'react';
import { User, UserRole, UserStatus, Vehicle } from '../types';
import Modal from '../components/Modal';
import { UserGroupIcon, ShieldCheckIcon, BellAlertIcon } from '../constants'; // Added BellAlertIcon

interface EmployeeDirectoryPageProps {
  users: User[];
  vehicles: Vehicle[];
  updateUser: (user: User) => void;
  toggleUserStatus: (userId: string) => void;
}

const POLICY_KM_LIMIT = 60000;
const POLICY_YEAR_LIMIT = 3;

// --- Helper Components ---

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; accentColor: string; }> = ({ title, value, icon, accentColor }) => (
  <div className={`bg-gray-800 p-4 rounded-lg shadow-lg flex items-center space-x-3 border-l-4 ${accentColor}`}>
    {icon}
    <div>
      <p className="text-sm text-gray-400">{title}</p>
      <p className="text-2xl font-bold text-gray-100">{value}</p>
    </div>
  </div>
);

const ProgressBar: React.FC<{ value: number; limit: number; colorClass: string }> = ({ value, limit, colorClass }) => {
    const percentage = Math.min((value / limit) * 100, 100);
    return (
      <div className="w-full bg-gray-600 rounded-full h-2.5">
        <div className={`${colorClass} h-2.5 rounded-full`} style={{ width: `${percentage}%` }}></div>
      </div>
    );
};

// --- Form Component (No changes here) ---
const initialUserFormState: Omit<User, 'id' | 'createdAt' | 'role'> = {
  name: '',
  email: '',
  status: UserStatus.ACTIVE,
  contact: '',
  address: '',
  officeAddress: '',
  empId: '',
  department: '',
  level: '',
  costCenter: '',
};

const inputFieldStyle = "bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-500 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm rounded-lg p-2.5";
const labelStyle = "block text-sm font-medium text-gray-300 mb-1";
const buttonPrimaryStyle = "px-6 py-2.5 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-md transition-colors";
const buttonSecondaryStyle = "px-6 py-2.5 text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-lg shadow-sm transition-colors";

interface EmployeeFormProps {
  onSubmit: (user: Omit<User, 'id' | 'createdAt' | 'role'>) => void;
  onCancel: () => void;
  initialData?: User | null;
}

const EmployeeForm: React.FC<EmployeeFormProps> = ({ onSubmit, onCancel, initialData }) => {
  const [formData, setFormData] = useState<Omit<User, 'id' | 'createdAt' | 'role'>>(
    initialData ? {
        name: initialData.name,
        email: initialData.email,
        status: initialData.status,
        contact: initialData.contact || '',
        address: initialData.address || '',
        officeAddress: initialData.officeAddress || '',
        empId: initialData.empId || '',
        department: initialData.department || '',
        level: initialData.level || '',
        costCenter: initialData.costCenter || '',
     } : initialUserFormState
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div><label htmlFor="name" className={labelStyle}>Full Name *</label><input type="text" name="name" value={formData.name} onChange={handleChange} required className={inputFieldStyle} /></div>
        <div><label htmlFor="email" className={labelStyle}>Email Address *</label><input type="email" name="email" value={formData.email} onChange={handleChange} required className={inputFieldStyle} /></div>
        <div><label htmlFor="empId" className={labelStyle}>Employee ID *</label><input type="text" name="empId" value={formData.empId} onChange={handleChange} required className={inputFieldStyle} /></div>
        <div><label htmlFor="contact" className={labelStyle}>Contact Number</label><input type="tel" name="contact" value={formData.contact} onChange={handleChange} className={inputFieldStyle} /></div>
      </div>
      <div><label htmlFor="address" className={labelStyle}>Personal Address</label><textarea name="address" value={formData.address} onChange={handleChange} rows={2} className={inputFieldStyle} /></div>
      <div><label htmlFor="officeAddress" className={labelStyle}>Office Address</label><textarea name="officeAddress" value={formData.officeAddress} onChange={handleChange} rows={2} className={inputFieldStyle} /></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div><label htmlFor="department" className={labelStyle}>Department</label><input type="text" name="department" value={formData.department} onChange={handleChange} className={inputFieldStyle} /></div>
        <div><label htmlFor="level" className={labelStyle}>Level</label><input type="text" name="level" value={formData.level} onChange={handleChange} className={inputFieldStyle} /></div>
        <div><label htmlFor="costCenter" className={labelStyle}>Cost Center</label><input type="text" name="costCenter" value={formData.costCenter} onChange={handleChange} className={inputFieldStyle} /></div>
      </div>
      <div className="flex justify-end space-x-3 pt-4"><button type="button" onClick={onCancel} className={buttonSecondaryStyle}>Cancel</button><button type="submit" className={buttonPrimaryStyle}>Update Employee</button></div>
    </form>
  );
};

// --- Main Page Component ---
type PolicyStatus = 'Exceeded' | 'Approaching Limit' | 'Within Limit';
type PolicyFilter = PolicyStatus | 'ALL';

const EmployeeDirectoryPage: React.FC<EmployeeDirectoryPageProps> = ({ users, vehicles, updateUser, toggleUserStatus }) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedEmployeeId, setExpandedEmployeeId] = useState<string | null>(null);
  const [policyFilter, setPolicyFilter] = useState<PolicyFilter>('ALL');

  const openEditModal = (user: User) => { setSelectedUser(user); setIsEditModalOpen(true); };
  const closeEditModal = () => { setSelectedUser(null); setIsEditModalOpen(false); };

  const handleFormSubmit = (userData: Omit<User, 'id' | 'createdAt' | 'role'>) => {
    if (selectedUser) {
      updateUser({ ...selectedUser, ...userData });
    }
    closeEditModal();
  };

  const handleToggleStatus = (userId: string) => {
    const user = users.find(u => u.id === userId);
    const action = user?.status === UserStatus.ACTIVE ? "deactivate" : "activate";
    if (window.confirm(`Are you sure you want to ${action} this employee?`)) {
        toggleUserStatus(userId);
    }
  };

  const formatDate = useCallback((date: Date | string | null) => {
      if (!date) return 'N/A';
      return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }, []);

  const allEmployeePolicyData = useMemo(() => {
    const employeeDataMap = new Map<string, {
      user: User;
      assignments: {
        vehicle: Vehicle;
        historyEntry: Vehicle['assignmentHistory'][0];
        kmDriven: number;
      }[];
      totalKmDriven: number;
      policyStartDate: Date | null;
      monthsElapsed: number;
      status: PolicyStatus;
    }>();

    users.forEach(user => {
        if(user.role === UserRole.EMPLOYEE) {
            employeeDataMap.set(user.id, {
                user, assignments: [], totalKmDriven: 0, policyStartDate: null, monthsElapsed: 0, status: 'Within Limit',
            });
        }
    });

    vehicles.forEach(vehicle => {
      (vehicle.assignmentHistory || []).forEach(entry => {
        if (entry.type === 'Employee' && employeeDataMap.has(entry.assignedToId)) {
          const kmDriven = (entry.endMileage || vehicle.mileage) - (entry.startMileage || 0);
          employeeDataMap.get(entry.assignedToId)!.assignments.push({
            vehicle, historyEntry: entry, kmDriven: kmDriven > 0 ? kmDriven : 0,
          });
        }
      });
    });

    employeeDataMap.forEach(data => {
      if (data.assignments.length > 0) {
        data.assignments.sort((a, b) => new Date(a.historyEntry.startDate).getTime() - new Date(b.historyEntry.startDate).getTime());
        data.policyStartDate = new Date(data.assignments[0].historyEntry.startDate);
        data.totalKmDriven = data.assignments.reduce((sum, assign) => sum + assign.kmDriven, 0);
        const now = new Date();
        data.monthsElapsed = (now.getFullYear() - data.policyStartDate.getFullYear()) * 12 + (now.getMonth() - data.policyStartDate.getMonth());
        const kmPercentage = (data.totalKmDriven / POLICY_KM_LIMIT) * 100;
        const timePercentage = (data.monthsElapsed / (POLICY_YEAR_LIMIT * 12)) * 100;
        if (kmPercentage >= 100 || timePercentage >= 100) data.status = 'Exceeded';
        else if (kmPercentage > 85 || timePercentage > 85) data.status = 'Approaching Limit';
      }
    });

    return Array.from(employeeDataMap.values()).sort((a, b) => b.totalKmDriven - a.totalKmDriven);
  }, [users, vehicles]);

  const policyStats = useMemo(() => {
    return allEmployeePolicyData.reduce((acc, data) => {
        if (data.assignments.length > 0) {
            if (data.status === 'Within Limit') acc.withinLimit++;
            if (data.status === 'Approaching Limit') acc.approachingLimit++;
            if (data.status === 'Exceeded') acc.exceeded++;
        }
        return acc;
    }, { withinLimit: 0, approachingLimit: 0, exceeded: 0 });
  }, [allEmployeePolicyData]);

  const filteredEmployeePolicyData = useMemo(() => {
    return allEmployeePolicyData.filter(data => {
        const matchesPolicy = policyFilter === 'ALL' || data.status === policyFilter;
        const matchesSearch = searchTerm === '' ||
            data.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            data.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (data.user.empId && data.user.empId.toLowerCase().includes(searchTerm.toLowerCase()));
        return matchesPolicy && matchesSearch;
    });
  }, [allEmployeePolicyData, policyFilter, searchTerm]);

  const toggleExpand = (employeeId: string) => {
    setExpandedEmployeeId(prevId => (prevId === employeeId ? null : employeeId));
  };
  
  const getStatusClass = (status: UserStatus) => status === UserStatus.ACTIVE ? 'bg-green-700 bg-opacity-30 text-green-300' : 'bg-red-700 bg-opacity-30 text-red-300';
  const getPolicyStatusPillClass = (status: PolicyStatus) => {
      switch (status) {
          case 'Exceeded': return 'bg-red-700 bg-opacity-40 text-red-300';
          case 'Approaching Limit': return 'bg-amber-700 bg-opacity-40 text-amber-300';
          case 'Within Limit': return 'bg-green-700 bg-opacity-40 text-green-300';
          default: return 'bg-gray-700 text-gray-300';
      }
  };

  const policyFilters: { label: string; value: PolicyFilter }[] = [
    { label: 'All', value: 'ALL' },
    { label: 'Within Limit', value: 'Within Limit' },
    { label: 'Approaching Limit', value: 'Approaching Limit' },
    { label: 'Exceeded', value: 'Exceeded' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-100 flex items-center"><UserGroupIcon className="w-8 h-8 mr-3 text-primary-400"/> Employee Directory & Policy</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Within Policy Limit" value={policyStats.withinLimit} icon={<ShieldCheckIcon className="w-7 h-7 text-green-400"/>} accentColor="border-green-500" />
        <StatCard title="Approaching Limit" value={policyStats.approachingLimit} icon={<BellAlertIcon className="w-7 h-7 text-amber-400"/>} accentColor="border-amber-500" />
        <StatCard title="Exceeded Limit" value={policyStats.exceeded} icon={<ShieldCheckIcon className="w-7 h-7 text-red-400"/>} accentColor="border-red-500" />
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <input type="text" placeholder="Search employees (name, email, ID)..." className={`${inputFieldStyle} flex-grow`} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        <div className="flex-shrink-0 bg-gray-700 p-1 rounded-lg flex items-center space-x-1">
            {policyFilters.map(filter => (
                 <button 
                    key={filter.value} 
                    onClick={() => setPolicyFilter(filter.value)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${policyFilter === filter.value ? 'bg-primary-600 text-white shadow' : 'text-gray-300 hover:bg-gray-600'}`}
                >
                    {filter.label}
                </button>
            ))}
        </div>
      </div>
      <div className="bg-gray-800 shadow-xl rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-700 text-sm">
          <thead className="bg-gray-750">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-400 uppercase w-10"></th>
              <th className="px-4 py-3 text-left font-medium text-gray-400 uppercase">Employee</th>
              <th className="px-4 py-3 text-left font-medium text-gray-400 uppercase">KM Progress ({POLICY_KM_LIMIT.toLocaleString()} km)</th>
              <th className="px-4 py-3 text-left font-medium text-gray-400 uppercase">Time Progress ({POLICY_YEAR_LIMIT} Years)</th>
              <th className="px-4 py-3 text-left font-medium text-gray-400 uppercase">Policy Status</th>
              <th className="px-4 py-3 text-left font-medium text-gray-400 uppercase">Account Status</th>
              <th className="px-4 py-3 text-left font-medium text-gray-400 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-gray-800 divide-y divide-gray-700">
            {filteredEmployeePolicyData.map(data => {
              const kmProgress = (data.totalKmDriven / POLICY_KM_LIMIT) * 100;
              const timeProgress = (data.monthsElapsed / (POLICY_YEAR_LIMIT * 12)) * 100;
              const isExpanded = expandedEmployeeId === data.user.id;
              
              return (
                <React.Fragment key={data.user.id}>
                  <tr className="hover:bg-gray-750 transition-colors">
                    <td className="px-4 py-3">
                      <button onClick={() => toggleExpand(data.user.id)} className="text-gray-400 hover:text-white disabled:opacity-30" disabled={data.assignments.length === 0}>
                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </td>
                    <td className="px-4 py-3"><div className="font-medium text-gray-100">{data.user.name}</div><div className="text-xs text-gray-400">{data.user.department} | {data.user.empId}</div></td>
                    <td className="px-4 py-3"><ProgressBar value={data.totalKmDriven} limit={POLICY_KM_LIMIT} colorClass={kmProgress > 85 ? 'bg-red-500' : kmProgress > 60 ? 'bg-amber-500' : 'bg-green-500'} /><div className="text-xs text-gray-300 mt-1">{data.totalKmDriven > 0 ? `${data.totalKmDriven.toLocaleString()} km` : 'N/A'}</div></td>
                    <td className="px-4 py-3"><ProgressBar value={data.monthsElapsed} limit={POLICY_YEAR_LIMIT * 12} colorClass={timeProgress > 85 ? 'bg-red-500' : timeProgress > 60 ? 'bg-amber-500' : 'bg-green-500'} /><div className="text-xs text-gray-300 mt-1">{data.monthsElapsed > 0 ? `${Math.floor(data.monthsElapsed/12)}Y ${data.monthsElapsed % 12}M` : 'N/A'}</div></td>
                    <td className="px-4 py-3"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPolicyStatusPillClass(data.status)}`}>{data.assignments.length > 0 ? data.status : 'No Policy'}</span></td>
                    <td className="px-4 py-3"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusClass(data.user.status)}`}>{data.user.status}</span></td>
                    <td className="px-4 py-3 whitespace-nowrap font-medium space-x-2">
                        <button onClick={() => openEditModal(data.user)} className="text-indigo-400 hover:text-indigo-300">Edit</button>
                        <button onClick={() => handleToggleStatus(data.user.id)} className={`${data.user.status === UserStatus.ACTIVE ? 'text-red-400 hover:text-red-300' : 'text-green-400 hover:text-green-300'}`}>{data.user.status === UserStatus.ACTIVE ? 'Deactivate' : 'Activate'}</button>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr className="bg-gray-850"><td colSpan={7} className="p-4">
                        <h4 className="font-semibold text-gray-200 mb-2">Assignment Details for {data.user.name}</h4>
                        <table className="min-w-full divide-y divide-gray-700 text-xs"><thead className="bg-gray-700"><tr><th className="px-3 py-2 text-left font-medium text-gray-400">Vehicle</th><th className="px-3 py-2 text-left font-medium text-gray-400">Assignment Period</th><th className="px-3 py-2 text-right font-medium text-gray-400">KM Driven</th></tr></thead>
                            <tbody className="divide-y divide-gray-700">{data.assignments.map(a => (<tr key={a.vehicle.id + a.historyEntry.startDate}>
                                <td className="px-3 py-2">{a.vehicle.make} {a.vehicle.model} ({a.vehicle.licensePlate})</td>
                                <td className="px-3 py-2">{formatDate(a.historyEntry.startDate)} to {formatDate(a.historyEntry.endDate)}</td>
                                <td className="px-3 py-2 text-right">{a.kmDriven.toLocaleString()} km</td>
                            </tr>))}</tbody>
                        </table>
                    </td></tr>
                  )}
                </React.Fragment>
              );
            })}
             {filteredEmployeePolicyData.length === 0 && (<tr><td colSpan={7} className="text-center py-10 text-gray-500">No employees found.</td></tr>)}
          </tbody>
        </table>
      </div>
      {isEditModalOpen && <Modal isOpen={isEditModalOpen} onClose={closeEditModal} title={`Edit Employee: ${selectedUser?.name}`} size="2xl"><EmployeeForm onSubmit={handleFormSubmit} onCancel={closeEditModal} initialData={selectedUser} /></Modal>}
    </div>
  );
};

export default EmployeeDirectoryPage;