
import React, { useState, useMemo } from 'react';
import { BuildingStorefrontIcon } from '../../constants';
import { Dealership, DealershipStatus, CreditLine, InventoryUnit, InventoryUnitStatus } from '../../types';
import Modal from '../../components/Modal';

interface DealershipsPageProps {
  dealerships: Dealership[];
  creditLines: CreditLine[];
  inventory: InventoryUnit[];
  addDealership: (dealership: Omit<Dealership, 'id'>) => void;
}

const inputFieldStyle = "bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-500 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm rounded-lg p-2.5";
const labelStyle = "block text-sm font-medium text-gray-300 mb-1";
const buttonPrimaryStyle = "px-6 py-2.5 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-md transition-colors";
const buttonSecondaryStyle = "px-6 py-2.5 text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-lg shadow-sm transition-colors";

interface DealershipFormProps {
    onSubmit: (dealership: Omit<Dealership, 'id'>) => void;
    onCancel: () => void;
}

const DealershipForm: React.FC<DealershipFormProps> = ({ onSubmit, onCancel }) => {
    const [formData, setFormData] = useState<Omit<Dealership, 'id'>>({
        name: '',
        dealerPrincipal: '',
        location: '',
        status: DealershipStatus.ONBOARDING,
        agreementDate: new Date().toISOString().split('T')[0],
        creditLineId: null, // Initially no credit line
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({...prev, [name]: value}));
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(!formData.name || !formData.dealerPrincipal || !formData.location) {
            alert("Please fill all required fields.");
            return;
        }
        onSubmit(formData);
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="name" className={labelStyle}>Dealership Name *</label>
                    <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className={inputFieldStyle} />
                </div>
                <div>
                    <label htmlFor="dealerPrincipal" className={labelStyle}>Dealer Principal *</label>
                    <input type="text" name="dealerPrincipal" id="dealerPrincipal" value={formData.dealerPrincipal} onChange={handleChange} required className={inputFieldStyle} />
                </div>
            </div>
            <div>
                <label htmlFor="location" className={labelStyle}>Location *</label>
                <input type="text" name="location" id="location" value={formData.location} onChange={handleChange} required className={inputFieldStyle} />
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="agreementDate" className={labelStyle}>Agreement Date *</label>
                    <input type="date" name="agreementDate" id="agreementDate" value={formData.agreementDate} onChange={handleChange} required className={`${inputFieldStyle} dark:[color-scheme:dark]`} />
                </div>
                <div>
                    <label htmlFor="status" className={labelStyle}>Status *</label>
                    <select name="status" id="status" value={formData.status} onChange={handleChange} className={inputFieldStyle}>
                        {Object.values(DealershipStatus).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
            </div>
             <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={onCancel} className={buttonSecondaryStyle}>Cancel</button>
                <button type="submit" className={buttonPrimaryStyle}>Add Dealership</button>
            </div>
        </form>
    );
}

const DealershipsPage: React.FC<DealershipsPageProps> = ({ dealerships, creditLines, inventory, addDealership }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDealer, setSelectedDealer] = useState<Dealership | null>(null);

    const dealerDetails = useMemo(() => {
        if (!selectedDealer) return null;
        
        const cl = creditLines.find(c => c.id === selectedDealer.creditLineId);
        const inv = inventory.filter(i => i.dealershipId === selectedDealer.id);
        const inStockValue = inv.filter(i => i.status === InventoryUnitStatus.IN_STOCK).reduce((sum, i) => sum + i.financedAmount, 0);

        return {
            creditLine: cl,
            inventory: inv,
            inStockCount: inv.filter(i => i.status === InventoryUnitStatus.IN_STOCK).length,
            inStockValue,
            repaidCount: inv.filter(i => i.status === InventoryUnitStatus.REPAID).length,
        };
    }, [selectedDealer, creditLines, inventory]);

    const getStatusColor = (status: DealershipStatus) => {
        switch(status) {
            case DealershipStatus.ACTIVE: return 'bg-green-700 text-green-200';
            case DealershipStatus.ONBOARDING: return 'bg-blue-700 text-blue-200';
            case DealershipStatus.SUSPENDED: return 'bg-red-700 text-red-200';
            case DealershipStatus.INACTIVE: return 'bg-gray-600 text-gray-300';
        }
    }

    const formatCurrency = (amount: number) => `₹${amount.toLocaleString()}`;


    if(selectedDealer && dealerDetails) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <button onClick={() => setSelectedDealer(null)} className="text-gray-400 hover:text-white">&larr; Back to List</button>
                    <h1 className="text-3xl font-bold text-gray-100">{selectedDealer.name}</h1>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-1 bg-gray-800 p-4 rounded-lg">
                        <h3 className="font-semibold text-lg mb-2">Details</h3>
                        <p className="text-sm"><strong className="text-gray-400">Principal:</strong> {selectedDealer.dealerPrincipal}</p>
                        <p className="text-sm"><strong className="text-gray-400">Location:</strong> {selectedDealer.location}</p>
                        <p className="text-sm"><strong className="text-gray-400">Agreement Date:</strong> {new Date(selectedDealer.agreementDate).toLocaleDateString('en-IN')}</p>
                        <p className="text-sm"><strong className="text-gray-400">Status:</strong> <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusColor(selectedDealer.status)}`}>{selectedDealer.status}</span></p>
                    </div>
                     <div className="md:col-span-2 bg-gray-800 p-4 rounded-lg">
                        <h3 className="font-semibold text-lg mb-2">Credit & Inventory Summary</h3>
                        {dealerDetails.creditLine ? (
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <p><strong className="text-gray-400">Credit Limit:</strong> {formatCurrency(dealerDetails.creditLine.totalLimit)}</p>
                                <p><strong className="text-gray-400">Available Credit:</strong> {formatCurrency(dealerDetails.creditLine.availableCredit)}</p>
                                <p><strong className="text-gray-400">Units in Stock:</strong> {dealerDetails.inStockCount}</p>
                                <p><strong className="text-gray-400">Stock Value:</strong> {formatCurrency(dealerDetails.inStockValue)}</p>
                            </div>
                        ) : <p className="text-gray-500">No credit line assigned.</p>}
                     </div>
                </div>

                <div className="bg-gray-800 p-4 rounded-lg">
                    <h3 className="font-semibold text-lg mb-2">Financed Inventory for {selectedDealer.name}</h3>
                    <div className="overflow-x-auto max-h-96">
                        <table className="min-w-full text-sm">
                           <thead className="bg-gray-700">
                                <tr>
                                    <th className="p-2 text-left">VIN</th><th className="p-2 text-left">Vehicle</th>
                                    <th className="p-2 text-left">Status</th><th className="p-2 text-left">Funded Amount</th>
                                    <th className="p-2 text-left">Funded Date</th>
                                </tr>
                           </thead>
                           <tbody className="divide-y divide-gray-700">
                                {dealerDetails.inventory.map(unit => (
                                    <tr key={unit.vin} className="hover:bg-gray-750">
                                        <td className="p-2 font-mono text-xs">{unit.vin}</td>
                                        <td className="p-2">{unit.make} {unit.model} ({unit.year})</td>
                                        <td className="p-2">{unit.status}</td>
                                        <td className="p-2">{formatCurrency(unit.financedAmount)}</td>
                                        <td className="p-2">{new Date(unit.fundingDate).toLocaleDateString('en-IN')}</td>
                                    </tr>
                                ))}
                                {dealerDetails.inventory.length === 0 && <tr><td colSpan={5} className="p-4 text-center text-gray-500">No inventory for this dealer.</td></tr>}
                           </tbody>
                        </table>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-100 flex items-center">
                <BuildingStorefrontIcon className="w-8 h-8 mr-3 text-primary-400" />
                Dealerships
                </h1>
                <button onClick={() => setIsModalOpen(true)} className={buttonPrimaryStyle}>Add Dealership</button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {dealerships.map(dealer => {
                    const creditLine = creditLines.find(cl => cl.id === dealer.creditLineId);
                    return (
                        <div key={dealer.id} className="bg-gray-800 rounded-lg p-4 shadow-lg hover:shadow-primary-900/50 transition-shadow cursor-pointer" onClick={() => setSelectedDealer(dealer)}>
                            <div className="flex justify-between items-start">
                                <h2 className="font-bold text-lg text-primary-300">{dealer.name}</h2>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(dealer.status)}`}>{dealer.status}</span>
                            </div>
                            <p className="text-sm text-gray-400">{dealer.location}</p>
                            <div className="mt-3 pt-3 border-t border-gray-700 text-xs">
                                <p><strong className="text-gray-500">Principal:</strong> {dealer.dealerPrincipal}</p>
                                {creditLine ? (
                                    <p><strong className="text-gray-500">Credit Limit:</strong> {formatCurrency(creditLine.totalLimit)}</p>
                                ) : <p className="text-gray-600">No Credit Line</p>}
                            </div>
                        </div>
                    )
                })}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Dealership">
                <DealershipForm onSubmit={(data) => { addDealership(data); setIsModalOpen(false); }} onCancel={() => setIsModalOpen(false)} />
            </Modal>
        </div>
    )
};

export default DealershipsPage;
