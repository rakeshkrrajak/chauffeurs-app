
import React, { useMemo } from 'react';
import { Vehicle, Chauffeur, MaintenanceTask, VehicleStatus, MaintenanceTaskStatus, MaintenanceType } from '../types';
import { TruckIcon, UserGroupIcon } from '../constants';

// Assuming a WrenchScrewdriverIcon or similar for Maintenance Pending
const WrenchScrewdriverIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path fillRule="evenodd" d="M12 6.75a5.25 5.25 0 015.25 5.25cv3.033l1.168.975A.75.75 0 0118 16.657v1.593a.75.75 0 01-.75.75H6.75a.75.75 0 01-.75-.75v-1.593a.75.75 0 01.332-.632l1.168-.975V12A5.25 5.25 0 0112 6.75zM4.067 12.67A.75.75 0 014.5 12h15a.75.75 0 01.433.67l.562 2.25H3.505l.562-2.25z" clipRule="evenodd" />
    <path d="M11.233 3.652a.75.75 0 011.062 0l1.25 1.25a.75.75 0 010 1.06l-.363.364a.75.75 0 01-1.061 0l-.362-.363V9a.75.75 0 01-1.5 0V6.026l-.363.363a.75.75 0 01-1.06 0l-.364-.363a.75.75 0 010-1.061l1.25-1.25zM15.75 12V6.791A3.726 3.726 0 0014.56 5.66L12.75 3.85V2.25a.75.75 0 00-1.5 0V3.85L9.44 5.66A3.725 3.725 0 008.25 6.79V12h7.5z" />
  </svg>
);


interface MonitorPageProps {
  vehicles: Vehicle[];
  chauffeurs: Chauffeur[];
  maintenanceTasks: MaintenanceTask[];
}

const InfoCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; color: string; }> = ({ title, value, icon, color }) => (
  <div className={`bg-gray-800 p-5 rounded-xl shadow-xl border-l-4 ${color}`}>
    <div className="flex items-center space-x-3">
      <div className="shrink-0 p-2 bg-gray-700 rounded-lg">{icon}</div>
      <div>
        <p className="text-sm text-gray-400">{title}</p>
        <p className="text-2xl font-semibold text-gray-100">{value}</p>
      </div>
    </div>
  </div>
);

interface ChartDataItem {
  label: string;
  value: number;
  color: string;
}

const PieChart: React.FC<{ data: ChartDataItem[]; title: string }> = ({ data, title }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  if (total === 0) return <div className="text-center text-gray-500 py-10">No data for {title}.</div>;

  let cumulativePercent = 0;
  const radius = 0.9; 
  const innerRadius = 0.5; 

  const getCoordinates = (percent: number, r: number) => {
    return [r * Math.cos(2 * Math.PI * percent), r * Math.sin(2 * Math.PI * percent)];
  };

  return (
    <div className="bg-gray-800 p-5 rounded-xl shadow-xl h-full flex flex-col">
      <h3 className="text-lg font-semibold text-gray-100 mb-3">{title}</h3>
      <div className="flex-grow flex items-center justify-around">
        <svg width="160" height="160" viewBox="-1 -1 2 2" style={{ transform: 'rotate(-0.25turn)' }} aria-label={`Pie chart: ${title}`}>
          {data.map((item, index) => {
            if (item.value === 0) return null;
            const percent = item.value / total;
            const [startX, startY] = getCoordinates(cumulativePercent, radius);
            const [startXInner, startYInner] = getCoordinates(cumulativePercent, innerRadius);
            
            cumulativePercent += percent;
            
            const [endX, endY] = getCoordinates(cumulativePercent, radius);
            const [endXInner, endYInner] = getCoordinates(cumulativePercent, innerRadius);

            const largeArcFlag = percent > 0.5 ? 1 : 0;

            const pathData = [
              `M ${startX} ${startY}`, 
              `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`, 
              `L ${endXInner} ${endYInner}`, 
              `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${startXInner} ${startYInner}`, 
              'Z' 
            ].join(' ');

            return <path key={index} d={pathData} fill={item.color} aria-label={`${item.label}: ${item.value}`} />;
          })}
        </svg>
        <div className="text-xs space-y-1 text-gray-300">
          {data.map((item, index) => (
            <div key={index} className="flex items-center">
              <span className="inline-block w-3 h-3 rounded-sm mr-2" style={{ backgroundColor: item.color }} aria-hidden="true"></span>
              <span>{item.label}: {item.value} ({total > 0 ? ((item.value / total) * 100).toFixed(1) : 0}%)</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};


const BarChart: React.FC<{ data: ChartDataItem[]; title: string; yAxisLabel?: string }> = ({ data, title, yAxisLabel }) => {
  const maxValue = Math.max(...data.map(item => item.value), 0);
  if (data.length === 0 || maxValue === 0) return <div className="text-center text-gray-500 py-10">No data for {title}.</div>;

  const chartHeight = 150; 
  const barWidthPercent = 60 / data.length; 

  return (
    <div className="bg-gray-800 p-5 rounded-xl shadow-xl h-full flex flex-col">
      <h3 className="text-lg font-semibold text-gray-100 mb-1">{title}</h3>
      {yAxisLabel && <p className="text-xs text-gray-400 mb-3">{yAxisLabel}</p>}
      <div className="flex-grow flex items-end space-x-2 px-2 border-b border-l border-gray-700 relative" style={{ height: `${chartHeight + 20}px` }}>
        <div className="absolute -left-6 top-0 bottom-5 flex flex-col justify-between text-xs text-gray-500">
          <span>{maxValue}</span>
          <span>{Math.round(maxValue / 2)}</span>
          <span>0</span>
        </div>
        {data.map((item, index) => (
          <div key={index} className="flex-1 flex flex-col items-center group">
            <div
              className="group-hover:opacity-80 transition-opacity"
              style={{ width: `${barWidthPercent}%`, height: `${(item.value / maxValue) * chartHeight}px`, backgroundColor: item.color }}
              title={`${item.label}: ${item.value}`}
              aria-label={`${item.label}: ${item.value}`}
            ></div>
            <span className="text-xs text-gray-400 mt-1 truncate group-hover:font-semibold group-hover:text-gray-200">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};


const MonitorPage: React.FC<MonitorPageProps> = ({ vehicles, chauffeurs, maintenanceTasks }) => {
  const totalVehicles = vehicles.length;
  const assignedVehiclesCount = useMemo(() => vehicles.filter(v => chauffeurs.some(d => d.assignedVehicleId === v.id)).length, [vehicles, chauffeurs]);
  const unassignedVehiclesCount = totalVehicles - assignedVehiclesCount;
  const maintenancePendingCount = useMemo(() => maintenanceTasks.filter(
    task => task.status === MaintenanceTaskStatus.SCHEDULED || task.status === MaintenanceTaskStatus.IN_PROGRESS || task.status === MaintenanceTaskStatus.AWAITING_PARTS
  ).length, [maintenanceTasks]);

  const vehicleStatusData = useMemo(() => {
    const statuses = {
      [VehicleStatus.ACTIVE]: 0,
      [VehicleStatus.MAINTENANCE]: 0,
      [VehicleStatus.INACTIVE]: 0,
      [VehicleStatus.RETIRED]: 0,
    };
    vehicles.forEach(v => {
      if (statuses[v.status] !== undefined) {
        statuses[v.status]++;
      }
    });
    return [
      { label: 'Active', value: statuses[VehicleStatus.ACTIVE], color: '#66BB6A' }, // Light Green
      { label: 'Maintenance', value: statuses[VehicleStatus.MAINTENANCE], color: '#FFCA28' }, // Light Amber
      { label: 'Inactive', value: statuses[VehicleStatus.INACTIVE], color: '#EF5350' }, // Light Red
      { label: 'Retired', value: statuses[VehicleStatus.RETIRED], color: '#BDBDBD' }, // Light Grey
    ];
  }, [vehicles]);

  const chauffeurAvailabilityData = useMemo(() => {
    const totalChauffeurs = chauffeurs.length;
    const assignedChauffeurs = chauffeurs.filter(d => d.assignedVehicleId).length;
    const unassignedChauffeurs = totalChauffeurs - assignedChauffeurs;
    return [
      { label: 'Total Chauffeurs', value: totalChauffeurs, color: '#42A5F5' }, // Light Blue
      { label: 'Assigned', value: assignedChauffeurs, color: '#66BB6A' }, 
      { label: 'Unassigned', value: unassignedChauffeurs, color: '#FFA726' }, // Light Orange
    ];
  }, [chauffeurs]);

  const maintenanceByTypeData = useMemo(() => {
    const types = {
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
      { label: 'Inspection', value: types[MaintenanceType.INSPECTION], color: '#8D6E63' }, // Slightly different brown
      { label: 'Upgrade', value: types[MaintenanceType.UPGRADE], color: '#AB47BC' }, 
    ].filter(item => item.value > 0);
  }, [maintenanceTasks]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-100">Fleet Monitor</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <InfoCard title="Total Vehicles" value={totalVehicles} icon={<TruckIcon className="w-8 h-8 text-sky-400" />} color="border-sky-500" />
        <InfoCard title="Assigned Vehicles" value={assignedVehiclesCount} icon={<TruckIcon className="w-8 h-8 text-green-400" />} color="border-green-500" />
        <InfoCard title="Unassigned Vehicles" value={unassignedVehiclesCount} icon={<TruckIcon className="w-8 h-8 text-amber-400" />} color="border-amber-500" />
        <InfoCard title="Maintenance Pending" value={maintenancePendingCount} icon={<WrenchScrewdriverIcon className="w-8 h-8 text-red-400" />} color="border-red-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PieChart data={vehicleStatusData} title="Vehicle Status Distribution" />
        <BarChart data={chauffeurAvailabilityData} title="Chauffeur Availability" yAxisLabel="Number of Chauffeurs" />
      </div>
      
      <div>
        <BarChart data={maintenanceByTypeData} title="Maintenance Tasks by Type" yAxisLabel="Number of Tasks" />
      </div>

    </div>
  );
};

export default MonitorPage;