import React, { useState, useMemo, useCallback } from 'react';
import { User, UserRole, UserStatus, Vehicle } from '../types';
import Modal from '../components/Modal';
import { UserGroupIcon } from '../constants';

interface EmployeeDirectoryPageProps {
  users: User[];
  vehicles: Vehicle[];
  updateUser: (user: User) => void;
  toggleUserStatus: (userId: string) => void;
}

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

const EmployeeDirectoryPage: React.FC<EmployeeDirectoryPageProps> = ({ users, vehicles, updateUser, toggleUserStatus }) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const openEditModal = (user: User) => { setSelectedUser(user); setIsEditModalOpen(true); };
  const closeEditModal = () => { setSelectedUser(null); setIsEditModalOpen(false); };
  const openHistoryModal = (user: User) => { setSelectedUser(user); setIsHistoryModalOpen(true); };
  const closeHistoryModal = () => { setSelectedUser(null); setIsHistoryModalOpen(false); };

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

  const formatDate = useCallback((dateString?: string, withTime = false) => {
    if (!dateString) return 'N/A';
    try {
      const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
       if(withTime) { options.hour = 'numeric'; options.minute = 'numeric'; }
      return new Date(dateString).toLocaleDateString('en-IN', options);
    } catch { return 'Invalid Date'; }
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter(user =>
      user.role === UserRole.EMPLOYEE &&
      (user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.empId && user.empId.toLowerCase().includes(searchTerm.toLowerCase())))
    );
  }, [users, searchTerm]);

  const userVehicleHistory = useMemo(() => {
    if (!selectedUser) return [];
    const history: { vehicle: Vehicle, historyEntry: Vehicle['assignmentHistory'][0]}[] = [];
    vehicles.forEach(vehicle => {
        (vehicle.assignmentHistory || []).forEach(entry => {
            if (entry.assignedToId === selectedUser.id) {
                history.push({ vehicle, historyEntry: entry });
            }
        });
    });
    return history.sort((a,b) => new Date(b.historyEntry.startDate).getTime() - new Date(a.historyEntry.startDate).getTime());
  }, [selectedUser, vehicles]);
  
  const getAssignedVehicle = useCallback((userId: string) => {
      const vehicle = vehicles.find(v => v.assignedEmployeeId === userId);
      return vehicle ? `${vehicle.make} ${vehicle.model} (${vehicle.licensePlate})` : 'None';
  }, [vehicles]);

  const getStatusClass = (status: UserStatus) => status === UserStatus.ACTIVE ? 'bg-green-700 bg-opacity-30 text-green-300' : 'bg-red-700 bg-opacity-30 text-red-300';

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-100 flex items-center"><UserGroupIcon className="w-8 h-8 mr-3 text-primary-400"/> Employee Directory</h1>
      <input type="text" placeholder="Search employees (name, email, ID)..." className={inputFieldStyle} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      <div className="bg-gray-800 shadow-xl rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-gray-750">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Employee</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Department Info</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Assigned Vehicle</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-gray-800 divide-y divide-gray-700">
            {filteredUsers.map(user => (
              <tr key={user.id} className="hover:bg-gray-750 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm font-medium text-gray-100">{user.name}</div><div className="text-xs text-gray-400">{user.email} | {user.empId}</div></td>
                <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm text-gray-300">{user.department}</div><div className="text-xs text-gray-400">L: {user.level} | CC: {user.costCenter}</div></td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{getAssignedVehicle(user.id)}</td>
                <td className="px-6 py-4 whitespace-nowrap"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(user.status)}`}>{user.status}</span></td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button onClick={() => openHistoryModal(user)} className="text-primary-400 hover:text-primary-300">View History</button>
                  <button onClick={() => openEditModal(user)} className="text-indigo-400 hover:text-indigo-300">Edit</button>
                  <button onClick={() => handleToggleStatus(user.id)} className={`${user.status === UserStatus.ACTIVE ? 'text-red-400 hover:text-red-300' : 'text-green-400 hover:text-green-300'}`}>{user.status === UserStatus.ACTIVE ? 'Deactivate' : 'Activate'}</button>
                </td>
              </tr>
            ))}
            {filteredUsers.length === 0 && (<tr><td colSpan={5} className="text-center text-gray-500 py-10">No employees found.</td></tr>)}
          </tbody>
        </table>
      </div>

      {isEditModalOpen && <Modal isOpen={isEditModalOpen} onClose={closeEditModal} title={`Edit Employee: ${selectedUser?.name}`} size="2xl"><EmployeeForm onSubmit={handleFormSubmit} onCancel={closeEditModal} initialData={selectedUser} /></Modal>}
      {isHistoryModalOpen && <Modal isOpen={isHistoryModalOpen} onClose={closeHistoryModal} title={`Vehicle Assignment History for ${selectedUser?.name}`} size="2xl"><div className="max-h-[60vh] overflow-y-auto">{userVehicleHistory.length > 0 ? (<table className="min-w-full divide-y divide-gray-700 text-sm"><thead className="bg-gray-750 sticky top-0"><tr><th className="px-4 py-2 text-left font-medium text-gray-400 uppercase">Vehicle</th><th className="px-4 py-2 text-left font-medium text-gray-400 uppercase">Assignment Period</th></tr></thead><tbody className="divide-y divide-gray-600">{userVehicleHistory.map(({ vehicle, historyEntry }, index) => (<tr key={`${vehicle.id}-${index}`}><td className="px-4 py-2 text-gray-200">{vehicle.make} {vehicle.model} ({vehicle.licensePlate})</td><td className="px-4 py-2 text-gray-300">{formatDate(historyEntry.startDate, true)} to {historyEntry.endDate ? formatDate(historyEntry.endDate, true) : 'Present'}</td></tr>))}</tbody></table>) : (<p className="text-center text-gray-500 py-8">This user has no vehicle assignment history.</p>)}</div><div className="flex justify-end mt-4 pt-4 border-t border-gray-700"><button onClick={closeHistoryModal} className={buttonSecondaryStyle}>Close</button></div></Modal>}
    </div>
  );
};

export default EmployeeDirectoryPage;