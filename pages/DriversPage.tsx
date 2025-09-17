import React, { useState, useMemo, useCallback, useRef } from 'react';
import { Chauffeur, Vehicle, ChauffeurOnboardingStatus, User } from '../types';
import Modal from '../components/Modal';
import { ArrowUpTrayIcon } from '../constants';
import ChauffeurForm from '../components/ChauffeurForm';

interface ChauffeursPageProps {
  chauffeurs: Chauffeur[];
  vehicles: Vehicle[];
  users: User[];
  addChauffeur: (chauffeur: Omit<Chauffeur, 'id' | 'imageUrl' | 'onboardingStatus'>) => void;
  addChauffeursBatch: (chauffeurs: Omit<Chauffeur, 'id' | 'imageUrl' | 'onboardingStatus'>[]) => void;
  updateChauffeur: (chauffeur: Chauffeur) => void;
  deleteChauffeur: (chauffeurId: string) => void;
  approveChauffeur: (chauffeurId: string) => void;
}

const buttonPrimaryStyle = "px-6 py-2.5 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-md transition-colors";
const inputFieldStyle = "bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-500 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm rounded-lg p-2.5";


const ChauffeursPage: React.FC<ChauffeursPageProps> = ({ chauffeurs, vehicles, users, addChauffeur, addChauffeursBatch, updateChauffeur, deleteChauffeur, approveChauffeur }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingChauffeur, setEditingChauffeur] = useState<Chauffeur | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<ChauffeurOnboardingStatus | 'ALL'>('ALL');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const openAddModal = () => { setEditingChauffeur(null); setIsModalOpen(true); };
  const openEditModal = (chauffeur: Chauffeur) => { setEditingChauffeur(chauffeur); setIsModalOpen(true); };
  const closeModal = () => { setIsModalOpen(false); setEditingChauffeur(null); };

  const handleFormSubmit = (chauffeurData: Omit<Chauffeur, 'id' | 'imageUrl' | 'onboardingStatus'>) => {
    if (editingChauffeur) {
      updateChauffeur({ ...editingChauffeur, ...chauffeurData });
    } else {
      addChauffeur(chauffeurData);
    }
    closeModal();
  };

  const handleDeleteChauffeur = (chauffeurId: string) => {
    if (window.confirm('Are you sure you want to delete this chauffeur?')) {
      deleteChauffeur(chauffeurId);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result;
      if (typeof text !== 'string') {
        alert('Failed to read file.');
        return;
      }
      try {
        const lines = text.split('\n').filter(line => line.trim() !== '');
        if (lines.length < 2) {
            alert('CSV file must contain a header row and at least one data row.');
            return;
        }

        const header = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        const expectedHeader = ['name', 'licenseNumber', 'contact', 'dlExpiryDate'];
        
        if (header.length !== expectedHeader.length || !expectedHeader.every((h, i) => h === header[i])) {
            alert(`Invalid CSV header. Expected format: ${expectedHeader.join(',')}`);
            return;
        }

        const newChauffeurs: Omit<Chauffeur, 'id' | 'imageUrl' | 'onboardingStatus'>[] = [];
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
          if (values.length === expectedHeader.length) {
            const [name, licenseNumber, contact, dlExpiryDate] = values;
            if (name && licenseNumber && contact) {
               newChauffeurs.push({
                  name,
                  licenseNumber,
                  contact,
                  dlExpiryDate: dlExpiryDate || undefined,
                  assignedVehicleId: null,
               });
            }
          }
        }
        
        if (newChauffeurs.length > 0) {
          addChauffeursBatch(newChauffeurs);
          alert(`Successfully imported ${newChauffeurs.length} chauffeurs.`);
        } else {
          alert('No valid chauffeur data found in the file.');
        }

      } catch (error) {
        alert('An error occurred while parsing the CSV file.');
        console.error(error);
      } finally {
        if (event.target) {
          event.target.value = '';
        }
      }
    };
    reader.readAsText(file);
  };


  const filteredChauffeurs = useMemo(() => {
    return chauffeurs.filter(chauffeur =>
      (chauffeur.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      chauffeur.licenseNumber.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (filterStatus === 'ALL' || chauffeur.onboardingStatus === filterStatus)
    );
  }, [chauffeurs, searchTerm, filterStatus]);

  const getAssignedVehicleInfo = useCallback((vehicleId?: string | null): string => {
    if (!vehicleId) return "Unassigned";
    const vehicle = vehicles.find(v => v.id === vehicleId);
    return vehicle ? `${vehicle.make} ${vehicle.model} (${vehicle.licensePlate})` : "Vehicle not found";
  }, [vehicles]);
  
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-IN');
    } catch { return 'Invalid Date'; }
  };
  
  const getStatusPillClass = (status: ChauffeurOnboardingStatus) => {
      switch(status) {
          case ChauffeurOnboardingStatus.APPROVED: return 'bg-green-700 bg-opacity-30 text-green-300';
          case ChauffeurOnboardingStatus.AWAITING_APPROVAL: return 'bg-amber-700 bg-opacity-30 text-amber-300';
          case ChauffeurOnboardingStatus.INVITED: return 'bg-sky-700 bg-opacity-30 text-sky-300';
          case ChauffeurOnboardingStatus.REJECTED: return 'bg-red-700 bg-opacity-30 text-red-300';
          default: return 'bg-gray-600 bg-opacity-30 text-gray-300';
      }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h1 className="text-3xl font-bold text-gray-100">Chauffeur Directory</h1>
        <div className="flex items-center gap-3">
            <button onClick={handleImportClick} className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2.5 px-5 rounded-lg shadow-md transition-colors duration-150 ease-in-out flex items-center">
                <ArrowUpTrayIcon className="w-5 h-5 mr-2" />
                Import from CSV
            </button>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".csv"
                className="hidden"
            />
            <button onClick={openAddModal} className={`${buttonPrimaryStyle} flex items-center`}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-2"><path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" /></svg>
                Invite New Chauffeur
            </button>
        </div>
      </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
            type="text"
            placeholder="Search chauffeurs by name or license number..."
            className={inputFieldStyle} 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select 
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value as ChauffeurOnboardingStatus | 'ALL')}
            className={inputFieldStyle}
        >
            <option value="ALL">All Onboarding Statuses</option>
            {Object.values(ChauffeurOnboardingStatus).map(s => <option key={s} value={s}>{s}</option>)}
        </select>
       </div>


      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredChauffeurs.map(chauffeur => (
          <div key={chauffeur.id} className="bg-gray-800 rounded-xl shadow-xl overflow-hidden transition-all hover:shadow-2xl transform hover:-translate-y-1">
            <div className="p-5 flex flex-col sm:flex-row items-start space-x-0 sm:space-x-4">
                <img 
                    src={chauffeur.imageUrl} 
                    alt={chauffeur.name} 
                    className="w-24 h-24 rounded-full object-cover border-2 border-gray-700 shadow-sm mb-3 sm:mb-0 shrink-0" 
                />
                <div className="flex-grow text-sm">
                    <h3 className="text-xl font-semibold text-gray-100">{chauffeur.name}</h3>
                    <p className="text-gray-400">License: {chauffeur.licenseNumber} (Exp: {formatDate(chauffeur.dlExpiryDate)})</p>
                    <p className="text-gray-400">Contact: {chauffeur.contact}</p>
                     <div className="mt-2 space-y-1.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium truncate max-w-full inline-block ${getStatusPillClass(chauffeur.onboardingStatus)}`}>
                            {chauffeur.onboardingStatus}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium truncate max-w-full inline-block ${chauffeur.assignedVehicleId ? 'bg-primary-700 bg-opacity-40 text-primary-300' : 'bg-gray-600 bg-opacity-30 text-gray-400'}`}>
                            {getAssignedVehicleInfo(chauffeur.assignedVehicleId)}
                        </span>
                    </div>
                </div>
            </div>
             <div className="px-5 pb-4 pt-2 border-t border-gray-700 bg-gray-750 flex justify-end space-x-2">
                {chauffeur.onboardingStatus === ChauffeurOnboardingStatus.AWAITING_APPROVAL && (
                    <button onClick={() => approveChauffeur(chauffeur.id)} className="text-sm text-green-400 hover:text-green-300 font-medium py-1 px-3 rounded-md hover:bg-gray-700 transition-colors">Approve</button>
                )}
                <button onClick={() => openEditModal(chauffeur)} className="text-sm text-indigo-400 hover:text-indigo-300 font-medium py-1 px-3 rounded-md hover:bg-gray-700 transition-colors">Edit</button>
                <button onClick={() => handleDeleteChauffeur(chauffeur.id)} className="text-sm text-red-400 hover:text-red-300 font-medium py-1 px-3 rounded-md hover:bg-gray-700 transition-colors">Delete</button>
            </div>
          </div>
        ))}
        {filteredChauffeurs.length === 0 && (
          <p className="col-span-full text-center text-gray-500 py-12">No chauffeurs found matching your search criteria.</p>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingChauffeur ? 'Edit Chauffeur' : 'Chauffeur Onboarding'} size="2xl">
        <ChauffeurForm
          onSubmit={handleFormSubmit}
          onCancel={closeModal}
          initialData={editingChauffeur}
          vehicles={vehicles}
          users={users}
        />
      </Modal>
    </div>
  );
};

export default ChauffeursPage;
