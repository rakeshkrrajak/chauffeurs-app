import React, { useMemo, useState, useCallback } from 'react';
import { Vehicle, VehicleStatus, MaintenanceTask, FuelLogEntry, DocumentType } from '../types';
import { TruckIcon, DocumentChartBarIcon, WrenchIcon, ArrowDownTrayIcon } from '../constants';
import { exportToCsv } from '../services/reportService';

interface VehicleReportingDashboardPageProps {
  vehicles: Vehicle[];
  maintenanceTasks: MaintenanceTask[];
  fuelLogs: FuelLogEntry[];
}

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; accentColor: string; }> = ({ title, value, icon, accentColor }) => (
  <div className={`bg-gray-800 p-4 rounded-xl shadow-lg flex items-center space-x-3 border-l-4 ${accentColor}`}>
    <div className="shrink-0 p-2.5 bg-gray-700 rounded-lg">{icon}</div>
    <div>
      <p className="text-sm text-gray-400">{title}</p>
      <p className="text-2xl font-semibold text-gray-100">{value}</p>
    </div>
  </div>
);

interface ChartDataItem { label: string; value: number; color: string; }

const DonutChart: React.FC<{ data: ChartDataItem[]; title: string; }> = ({ data, title }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  if (total === 0) return <div className="text-center text-gray-500 py-8 h-full flex items-center justify-center">No data for {title}.</div>;

  let cumulativePercent = 0;
  const radius = 0.9;
  const innerRadius = 0.6;
  const getCoordinates = (percent: number, r: number) => [r * Math.cos(2 * Math.PI * percent), r * Math.sin(2 * Math.PI * percent)];

  return (
    <div className="bg-gray-800 p-5 rounded-xl shadow-xl h-full flex flex-col min-h-[300px]">
      <h3 className="text-lg font-semibold text-gray-100 mb-3">{title}</h3>
      <div className="flex-grow flex flex-col sm:flex-row items-center justify-around space-y-3 sm:space-y-0 sm:space-x-3">
        <svg width="150" height="150" viewBox="-1 -1 2 2" style={{ transform: 'rotate(-0.25turn)' }} aria-label={`Donut chart: ${title}`}>
          {data.map((item, index) => {
            if (item.value === 0) return null;
            const percent = item.value / total;
            const [startX, startY] = getCoordinates(cumulativePercent, radius);
            const [startXInner, startYInner] = getCoordinates(cumulativePercent, innerRadius);
            cumulativePercent += percent;
            const [endX, endY] = getCoordinates(cumulativePercent, radius);
            const [endXInner, endYInner] = getCoordinates(cumulativePercent, innerRadius);
            const largeArcFlag = percent > 0.5 ? 1 : 0;
            const pathData = `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY} L ${endXInner} ${endYInner} A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${startXInner} ${startYInner} Z`;
            return <path key={index} d={pathData} fill={item.color} aria-label={`${item.label}: ${item.value}`} />;
          })}
        </svg>
        <div className="text-xs space-y-1 text-gray-300">
          {data.map((item, index) => (
            <div key={index} className="flex items-center">
              <span className="inline-block w-2.5 h-2.5 rounded-sm mr-1.5" style={{ backgroundColor: item.color }} aria-hidden="true"></span>
              <span>{item.label}: {item.value} ({total > 0 ? ((item.value / total) * 100).toFixed(0) : 0}%)</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const HorizontalBarChart: React.FC<{ data: ChartDataItem[] }> = ({ data }) => {
    const maxValue = Math.max(...data.map(item => item.value), 1); // Avoid division by zero
  
    if (data.length === 0) {
        return <p className="text-gray-500 text-sm py-8 text-center">No vehicle data for the selected period.</p>;
    }

    return (
        <div className="space-y-3 mt-4">
            {data.map(item => (
            <div key={item.label} className="grid grid-cols-5 gap-2 items-center">
                <span className="text-sm text-gray-400 text-right col-span-1 pr-4">{item.label}</span>
                <div className="col-span-4 bg-gray-700 rounded-full h-6">
                <div
                    className="h-6 rounded-full flex items-center justify-end px-2 transition-width duration-500 ease-in-out"
                    style={{ width: `${(item.value / maxValue) * 100}%`, backgroundColor: item.color }}
                >
                    <span className="text-xs font-bold text-white">{item.value}</span>
                </div>
                </div>
            </div>
            ))}
        </div>
    );
};

const getDaysRemaining = (dateString?: string): number | null => {
    if (!dateString) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiryDate = new Date(dateString);
    if (isNaN(expiryDate.getTime())) return null;
    const diffTime = expiryDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};


const VehicleReportingDashboardPage: React.FC<VehicleReportingDashboardPageProps> = ({ vehicles, maintenanceTasks, fuelLogs }) => {
    const [historicalDate, setHistoricalDate] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM format

    const reportStats = useMemo(() => {
        if (vehicles.length === 0) return { avgAge: 0, avgMileage: 0, inMaintenance: 0 };
        const totalAgeInYears = vehicles.reduce((sum, v) => {
            const regDate = new Date(v.dateOfRegistration || Date.now());
            const ageMillis = Date.now() - regDate.getTime();
            return sum + ageMillis / (1000 * 60 * 60 * 24 * 365.25);
        }, 0);
        const totalMileage = vehicles.reduce((sum, v) => sum + v.mileage, 0);
        
        return {
            avgAge: (totalAgeInYears / vehicles.length).toFixed(1),
            avgMileage: (totalMileage / vehicles.length).toLocaleString(undefined, {maximumFractionDigits: 0}),
            inMaintenance: vehicles.filter(v => v.status === VehicleStatus.MAINTENANCE).length,
        };
    }, [vehicles]);

    const vehicleStatusData = useMemo(() => {
        const counts = vehicles.reduce((acc, v) => {
            acc[v.status] = (acc[v.status] || 0) + 1;
            return acc;
        }, {} as Record<VehicleStatus, number>);

        return [
            { label: 'Active', value: counts.Active || 0, color: '#4CAF50' },
            { label: 'Maintenance', value: counts.Maintenance || 0, color: '#FFC107' },
            { label: 'Inactive', value: counts.Inactive || 0, color: '#F44336' },
            { label: 'Retired', value: counts.Retired || 0, color: '#9E9E9E' },
            { label: 'Removed', value: counts.Removed || 0, color: '#673AB7'},
        ].filter(d => d.value > 0);
    }, [vehicles]);
    
    const topMaintenanceCostVehicles = useMemo(() => {
        const costsByVehicle: Record<string, number> = {};
        maintenanceTasks.forEach(task => {
            if (task.totalCost) {
                costsByVehicle[task.vehicleId] = (costsByVehicle[task.vehicleId] || 0) + task.totalCost;
            }
        });
        return Object.entries(costsByVehicle)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([vehicleId, totalCost]) => {
                const vehicle = vehicles.find(v => v.id === vehicleId);
                return {
                    id: vehicleId,
                    name: vehicle ? `${vehicle.make} ${vehicle.model} (${vehicle.licensePlate})` : 'Unknown',
                    cost: totalCost
                };
            });
    }, [maintenanceTasks, vehicles]);

    const documentRenewals = useMemo(() => {
        const renewals: { vehicleName: string; docType: DocumentType; daysLeft: number }[] = [];
        vehicles.forEach(v => {
            (v.documents || []).forEach(doc => {
                if ([DocumentType.INSURANCE, DocumentType.PUC, DocumentType.FITNESS].includes(doc.type)) {
                    const days = getDaysRemaining(doc.expiryDate);
                    if (days !== null && days <= 30) {
                        renewals.push({
                            vehicleName: `${v.make} ${v.model} (${v.licensePlate})`,
                            docType: doc.type,
                            daysLeft: days
                        });
                    }
                }
            });
        });
        return renewals.sort((a,b) => a.daysLeft - b.daysLeft);
    }, [vehicles]);

    const historicalStatusChartData = useMemo(() => {
        const year = parseInt(historicalDate.substring(0, 4), 10);
        const month = parseInt(historicalDate.substring(5, 7), 10);
        // JS month is 0-indexed, so `month` from input is correct for 'end of month' calc
        const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

        const statusCounts: Record<string, number> = {};
        Object.values(VehicleStatus).forEach(s => statusCounts[s] = 0);

        vehicles.forEach(vehicle => {
            const registrationDate = new Date(vehicle.dateOfRegistration || 0);
            if (registrationDate > endOfMonth) {
                return; // Vehicle didn't exist yet
            }

            // Find the status of the vehicle at the end of the selected month
            const relevantHistory = (vehicle.statusHistory || [])
                .filter(h => new Date(h.date) <= endOfMonth)
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            
            let statusForMonth: VehicleStatus;
            if (relevantHistory.length > 0) {
                statusForMonth = relevantHistory[0].status;
            } else {
                // If no history before this date, it was in its initial state
                statusForMonth = VehicleStatus.ACTIVE;
            }
            statusCounts[statusForMonth]++;
        });
        
        const statusColors: Record<VehicleStatus, string> = {
            [VehicleStatus.ACTIVE]: '#4CAF50',
            [VehicleStatus.MAINTENANCE]: '#FFC107',
            [VehicleStatus.INACTIVE]: '#F44336',
            [VehicleStatus.RETIRED]: '#9E9E9E',
            [VehicleStatus.REMOVED]: '#673AB7'
        };

        return Object.entries(statusCounts)
            .map(([status, value]) => ({
                label: status,
                value: value,
                color: statusColors[status as VehicleStatus] || '#757575'
            }))
            .filter(d => d.value > 0)
            .sort((a, b) => b.value - a.value);
    }, [vehicles, historicalDate]);

    const handleDownloadReport = useCallback(() => {
        const dataToExport = vehicles.map(v => {
            const maintenanceCost = maintenanceTasks
                .filter(t => t.vehicleId === v.id && t.totalCost)
                .reduce((sum, t) => sum + t.totalCost!, 0);
            
            const fuelCost = fuelLogs
                .filter(l => l.vehicleId === v.id)
                .reduce((sum, l) => sum + l.totalCost, 0);

            const regDate = new Date(v.dateOfRegistration || Date.now());
            const ageMillis = Date.now() - regDate.getTime();
            const ageYears = (ageMillis / (1000 * 60 * 60 * 24 * 365.25)).toFixed(1);
            
            const getDocExpiry = (type: DocumentType) => {
                const doc = v.documents?.find(d => d.type === type);
                return doc?.expiryDate ? new Date(doc.expiryDate).toLocaleDateString('en-IN') : 'N/A';
            }

            return {
                licensePlate: v.licensePlate,
                makeModel: `${v.make} ${v.model}`,
                status: v.status,
                ageYears: ageYears,
                mileage: v.mileage,
                totalMaintenanceCost: maintenanceCost,
                totalFuelCost: fuelCost.toFixed(2),
                insuranceExpiry: getDocExpiry(DocumentType.INSURANCE),
                pucExpiry: getDocExpiry(DocumentType.PUC),
                fitnessExpiry: getDocExpiry(DocumentType.FITNESS),
            };
        });

        const headers = [
            { key: 'licensePlate', label: 'License Plate' },
            { key: 'makeModel', label: 'Make & Model' },
            { key: 'status', label: 'Status' },
            { key: 'ageYears', label: 'Age (Years)' },
            { key: 'mileage', label: 'Mileage (KM)' },
            { key: 'totalMaintenanceCost', label: 'Total Maintenance Cost (INR)' },
            { key: 'totalFuelCost', label: 'Total Fuel Cost (INR)' },
            { key: 'insuranceExpiry', label: 'Insurance Expiry' },
            { key: 'pucExpiry', label: 'PUC Expiry' },
            { key: 'fitnessExpiry', label: 'Fitness Expiry' },
        ];
        
        exportToCsv(`vehicle_reporting_summary_${new Date().toISOString().split('T')[0]}.csv`, dataToExport, headers);
    }, [vehicles, maintenanceTasks, fuelLogs]);


    return (
        <div className="space-y-6">
            <header className="flex justify-between items-center flex-wrap gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-100 flex items-center">
                        <DocumentChartBarIcon className="w-8 h-8 mr-3 text-primary-400" />
                        Vehicle Reporting Dashboard
                    </h1>
                    <p className="text-gray-400 mt-1">Analytics and insights on fleet vehicles.</p>
                </div>
                 <button onClick={handleDownloadReport} className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2.5 px-5 rounded-lg shadow-md transition-colors duration-150 ease-in-out flex items-center">
                    <ArrowDownTrayIcon className="w-5 h-5 mr-2" /> Download Report
                </button>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Total Vehicles" value={vehicles.length} icon={<TruckIcon className="w-7 h-7 text-sky-400" />} accentColor="border-sky-500" />
                <StatCard title="Avg. Age (Years)" value={reportStats.avgAge} icon={<TruckIcon className="w-7 h-7 text-blue-400" />} accentColor="border-blue-500" />
                <StatCard title="Avg. Mileage (KM)" value={reportStats.avgMileage} icon={<TruckIcon className="w-7 h-7 text-green-400" />} accentColor="border-green-500" />
                <StatCard title="In Maintenance" value={reportStats.inMaintenance} icon={<WrenchIcon className="w-7 h-7 text-amber-400" />} accentColor="border-amber-500" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <DonutChart data={vehicleStatusData} title="Current Vehicle Status" />
                 <div className="bg-gray-800 p-5 rounded-xl shadow-xl">
                    <h3 className="text-lg font-semibold text-gray-100 mb-3">Historical Fleet Status</h3>
                    <div className="max-w-xs mb-4">
                        <label htmlFor="historicalDate" className="block text-sm font-medium text-gray-400 mb-1">Select Month</label>
                        <input
                            type="month"
                            id="historicalDate"
                            value={historicalDate}
                            onChange={e => setHistoricalDate(e.target.value)}
                            className="bg-gray-700 border border-gray-600 text-gray-200 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:[color-scheme:dark]"
                        />
                    </div>
                    <HorizontalBarChart data={historicalStatusChartData} />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <div className="bg-gray-800 p-5 rounded-xl shadow-xl">
                    <h3 className="text-lg font-semibold text-gray-100 mb-3">Top 5 Vehicles by Maintenance Cost</h3>
                    {topMaintenanceCostVehicles.length > 0 ? (
                        <ul className="space-y-2.5 text-sm">
                        {topMaintenanceCostVehicles.map(v => (
                            <li key={v.id} className="p-2.5 rounded-md bg-gray-700 flex justify-between items-center">
                                <span className="text-gray-200 font-medium truncate pr-4" title={v.name}>{v.name}</span>
                                <span className="font-semibold text-amber-300 whitespace-nowrap">₹{v.cost.toLocaleString()}</span>
                            </li>
                        ))}
                        </ul>
                    ) : (
                        <p className="text-gray-500 text-sm py-8 text-center">No maintenance cost data available.</p>
                    )}
                </div>
                 <div className="bg-gray-800 p-5 rounded-xl shadow-xl">
                    <h3 className="text-lg font-semibold text-gray-100 mb-3">Upcoming Document Renewals (Next 30 Days)</h3>
                    {documentRenewals.length > 0 ? (
                        <ul className="space-y-2.5 text-xs max-h-60 overflow-y-auto pr-2">
                        {documentRenewals.map((r, i) => (
                            <li key={i} className={`p-2 rounded-md ${r.daysLeft < 0 ? 'bg-red-900 bg-opacity-40' : 'bg-gray-700'}`}>
                                <div className="flex justify-between items-center">
                                    <span className="font-medium text-gray-200 truncate pr-2" title={r.vehicleName}>{r.vehicleName}</span>
                                    <span className={`font-semibold text-xs px-1.5 py-0.5 rounded-full ${r.daysLeft < 0 ? 'bg-red-500 text-white' : 'bg-amber-500 text-white'}`}>
                                        {r.daysLeft < 0 ? 'Expired' : `${r.daysLeft} days left`}
                                    </span>
                                </div>
                                 <p className="text-gray-400 text-[11px]">{r.docType}</p>
                            </li>
                        ))}
                        </ul>
                    ) : (
                        <p className="text-gray-500 text-sm py-8 text-center">No documents expiring soon.</p>
                    )}
                </div>
            </div>

        </div>
    );
};

export default VehicleReportingDashboardPage;