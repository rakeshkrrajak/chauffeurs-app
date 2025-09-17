import React, { useState, useMemo, useCallback } from 'react';
import { FuelCard, FuelLogEntry, Chauffeur, Vehicle, FuelCardStatus } from '../../types';
import Modal from '../../components/Modal';
import { CreditCardIcon, ArrowDownTrayIcon } from '../../constants';
import { exportToCsv } from '../../services/reportService';

interface FuelCardPageProps {
  fuelCards: FuelCard[];
  chauffeurs: Chauffeur[];
  vehicles: Vehicle[];
  fuelLogs: FuelLogEntry[];
  addCard: (card: Omit<FuelCard, 'id'>) => void;
  updateCard: (card: FuelCard) => void;
  deleteCard: (cardId: string) => void;
}

const inputFieldStyle = "bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-500 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm rounded-lg p-2.5";
const labelStyle = "block text-sm font-medium text-gray-300 mb-1";
const buttonPrimaryStyle = "px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-md transition-colors";
const buttonSecondaryStyle = "px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-lg shadow-sm transition-colors";

const initialFormState: Omit<FuelCard, 'id'> = {
  cardNumber: '',
  issuanceDate: new Date().toISOString().split('T')[0],
  expiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 3)).toISOString().split('T')[0],
  assignedChauffeurId: null,
  assignedVehicleId: null,
  status: FuelCardStatus.ACTIVE,
  provider: 'HP',
};

interface FuelCardFormProps {
  onSubmit: (card: Omit<FuelCard, 'id'>) => void;
  onCancel: () => void;
  initialData?: FuelCard | null;
  chauffeurs: Chauffeur[];
  vehicles: Vehicle[];
}

const FuelCardForm: React.FC<FuelCardFormProps> = ({ onSubmit, onCancel, initialData, chauffeurs, vehicles }) => {
  const [formData, setFormData] = useState<Omit<FuelCard, 'id'>>(initialData || initialFormState);

  const availablePoolCars = useMemo(() => vehicles.filter(v => v.carType === 'Pool Car'), [vehicles]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value === "" ? null : value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.cardNumber || !formData.provider) {
      alert("Please fill in Card Number and Provider.");
      return;
    }
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label htmlFor="cardNumber" className={labelStyle}>Card Number *</label><input type="text" name="cardNumber" id="cardNumber" value={formData.cardNumber} onChange={handleChange} required className={inputFieldStyle} /></div>
            <div><label htmlFor="provider" className={labelStyle}>Provider *</label><select name="provider" id="provider" value={formData.provider} onChange={handleChange} required className={inputFieldStyle}><option>HP</option><option>Indian Oil</option><option>Shell</option><option>Other</option></select></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label htmlFor="issuanceDate" className={labelStyle}>Issuance Date</label><input type="date" name="issuanceDate" id="issuanceDate" value={formData.issuanceDate} onChange={handleChange} className={`${inputFieldStyle} dark:[color-scheme:dark]`} /></div>
            <div><label htmlFor="expiryDate" className={labelStyle}>Expiry Date</label><input type="date" name="expiryDate" id="expiryDate" value={formData.expiryDate} onChange={handleChange} className={`${inputFieldStyle} dark:[color-scheme:dark]`} /></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label htmlFor="assignedVehicleId" className={labelStyle}>Assign to Pool Car</label><select name="assignedVehicleId" id="assignedVehicleId" value={formData.assignedVehicleId || ''} onChange={handleChange} className={inputFieldStyle}><option value="">Select Pool Car</option>{availablePoolCars.map(v => <option key={v.id} value={v.id}>{v.make} {v.model} ({v.licensePlate})</option>)}</select></div>
            <div><label htmlFor="assignedChauffeurId" className={labelStyle}>Assign to Chauffeur</label><select name="assignedChauffeurId" id="assignedChauffeurId" value={formData.assignedChauffeurId || ''} onChange={handleChange} className={inputFieldStyle}><option value="">Select Chauffeur</option>{chauffeurs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
        </div>
        <div><label htmlFor="status" className={labelStyle}>Card Status</label><select name="status" id="status" value={formData.status} onChange={handleChange} className={inputFieldStyle}>{Object.values(FuelCardStatus).map(s => <option key={s} value={s}>{s}</option>)}</select></div>
        <div className="flex justify-end space-x-3 pt-4"><button type="button" onClick={onCancel} className={buttonSecondaryStyle}>Cancel</button><button type="submit" className={buttonPrimaryStyle}>{initialData ? 'Update Card' : 'Issue Card'}</button></div>
    </form>
  );
};


const FuelCardPage: React.FC<FuelCardPageProps> = ({ fuelCards, chauffeurs, vehicles, fuelLogs, addCard, updateCard, deleteCard }) => {
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<FuelCard | null>(null);

  const openAddModal = () => { setSelectedCard(null); setIsFormModalOpen(true); };
  const openEditModal = (card: FuelCard) => { setSelectedCard(card); setIsFormModalOpen(true); };
  const openDetailsModal = (card: FuelCard) => { setSelectedCard(card); setIsDetailsModalOpen(true); };
  const closeModal = () => { setIsFormModalOpen(false); setIsDetailsModalOpen(false); setSelectedCard(null); };

  const handleDelete = (cardId: string) => { if (window.confirm('Are you sure you want to delete this fuel card?')) { deleteCard(cardId); }};
  const getChauffeurName = useCallback((id: string | null) => id ? chauffeurs.find(c => c.id === id)?.name || 'N/A' : 'Unassigned', [chauffeurs]);
  const getVehicleName = useCallback((id: string | null) => { if (!id) return 'Unassigned'; const v = vehicles.find(v => v.id === id); return v ? `${v.make} ${v.model} (${v.licensePlate})` : 'N/A'}, [vehicles]);
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-IN');
  
  const getStatusPillClass = (status: FuelCardStatus) => {
    switch (status) {
        case FuelCardStatus.ACTIVE: return 'bg-green-700 bg-opacity-30 text-green-300';
        case FuelCardStatus.INACTIVE: return 'bg-gray-600 text-gray-300';
        case FuelCardStatus.LOST: return 'bg-red-700 bg-opacity-30 text-red-300';
    }
  };

  const cardTransactions = useMemo(() => {
    if (!selectedCard) return [];
    return fuelLogs.filter(log => log.fuelCardId === selectedCard.id).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [selectedCard, fuelLogs]);
  const cardCumulativeCost = useMemo(() => cardTransactions.reduce((sum, tx) => sum + tx.totalCost, 0), [cardTransactions]);

  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center"><h1 className="text-3xl font-bold text-gray-100 flex items-center"><CreditCardIcon className="w-8 h-8 mr-3 text-primary-400"/>Fuel Card Management</h1><button onClick={openAddModal} className={`${buttonPrimaryStyle} flex items-center`}><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-2"><path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" /></svg>Issue New Fuel Card</button></div>
        <p className="text-sm text-gray-400 -mt-4">Track fuel cards issued to chauffeurs for pool cars.</p>
        <div className="bg-gray-800 shadow-xl rounded-lg overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700"><thead className="bg-gray-750"><tr><th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Card Number</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Assigned Chauffeur</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Assigned Pool Car</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Expiry</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Actions</th></tr></thead>
                <tbody className="bg-gray-800 divide-y divide-gray-700">{fuelCards.map(card => (<tr key={card.id} className="hover:bg-gray-750">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-200">{card.cardNumber} <span className="text-gray-400">({card.provider})</span></td>
                    <td className="px-6 py-4 whitespace-nowrap"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusPillClass(card.status)}`}>{card.status}</span></td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{getChauffeurName(card.assignedChauffeurId)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{getVehicleName(card.assignedVehicleId)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{formatDate(card.expiryDate)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2"><button onClick={() => openDetailsModal(card)} className="text-primary-400 hover:text-primary-300">Details</button><button onClick={() => openEditModal(card)} className="text-indigo-400 hover:text-indigo-300">Edit</button><button onClick={() => handleDelete(card.id)} className="text-red-400 hover:text-red-300">Delete</button></td>
                </tr>))}</tbody>
            </table>
        </div>
        <Modal isOpen={isFormModalOpen} onClose={closeModal} title={selectedCard ? 'Edit Fuel Card' : 'Issue New Fuel Card'} size="xl"><FuelCardForm onSubmit={data => { selectedCard ? updateCard({ ...selectedCard, ...data }) : addCard(data); closeModal(); }} onCancel={closeModal} initialData={selectedCard} chauffeurs={chauffeurs} vehicles={vehicles} /></Modal>
        {selectedCard && <Modal isOpen={isDetailsModalOpen} onClose={closeModal} title={`Details for Card ${selectedCard.cardNumber}`} size="3xl"><div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm bg-gray-700 p-4 rounded-lg"><p><strong>Provider:</strong> {selectedCard.provider}</p><p><strong>Status:</strong> {selectedCard.status}</p><p><strong>Chauffeur:</strong> {getChauffeurName(selectedCard.assignedChauffeurId)}</p><p><strong>Vehicle:</strong> {getVehicleName(selectedCard.assignedVehicleId)}</p><p><strong>Issued:</strong> {formatDate(selectedCard.issuanceDate)}</p><p><strong>Expires:</strong> {formatDate(selectedCard.expiryDate)}</p></div>
            <div><h4 className="text-lg font-semibold text-gray-100">Transaction History (Total Cost: ₹{cardCumulativeCost.toLocaleString()})</h4><div className="max-h-60 overflow-y-auto mt-2 border border-gray-600 rounded-lg"><table className="min-w-full divide-y divide-gray-600 text-xs">
                <thead className="bg-gray-750"><tr><th className="p-2 text-left">Date</th><th className="p-2 text-left">Vehicle</th><th className="p-2 text-right">Amount (₹)</th><th className="p-2 text-right">Quantity</th><th className="p-2 text-left">Station</th></tr></thead>
                <tbody className="divide-y divide-gray-700">{cardTransactions.map(tx => <tr key={tx.id}>
                    <td className="p-2">{formatDate(tx.date)}</td><td className="p-2">{getVehicleName(tx.vehicleId)}</td><td className="p-2 text-right font-semibold">{tx.totalCost.toFixed(2)}</td><td className="p-2 text-right">{tx.quantity.toFixed(2)}</td><td className="p-2">{tx.stationName}</td>
                </tr>)}</tbody>
            </table></div></div>
        </div></Modal>}
    </div>
  );
};

export default FuelCardPage;