import React, { useState, useMemo, useCallback } from 'react';
import { Vehicle, VehicleStatus, Chauffeur, DocumentType, User, MaintenanceTask, FuelLogEntry, ReportedIssue, MaintenanceType } from '../types';
import Modal from '../components/Modal';
import GeminiMaintenanceAdvisor from '../components/GeminiMaintenanceAdvisor';
import { exportToCsv } from '../services/reportService';
// FIX: Imported missing UserGroupIcon to resolve reference error. And changed VehicleForm to a default import.
import { ArrowDownTrayIcon, TruckIcon, CogIcon, FireIcon, ShieldCheckIcon, UserGroupIcon, CalendarDaysIcon } from '../constants';
import VehicleForm from '../components/VehicleForm';

interface VehiclesPageProps {
  vehicles: Vehicle[];
  chauffeurs: Chauffeur[];
  users: User[];
  updateVehicle: (vehicleData: Vehicle, transferReason?: string) => void;
  deleteVehicle: (vehicleId: string) => void;
  maintenanceTasks: MaintenanceTask[];
  fuelLogs: FuelLogEntry[];
  reportedIssues: ReportedIssue[];
}

// Stat Card component for summary stats
interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  accentColor: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, accentColor }) => (
  <div className={`bg-gray-800 p-4 rounded-lg shadow-lg flex items-center space-x-3 border-l-4 ${accentColor}`}>
    {icon}
    <div>
      <p className="text-sm text-gray-400">{title}</p>
      <p className="text-2xl font-bold text-gray-100">{value}</p>
    </div>
  </div>
);


// Sort Icon Component
const SortIcon: React.FC<{ direction?: 'asc' | 'desc' }> = ({ direction }) => {
    if (!direction) {
        return <svg className="w-4 h-4 text-gray-500 inline-block ml-1 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" /></svg>;
    }
    if (direction === 'asc') {
        return <svg className="w-4 h-4 text-gray-200 inline-block ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>;
    }
    return <svg className="w-4 h-4 text-gray-200 inline-block ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>;
};

// Helper to get a specific document from a vehicle
const getDocumentInfo = (vehicle: Vehicle, docType: DocumentType) => {
    return vehicle.documents?.find(d => d.type === docType);
};

// Helper for calculating days remaining and status
const getDaysRemaining = (dateString?: string): { days: number | null, status: 'Safe' | 'Action' | 'Expired' | 'N/A' } => {
    if (!dateString) return { days: null, status: 'N/A' };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiryDate = new Date(dateString);
    if (isNaN(expiryDate.getTime())) return { days: null, status: 'N/A' };

    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    let status: 'Safe' | 'Action' | 'Expired' | 'N/A' = 'Safe';
    if (diffDays < 0) {
        status = 'Expired';
    } else if (diffDays <= 30) {
        status = 'Action';
    }

    return { days: diffDays, status };
};

// Helper for detailed age string "X Years Y Months Z Days"
const getDetailedAge = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    const startDate = new Date(dateString);
    if (isNaN(startDate.getTime())) return 'N/A';

    let endDate = new Date();
    let years = endDate.getFullYear() - startDate.getFullYear();
    let months = endDate.getMonth() - startDate.getMonth();
    let days = endDate.getDate() - startDate.getDate();

    if (days < 0) {
        months--;
        days += new Date(endDate.getFullYear(), endDate.getMonth(), 0).getDate();
    }
    if (months < 0) {
        years--;
        months += 12;
    }
    return `${years}Y ${months}M ${days}D`;
};

// FIX: Moved formatDate utility function to module scope to make it accessible to all components in this file.
const formatDate = (dateString?: string | Date | null, withTime = false) => {
  if (!dateString) return 'N/A';
  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    if(withTime) {
      options.hour = 'numeric';
      options.minute = 'numeric';
    }
    return date.toLocaleDateString('en-IN', options);
  } catch { return 'Invalid Date'; }
};

// FIX: Moved getStatusPillClass to module scope to make it accessible by all components in this file.
const getStatusPillClass = (status: VehicleStatus) => {
    switch (status) {
      case VehicleStatus.ACTIVE: return 'bg-green-700 bg-opacity-30 text-green-300';
      case VehicleStatus.MAINTENANCE: return 'bg-amber-700 bg-opacity-30 text-amber-300';
      case VehicleStatus.INACTIVE: return 'bg-red-700 bg-opacity-30 text-red-300';
      case VehicleStatus.RETIRED: return 'bg-gray-600 bg-opacity-40 text-gray-300';
      case VehicleStatus.REMOVED: return 'bg-fuchsia-700 bg-opacity-30 text-fuchsia-300';
    }
  };

type SortableKey =
  | 'licensePlate'
  | 'status'
  | 'carType'
  | 'model'
  | 'carUserDisplay'
  | 'driverName'
  | 'department'
  | 'dateOfRegistration'
  | 'totalMonthsUsed'
  | 'mileage'
  | 'insuranceDaysLeft'
  | 'pucDaysLeft';

// Import necessary types and components
type TimelineEvent = {
    date: Date;
    type: 'Maintenance' | 'Fuel' | 'Incident' | 'Assignment' | 'Compliance' | 'Status Change';
    description: string;
    cost: number | null;
    notes: string;
};

const VehiclesPage: React.FC<VehiclesPageProps> = ({ vehicles, chauffeurs, users, updateVehicle, deleteVehicle, maintenanceTasks, fuelLogs, reportedIssues }) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [sortConfig, setSortConfig] = useState<{ key: SortableKey; direction: 'asc' | 'desc' }>({ key: 'licensePlate', direction: 'asc' });

  const vehicleStats = useMemo(() => {
    const total = vehicles.length;
    const poolCars = vehicles.filter(v => v.carType === 'Pool Cars').length;
    const mCars = vehicles.filter(v => v.carType === 'M-Car').length;
    const testCars = vehicles.filter(v => v.carType === 'Test Cars').length;
    return { total, poolCars, mCars, testCars };
  }, [vehicles]);

  const requestSort = (key: SortableKey) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const openEditModal = (vehicle: Vehicle) => { setEditingVehicle(vehicle); setIsEditModalOpen(true); };
  const closeEditModal = () => { setIsEditModalOpen(false); setEditingVehicle(null); };
  
  const viewVehicleDetails = (vehicle: Vehicle) => setSelectedVehicle(vehicle);
  const closeVehicleDetails = () => setSelectedVehicle(null);

  const handleEditFormSubmit = (vehicleData: Omit<Vehicle, 'id' | 'imageUrl'>, transferReason?: string) => {
    if (editingVehicle) {
      updateVehicle({ ...editingVehicle, ...vehicleData }, transferReason);
       // Also update the selectedVehicle state if it's the one being edited
      if (selectedVehicle && selectedVehicle.id === editingVehicle.id) {
          setSelectedVehicle({ ...selectedVehicle, ...vehicleData });
      }
    }
    closeEditModal();
  };

  const handleDeleteVehicle = (vehicleId: string) => {
    if (window.confirm('Are you sure you want to delete this vehicle? This action is permanent.')) {
        deleteVehicle(vehicleId);
        if (selectedVehicle?.id === vehicleId) setSelectedVehicle(null);
    }
  };

  const filteredVehicles = useMemo(() => {
    return vehicles.filter(vehicle =>
      vehicle.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.vin.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.licensePlate.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [vehicles, searchTerm]);
  
  const getCarUserDisplay = useCallback((vehicle: Vehicle): string => {
    if (vehicle.carType === 'Pool Cars') {
      return "POOL";
    }
    if (vehicle.assignedEmployeeId) {
      return users.find(u => u.id === vehicle.assignedEmployeeId)?.name || "Unknown Assignee";
    }
    return "Unassigned";
  }, [users]);


  const getComplianceStatusPillClass = (status: 'Safe' | 'Action' | 'Expired' | 'N/A') => {
    switch (status) {
      case 'Safe': return 'bg-green-700 bg-opacity-30 text-green-300';
      case 'Action': return 'bg-amber-700 bg-opacity-30 text-amber-300';
      case 'Expired': return 'bg-red-700 bg-opacity-30 text-red-300';
      default: return 'bg-gray-600 bg-opacity-40 text-gray-300';
    }
  };

  const getUserDetails = useCallback((userId?: string | null) => {
    if (!userId) return { dept: 'N/A', cc: 'N/A', level: 'N/A' };
    const user = users.find(u => u.id === userId);
    if (!user) return { dept: 'N/A', cc: 'N/A', level: 'N/A' };
    return {
        dept: user.department || 'N/A',
        cc: user.costCenter || 'N/A',
        level: user.level || 'N/A'
    };
  }, [users]);
  
  const calculateVehicleAge = useCallback((registrationDate?: string): { months: number; years: string } => {
    if (!registrationDate) return { months: 0, years: '0.0' };
    const regDate = new Date(registrationDate);
    const today = new Date();
    if (isNaN(regDate.getTime()) || regDate > today) return { months: 0, years: '0.0' };

    let years = today.getFullYear() - regDate.getFullYear();
    let months = today.getMonth() - regDate.getMonth();
    
    if (today.getDate() < regDate.getDate()) {
        months--;
    }

    if (months < 0) {
        years--;
        months += 12;
    }

    const totalMonths = years * 12 + months;
    const yearsFloat = (totalMonths / 12).toFixed(1);

    return { months: totalMonths, years: yearsFloat };
  }, []);

  const sortedTableData = useMemo(() => {
    let tableData = filteredVehicles.map(vehicle => {
        const userDetails = getUserDetails(vehicle.assignedEmployeeId);
        const age = calculateVehicleAge(vehicle.dateOfRegistration);
        
        const insuranceDoc = getDocumentInfo(vehicle, DocumentType.INSURANCE);
        const insuranceInfo = getDaysRemaining(insuranceDoc?.expiryDate);

        const pucDoc = getDocumentInfo(vehicle, DocumentType.PUC);
        const pucInfo = getDaysRemaining(pucDoc?.expiryDate);
        
        const driver = vehicle.assignedChauffeurId ? chauffeurs.find(c => c.id === vehicle.assignedChauffeurId) : null;

        return {
            ...vehicle,
            carUserDisplay: getCarUserDisplay(vehicle),
            driverName: driver ? driver.name : "N/A",
            department: userDetails.dept,
            costCenter: userDetails.cc,
            level: userDetails.level,
            totalMonthsUsed: age.months,
            vehicleAgeYears: age.years,
            detailedAge: getDetailedAge(vehicle.dateOfRegistration),
            
            insurancePolicy: insuranceDoc?.number || 'N/A',
            insuranceVendor: insuranceDoc?.vendor || 'N/A',
            insuranceEndDate: insuranceDoc ? formatDate(insuranceDoc.expiryDate) : 'N/A',
            insuranceDaysLeft: insuranceInfo.days,
            insuranceStatus: insuranceInfo.status,

            pucEndDate: pucDoc ? formatDate(pucDoc.expiryDate) : 'N/A',
            pucDaysLeft: pucInfo.days,
            pucStatus: pucInfo.status,
        };
    });

    if (sortConfig.key) {
        tableData.sort((a, b) => {
            let aValue: any;
            let bValue: any;

            if (sortConfig.key === 'model') {
                aValue = `${a.make} ${a.model}`;
                bValue = `${b.make} ${b.model}`;
            } else if (sortConfig.key === 'department') {
                aValue = `${a.department}/${a.costCenter}/${a.level}`;
                bValue = `${b.department}/${b.costCenter}/${b.level}`;
            } else {
                aValue = a[sortConfig.key!];
                bValue = b[sortConfig.key!];
            }
            
            if (aValue === null || aValue === undefined) return 1;
            if (bValue === null || bValue === undefined) return -1;
            
            let comparison = 0;
            if (typeof aValue === 'string' && typeof bValue === 'string') {
                comparison = aValue.localeCompare(bValue);
            } else if (typeof aValue === 'number' && typeof bValue === 'number') {
                comparison = aValue - bValue;
            } else {
                comparison = String(aValue).localeCompare(String(bValue));
            }

            return sortConfig.direction === 'asc' ? comparison : -comparison;
        });
    }

    return tableData;
  }, [filteredVehicles, chauffeurs, users, getUserDetails, calculateVehicleAge, getCarUserDisplay, getDetailedAge, sortConfig]);


  const handleDownloadReport = useCallback(() => {
    const dataToExport = sortedTableData.map(v => ({
      Vehicle_No: v.licensePlate,
      Status: v.status,
      Type_of_vehicle: v.carType || 'N/A',
      Model: `${v.make} ${v.model}`,
      Assigned_Employee: v.carUserDisplay,
      Driver_Name: v.driverName,
      Dept: v.department,
      CC: v.costCenter,
      Level: v.level,
      Purchase_Month: v.dateOfRegistration ? formatDate(v.dateOfRegistration) : 'N/A',
      Total_Months_Used: v.totalMonthsUsed,
      Vehicle_Age_in_years_days: v.detailedAge,
      Vehicle_Age: v.vehicleAgeYears,
      KM_Run: v.mileage,
      Fuel_Card: v.fuelCardNumber || 'N/A',
      Chassis_VIN_number: v.vin,
      Engine_number: v.engineNumber || 'N/A',
      Insurance_policy: v.insurancePolicy,
      Insurance_Vendor: v.insuranceVendor,
      Insurance_End_date: v.insuranceEndDate,
      Insurance_Days_Remaining: v.insuranceDaysLeft !== null ? v.insuranceDaysLeft : 'N/A',
      'Insurance Status': v.insuranceStatus,
      Emission_Test_Date: v.pucEndDate,
      Emission_Test_days_remaining: v.pucDaysLeft !== null ? v.pucDaysLeft : 'N/A',
      'Emission_Status': v.pucStatus,
      Location: v.location || 'N/A',
    }));
    const headers = Object.keys(dataToExport[0] || {}).map(k => ({key: k, label: k.replace(/_/g, ' ')}));
    exportToCsv(`vehicle_directory_report_${new Date().toISOString().split('T')[0]}.csv`, dataToExport, headers);
    // FIX: Removed formatDate from dependency array as it's now a stable module-scope function.
  }, [sortedTableData]);
  

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h1 className="text-3xl font-bold text-gray-100">
          {selectedVehicle ? `Vehicle History Report` : 'Vehicle Directory'}
        </h1>
        <div className="flex items-center gap-x-4">
            {!selectedVehicle ? (
                 <button onClick={handleDownloadReport} className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2.5 px-5 rounded-lg shadow-md transition-colors duration-150 ease-in-out flex items-center">
                    <ArrowDownTrayIcon className="w-5 h-5 mr-2" /> Download Report
                </button>
            ) : (
                <button onClick={closeVehicleDetails} className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2.5 px-5 rounded-lg shadow-md transition-colors duration-150 ease-in-out flex items-center">
                    &larr; Back to Directory
                </button>
            )}
        </div>
      </div>
      
      {selectedVehicle ? (
        <VehicleDetailReport 
            vehicle={selectedVehicle}
            chauffeurs={chauffeurs}
            users={users}
            allMaintenanceTasks={maintenanceTasks}
            allFuelLogs={fuelLogs}
            allReportedIssues={reportedIssues}
            onEdit={() => openEditModal(selectedVehicle)}
            onDelete={() => handleDeleteVehicle(selectedVehicle.id)}
        />
      ) : (
        <>
            <section>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard title="Total Vehicles" value={vehicleStats.total} icon={<TruckIcon className="w-7 h-7 text-sky-400" />} accentColor="border-sky-500" />
                    <StatCard title="Pool Cars" value={vehicleStats.poolCars} icon={<TruckIcon className="w-7 h-7 text-blue-400" />} accentColor="border-blue-500" />
                    <StatCard title="M-Cars" value={vehicleStats.mCars} icon={<TruckIcon className="w-7 h-7 text-gray-400" />} accentColor="border-gray-500" />
                    <StatCard title="Test Cars" value={vehicleStats.testCars} icon={<TruckIcon className="w-7 h-7 text-indigo-400" />} accentColor="border-indigo-500" />
                </div>
            </section>
            
            <input type="text" placeholder="Search vehicles (make, model, VIN, plate)..." className="bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-400 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm rounded-lg p-3 text-base" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            
            <div className="bg-gray-800 shadow-xl rounded-lg overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700 text-xs">
                    <thead className="bg-gray-750">
                        <tr>
                            <th className="px-3 py-3 text-left font-medium text-gray-400 uppercase"><button className="flex items-center" onClick={() => requestSort('licensePlate')}>Vehicle No {sortConfig.key === 'licensePlate' ? <SortIcon direction={sortConfig.direction} /> : <SortIcon />}</button></th>
                            <th className="px-3 py-3 text-left font-medium text-gray-400 uppercase"><button className="flex items-center" onClick={() => requestSort('status')}>Status {sortConfig.key === 'status' ? <SortIcon direction={sortConfig.direction} /> : <SortIcon />}</button></th>
                            <th className="px-3 py-3 text-left font-medium text-gray-400 uppercase"><button className="flex items-center" onClick={() => requestSort('carType')}>Category {sortConfig.key === 'carType' ? <SortIcon direction={sortConfig.direction} /> : <SortIcon />}</button></th>
                            <th className="px-3 py-3 text-left font-medium text-gray-400 uppercase"><button className="flex items-center" onClick={() => requestSort('model')}>Model {sortConfig.key === 'model' ? <SortIcon direction={sortConfig.direction} /> : <SortIcon />}</button></th>
                            <th className="px-3 py-3 text-left font-medium text-gray-400 uppercase"><button className="flex items-center" onClick={() => requestSort('carUserDisplay')}>Assigned To {sortConfig.key === 'carUserDisplay' ? <SortIcon direction={sortConfig.direction} /> : <SortIcon />}</button></th>
                            <th className="px-3 py-3 text-left font-medium text-gray-400 uppercase"><button className="flex items-center" onClick={() => requestSort('driverName')}>Driver {sortConfig.key === 'driverName' ? <SortIcon direction={sortConfig.direction} /> : <SortIcon />}</button></th>
                            <th className="px-3 py-3 text-left font-medium text-gray-400 uppercase"><button className="flex items-center" onClick={() => requestSort('department')}>Dept/CC/Lvl {sortConfig.key === 'department' ? <SortIcon direction={sortConfig.direction} /> : <SortIcon />}</button></th>
                            <th className="px-3 py-3 text-left font-medium text-gray-400 uppercase"><button className="flex items-center" onClick={() => requestSort('dateOfRegistration')}>Purchase Date {sortConfig.key === 'dateOfRegistration' ? <SortIcon direction={sortConfig.direction} /> : <SortIcon />}</button></th>
                            <th className="px-3 py-3 text-left font-medium text-gray-400 uppercase"><button className="flex items-center" onClick={() => requestSort('totalMonthsUsed')}>Age {sortConfig.key === 'totalMonthsUsed' ? <SortIcon direction={sortConfig.direction} /> : <SortIcon />}</button></th>
                            <th className="px-3 py-3 text-right font-medium text-gray-400 uppercase"><button className="flex items-center w-full justify-end" onClick={() => requestSort('mileage')}>KM Run {sortConfig.key === 'mileage' ? <SortIcon direction={sortConfig.direction} /> : <SortIcon />}</button></th>
                            <th className="px-3 py-3 text-left font-medium text-gray-400 uppercase"><button className="flex items-center" onClick={() => requestSort('insuranceDaysLeft')}>Insurance {sortConfig.key === 'insuranceDaysLeft' ? <SortIcon direction={sortConfig.direction} /> : <SortIcon />}</button></th>
                            <th className="px-3 py-3 text-left font-medium text-gray-400 uppercase"><button className="flex items-center" onClick={() => requestSort('pucDaysLeft')}>Emission (PUC) {sortConfig.key === 'pucDaysLeft' ? <SortIcon direction={sortConfig.direction} /> : <SortIcon />}</button></th>
                            <th className="px-3 py-3 text-left font-medium text-gray-400 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-gray-800 divide-y divide-gray-700">
                        {sortedTableData.map(v => (
                            <tr key={v.id} className="hover:bg-gray-750 transition-colors">
                                <td className="px-3 py-3 whitespace-nowrap"><div className="font-medium text-gray-200">{v.licensePlate}</div></td>
                                <td className="px-3 py-3 whitespace-nowrap">
                                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${getStatusPillClass(v.status)}`}>
                                        {v.status}
                                    </span>
                                </td>
                                <td className="px-3 py-3 whitespace-nowrap text-gray-300">{v.carType}</td>
                                <td className="px-3 py-3 whitespace-nowrap text-gray-300">{v.make} {v.model}</td>
                                <td className="px-3 py-3 whitespace-nowrap text-gray-300 font-semibold">{v.carUserDisplay}</td>
                                <td className="px-3 py-3 whitespace-nowrap text-gray-300">{v.driverName}</td>
                                <td className="px-3 py-3 whitespace-nowrap text-gray-300">{v.department}/{v.costCenter}/{v.level}</td>
                                <td className="px-3 py-3 whitespace-nowrap text-gray-300">{formatDate(v.dateOfRegistration)}</td>
                                <td className="px-3 py-3 whitespace-nowrap text-gray-300">{v.detailedAge} <span className="text-gray-500">({v.vehicleAgeYears} Yrs)</span></td>
                                <td className="px-3 py-3 whitespace-nowrap text-right text-gray-300">{v.mileage.toLocaleString()}</td>
                                <td className="px-3 py-3 whitespace-nowrap">
                                    <div className={getComplianceStatusPillClass(v.insuranceStatus).replace('bg-opacity-30 text-xs px-1.5 py-0.5 rounded-full', '')}>
                                        {v.insuranceEndDate} ({v.insuranceDaysLeft !== null ? `${v.insuranceDaysLeft} days` : 'N/A'})
                                    </div>
                                </td>
                                <td className="px-3 py-3 whitespace-nowrap">
                                     <div className={getComplianceStatusPillClass(v.pucStatus).replace('bg-opacity-30 text-xs px-1.5 py-0.5 rounded-full', '')}>
                                        {v.pucEndDate} ({v.pucDaysLeft !== null ? `${v.pucDaysLeft} days` : 'N/A'})
                                    </div>
                                </td>
                                <td className="px-3 py-3 whitespace-nowrap font-medium space-x-2">
                                    <button onClick={() => viewVehicleDetails(v)} className="text-primary-400 hover:text-primary-300">View</button>
                                    <button onClick={() => openEditModal(v)} className="text-amber-400 hover:text-amber-300">Edit</button>
                                </td>
                            </tr>
                        ))}
                        {sortedTableData.length === 0 && (
                            <tr>
                                <td colSpan={13} className="text-center text-gray-500 py-12 text-lg">
                                    No vehicles found matching your search criteria.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </>
      )}

      <Modal isOpen={isEditModalOpen} onClose={closeEditModal} title={'Edit Vehicle Details'} size="4xl" theme="dark">
        <VehicleForm onSubmit={handleEditFormSubmit} onCancel={closeEditModal} initialData={editingVehicle} chauffeurs={chauffeurs} users={users} vehicles={vehicles}/>
      </Modal>
    </div>
  );
};

// ... Rest of the page component, including VehicleDetailReport
interface VehicleDetailReportProps {
  vehicle: Vehicle;
  chauffeurs: Chauffeur[];
  users: User[];
  allMaintenanceTasks: MaintenanceTask[];
  allFuelLogs: FuelLogEntry[];
  allReportedIssues: ReportedIssue[];
  onEdit: () => void;
  onDelete: () => void;
}

const VehicleDetailReport: React.FC<VehicleDetailReportProps> = ({ vehicle, chauffeurs, users, allMaintenanceTasks, allFuelLogs, allReportedIssues, onEdit, onDelete }) => {
    const maintenanceTasks = useMemo(() => allMaintenanceTasks.filter(t => t.vehicleId === vehicle.id), [allMaintenanceTasks, vehicle.id]);
    const fuelLogs = useMemo(() => allFuelLogs.filter(f => f.vehicleId === vehicle.id).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()), [allFuelLogs, vehicle.id]);
    const reportedIssues = useMemo(() => allReportedIssues.filter(i => i.vehicleId === vehicle.id), [allReportedIssues, vehicle.id]);

    const timelineEvents = useMemo<TimelineEvent[]>(() => {
        const events: TimelineEvent[] = [];
        maintenanceTasks.forEach(t => events.push({ date: new Date(t.completionDate || t.scheduledDate || 0), type: 'Maintenance', description: t.title, cost: t.totalCost || null, notes: t.description || '' }));
        fuelLogs.forEach(f => events.push({ date: new Date(f.date), type: 'Fuel', description: `Refueled – ${f.quantity.toFixed(1)}L ${f.fuelType}`, cost: f.totalCost, notes: `Odometer: ${f.odometerReading.toLocaleString()} km` }));
        reportedIssues.forEach(i => events.push({ date: new Date(i.reportDate), type: 'Incident', description: i.issueDescription, cost: null, notes: `Severity: ${i.severity}` }));
        (vehicle.assignmentHistory || []).forEach(h => events.push({ date: new Date(h.startDate), type: 'Assignment', description: `Assigned to ${h.assignedToName}`, cost: null, notes: h.transferReason || '' }));
        (vehicle.statusHistory || []).forEach(h => events.push({ date: new Date(h.date), type: 'Status Change', description: `Status changed to ${h.status}`, cost: null, notes: ''}));
        return events.sort((a, b) => b.date.getTime() - a.date.getTime());
    }, [maintenanceTasks, fuelLogs, reportedIssues, vehicle.assignmentHistory, vehicle.statusHistory]);
    
    const keyStats = useMemo(() => {
        const totalFuelConsumed = fuelLogs.reduce((sum, log) => sum + log.quantity, 0);
        const totalFuelSpend = fuelLogs.reduce((sum, log) => sum + log.totalCost, 0);
        const maintenanceSpend = maintenanceTasks.reduce((sum, task) => sum + (task.totalCost || 0), 0);
        
        let downtimeDays = 0;
        if (vehicle.statusHistory) {
            let maintenanceStartDate: Date | null = null;
            [...vehicle.statusHistory].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()).forEach(h => {
                if (h.status === VehicleStatus.MAINTENANCE && !maintenanceStartDate) {
                    maintenanceStartDate = new Date(h.date);
                } else if (h.status === VehicleStatus.ACTIVE && maintenanceStartDate) {
                    const diff = new Date(h.date).getTime() - maintenanceStartDate.getTime();
                    downtimeDays += diff / (1000 * 60 * 60 * 24);
                    maintenanceStartDate = null;
                }
            });
        }

        return {
            totalFuelConsumed: totalFuelConsumed.toFixed(0) + ' L',
            totalFuelSpend: `₹${totalFuelSpend.toLocaleString(undefined, {maximumFractionDigits: 0})}`,
            maintenanceSpend: `₹${maintenanceSpend.toLocaleString(undefined, {maximumFractionDigits: 0})}`,
            incidents: reportedIssues.length,
            violations: '1 (Mock)', // Mock data
            downtime: `${Math.round(downtimeDays)} days`
        };
    }, [fuelLogs, maintenanceTasks, reportedIssues, vehicle.statusHistory]);

    const driverName = useMemo(() => vehicle.assignedChauffeurId ? chauffeurs.find(c => c.id === vehicle.assignedChauffeurId)?.name || 'Unknown' : 'N/A', [chauffeurs, vehicle.assignedChauffeurId]);
    
    const employeeName = useMemo(() => {
        if (vehicle.carType === 'Pool Cars') {
            return 'Pool Car';
        }
        if (!vehicle.assignedEmployeeId) {
            return 'Unassigned';
        }
        return users.find(u => u.id === vehicle.assignedEmployeeId)?.name || 'Unknown Employee';
    }, [users, vehicle.assignedEmployeeId, vehicle.carType]);

    const getTimelineIcon = (type: TimelineEvent['type']) => {
      const baseClass = "w-6 h-6 mr-3 text-white";
      const wrapperClass = "rounded-full p-2 mr-4";
      switch(type) {
        case 'Maintenance': return <div className={`bg-amber-500 ${wrapperClass}`}><CogIcon className={baseClass} /></div>;
        case 'Fuel': return <div className={`bg-sky-500 ${wrapperClass}`}><FireIcon className={baseClass} /></div>;
        case 'Incident': return <div className={`bg-red-500 ${wrapperClass}`}><ShieldCheckIcon className={baseClass} /></div>;
        case 'Assignment': return <div className={`bg-purple-500 ${wrapperClass}`}><UserGroupIcon className={baseClass} /></div>;
        case 'Status Change': return <div className={`bg-teal-500 ${wrapperClass}`}><CalendarDaysIcon className={baseClass} /></div>;
        default: return <div className={`bg-gray-500 ${wrapperClass}`}><TruckIcon className={baseClass} /></div>;
      }
    };
    
    return (
        <div className="space-y-6">
            {/* Section 1: Vehicle Summary */}
            <div className="bg-gray-800 p-6 rounded-xl shadow-2xl border border-gray-700">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div><p className="text-gray-400">License Plate</p><p className="font-semibold text-lg">{vehicle.licensePlate}</p></div>
                    <div><p className="text-gray-400">Make/Model/Year</p><p className="font-semibold">{vehicle.make} {vehicle.model} ({vehicle.year})</p></div>
                    <div><p className="text-gray-400">Current Odometer</p><p className="font-semibold">{vehicle.mileage.toLocaleString()} km</p></div>
                    <div><p className="text-gray-400">Status</p><p className="font-semibold inline-flex items-center"><span className={`w-2 h-2 rounded-full mr-2 ${vehicle.status === 'Active' ? 'bg-green-400' : 'bg-amber-400'}`}></span>{vehicle.status}</p></div>
                    <div><p className="text-gray-400">VIN</p><p className="font-mono text-xs">{vehicle.vin}</p></div>
                    <div><p className="text-gray-400">Vehicle Category</p><p className="font-semibold">{vehicle.carType || 'N/A'}</p></div>
                    <div><p className="text-gray-400">Assigned To</p><p className="font-semibold">{employeeName}</p></div>
                    <div><p className="text-gray-400">Assigned Driver</p><p className="font-semibold">{driverName}</p></div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-700 flex gap-x-3">
                    <button onClick={onEdit} className="bg-sky-600 hover:bg-sky-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-colors text-sm">Edit Vehicle</button>
                    <button onClick={onDelete} className="bg-red-700 hover:bg-red-800 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-colors text-sm">Delete Vehicle</button>
                </div>
            </div>

            {/* Key Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {Object.entries(keyStats).map(([title, value]) => (
                <div key={title} className="bg-gray-800 p-4 rounded-lg text-center shadow-lg">
                    <p className="text-2xl font-bold text-primary-400">{value}</p>
                    <p className="text-xs text-gray-400 uppercase">{title.replace(/([A-Z])/g, ' $1')}</p>
                </div>
              ))}
            </div>
            
            {/* Assignment & Status History */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-800 p-4 rounded-xl shadow-lg">
                    <h3 className="text-xl font-semibold mb-4">Assignment History</h3>
                    <div className="max-h-60 overflow-y-auto text-sm">
                        {(vehicle.assignmentHistory && vehicle.assignmentHistory.length > 0) ? (
                            <table className="min-w-full">
                                <thead className="sticky top-0 bg-gray-700"><tr className="text-left text-xs text-gray-300 uppercase">
                                    <th className="p-2">Assigned To</th><th className="p-2">Period</th><th className="p-2 text-right">KM Driven</th>
                                </tr></thead>
                                <tbody className="divide-y divide-gray-700">
                                    {vehicle.assignmentHistory.slice().reverse().map((h, i) => {
                                        const km = (h.endMileage || vehicle.mileage) - (h.startMileage || 0);
                                        return (<tr key={i}>
                                            <td className="p-2 font-medium">
                                                <div className="text-gray-200">{h.assignedToName}</div>
                                                {h.transferReason && (
                                                    <div className="text-xs text-gray-400 italic mt-1" title={h.transferReason}>
                                                        Reason: {h.transferReason}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="p-2 text-gray-400">{formatDate(h.startDate)} - {formatDate(h.endDate)}</td>
                                            <td className="p-2 text-right">{km > 0 ? km.toLocaleString() : 'N/A'}</td>
                                        </tr>)
                                    })}
                                </tbody>
                            </table>
                        ) : <p className="text-center text-gray-500 py-8">No assignment history.</p>}
                    </div>
                </div>
                 <div className="bg-gray-800 p-4 rounded-xl shadow-lg">
                    <h3 className="text-xl font-semibold mb-4">Status History</h3>
                     <div className="max-h-60 overflow-y-auto">
                        {(vehicle.statusHistory && vehicle.statusHistory.length > 0) ? (
                             <ul className="space-y-2">
                                {vehicle.statusHistory.slice().reverse().map((h, i) => (
                                    <li key={i} className="flex justify-between items-center p-2 bg-gray-700 rounded-md">
                                        <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusPillClass(h.status)}`}>{h.status}</span>
                                        <span className="text-xs text-gray-400">{formatDate(h.date, true)}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : <p className="text-center text-gray-500 py-8">No status history.</p>}
                    </div>
                </div>
            </div>

            {/* Main Timeline */}
            <div className="grid grid-cols-1 gap-6">
                <div className="bg-gray-800 p-4 rounded-xl shadow-lg">
                    <h3 className="text-xl font-semibold mb-4">Historical Timeline</h3>
                    <div className="max-h-96 overflow-y-auto pr-2 space-y-4">
                        {timelineEvents.map((event, index) => (
                            <div key={index} className="flex">
                                {getTimelineIcon(event.type)}
                                <div className="flex-grow">
                                    <div className="flex justify-between items-baseline">
                                        <p className="font-semibold text-gray-100">{event.type}: <span className="font-normal">{event.description}</span></p>
                                        <p className="text-xs text-gray-400 whitespace-nowrap">{formatDate(event.date)}</p>
                                    </div>
                                    <p className="text-sm text-gray-400">{event.notes}</p>
                                    {event.cost && <p className="text-sm font-semibold text-amber-300">Cost: ₹{event.cost.toLocaleString()}</p>}
                                </div>
                            </div>
                        ))}
                         {timelineEvents.length === 0 && <p className="text-center text-gray-500 py-8">No historical events found for this vehicle.</p>}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 {/* Maintenance History */}
                <div className="bg-gray-800 p-4 rounded-xl shadow-lg">
                    <h3 className="text-xl font-semibold mb-4">Maintenance History</h3>
                     <div className="max-h-72 overflow-y-auto">
                        <table className="min-w-full text-sm">
                            <thead className="sticky top-0 bg-gray-700"><tr className="text-left text-xs text-gray-300 uppercase">
                                <th className="p-2">Date</th><th className="p-2">Type</th><th className="p-2">Workshop</th><th className="p-2 text-right">Cost</th>
                            </tr></thead>
                            <tbody className="divide-y divide-gray-700">
                                {maintenanceTasks.map(t => <tr key={t.id}>
                                    <td className="p-2">{formatDate(t.completionDate || t.scheduledDate)}</td><td className="p-2">{t.maintenanceType}</td>
                                    <td className="p-2">{t.garageName || 'Internal'}</td><td className="p-2 text-right">₹{t.totalCost?.toLocaleString() || 0}</td>
                                </tr>)}
                                {maintenanceTasks.length === 0 && <tr><td colSpan={4} className="p-4 text-center text-gray-500">No maintenance tasks logged.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Compliance Records */}
                <div className="bg-gray-800 p-4 rounded-xl shadow-lg">
                    <h3 className="text-xl font-semibold mb-4">Compliance Records</h3>
                    <ul className="space-y-3 text-sm">
                        {[DocumentType.RC, DocumentType.INSURANCE, DocumentType.PUC, DocumentType.PERMIT].map(docType => {
                            const doc = vehicle.documents?.find(d => d.type === docType);
                            const expiry = getDaysRemaining(doc?.expiryDate);
                            return (
                                <li key={docType} className="flex justify-between items-center">
                                    <span className="font-medium text-gray-300">{docType}</span>
                                    {doc ? (
                                        <span className={`px-2 py-1 text-xs rounded-full ${expiry.status === 'Expired' ? 'bg-red-500' : expiry.status === 'Action' ? 'bg-amber-500' : 'bg-green-500'} text-white`}>
                                            Valid Till: {formatDate(doc.expiryDate)}
                                        </span>
                                    ) : <span className="text-xs text-gray-500">Not Available</span>}
                                </li>
                            );
                        })}
                    </ul>
                </div>
            </div>
            
            <GeminiMaintenanceAdvisor vehicle={vehicle} />
        </div>
    );
};

export default VehiclesPage;