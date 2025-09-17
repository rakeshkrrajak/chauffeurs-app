import React, { useState, useMemo, useCallback } from 'react';
import { User, UserRole, UserStatus, Vehicle } from '../types';
import Modal from '../components/Modal';
import { UsersIcon } from '../constants'; 

interface UserManagementPageProps {
  users: User[];
  vehicles: Vehicle[];
  addUser: (user: Omit<User, 'id' | 'createdAt'>) => void;
  updateUser: (user: User) => void;
  toggleUserStatus: (userId: string) => void; 
}

const initialUserFormState: Omit<User, 'id' | 'createdAt'> = {
  name: '',
  email: '',
  role: UserRole.FLEET_MANAGER, 
  status: UserStatus.ACTIVE,
  contact: '',
  address: '',
  officeAddress: '',
};

const inputFieldStyle = "bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-500 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm rounded-lg p-2.5";
const labelStyle = "block text-sm font-medium text-gray-300 mb-1";
const buttonPrimaryStyle = "px-6 py-2.5 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-md transition-colors";
const buttonSecondaryStyle = "px-6 py-2.5 text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-lg shadow-sm transition-colors";

interface UserFormProps {
  onSubmit: (user: Omit<User, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
  initialData?: User | null;
}

const UserForm: React.FC<UserFormProps> = ({ onSubmit, onCancel, initialData }) => {
  const [formData, setFormData] = useState<Omit<User, 'id' | 'createdAt'>>(
    initialData ? { 
        name: initialData.name, 
        email: initialData.email, 
        role: initialData.role, 
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
    if (!formData.name || !formData.email) {
      alert("Please fill in Name and Email fields.");
      return;
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
        alert("Please enter a valid email address.");
        return;
    }
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className={labelStyle}>Full Name *</label>
        <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className={`${inputFieldStyle} mt-1`} />
      </div>
      <div>
        <label htmlFor="email" className={labelStyle}>Email Address *</label>
        <input type="email" name="email" id="email" value={formData.email} onChange={handleChange} required className={`${inputFieldStyle} mt-1`} />
      </div>
       <div>
        <label htmlFor="contact" className={labelStyle}>Contact Number</label>
        <input type="tel" name="contact" id="contact" value={formData.contact} onChange={handleChange} className={`${inputFieldStyle} mt-1`} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="role" className={labelStyle}>Role *</label>
          <select name="role" id="role" value={formData.role} onChange={handleChange} required className={`${inputFieldStyle} mt-1 pr-8`}>
            {Object.values(UserRole).filter(r => r !== UserRole.EMPLOYEE).map(role => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="status" className={labelStyle}>Status *</label>
          <select name="status" id="status" value={formData.status} onChange={handleChange} required className={`${inputFieldStyle} mt-1 pr-8`}>
            {Object.values(UserStatus).map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="flex justify-end space-x-3 pt-4">
        <button type="button" onClick={onCancel} className={buttonSecondaryStyle}>Cancel</button>
        <button type="submit" className={buttonPrimaryStyle}>
          {initialData ? 'Update User' : 'Add User'}
        </button>
      </div>
    </form>
  );
};

const UserManagementPage: React.FC<UserManagementPageProps> = ({ users, vehicles, addUser, updateUser, toggleUserStatus }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [historyUser, setHistoryUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const openAddModal = () => { setEditingUser(null); setIsModalOpen(true); };
  const openEditModal = (user: User) => { setEditingUser(user); setIsModalOpen(true); };
  const closeModal = () => { setIsModalOpen(false); setEditingUser(null); };

  const openHistoryModal = (user: User) => { setHistoryUser(user); setIsHistoryModalOpen(true); };
  const closeHistoryModal = () => { setIsHistoryModalOpen(false); setHistoryUser(null); };

  const handleFormSubmit = (userData: Omit<User, 'id' | 'createdAt'>) => {
    if (editingUser) {
      updateUser({ ...editingUser, ...userData });
    } else {
      addUser(userData);
    }
    closeModal();
  };

  const handleToggleStatus = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user && user.role === UserRole.ADMIN && user.status === UserStatus.ACTIVE) {
        const activeAdmins = users.filter(u => u.role === UserRole.ADMIN && u.status === UserStatus.ACTIVE).length;
        if (activeAdmins <= 1) {
            alert("Cannot deactivate the last active Admin user.");
            return;
        }
    }
    const action = user?.status === UserStatus.ACTIVE ? "deactivate" : "activate";
    if (window.confirm(`Are you sure you want to ${action} this user?`)) {
        toggleUserStatus(userId);
    }
  };

  const formatDate = useCallback((dateString?: string, withTime = false) => {
    if (!dateString) return 'N/A';
    try {
      const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
       if(withTime) {
        options.hour = 'numeric';
        options.minute = 'numeric';
      }
      return new Date(dateString).toLocaleDateString('en-IN', options);
    } catch { return 'Invalid Date'; }
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter(user =>
      (user.role === UserRole.ADMIN || user.role === UserRole.FLEET_MANAGER) &&
      (user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [users, searchTerm]);

  const userVehicleHistory = useMemo(() => {
    if (!historyUser) return [];
    const history: { vehicle: Vehicle, historyEntry: Vehicle['assignmentHistory'][0]}[] = [];
    vehicles.forEach(vehicle => {
        (vehicle.assignmentHistory || []).forEach(entry => {
            if (entry.assignedToId === historyUser.id) {
                history.push({ vehicle, historyEntry: entry });
            }
        });
    });
    return history.sort((a,b) => new Date(b.historyEntry.startDate).getTime() - new Date(a.historyEntry.startDate).getTime());
  }, [historyUser, vehicles]);

  const getStatusClass = (status: UserStatus) => {
    return status === UserStatus.ACTIVE ? 'bg-green-700 bg-opacity-30 text-green-300' : 'bg-red-700 bg-opacity-30 text-red-300';
  };
  
  const getRoleClass = (role: UserRole) => {
    switch(role) {
        case UserRole.ADMIN: return 'bg-sky-700 bg-opacity-40 text-sky-300';
        case UserRole.FLEET_MANAGER: return 'bg-indigo-700 bg-opacity-40 text-indigo-300';
        default: return 'bg-gray-700 bg-opacity-40 text-gray-300';
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h1 className="text-3xl font-bold text-gray-100 flex items-center">
            <UsersIcon className="w-8 h-8 mr-3 text-primary-400"/> Admin User Management
        </h1>
        <div className="flex items-center gap-x-3">
          <button onClick={openAddModal} className={`${buttonPrimaryStyle} flex items-center`}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-2"><path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" /></svg>
            Add User
          </button>
        </div>
      </div>

      <input
        type="text"
        placeholder="Search users (name, email, role)..."
        className={inputFieldStyle}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      <div className="bg-gray-800 shadow-xl rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-gray-750">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Name</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Contact Info</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Role</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Created At</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-gray-800 divide-y divide-gray-700">
            {filteredUsers.map(user => (
              <tr key={user.id} className="hover:bg-gray-750 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-100">{user.name}</div>
                  <div className="text-xs text-gray-400">{user.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-300">{user.contact || 'N/A'}</div>
                  <div className="text-xs text-gray-400 truncate" title={user.officeAddress}>{user.officeAddress || 'N/A'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleClass(user.role)}`}>{user.role}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(user.status)}`}>{user.status}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{formatDate(user.createdAt)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button onClick={() => openHistoryModal(user)} className="text-primary-400 hover:text-primary-300 transition-colors">View History</button>
                  <button onClick={() => openEditModal(user)} className="text-indigo-400 hover:text-indigo-300 transition-colors">Edit</button>
                  <button onClick={() => handleToggleStatus(user.id)} className={`${user.status === UserStatus.ACTIVE ? 'text-red-400 hover:text-red-300' : 'text-green-400 hover:text-green-300'} transition-colors`}>
                    {user.status === UserStatus.ACTIVE ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
            {filteredUsers.length === 0 && (
              <tr><td colSpan={6} className="text-center text-gray-500 py-10">No admin users found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingUser ? 'Edit User' : 'Add New User'} size="2xl">
        <UserForm onSubmit={handleFormSubmit} onCancel={closeModal} initialData={editingUser} />
      </Modal>

      {historyUser && (
        <Modal isOpen={isHistoryModalOpen} onClose={closeHistoryModal} title={`Vehicle Assignment History for ${historyUser.name}`} size="2xl">
            <div className="max-h-[60vh] overflow-y-auto">
                {userVehicleHistory.length > 0 ? (
                    <table className="min-w-full divide-y divide-gray-700 text-sm">
                        <thead className="bg-gray-750 sticky top-0">
                            <tr>
                                <th className="px-4 py-2 text-left font-medium text-gray-400 uppercase">Vehicle</th>
                                <th className="px-4 py-2 text-left font-medium text-gray-400 uppercase">Assignment Period</th>
                                <th className="px-4 py-2 text-left font-medium text-gray-400 uppercase">Reason</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-600">
                        {userVehicleHistory.map(({ vehicle, historyEntry }, index) => (
                            <tr key={`${vehicle.id}-${index}`}>
                                <td className="px-4 py-2 text-gray-200">{vehicle.make} {vehicle.model} ({vehicle.licensePlate})</td>
                                <td className="px-4 py-2 text-gray-300">{formatDate(historyEntry.startDate, true)} to {historyEntry.endDate ? formatDate(historyEntry.endDate, true) : 'Present'}</td>
                                <td className="px-4 py-2 text-gray-400">{historyEntry.transferReason || '-'}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                ) : (
                    <p className="text-center text-gray-500 py-8">This user has no vehicle assignment history.</p>
                )}
            </div>
             <div className="flex justify-end mt-4 pt-4 border-t border-gray-700">
                <button onClick={closeHistoryModal} className={buttonSecondaryStyle}>Close</button>
            </div>
        </Modal>
      )}
    </div>
  );
};

export default UserManagementPage;