


import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
// FIX: Added missing imports for TelematicsAlert and AlertType
import { Vehicle, Chauffeur, TelematicsAlert, MaintenanceTask, VehicleStatus, AlertType, MaintenanceTaskStatus, CostEntry, FuelLogEntry, FuelType, MaintenanceType } from '../types';
import { TruckIcon, BellAlertIcon, ClipboardListIcon, CogIcon, UserGroupIcon, FireIcon } from '../constants'; 

interface FleetOverviewDashboardPageProps {
  vehicles: Vehicle[];
  chauffeurs: Chauffeur[];
  alerts: TelematicsAlert[];
  maintenanceTasks: MaintenanceTask[];
  costEntries: CostEntry[];
  fuelLogs: FuelLogEntry[];
}

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; accentColor?: string; subtext?: string; }> =
({ title, value, icon, accentColor = 'border-primary-500 text-primary-400', subtext }) => (
  <div className={`bg-gray-800 p-4 rounded-xl shadow-lg flex items-center space-x-3 border-l-4 ${accentColor.split(' ')[1] || 'border-primary-500'}`}>
    <div className={`shrink-0 p-2.5 bg-gray-700 rounded-lg ${accentColor.split(' ')[0] || 'text-primary-400'}`}>{icon}</div>
    <div>
      <p className="text-xs sm:text-sm text-gray-400">{title}</p>
      <p className="text-xl sm:text-2xl font-semibold text-gray-100">{value}</p>
      {subtext && <p className="text-xs text-gray-500 mt-0.5">{subtext}</p>}
    </div>
  </div>
);

interface ChartDataItem {
  label: string;
  value: number;
  color: string;
}

const DonutChart: React.FC<{ data: ChartDataItem[]; title: string; centerText?: string }> = ({ data, title, centerText }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  if (total === 0 && !centerText) return <div className="text-center text-gray-500 py-8 h-full flex items-center justify-center">No data for {title}.</div>;

  let cumulativePercent = 0;
  const radius = 0.9;
  const innerRadius = 0.55;

  const getCoordinates = (percent: number, r: number) => [r * Math.cos(2 * Math.PI * percent), r * Math.sin(2 * Math.PI * percent)];

  return (
    <div className="bg-gray-800 p-5 rounded-xl shadow-xl h-full flex flex-col">
      <h3 className="text-lg font-semibold text-gray-100 mb-3">{title}</h3>
      <div className="flex-grow flex flex-col sm:flex-row items-center justify-around space-y-3 sm:space-y-0 sm:space-x-3 relative">
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
           {centerText && (
            <text x="0" y="0.05" textAnchor="middle" dominantBaseline="middle" fontSize="0.25" fill="#e5e7eb" fontWeight="bold">
              {centerText}
            </text>
          )}
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

const BarChart: React.FC<{ data: ChartDataItem[]; title: string; yAxisLabel?: string }> = ({ data, title, yAxisLabel }) => {
  const maxValue = Math.max(...data.map(item => item.value), 0);
  if (data.length === 0 || maxValue === 0) return <div className="text-center text-gray-500 py-10 h-full flex items-center justify-center">No data for {title}.</div>;

  const chartHeight = 150; 
  const barWidthPercent = Math.min(20, 60 / data.length); // Ensure bars are not too wide

  return (
    <div className="bg-gray-800 p-5 rounded-xl shadow-xl h-full flex flex-col">
      <h3 className="text-lg font-semibold text-gray-100 mb-1">{title}</h3>
      {yAxisLabel && <p className="text-xs text-gray-400 mb-3">{yAxisLabel}</p>}
      <div className="flex-grow flex items-end space-x-2 px-2 border-b border-l border-gray-700 relative" style={{ height: `${chartHeight + 30}px` }}> {/* Increased height for labels */}
        <div className="absolute -left-7 top-0 bottom-8 flex flex-col justify-between text-xs text-gray-500" style={{height: `${chartHeight}px`}}> {/* Adjusted positioning */}
          <span>{maxValue}</span>
          <span>{maxValue > 0 ? Math.round(maxValue / 2) : 0}</span>
          <span>0</span>
        </div>
        {data.map((item, index) => (
          <div key={index} className="flex-1 flex flex-col items-center group h-full justify-end">
            <div
              className="group-hover:opacity-80 transition-opacity"
              style={{ width: `${barWidthPercent}%`, height: `${maxValue > 0 ? (item.value / maxValue) * chartHeight : 0}px`, backgroundColor: item.color }}
              title={`${item.label}: ${item.value}`}
              aria-label={`${item.label}: ${item.value}`}
            ></div>
            <span className="text-[10px] text-gray-400 mt-1 truncate group-hover:font-semibold group-hover:text-gray-200" style={{maxWidth: '50px'}}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};


const FleetOverviewDashboardPage: React.FC<FleetOverviewDashboardPageProps> = ({
  vehicles,
  chauffeurs,
  alerts,
  maintenanceTasks,
  costEntries, 
  fuelLogs 
}) => {
  const totalVehicles = vehicles.length;
  const activeVehiclesCount = vehicles.filter(v => v.status === VehicleStatus.ACTIVE).length;
  const onRouteEstimate = Math.round(activeVehiclesCount * 0.70); 
  const idleVehiclesCount = activeVehiclesCount - onRouteEstimate;

  const avgFuelEfficiency = useMemo(() => {
    let totalKm = 0;
    let totalLitersOrKWh = 0; // Combined for simplicity, specific units for labels
    const vehicleJourneys = new Map<string, { odoReadings: number[], fuelConsumed: number, isElectric: boolean }>();

    if (!fuelLogs || fuelLogs.length === 0) return "N/A"; 

    fuelLogs.forEach(log => {
        if (!vehicleJourneys.has(log.vehicleId)) {
            vehicleJourneys.set(log.vehicleId, { odoReadings: [], fuelConsumed: 0, isElectric: log.fuelType === FuelType.ELECTRIC });
        }
        const journey = vehicleJourneys.get(log.vehicleId)!;
        journey.odoReadings.push(log.odometerReading);
        if (log.fuelType !== FuelType.ELECTRIC) {
            journey.fuelConsumed += log.quantity;
        }
    });

    vehicleJourneys.forEach(journey => {
        if (journey.odoReadings.length > 1) {
            journey.odoReadings.sort((a,b) => a-b);
            totalKm += journey.odoReadings[journey.odoReadings.length -1] - journey.odoReadings[0];
            totalLitersOrKWh += journey.fuelConsumed;
        }
    });

    if (totalLitersOrKWh === 0 || totalKm === 0) return "N/A";
    return `${(totalKm / totalLitersOrKWh).toFixed(1)} km/L`;
  }, [fuelLogs]);


  const criticalAlertsCount = alerts.filter(
    a => !a.isAcknowledged && [AlertType.SPEEDING, AlertType.UNAUTHORIZED_USE, AlertType.DEVICE_OFFLINE, AlertType.MAINTENANCE_OVERDUE, AlertType.COST_EXCEEDED_LIMIT].includes(a.type)
  ).length;

  const granularVehicleStatusChartData = useMemo(() => {
    const inMaintenance = vehicles.filter(v => v.status === VehicleStatus.MAINTENANCE).length;
    const otherInactive = vehicles.filter(v => v.status === VehicleStatus.INACTIVE || v.status === VehicleStatus.RETIRED).length;
    const activeNotRouteOrIdle = activeVehiclesCount - onRouteEstimate - idleVehiclesCount;
    return [
      { label: 'Active (Other)', value: activeNotRouteOrIdle > 0 ? activeNotRouteOrIdle : 0 , color: '#4CAF50' },
      { label: 'On Route', value: onRouteEstimate, color: '#2196F3' },
      { label: 'Idle', value: idleVehiclesCount, color: '#FFC107' },
      { label: 'Maintenance', value: inMaintenance, color: '#FF9800' },
      { label: 'Other Inactive', value: otherInactive, color: '#9E9E9E' },
    ].filter(d => d.value > 0);
  }, [vehicles, activeVehiclesCount, onRouteEstimate, idleVehiclesCount]);

  const activeAlerts = useMemo(() => alerts.filter(a => !a.isAcknowledged), [alerts]);
  
  const alertsByTypeChartData = useMemo(() => {
    const counts = activeAlerts.reduce((acc, alert) => {
      acc[alert.type] = (acc[alert.type] || 0) + 1;
      return acc;
    }, {} as Record<AlertType, number>);
    
    const colors: Record<AlertType, string> = {
      [AlertType.SPEEDING]: '#F44336', [AlertType.IDLING]: '#FF9800', [AlertType.HARSH_BRAKING]: '#FFC107',
      [AlertType.UNAUTHORIZED_USE]: '#E91E63', [AlertType.GEOFENCE_ENTRY]: '#2196F3', [AlertType.GEOFENCE_EXIT]: '#00BCD4',
      [AlertType.DEVICE_OFFLINE]: '#9C27B0', [AlertType.COST_EXCEEDED_LIMIT]: '#795548',
      [AlertType.INSURANCE_PERMIT_RENEWAL]: '#4CAF50', [AlertType.MAINTENANCE_DUE]: '#8BC34A', [AlertType.MAINTENANCE_OVERDUE]: '#CDDC39',
    };
    return Object.entries(counts).map(([label, value]) => ({
      label, value, color: colors[label as AlertType] || '#9E9E9E'
    })).sort((a,b) => b.value - a.value);
  }, [activeAlerts]);


  const recentCriticalAlerts = useMemo(() => {
    return alerts
      .filter(a => !a.isAcknowledged && [AlertType.SPEEDING, AlertType.UNAUTHORIZED_USE, AlertType.DEVICE_OFFLINE, AlertType.MAINTENANCE_OVERDUE, AlertType.COST_EXCEEDED_LIMIT].includes(a.type))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 4);
  }, [alerts]);

  const vehiclesInMaintenanceCount = vehicles.filter(v => v.status === VehicleStatus.MAINTENANCE).length;
  const pendingMaintenanceTasksCount = maintenanceTasks.filter(
    task => [MaintenanceTaskStatus.SCHEDULED, MaintenanceTaskStatus.IN_PROGRESS, MaintenanceTaskStatus.AWAITING_PARTS, MaintenanceTaskStatus.PENDING_APPROVAL].includes(task.status)
  ).length;
  const overdueTasksEstimate = Math.round(pendingMaintenanceTasksCount * 0.15); 

  const formatDate = (dateString: string) => new Date(dateString).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' });
  const getVehicleName = (vehicleId?: string | null): string => {
    if (!vehicleId) return 'N/A';
    const vehicle = vehicles.find(v => v.id === vehicleId);
    return vehicle ? `${vehicle.make} ${vehicle.model} (${vehicle.licensePlate.substring(0,6)}..)` : 'Unknown';
  };

  const getAlertSeverityClass = (type: AlertType) => {
    switch (type) {
      case AlertType.SPEEDING: case AlertType.UNAUTHORIZED_USE: case AlertType.DEVICE_OFFLINE: case AlertType.COST_EXCEEDED_LIMIT: case AlertType.MAINTENANCE_OVERDUE:
        return 'text-red-400';
      default:
        return 'text-amber-400';
    }
  };

  const chauffeurAvailabilityChartData = useMemo(() => {
    const totalChauffeurs = chauffeurs.length;
    const assignedChauffeurs = chauffeurs.filter(d => d.assignedVehicleId).length;
    const unassignedChauffeurs = totalChauffeurs - assignedChauffeurs;
    return [
      { label: 'Total', value: totalChauffeurs, color: '#42A5F5' }, 
      { label: 'Assigned', value: assignedChauffeurs, color: '#66BB6A' }, 
      { label: 'Unassigned', value: unassignedChauffeurs, color: '#FFA726' }, 
    ];
  }, [chauffeurs]);

  const maintenanceTasksByTypeChartData = useMemo(() => {
    const types: { [key in MaintenanceType]: number } = {
      [MaintenanceType.PREVENTIVE]: 0,
      [MaintenanceType.CORRECTIVE]: 0,
      [MaintenanceType.PREDICTIVE]: 0,
      [MaintenanceType.EMERGENCY]: 0,
      [MaintenanceType.INSPECTION]: 0,
      [MaintenanceType.UPGRADE]: 0,
    };
    maintenanceTasks.forEach(task => {
      if (types[task.maintenanceType] !== undefined) {
        types[task.maintenanceType]++;
      }
    });
    return [
      { label: 'Preventive', value: types[MaintenanceType.PREVENTIVE], color: '#29B6F6' }, 
      { label: 'Corrective', value: types[MaintenanceType.CORRECTIVE], color: '#FF7043' }, 
      { label: 'Predictive', value: types[MaintenanceType.PREDICTIVE], color: '#A1887F' }, 
      { label: 'Emergency', value: types[MaintenanceType.EMERGENCY], color: '#EF5350' }, 
      { label: 'Inspection', value: types[MaintenanceType.INSPECTION], color: '#8D6E63' },
      { label: 'Upgrade', value: types[MaintenanceType.UPGRADE], color: '#AB47BC' }, 
    ].filter(item => item.value > 0);
  }, [maintenanceTasks]);


  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-100">Fleet Overview Dashboard</h1>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard title="Total Vehicles" value={totalVehicles} icon={<TruckIcon className="w-6 h-6" />} accentColor="border-sky-500 text-sky-400" />
        <StatCard title="Active" value={activeVehiclesCount} icon={<TruckIcon className="w-6 h-6" />} accentColor="border-green-500 text-green-400" />
        <StatCard title="On Route (Est.)" value={onRouteEstimate} icon={<TruckIcon className="w-6 h-6" />} accentColor="border-blue-500 text-blue-400" />
        <StatCard title="Distance Today (Est.)" value="12,500 km" icon={<CogIcon className="w-6 h-6" />} accentColor="border-indigo-500 text-indigo-400" />
        <StatCard title="Avg. Fuel Eff. (Est.)" value={avgFuelEfficiency} icon={<FireIcon className="w-6 h-6" />} accentColor="border-teal-500 text-teal-400" />
        <StatCard title="Critical Alerts" value={criticalAlertsCount} icon={<BellAlertIcon className="w-6 h-6" />} accentColor="border-red-500 text-red-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DonutChart data={granularVehicleStatusChartData} title="Vehicle Status Distribution" />
        <DonutChart data={alertsByTypeChartData} title="Active Alerts by Type" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BarChart data={chauffeurAvailabilityChartData} title="Chauffeur Availability" yAxisLabel="Number of Chauffeurs" />
        <BarChart data={maintenanceTasksByTypeChartData} title="Maintenance Tasks by Type" yAxisLabel="Number of Tasks" />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-800 p-5 rounded-xl shadow-xl">
          <h3 className="text-lg font-semibold text-gray-100 mb-3">Recent Critical Alerts</h3>
          {recentCriticalAlerts.length > 0 ? (
            <ul className="space-y-2.5 text-xs max-h-60 overflow-y-auto">
              {recentCriticalAlerts.map(alert => (
                <li key={alert.id} className={`p-2.5 rounded-md bg-gray-750 border-l-2 ${alert.isAcknowledged ? 'border-gray-600' : getAlertSeverityClass(alert.type).replace('text-','border-')}`}>
                  <div className="flex justify-between items-center">
                    <span className={`font-medium ${getAlertSeverityClass(alert.type)}`}>{alert.type}</span>
                    <span className="text-gray-500">{formatDate(alert.timestamp)}</span>
                  </div>
                  <p className="text-gray-300 text-[11px] leading-tight truncate" title={alert.details}>{alert.details}</p>
                  <p className="text-gray-400 text-[11px] leading-tight">Vehicle: {getVehicleName(alert.vehicleId)}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-sm py-8 text-center">No critical alerts at the moment.</p>
          )}
           <Link to="/alerts" className="block mt-3 text-right text-xs text-primary-400 hover:text-primary-300 hover:underline">View All Alerts &rarr;</Link>
        </div>

        <div className="bg-gray-800 p-5 rounded-xl shadow-xl">
            <h3 className="text-lg font-semibold text-gray-100 mb-3">Maintenance Snapshot</h3>
            <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center py-1.5 border-b border-gray-700">
                    <span className="text-gray-300">Vehicles in Maintenance:</span>
                    <span className="font-semibold text-amber-400">{vehiclesInMaintenanceCount}</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-gray-700">
                    <span className="text-gray-300">Pending Tasks:</span>
                    <span className="font-semibold text-orange-400">{pendingMaintenanceTasksCount}</span>
                </div>
                <div className="flex justify-between items-center py-1.5">
                    <span className="text-gray-300">Overdue Tasks (Est.):</span>
                    <span className="font-semibold text-red-400">{overdueTasksEstimate}</span>
                </div>
            </div>
            <Link to="/maintenance/tasks" className="block mt-3 text-right text-xs text-primary-400 hover:text-primary-300 hover:underline">Go to Maintenance Tasks &rarr;</Link>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> {/* This row will only have one item for now */}
        <div className="bg-gray-800 p-5 rounded-xl shadow-xl md:col-span-2 lg:col-span-1"> {/* Adjust span if more items added here */}
            <h3 className="text-lg font-semibold text-gray-100 mb-3">Performance Highlights (Est.)</h3>
            <div className="space-y-2 text-sm">
                <div className="py-1.5">
                    <p className="text-gray-400 font-medium">Top Fuel Consumers:</p>
                    <ul className="list-disc list-inside ml-4 text-gray-300 text-xs">
                        <li>Large Trucks (e.g., Volvo FM): ~15-20L/100km</li>
                        <li>Older Models (e.g., Tata LPT): ~12-18L/100km</li>
                    </ul>
                </div>
                 <div className="py-1.5 border-t border-gray-700 mt-1">
                    <p className="text-gray-400 font-medium">Highest Mileage Chauffeurs (Weekly Est.):</p>
                    <ul className="list-disc list-inside ml-4 text-gray-300 text-xs">
                        <li>Rajesh Kumar: ~1,800 km</li>
                        <li>Priya Sharma: ~1,650 km</li>
                    </ul>
                </div>
            </div>
            <p className="text-xs text-gray-600 mt-3 italic">Estimates based on typical fleet data. Actuals may vary.</p>
        </div>
      </div>

    </div>
  );
};

export default FleetOverviewDashboardPage;