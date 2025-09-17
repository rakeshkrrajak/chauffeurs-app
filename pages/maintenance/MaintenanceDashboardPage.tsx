
import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Vehicle, MaintenanceTask, Mechanic, VehicleStatus, MaintenanceTaskStatus, MaintenanceType } from '../../types';
import { WrenchIcon, ClipboardListIcon, UserGroupIcon, CogIcon as CalendarDaysIcon } from '../../constants'; // Reusing CogIcon as CalendarDaysIcon

interface MaintenanceDashboardPageProps {
  vehicles: Vehicle[];
  maintenanceTasks: MaintenanceTask[];
  mechanics: Mechanic[];
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

const DonutChart: React.FC<{ data: ChartDataItem[]; title: string }> = ({ data, title }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  if (total === 0) return <div className="text-center text-gray-500 py-8 h-full flex items-center justify-center">No data for {title}.</div>;

  let cumulativePercent = 0;
  const radius = 0.9;
  const innerRadius = 0.55;

  const getCoordinates = (percent: number, r: number) => [r * Math.cos(2 * Math.PI * percent), r * Math.sin(2 * Math.PI * percent)];

  return (
    <div className="bg-gray-800 p-5 rounded-xl shadow-xl h-full flex flex-col">
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

const BarChart: React.FC<{ data: ChartDataItem[]; title: string; yAxisLabel?: string }> = ({ data, title, yAxisLabel }) => {
  const maxValue = Math.max(...data.map(item => item.value), 0);
  if (data.length === 0 || maxValue === 0) return <div className="text-center text-gray-500 py-10 h-full flex items-center justify-center">No data for {title}.</div>;

  const chartHeight = 150; 
  const barWidthPercent = Math.min(20, 60 / data.length); 

  return (
    <div className="bg-gray-800 p-5 rounded-xl shadow-xl h-full flex flex-col">
      <h3 className="text-lg font-semibold text-gray-100 mb-1">{title}</h3>
      {yAxisLabel && <p className="text-xs text-gray-400 mb-3">{yAxisLabel}</p>}
      <div className="flex-grow flex items-end space-x-2 px-2 border-b border-l border-gray-700 relative" style={{ height: `${chartHeight + 30}px` }}>
        <div className="absolute -left-7 top-0 bottom-8 flex flex-col justify-between text-xs text-gray-500" style={{height: `${chartHeight}px`}}>
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

const MaintenanceDashboardPage: React.FC<MaintenanceDashboardPageProps> = ({
  vehicles,
  maintenanceTasks,
  mechanics,
}) => {
  const vehiclesInMaintenanceCount = useMemo(() =>
    vehicles.filter(v => v.status === VehicleStatus.MAINTENANCE).length,
  [vehicles]);

  const pendingTasksCount = useMemo(() =>
    maintenanceTasks.filter(task =>
      [MaintenanceTaskStatus.SCHEDULED, MaintenanceTaskStatus.IN_PROGRESS, MaintenanceTaskStatus.AWAITING_PARTS, MaintenanceTaskStatus.PENDING_APPROVAL].includes(task.status)
    ).length,
  [maintenanceTasks]);

  const overdueTasks = useMemo(() =>
    maintenanceTasks.filter(task =>
      task.scheduledDate && new Date(task.scheduledDate) < new Date() &&
      ![MaintenanceTaskStatus.COMPLETED, MaintenanceTaskStatus.CANCELLED].includes(task.status)
    ),
  [maintenanceTasks]);
  const overdueTasksCount = overdueTasks.length;

  const upcomingServicesCount = useMemo(() => {
    const today = new Date();
    const sevenDaysLater = new Date();
    sevenDaysLater.setDate(today.getDate() + 7);
    return maintenanceTasks.filter(task =>
      task.scheduledDate &&
      new Date(task.scheduledDate) >= today &&
      new Date(task.scheduledDate) <= sevenDaysLater &&
      task.status === MaintenanceTaskStatus.SCHEDULED
    ).length;
  }, [maintenanceTasks]);

  const maintenanceCostThisMonth = useMemo(() => {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    return maintenanceTasks
      .filter(task =>
        task.status === MaintenanceTaskStatus.COMPLETED &&
        task.completionDate &&
        new Date(task.completionDate) >= firstDayOfMonth &&
        new Date(task.completionDate) <= lastDayOfMonth
      )
      .reduce((sum, task) => sum + (task.totalCost || 0), 0);
  }, [maintenanceTasks]);

  const maintenanceTasksByStatusData = useMemo(() => {
    const statuses: { [key in MaintenanceTaskStatus]: number } = {
      [MaintenanceTaskStatus.SCHEDULED]: 0,
      [MaintenanceTaskStatus.IN_PROGRESS]: 0,
      [MaintenanceTaskStatus.COMPLETED]: 0,
      [MaintenanceTaskStatus.CANCELLED]: 0,
      [MaintenanceTaskStatus.AWAITING_PARTS]: 0,
      [MaintenanceTaskStatus.PENDING_APPROVAL]: 0,
    };
    maintenanceTasks.forEach(task => {
      if (statuses[task.status] !== undefined) {
        statuses[task.status]++;
      }
    });
    return [
      { label: 'Scheduled', value: statuses[MaintenanceTaskStatus.SCHEDULED], color: '#2196F3' },
      { label: 'In Progress', value: statuses[MaintenanceTaskStatus.IN_PROGRESS], color: '#FFC107' },
      { label: 'Completed', value: statuses[MaintenanceTaskStatus.COMPLETED], color: '#4CAF50' },
      { label: 'Cancelled', value: statuses[MaintenanceTaskStatus.CANCELLED], color: '#F44336' },
      { label: 'Awaiting Parts', value: statuses[MaintenanceTaskStatus.AWAITING_PARTS], color: '#FF9800' },
      { label: 'Pending Approval', value: statuses[MaintenanceTaskStatus.PENDING_APPROVAL], color: '#9C27B0' },
    ].filter(d => d.value > 0);
  }, [maintenanceTasks]);

  const maintenanceTasksByTypeData = useMemo(() => {
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
      { label: 'Preventive', value: types[MaintenanceType.PREVENTIVE], color: '#00BCD4' },
      { label: 'Corrective', value: types[MaintenanceType.CORRECTIVE], color: '#E91E63' },
      { label: 'Predictive', value: types[MaintenanceType.PREDICTIVE], color: '#795548' },
      { label: 'Emergency', value: types[MaintenanceType.EMERGENCY], color: '#F44336' },
      { label: 'Inspection', value: types[MaintenanceType.INSPECTION], color: '#FFEB3B' },
      { label: 'Upgrade', value: types[MaintenanceType.UPGRADE], color: '#673AB7' },
    ].filter(d => d.value > 0);
  }, [maintenanceTasks]);

  const vehiclesCurrentlyInMaintenance = useMemo(() =>
    vehicles.filter(v => v.status === VehicleStatus.MAINTENANCE)
    .map(v => {
        const activeTask = maintenanceTasks.find(t => t.vehicleId === v.id && 
            [MaintenanceTaskStatus.IN_PROGRESS, MaintenanceTaskStatus.AWAITING_PARTS, MaintenanceTaskStatus.SCHEDULED].includes(t.status)
        );
        const mechanic = mechanics.find(m => m.id === activeTask?.mechanicId);
        return {
            ...v,
            taskTitle: activeTask?.title || "Pending Task",
            mechanicName: mechanic?.name || activeTask?.garageName || "N/A"
        };
    }), [vehicles, maintenanceTasks, mechanics]);

  const criticalOverdueTasks = useMemo(() =>
    overdueTasks
      .sort((a,b) => new Date(a.scheduledDate!).getTime() - new Date(b.scheduledDate!).getTime()) // Oldest first
      .slice(0, 5)
      .map(task => {
        const vehicle = vehicles.find(v => v.id === task.vehicleId);
        const daysOverdue = Math.floor((new Date().getTime() - new Date(task.scheduledDate!).getTime()) / (1000 * 60 * 60 * 24));
        return {
            ...task,
            vehicleInfo: vehicle ? `${vehicle.make} ${vehicle.model} (${vehicle.licensePlate})` : "N/A",
            daysOverdue
        };
      }),
  [overdueTasks, vehicles]);

  const formatDate = (dateString?: string) => dateString ? new Date(dateString).toLocaleDateString('en-IN', {day: '2-digit', month: 'short', year: 'numeric'}) : 'N/A';

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-100">Maintenance Overview Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <StatCard title="Vehicles In Maintenance" value={vehiclesInMaintenanceCount} icon={<WrenchIcon className="w-6 h-6" />} accentColor="border-amber-500 text-amber-400" />
        <StatCard title="Total Pending Tasks" value={pendingTasksCount} icon={<ClipboardListIcon className="w-6 h-6" />} accentColor="border-yellow-500 text-yellow-400" />
        <StatCard title="Overdue Tasks" value={overdueTasksCount} icon={<ClipboardListIcon className="w-6 h-6" />} accentColor="border-red-500 text-red-400" />
        <StatCard title="Upcoming (7 Days)" value={upcomingServicesCount} icon={<CalendarDaysIcon className="w-6 h-6" />} accentColor="border-blue-500 text-blue-400" />
        <StatCard title="Cost This Month (Est.)" value={`₹${maintenanceCostThisMonth.toLocaleString()}`} icon={<UserGroupIcon className="w-6 h-6" />} accentColor="border-green-500 text-green-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DonutChart data={maintenanceTasksByStatusData} title="Maintenance Tasks by Status" />
        <BarChart data={maintenanceTasksByTypeData} title="Maintenance Tasks by Type" yAxisLabel="Number of Tasks" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-800 p-5 rounded-xl shadow-xl">
          <h3 className="text-lg font-semibold text-gray-100 mb-3">Vehicles Currently in Maintenance</h3>
          {vehiclesCurrentlyInMaintenance.length > 0 ? (
            <ul className="space-y-2.5 text-xs max-h-60 overflow-y-auto">
              {vehiclesCurrentlyInMaintenance.map(v => (
                <li key={v.id} className="p-2.5 rounded-md bg-gray-750">
                  <p className="text-gray-200 font-medium">{v.make} {v.model} ({v.licensePlate})</p>
                  <p className="text-gray-400 text-[11px] leading-tight">Task: {v.taskTitle}</p>
                  <p className="text-gray-400 text-[11px] leading-tight">Mechanic: {v.mechanicName}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-sm py-8 text-center">No vehicles currently in maintenance.</p>
          )}
        </div>

        <div className="bg-gray-800 p-5 rounded-xl shadow-xl">
          <h3 className="text-lg font-semibold text-gray-100 mb-3">Critical Overdue Tasks</h3>
           {criticalOverdueTasks.length > 0 ? (
            <ul className="space-y-2.5 text-xs max-h-60 overflow-y-auto">
              {criticalOverdueTasks.map(task => (
                <li key={task.id} className="p-2.5 rounded-md bg-red-900 bg-opacity-30 border-l-2 border-red-500">
                  <p className="text-red-200 font-medium">{task.title} ({task.daysOverdue} days overdue)</p>
                  <p className="text-red-300 text-[11px] leading-tight">Vehicle: {task.vehicleInfo}</p>
                  <p className="text-red-400 text-[11px] leading-tight">Scheduled: {formatDate(task.scheduledDate)}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-sm py-8 text-center">No critical overdue tasks.</p>
          )}
        </div>
      </div>
      
      <div className="flex justify-end space-x-4 mt-6">
        <Link to="/maintenance/tasks" className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-colors">
          View All Tasks
        </Link>
        <Link to="/maintenance/mechanics" className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-colors">
          Manage Mechanics
        </Link>
      </div>

    </div>
  );
};

export default MaintenanceDashboardPage;
