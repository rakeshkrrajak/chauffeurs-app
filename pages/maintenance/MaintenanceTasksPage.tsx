import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { MaintenanceTask, Vehicle, Mechanic, MaintenanceType, MaintenanceTaskStatus, MaintenancePart } from '../../types';
import Modal from '../../components/Modal';
import { ClipboardListIcon, ArrowDownTrayIcon } from '../../constants';
import { exportToCsv } from '../../services/reportService';

interface MaintenanceTasksPageProps {
  tasks: MaintenanceTask[];
  vehicles: Vehicle[];
  mechanics: Mechanic[];
  addTask: (task: Omit<MaintenanceTask, 'id'>) => void;
  updateTask: (task: MaintenanceTask) => void;
  deleteTask: (taskId: string) => void;
}

const inputFieldStyle = "bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-500 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm rounded-lg p-2.5";
const labelStyle = "block text-sm font-medium text-gray-300 mb-1";
const buttonPrimaryStyle = "px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-md transition-colors";
const buttonSecondaryStyle = "px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-lg shadow-sm transition-colors";
const buttonSmallActionStyle = "text-xs py-1 px-2 rounded-md transition-colors";

const initialFormState: Omit<MaintenanceTask, 'id'> = {
  vehicleId: '',
  title: '',
  jobCardNumber: '',
  description: '',
  maintenanceType: MaintenanceType.PREVENTIVE,
  status: MaintenanceTaskStatus.SCHEDULED,
  scheduledDate: new Date().toISOString().split('T')[0],
  completionDate: undefined,
  mechanicId: null,
  garageName: '',
  partsReplaced: [],
  laborCost: 0,
  partsCost: 0,
  totalCost: 0,
  odometerAtMaintenance: 0,
  notes: '',
  receiptFileName: '',
  isFreeService: false,
};

interface MaintenanceTaskFormProps {
  onSubmit: (task: Omit<MaintenanceTask, 'id'>) => void;
  onCancel: () => void;
  initialData?: MaintenanceTask | null;
  vehicles: Vehicle[];
  mechanics: Mechanic[];
}

const MaintenanceTaskForm: React.FC<MaintenanceTaskFormProps> = ({ onSubmit, onCancel, initialData, vehicles, mechanics }) => {
    const [formData, setFormData] = useState<Omit<MaintenanceTask, 'id'>>(() => {
        const data = initialData ? JSON.parse(JSON.stringify(initialData)) : { ...initialFormState };
        if (data.scheduledDate) data.scheduledDate = data.scheduledDate.split('T')[0];
        if (data.completionDate) data.completionDate = data.completionDate.split('T')[0];
        if (!data.partsReplaced) data.partsReplaced = [];
        return data;
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const isCheckbox = type === 'checkbox';
        const checked = isCheckbox ? (e.target as HTMLInputElement).checked : undefined;

        setFormData(prev => ({
        ...prev,
        [name]: isCheckbox ? checked : (type === 'number' ? parseFloat(value) || 0 : value),
        }));
    };

    const handlePartChange = (index: number, field: keyof MaintenancePart, value: string | number) => {
        const newParts = [...(formData.partsReplaced || [])];
        (newParts[index] as any)[field] = field === 'name' ? value : Number(value);
        setFormData(prev => ({ ...prev, partsReplaced: newParts }));
    };

    const addPart = () => {
        setFormData(prev => ({ ...prev, partsReplaced: [...(prev.partsReplaced || []), { name: '', quantity: 1, cost: 0 }] }));
    };

    const removePart = (index: number) => {
        setFormData(prev => ({ ...prev, partsReplaced: (prev.partsReplaced || []).filter((_, i) => i !== index) }));
    };

    useEffect(() => {
        const partsTotal = (formData.partsReplaced || []).reduce((sum, part) => sum + (part.cost || 0) * part.quantity, 0);
        setFormData(prev => ({ ...prev, partsCost: partsTotal, totalCost: (prev.laborCost || 0) + partsTotal }));
    }, [formData.partsReplaced, formData.laborCost]);


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.vehicleId || !formData.title) {
        alert("Please select a vehicle and provide a title for the task.");
        return;
        }
        onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 text-sm max-h-[70vh] overflow-y-auto pr-2">
            <fieldset className="border border-gray-600 p-3 rounded-md">
                <legend className="text-md font-medium text-gray-200 px-1">Job Details</legend>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label htmlFor="title" className={labelStyle}>Task Title *</label><input type="text" name="title" id="title" value={formData.title} onChange={handleChange} required className={inputFieldStyle} /></div>
                    <div><label htmlFor="jobCardNumber" className={labelStyle}>Job Card Number</label><input type="text" name="jobCardNumber" id="jobCardNumber" value={formData.jobCardNumber || ''} onChange={handleChange} className={inputFieldStyle} /></div>
                    <div><label htmlFor="vehicleId" className={labelStyle}>Vehicle *</label><select name="vehicleId" id="vehicleId" value={formData.vehicleId || ''} onChange={handleChange} required className={inputFieldStyle}><option value="">Select Vehicle</option>{vehicles.map(v => <option key={v.id} value={v.id}>{v.make} {v.model} ({v.licensePlate})</option>)}</select></div>
                    <div><label htmlFor="odometerAtMaintenance" className={labelStyle}>Odometer at Maintenance</label><input type="number" name="odometerAtMaintenance" id="odometerAtMaintenance" value={formData.odometerAtMaintenance || ''} onChange={handleChange} className={inputFieldStyle} /></div>
                    <div className="md:col-span-2"><label htmlFor="description" className={labelStyle}>Problem Description</label><textarea name="description" id="description" value={formData.description || ''} onChange={handleChange} rows={2} className={inputFieldStyle} /></div>
                </div>
            </fieldset>

            <fieldset className="border border-gray-600 p-3 rounded-md">
                <legend className="text-md font-medium text-gray-200 px-1">Status & Schedule</legend>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div><label htmlFor="status" className={labelStyle}>Status *</label><select name="status" id="status" value={formData.status} onChange={handleChange} required className={inputFieldStyle}>{Object.values(MaintenanceTaskStatus).map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                    <div><label htmlFor="maintenanceType" className={labelStyle}>Type *</label><select name="maintenanceType" id="maintenanceType" value={formData.maintenanceType} onChange={handleChange} required className={inputFieldStyle}>{Object.values(MaintenanceType).map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                    <div><label htmlFor="scheduledDate" className={labelStyle}>Scheduled Date</label><input type="date" name="scheduledDate" id="scheduledDate" value={formData.scheduledDate || ''} onChange={handleChange} className={`${inputFieldStyle} dark:[color-scheme:dark]`} /></div>
                    <div><label htmlFor="completionDate" className={labelStyle}>Completion Date</label><input type="date" name="completionDate" id="completionDate" value={formData.completionDate || ''} onChange={handleChange} className={`${inputFieldStyle} dark:[color-scheme:dark]`} /></div>
                </div>
            </fieldset>
            
            <fieldset className="border border-gray-600 p-3 rounded-md">
                <legend className="text-md font-medium text-gray-200 px-1">Parts & Costs</legend>
                {(formData.partsReplaced || []).map((part, index) => (
                    <div key={index} className="grid grid-cols-8 gap-2 mb-2 items-center">
                        <input type="text" placeholder="Part Name" value={part.name} onChange={e => handlePartChange(index, 'name', e.target.value)} className={`col-span-4 ${inputFieldStyle}`} />
                        <input type="number" placeholder="Qty" value={part.quantity} onChange={e => handlePartChange(index, 'quantity', e.target.value)} className={`col-span-1 ${inputFieldStyle}`} />
                        <input type="number" placeholder="Cost/Unit" value={part.cost || ''} onChange={e => handlePartChange(index, 'cost', e.target.value)} className={`col-span-2 ${inputFieldStyle}`} />
                        <button type="button" onClick={() => removePart(index)} className={`${buttonSmallActionStyle} col-span-1 text-red-400 hover:bg-red-900 bg-opacity-50`}>Remove</button>
                    </div>
                ))}
                <button type="button" onClick={addPart} className={`${buttonSmallActionStyle} mt-2 bg-sky-700 bg-opacity-50 text-sky-300 hover:bg-sky-600`}>Add Part</button>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div><label htmlFor="laborCost" className={labelStyle}>Labor Cost (₹)</label><input type="number" name="laborCost" id="laborCost" value={formData.laborCost || ''} onChange={handleChange} className={inputFieldStyle} /></div>
                    <div><label htmlFor="partsCost" className={labelStyle}>Parts Cost (₹)</label><input type="number" name="partsCost" id="partsCost" value={formData.partsCost || ''} readOnly className={`${inputFieldStyle} bg-gray-600`} /></div>
                    <div><label htmlFor="totalCost" className={labelStyle}>Total Cost (₹)</label><input type="number" name="totalCost" id="totalCost" value={formData.totalCost || ''} readOnly className={`${inputFieldStyle} bg-gray-600`} /></div>
                </div>
                <div className="flex items-center mt-3"><input type="checkbox" id="isFreeService" name="isFreeService" checked={!!formData.isFreeService} onChange={handleChange} className="h-4 w-4 rounded border-gray-500 text-primary-600 focus:ring-primary-500" /><label htmlFor="isFreeService" className="ml-2 text-sm text-gray-300">This is a free service</label></div>
            </fieldset>

            <fieldset className="border border-gray-600 p-3 rounded-md">
                <legend className="text-md font-medium text-gray-200 px-1">Assignment & Notes</legend>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label htmlFor="mechanicId" className={labelStyle}>Mechanic/Vendor</label><select name="mechanicId" id="mechanicId" value={formData.mechanicId || ''} onChange={handleChange} className={inputFieldStyle}><option value="">Select Mechanic</option>{mechanics.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></div>
                    <div><label htmlFor="garageName" className={labelStyle}>Garage Name (if external)</label><input type="text" name="garageName" id="garageName" value={formData.garageName || ''} onChange={handleChange} className={inputFieldStyle} /></div>
                    <div className="md:col-span-2"><label htmlFor="notes" className={labelStyle}>Notes</label><textarea name="notes" id="notes" value={formData.notes || ''} onChange={handleChange} rows={2} className={inputFieldStyle} /></div>
                    <div><label htmlFor="receiptFileName" className={labelStyle}>Receipt File Name (mock)</label><input type="text" name="receiptFileName" id="receiptFileName" value={formData.receiptFileName || ''} onChange={handleChange} className={inputFieldStyle} /></div>
                </div>
            </fieldset>
            
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-700 mt-4">
                <button type="button" onClick={onCancel} className={buttonSecondaryStyle}>Cancel</button>
                <button type="submit" className={buttonPrimaryStyle}>{initialData ? 'Update Task' : 'Create Task'}</button>
            </div>
        </form>
    );
};


const MaintenanceTasksPage: React.FC<MaintenanceTasksPageProps> = ({ tasks, vehicles, mechanics, addTask, updateTask, deleteTask }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<MaintenanceTask | null>(null);
    const [filterStatus, setFilterStatus] = useState<MaintenanceTaskStatus | 'ALL'>('ALL');
    const [filterVehicleId, setFilterVehicleId] = useState('ALL');

    const openAddModal = () => { setEditingTask(null); setIsModalOpen(true); };
    const openEditModal = (task: MaintenanceTask) => { setEditingTask(task); setIsModalOpen(true); };
    const closeModal = () => { setIsModalOpen(false); setEditingTask(null); };
    
    const handleDelete = (taskId: string) => { if (window.confirm('Are you sure you want to delete this task?')) { deleteTask(taskId); }};
    const getVehicleName = useCallback((vehicleId: string) => { const v = vehicles.find(v => v.id === vehicleId); return v ? `${v.make} ${v.model} (${v.licensePlate})` : 'N/A'}, [vehicles]);
    const getMechanicName = useCallback((mechanicId?: string | null) => mechanics.find(m => m.id === mechanicId)?.name || 'N/A', [mechanics]);
    const formatDate = (dateString?: string) => dateString ? new Date(dateString).toLocaleDateString('en-IN') : 'N/A';
    
    const filteredTasks = useMemo(() => {
        return tasks.filter(task =>
            (filterStatus === 'ALL' || task.status === filterStatus) &&
            (filterVehicleId === 'ALL' || task.vehicleId === filterVehicleId)
        ).sort((a,b) => new Date(b.scheduledDate || 0).getTime() - new Date(a.scheduledDate || 0).getTime());
    }, [tasks, filterStatus, filterVehicleId]);
    
    const getStatusPillClass = (status: MaintenanceTaskStatus) => {
        const classMap: Record<MaintenanceTaskStatus, string> = {
            [MaintenanceTaskStatus.SCHEDULED]: 'bg-blue-700 bg-opacity-30 text-blue-300',
            [MaintenanceTaskStatus.IN_PROGRESS]: 'bg-yellow-700 bg-opacity-30 text-yellow-300',
            [MaintenanceTaskStatus.COMPLETED]: 'bg-green-700 bg-opacity-30 text-green-300',
            [MaintenanceTaskStatus.CANCELLED]: 'bg-red-700 bg-opacity-30 text-red-300',
            [MaintenanceTaskStatus.AWAITING_PARTS]: 'bg-amber-700 bg-opacity-30 text-amber-300',
            [MaintenanceTaskStatus.PENDING_APPROVAL]: 'bg-purple-700 bg-opacity-30 text-purple-300',
        };
        return classMap[status] || 'bg-gray-700 text-gray-300';
    };

    const handleDownloadReport = useCallback(() => {
        const dataToExport = filteredTasks.map(t => ({
            jobCardNumber: t.jobCardNumber || 'N/A',
            vehicle: getVehicleName(t.vehicleId),
            title: t.title,
            status: t.status,
            type: t.maintenanceType,
            scheduledDate: formatDate(t.scheduledDate),
            completionDate: formatDate(t.completionDate),
            mechanic: getMechanicName(t.mechanicId) || t.garageName,
            totalCost: t.totalCost || 0,
        }));
        const headers = [
            { key: 'jobCardNumber', label: 'Job Card #' },
            { key: 'vehicle', label: 'Vehicle' },
            { key: 'title', label: 'Title' },
            { key: 'status', label: 'Status' },
            { key: 'type', label: 'Type' },
            { key: 'scheduledDate', label: 'Scheduled' },
            { key: 'completionDate', label: 'Completed' },
            { key: 'mechanic', label: 'Mechanic/Garage' },
            { key: 'totalCost', label: 'Total Cost (INR)' },
        ];
        exportToCsv(`maintenance_tasks_${new Date().toISOString().split('T')[0]}.csv`, dataToExport, headers);
    }, [filteredTasks, getVehicleName, getMechanicName, formatDate]);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-4">
                <h1 className="text-3xl font-bold text-gray-100 flex items-center"><ClipboardListIcon className="w-8 h-8 mr-3 text-primary-400" /> Maintenance Tasks / Job Cards</h1>
                <div className="flex items-center gap-4">
                    <button onClick={handleDownloadReport} className={`${buttonSecondaryStyle} flex items-center`}><ArrowDownTrayIcon className="w-5 h-5 mr-2" /> Download Report</button>
                    <button onClick={openAddModal} className={`${buttonPrimaryStyle} flex items-center`}><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-2"><path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" /></svg>Create Job Card</button>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-800 rounded-lg shadow">
                <div><label htmlFor="filterVehicleId" className={labelStyle}>Filter by Vehicle</label><select id="filterVehicleId" value={filterVehicleId} onChange={e => setFilterVehicleId(e.target.value)} className={`${inputFieldStyle} mt-1 pr-8`}><option value="ALL">All Vehicles</option>{vehicles.map(v => <option key={v.id} value={v.id}>{v.make} {v.model} ({v.licensePlate})</option>)}</select></div>
                <div><label htmlFor="filterStatus" className={labelStyle}>Filter by Status</label><select id="filterStatus" value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)} className={`${inputFieldStyle} mt-1 pr-8`}><option value="ALL">All Statuses</option>{Object.values(MaintenanceTaskStatus).map(s => <option key={s} value={s}>{s}</option>)}</select></div>
            </div>

            <div className="bg-gray-800 shadow-xl rounded-lg overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                    <thead className="bg-gray-750">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Job Card #</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Vehicle</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Title</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Type</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Scheduled</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Mechanic</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Cost (₹)</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-gray-800 divide-y divide-gray-700">
                        {filteredTasks.map(task => (
                            <tr key={task.id} className="hover:bg-gray-750">
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300 font-mono">{task.jobCardNumber}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">{getVehicleName(task.vehicleId)}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-200 font-medium">{task.title}</td>
                                <td className="px-4 py-3 whitespace-nowrap"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusPillClass(task.status)}`}>{task.status}</span></td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-400">{task.maintenanceType}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">{formatDate(task.scheduledDate)}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">{getMechanicName(task.mechanicId) || task.garageName}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-semibold text-gray-200">{task.totalCost ? task.totalCost.toLocaleString() : '-'}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium space-x-2">
                                    <button onClick={() => openEditModal(task)} className="text-indigo-400 hover:text-indigo-300">Edit</button>
                                    <button onClick={() => handleDelete(task.id)} className="text-red-400 hover:text-red-300">Delete</button>
                                </td>
                            </tr>
                        ))}
                        {filteredTasks.length === 0 && (<tr><td colSpan={9} className="text-center py-10 text-gray-500">No tasks found.</td></tr>)}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={isModalOpen} onClose={closeModal} title={editingTask ? 'Edit Job Card' : 'Create New Job Card'} size="3xl">
                <MaintenanceTaskForm onSubmit={(data) => { editingTask ? updateTask({ ...editingTask, ...data }) : addTask(data); closeModal(); }} onCancel={closeModal} initialData={editingTask} vehicles={vehicles} mechanics={mechanics} />
            </Modal>
        </div>
    );
};

export default MaintenanceTasksPage;
