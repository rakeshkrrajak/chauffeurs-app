
import React, { useState, useMemo } from 'react';
import { RectangleStackIcon } from '../../constants';
import { InventoryUnit, InventoryUnitStatus, Dealership, HypothecationStatus } from '../../types';
import Modal from '../../components/Modal';

interface InventoryPageProps {
  inventory: InventoryUnit[];
  dealerships: Dealership[];
  fundNewInventory: (inventoryData: Omit<InventoryUnit, 'daysInStock'>) => void;
  markInventoryAsRepaid: (vin: string, dealershipId: string, repaymentAmount: number) => void;
}

const inputFieldStyle = "bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-500 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm rounded-lg p-2.5";
const labelStyle = "block text-sm font-medium text-gray-300 mb-1";
const buttonPrimaryStyle = "px-6 py-2.5 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-md transition-colors";
const buttonSecondaryStyle = "px-6 py-2.5 text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-lg shadow-sm transition-colors";


const FundInventoryForm: React.FC<{ dealerships: Dealership[]; onSubmit: (data: any) => void; onCancel: () => void; }> = ({ dealerships, onSubmit, onCancel }) => {
    const [formData, setFormData] = useState({
        dealershipId: dealerships[0]?.id || '',
        vin: '',
        make: '',
        model: '',
        year: new Date().getFullYear(),
        financedAmount: 0,
        oemInvoiceNumber: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) || 0 : value }));
    }
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(!formData.dealershipId || !formData.vin || !formData.make || !formData.model || formData.financedAmount <= 0) {
            alert("Please fill all required fields.");
            return;
        }
        onSubmit({
            ...formData,
            status: InventoryUnitStatus.IN_STOCK,
            fundingDate: new Date().toISOString(),
            hypothecationStatus: HypothecationStatus.PENDING,
        });
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <label htmlFor="dealershipId" className={labelStyle}>Dealership *</label>
                    <select name="dealershipId" id="dealershipId" value={formData.dealershipId} onChange={handleChange} required className={inputFieldStyle}>
                        {dealerships.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="vin" className={labelStyle}>Vehicle VIN *</label>
                    <input type="text" name="vin" value={formData.vin} onChange={handleChange} required className={inputFieldStyle} />
                </div>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label htmlFor="make" className={labelStyle}>Make *</label>
                    <input type="text" name="make" value={formData.make} onChange={handleChange} required className={inputFieldStyle} />
                </div>
                <div>
                    <label htmlFor="model" className={labelStyle}>Model *</label>
                    <input type="text" name="model" value={formData.model} onChange={handleChange} required className={inputFieldStyle} />
                </div>
                 <div>
                    <label htmlFor="year" className={labelStyle}>Year *</label>
                    <input type="number" name="year" value={formData.year} onChange={handleChange} required className={inputFieldStyle} />
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="financedAmount" className={labelStyle}>Financed Amount (INR) *</label>
                    <input type="number" name="financedAmount" value={formData.financedAmount} onChange={handleChange} required min="1" className={inputFieldStyle} />
                </div>
                <div>
                    <label htmlFor="oemInvoiceNumber" className={labelStyle}>OEM Invoice #</label>
                    <input type="text" name="oemInvoiceNumber" value={formData.oemInvoiceNumber} onChange={handleChange} className={inputFieldStyle} />
                </div>
            </div>
             <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={onCancel} className={buttonSecondaryStyle}>Cancel</button>
                <button type="submit" className={buttonPrimaryStyle}>Fund Inventory</button>
            </div>
        </form>
    )
}

const RepayInventoryForm: React.FC<{ unit: InventoryUnit; onSubmit: (amount: number) => void; onCancel: () => void; }> = ({ unit, onSubmit, onCancel }) => {
    const [repaymentAmount, setRepaymentAmount] = useState(unit.financedAmount);
    return (
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(repaymentAmount); }} className="space-y-4">
            <p>Marking inventory item as repaid will close this unit and restore the principal amount to the dealer's credit line.</p>
            <p><strong className="text-gray-400">VIN:</strong> {unit.vin}</p>
            <p><strong className="text-gray-400">Vehicle:</strong> {unit.make} {unit.model}</p>
            <p><strong className="text-gray-400">Principal Amount:</strong> ₹{unit.financedAmount.toLocaleString()}</p>
            <div>
                <label htmlFor="repaymentAmount" className={labelStyle}>Repayment Amount (INR) *</label>
                <input type="number" name="repaymentAmount" value={repaymentAmount} onChange={(e) => setRepaymentAmount(Number(e.target.value))} required className={inputFieldStyle} />
            </div>
            <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={onCancel} className={buttonSecondaryStyle}>Cancel</button>
                <button type="submit" className={buttonPrimaryStyle}>Confirm Repayment</button>
            </div>
        </form>
    )
}


const InventoryPage: React.FC<InventoryPageProps> = ({ inventory, dealerships, fundNewInventory, markInventoryAsRepaid }) => {
    const [isFundModalOpen, setIsFundModalOpen] = useState(false);
    const [repayingUnit, setRepayingUnit] = useState<InventoryUnit | null>(null);
    const [filterStatus, setFilterStatus] = useState<InventoryUnitStatus | 'ALL'>(InventoryUnitStatus.IN_STOCK);
    const [filterDealership, setFilterDealership] = useState('ALL');

    const getDealershipName = (id: string) => dealerships.find(d => d.id === id)?.name || "N/A";

    const filteredInventory = useMemo(() => {
        return inventory.filter(unit => 
            (filterStatus === 'ALL' || unit.status === filterStatus) &&
            (filterDealership === 'ALL' || unit.dealershipId === filterDealership)
        );
    }, [inventory, filterStatus, filterDealership]);

    const getStatusPill = (status: InventoryUnitStatus) => {
        switch(status) {
            case InventoryUnitStatus.IN_STOCK: return 'bg-blue-700 text-blue-200';
            case InventoryUnitStatus.SOLD_PENDING_PAYMENT: return 'bg-yellow-700 text-yellow-200';
            case InventoryUnitStatus.REPAID: return 'bg-green-700 text-green-200';
            case InventoryUnitStatus.AUDIT_MISSING: return 'bg-red-700 text-red-200';
            default: return 'bg-gray-600 text-gray-300';
        }
    }
    
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-100 flex items-center">
                    <RectangleStackIcon className="w-8 h-8 mr-3 text-primary-400" />
                    Floor Plan Inventory
                </h1>
                <button onClick={() => setIsFundModalOpen(true)} className={buttonPrimaryStyle}>Fund New Inventory</button>
            </div>
            
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-800 rounded-lg shadow">
                <div>
                    <label htmlFor="filterDealership" className={labelStyle}>Filter by Dealership</label>
                    <select id="filterDealership" value={filterDealership} onChange={e => setFilterDealership(e.target.value)} className={`${inputFieldStyle} mt-1 pr-8`}>
                        <option value="ALL">All Dealerships</option>
                        {dealerships.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="filterStatus" className={labelStyle}>Filter by Status</label>
                    <select id="filterStatus" value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)} className={`${inputFieldStyle} mt-1 pr-8`}>
                        <option value="ALL">All Statuses</option>
                        {Object.values(InventoryUnitStatus).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
            </div>


            <div className="bg-gray-800 shadow-xl rounded-lg overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                    <thead className="bg-gray-750">
                        <tr>
                           <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">VIN / OEM Invoice</th>
                           <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Dealership</th>
                           <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Vehicle</th>
                           <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Financed Amount</th>
                           <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
                           <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Days In Stock</th>
                           <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                        {filteredInventory.map(unit => (
                            <tr key={unit.vin} className="hover:bg-gray-750">
                                <td className="px-4 py-3 whitespace-nowrap text-xs font-mono text-gray-300">
                                    {unit.vin}
                                    <span className="block text-gray-500">{unit.oemInvoiceNumber}</span>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">{getDealershipName(unit.dealershipId)}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">{unit.make} {unit.model} ({unit.year})</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-semibold text-gray-200">₹{unit.financedAmount.toLocaleString()}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm">
                                    <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusPill(unit.status)}`}>{unit.status}</span>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-300">{unit.daysInStock}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-center text-sm">
                                    {unit.status === InventoryUnitStatus.IN_STOCK && (
                                        <button onClick={() => setRepayingUnit(unit)} className="text-green-400 hover:underline">Mark as Repaid</button>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {filteredInventory.length === 0 && (
                             <tr><td colSpan={7} className="text-center py-10 text-gray-500">No inventory found for the selected filters.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={isFundModalOpen} onClose={() => setIsFundModalOpen(false)} title="Fund New Inventory">
                <FundInventoryForm dealerships={dealerships} onSubmit={(data) => { fundNewInventory(data); setIsFundModalOpen(false); }} onCancel={() => setIsFundModalOpen(false)} />
            </Modal>
            
            {repayingUnit && (
                <Modal isOpen={!!repayingUnit} onClose={() => setRepayingUnit(null)} title={`Repay Financed Unit: ${repayingUnit.vin}`}>
                    <RepayInventoryForm 
                        unit={repayingUnit} 
                        onSubmit={(amount) => { markInventoryAsRepaid(repayingUnit.vin, repayingUnit.dealershipId, amount); setRepayingUnit(null);}} 
                        onCancel={() => setRepayingUnit(null)}
                    />
                </Modal>
            )}
        </div>
    );
};

export default InventoryPage;
