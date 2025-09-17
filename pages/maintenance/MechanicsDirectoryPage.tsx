
import React, { useState, useMemo } from 'react';
import { Mechanic } from '../../types';
import Modal from '../../components/Modal';
import { UserGroupIcon } from '../../constants';

const generateMockId = () => Math.random().toString(36).substring(2, 10);

interface MechanicsDirectoryPageProps {
  mechanics: Mechanic[];
  addMechanic: (mechanic: Omit<Mechanic, 'id'>) => void;
  updateMechanic: (mechanic: Mechanic) => void;
  deleteMechanic: (mechanicId: string) => void;
}

const initialMechanicFormState: Omit<Mechanic, 'id'> = {
  name: '',
  contactPerson: '',
  phoneNumber: '',
  email: '',
  address: '',
  specialties: [],
  rating: 0,
  notes: '',
  isInternal: false,
};

// Common dark theme styles
const inputFieldStyle = "bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-500 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm rounded-lg p-2.5";
const labelStyle = "block text-sm font-medium text-gray-300 mb-1";
const buttonPrimaryStyle = "px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-md transition-colors";
const buttonSecondaryStyle = "px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-lg shadow-sm transition-colors";
const buttonSmallActionStyle = "text-xs py-1.5 px-3 rounded-md transition-colors";

interface MechanicFormProps {
  onSubmit: (mechanic: Omit<Mechanic, 'id'>) => void;
  onCancel: () => void;
  initialData?: Mechanic | null;
}

const MechanicForm: React.FC<MechanicFormProps> = ({ onSubmit, onCancel, initialData }) => {
  const [formData, setFormData] = useState<Omit<Mechanic, 'id'>>(
    initialData ? { ...initialData, specialties: initialData.specialties || [] } : { ...initialMechanicFormState, specialties: [] }
  );
  const [currentSpecialty, setCurrentSpecialty] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: name === 'rating' ? parseFloat(value) : value }));
    }
  };

  const handleAddSpecialty = () => {
    if (currentSpecialty.trim() && !formData.specialties?.includes(currentSpecialty.trim())) {
      setFormData(prev => ({ ...prev, specialties: [...(prev.specialties || []), currentSpecialty.trim()] }));
      setCurrentSpecialty('');
    }
  };

  const handleRemoveSpecialty = (specToRemove: string) => {
    setFormData(prev => ({ ...prev, specialties: (prev.specialties || []).filter(spec => spec !== specToRemove) }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phoneNumber) {
      alert("Please fill in Mechanic/Vendor Name and Phone Number.");
      return;
    }
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-sm">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="name" className={labelStyle}>Mechanic/Vendor Name *</label>
          <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className={`${inputFieldStyle} mt-1`} />
        </div>
        <div>
          <label htmlFor="contactPerson" className={labelStyle}>Contact Person</label>
          <input type="text" name="contactPerson" id="contactPerson" value={formData.contactPerson || ''} onChange={handleChange} className={`${inputFieldStyle} mt-1`} />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="phoneNumber" className={labelStyle}>Phone Number *</label>
          <input type="tel" name="phoneNumber" id="phoneNumber" value={formData.phoneNumber} onChange={handleChange} required className={`${inputFieldStyle} mt-1`} />
        </div>
        <div>
          <label htmlFor="email" className={labelStyle}>Email Address</label>
          <input type="email" name="email" id="email" value={formData.email || ''} onChange={handleChange} className={`${inputFieldStyle} mt-1`} />
        </div>
      </div>
      <div>
        <label htmlFor="address" className={labelStyle}>Address</label>
        <textarea name="address" id="address" value={formData.address || ''} onChange={handleChange} rows={2} className={`${inputFieldStyle} mt-1`} />
      </div>
      <div>
        <label htmlFor="specialties" className={labelStyle}>Service Specialties</label>
        <div className="flex items-center gap-2 mt-1">
          <input
            type="text"
            value={currentSpecialty}
            onChange={(e) => setCurrentSpecialty(e.target.value)}
            placeholder="e.g., Engine, Tires"
            className={`${inputFieldStyle} flex-grow`}
          />
          <button type="button" onClick={handleAddSpecialty} className={`${buttonSmallActionStyle} bg-sky-700 bg-opacity-50 text-sky-300 hover:bg-sky-600`}>Add</button>
        </div>
        <div className="mt-2 flex flex-wrap gap-1">
          {(formData.specialties || []).map(spec => (
            <span key={spec} className="bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full text-xs flex items-center">
              {spec}
              <button type="button" onClick={() => handleRemoveSpecialty(spec)} className="ml-1.5 text-gray-500 hover:text-gray-300">&times;</button>
            </span>
          ))}
        </div>
      </div>
       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="rating" className={labelStyle}>Rating (1-5)</label>
            <input type="number" name="rating" id="rating" value={formData.rating || 0} onChange={handleChange} min="0" max="5" step="0.1" className={`${inputFieldStyle} mt-1`} />
          </div>
          <div className="flex items-center pt-6">
            <input type="checkbox" name="isInternal" id="isInternal" checked={formData.isInternal} onChange={handleChange} className="h-4 w-4 text-primary-500 bg-gray-600 border-gray-500 rounded focus:ring-primary-600 focus:ring-offset-gray-800" />
            <label htmlFor="isInternal" className="ml-2 block text-sm text-gray-300">Internal Mechanic/Team</label>
          </div>
       </div>
      <div>
        <label htmlFor="notes" className={labelStyle}>Notes</label>
        <textarea name="notes" id="notes" value={formData.notes || ''} onChange={handleChange} rows={2} className={`${inputFieldStyle} mt-1`} />
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-700 mt-4">
        <button type="button" onClick={onCancel} className={buttonSecondaryStyle}>Cancel</button>
        <button type="submit" className={buttonPrimaryStyle}>
          {initialData ? 'Update Mechanic' : 'Add Mechanic'}
        </button>
      </div>
    </form>
  );
};

const MechanicsDirectoryPage: React.FC<MechanicsDirectoryPageProps> = ({ mechanics, addMechanic, updateMechanic, deleteMechanic }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMechanic, setEditingMechanic] = useState<Mechanic | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const openAddModal = () => { setEditingMechanic(null); setIsModalOpen(true); };
  const openEditModal = (mechanic: Mechanic) => { setEditingMechanic(mechanic); setIsModalOpen(true); };
  const closeModal = () => { setIsModalOpen(false); setEditingMechanic(null); };

  const handleFormSubmit = (mechanicData: Omit<Mechanic, 'id'>) => {
    if (editingMechanic) {
      updateMechanic({ ...editingMechanic, ...mechanicData });
    } else {
      addMechanic(mechanicData);
    }
    closeModal();
  };

  const handleDelete = (mechanicId: string) => {
    if (window.confirm('Are you sure you want to delete this mechanic/vendor?')) {
      deleteMechanic(mechanicId);
    }
  };

  const filteredMechanics = useMemo(() => {
    return mechanics.filter(m =>
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.contactPerson && m.contactPerson.toLowerCase().includes(searchTerm.toLowerCase())) ||
      m.phoneNumber.includes(searchTerm) ||
      (m.specialties && m.specialties.join(' ').toLowerCase().includes(searchTerm.toLowerCase()))
    ).sort((a,b) => a.name.localeCompare(b.name));
  }, [mechanics, searchTerm]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-100 flex items-center">
            <UserGroupIcon className="w-8 h-8 mr-3 text-primary-400"/> Mechanics & Vendors Directory
        </h1>
        <button
          onClick={openAddModal}
          className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2.5 px-5 rounded-lg shadow-md flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-2"><path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" /></svg>
          Add New Mechanic/Vendor
        </button>
      </div>

      <input
        type="text"
        placeholder="Search by name, contact, phone, specialties..."
        className={`${inputFieldStyle} w-full p-3 text-base`}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMechanics.map(mechanic => (
          <div key={mechanic.id} className="bg-gray-800 rounded-xl shadow-xl overflow-hidden transition-all hover:shadow-2xl">
            <div className="p-5">
              <div className="flex justify-between items-start">
                <h3 className="text-lg font-semibold text-primary-400">{mechanic.name}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full ${mechanic.isInternal ? 'bg-green-700 bg-opacity-30 text-green-300' : 'bg-blue-700 bg-opacity-30 text-blue-300'}`}>
                  {mechanic.isInternal ? 'Internal' : 'External'}
                </span>
              </div>
              {mechanic.contactPerson && <p className="text-sm text-gray-400">Contact: {mechanic.contactPerson}</p>}
              <p className="text-sm text-gray-400">Phone: {mechanic.phoneNumber}</p>
              {mechanic.email && <p className="text-sm text-gray-400 truncate">Email: {mechanic.email}</p>}
              {mechanic.address && <p className="text-sm text-gray-500 truncate" title={mechanic.address}>Address: {mechanic.address}</p>}
              {mechanic.rating && mechanic.rating > 0 && (
                <p className="text-sm text-gray-400">
                  Rating: <span className="text-amber-400">{'⭐'.repeat(Math.round(mechanic.rating))}</span><span className="text-gray-600">{'⭐'.repeat(5-Math.round(mechanic.rating))}</span> ({mechanic.rating.toFixed(1)})
                </p>
              )}

              {mechanic.specialties && mechanic.specialties.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs font-medium text-gray-500">Specialties:</p>
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {mechanic.specialties.map(spec => (
                      <span key={spec} className="text-xs bg-gray-700 text-gray-300 px-1.5 py-0.5 rounded-full">{spec}</span>
                    ))}
                  </div>
                </div>
              )}
              {mechanic.notes && <p className="text-xs text-gray-500 mt-2 bg-gray-750 p-1.5 rounded italic">Notes: {mechanic.notes}</p>}
            </div>
            <div className="p-3 bg-gray-750 border-t border-gray-700 flex justify-end space-x-2">
              <button onClick={() => openEditModal(mechanic)} className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold py-1 px-2 rounded hover:bg-gray-700 transition-colors">Edit</button>
              <button onClick={() => handleDelete(mechanic.id)} className="text-xs text-red-400 hover:text-red-300 font-semibold py-1 px-2 rounded hover:bg-gray-700 transition-colors">Delete</button>
            </div>
          </div>
        ))}
        {filteredMechanics.length === 0 && (
          <p className="col-span-full text-center text-gray-500 py-10">No mechanics or vendors found.</p>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingMechanic ? 'Edit Mechanic/Vendor' : 'Add New Mechanic/Vendor'} size="xl">
        <MechanicForm
          onSubmit={handleFormSubmit}
          onCancel={closeModal}
          initialData={editingMechanic}
        />
      </Modal>
    </div>
  );
};

export default MechanicsDirectoryPage;
