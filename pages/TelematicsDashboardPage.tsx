


import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
// FIX: Added missing imports for TelematicsAlert and AlertType
import { TelematicsAlert, Vehicle, AlertType } from '../types';
import { BellAlertIcon, ChartPieIcon, ClipboardListIcon } from '../constants'; // Reusing icons

interface TelematicsDashboardPageProps {
  alerts: TelematicsAlert[];
  vehicles: Vehicle[];
}

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; accentColor?: string; subtext?: string; linkTo?: string; }> =
({ title, value, icon, accentColor = 'border-primary-500 text-primary-400', subtext, linkTo }) => {
  const content = (
    <>
      <div className={`shrink-0 p-2.5 bg-gray-700 rounded-lg ${accentColor.split(' ')[0] || 'text-primary-400'}`}>{icon}</div>
      <div>
        <p className="text-xs sm:text-sm text-gray-400">{title}</p>
        <p className="text-xl sm:text-2xl font-semibold text-gray-100">{value}</p>
        {subtext && <p className="text-xs text-gray-500 mt-0.5">{subtext}</p>}
      </div>
    </>
  );
  const cardClasses = `bg-gray-800 p-4 rounded-xl shadow-lg flex items-center space-x-3 border-l-4 ${accentColor.split(' ')[1] || 'border-primary-500'}`;

  if (linkTo) {
    return <Link to={linkTo} className={`${cardClasses} hover:bg-gray-750 transition-colors`}>{content}</Link>;
  }
  return <div className={cardClasses}>{content}</div>;
};

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
  const innerRadius = 0.6;
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

const CRITICAL_ALERT_TYPES: AlertType[] = [
  AlertType.SPEEDING, AlertType.UNAUTHORIZED_USE, AlertType.DEVICE_OFFLINE, 
  AlertType.MAINTENANCE_OVERDUE, AlertType.COST_EXCEEDED_LIMIT
];

const WARNING_ALERT_TYPES: AlertType[] = [
  AlertType.IDLING, AlertType.HARSH_BRAKING, AlertType.GEOFENCE_ENTRY, 
  AlertType.GEOFENCE_EXIT, AlertType.MAINTENANCE_DUE, AlertType.INSURANCE_PERMIT_RENEWAL
];


const TelematicsDashboardPage: React.FC<TelematicsDashboardPageProps> = ({ alerts, vehicles }) => {
  const activeAlerts = useMemo(() => alerts.filter(a => !a.isAcknowledged), [alerts]);

  const totalActiveAlertsCount = activeAlerts.length;

  const criticalAlertsCount = useMemo(() =>
    activeAlerts.filter(a => CRITICAL_ALERT_TYPES.includes(a.type)).length,
  [activeAlerts]);

  const warningAlertsCount = useMemo(() =>
    activeAlerts.filter(a => WARNING_ALERT_TYPES.includes(a.type)).length,
  [activeAlerts]);

  const mostFrequentAlertType = useMemo(() => {
    if (activeAlerts.length === 0) return "N/A";
    const typeCounts = activeAlerts.reduce((acc, alert) => {
      acc[alert.type] = (acc[alert.type] || 0) + 1;
      return acc;
    }, {} as Record<AlertType, number>);
    return Object.entries(typeCounts).sort(([, a], [, b]) => b - a)[0]?.[0] || "N/A";
  }, [activeAlerts]);

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

  const alertsBySeverityChartData = useMemo(() => [
    { label: 'Critical', value: criticalAlertsCount, color: '#F44336' },
    { label: 'Warning', value: warningAlertsCount, color: '#FF9800' },
    // Could add 'Info' if such alerts exist
  ], [criticalAlertsCount, warningAlertsCount]);
  
  const topVehiclesByAlerts = useMemo(() => {
    const vehicleAlertCounts = activeAlerts.reduce((acc, alert) => {
        if(alert.vehicleId) {
            acc[alert.vehicleId] = (acc[alert.vehicleId] || 0) + 1;
        }
        return acc;
    }, {} as Record<string, number>);

    return Object.entries(vehicleAlertCounts)
        .map(([vehicleId, count]) => ({
            vehicleId,
            name: vehicles.find(v => v.id === vehicleId)?.licensePlate || vehicleId.substring(0,6),
            count
        }))
        .sort((a,b) => b.count - a.count)
        .slice(0,5)
        .map((item, index) => ({label: item.name, value: item.count, color: ['#8b5cf6', '#ec4899', '#f97316', '#eab308', '#22c55e'][index % 5]}));

  }, [activeAlerts, vehicles]);

  // Mock data for trend chart
  const mockAlertTrendData: ChartDataItem[] = [
    { label: 'Mon', value: 12, color: '#3b82f6'}, { label: 'Tue', value: 15, color: '#3b82f6'},
    { label: 'Wed', value: 8, color: '#3b82f6'}, { label: 'Thu', value: 18, color: '#3b82f6'},
    { label: 'Fri', value: 10, color: '#3b82f6'}, { label: 'Sat', value: 22, color: '#3b82f6'},
    { label: 'Sun', value: 16, color: '#3b82f6'},
  ];


  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-100">Telematics Alerts Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Active Alerts" value={totalActiveAlertsCount} icon={<BellAlertIcon className="w-6 h-6" />} accentColor="border-sky-500 text-sky-400" linkTo="/alerts" />
        <StatCard title="Critical Alerts" value={criticalAlertsCount} icon={<BellAlertIcon className="w-6 h-6" />} accentColor="border-red-500 text-red-400" />
        <StatCard title="Warning Alerts" value={warningAlertsCount} icon={<BellAlertIcon className="w-6 h-6" />} accentColor="border-amber-500 text-amber-400" />
        <StatCard title="Most Frequent Type" value={mostFrequentAlertType} icon={<ChartPieIcon className="w-6 h-6" />} accentColor="border-purple-500 text-purple-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DonutChart data={alertsByTypeChartData} title="Active Alerts by Type" />
        <div className="bg-gray-800 p-5 rounded-xl shadow-xl h-full flex flex-col">
            <h3 className="text-lg font-semibold text-gray-100 mb-3">Alerts by Severity (Active)</h3>
            {alertsBySeverityChartData.filter(d => d.value > 0).length > 0 ? (
                 <div className="flex-grow flex items-end space-x-4 px-2 border-b border-l border-gray-700 relative" style={{ height: `200px` }}>
                    <div className="absolute -left-7 top-0 bottom-8 flex flex-col justify-between text-xs text-gray-500" style={{height: `170px`}}>
                        <span>{Math.max(...alertsBySeverityChartData.map(d=>d.value),0)}</span>
                        <span>0</span>
                    </div>
                    {alertsBySeverityChartData.map((item) => (
                        <div key={item.label} className="flex-1 flex flex-col items-center group h-full justify-end">
                            <div
                            className="group-hover:opacity-80 transition-opacity"
                            style={{ width: `50%`, height: `${(item.value / Math.max(...alertsBySeverityChartData.map(d=>d.value),1)) * 170}px`, backgroundColor: item.color }}
                            title={`${item.label}: ${item.value}`}
                            />
                            <span className="text-xs text-gray-400 mt-1">{item.label} ({item.value})</span>
                        </div>
                    ))}
                </div>
            ) : <p className="text-gray-500 text-center py-8">No severity data for active alerts.</p>}
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         <div className="bg-gray-800 p-5 rounded-xl shadow-xl h-full flex flex-col">
            <h3 className="text-lg font-semibold text-gray-100 mb-3">Alert Trend (Last 7 Days - Mock)</h3>
             <div className="flex-grow flex items-end space-x-2 px-2 border-b border-l border-gray-700 relative" style={{ height: `200px` }}>
                 <div className="absolute -left-7 top-0 bottom-8 flex flex-col justify-between text-xs text-gray-500" style={{height: `170px`}}>
                    <span>{Math.max(...mockAlertTrendData.map(d=>d.value),0)}</span>
                    <span>0</span>
                </div>
                {mockAlertTrendData.map((item) => (
                    <div key={item.label} className="flex-1 flex flex-col items-center group h-full justify-end">
                        <div
                        className="group-hover:opacity-80 transition-opacity"
                        style={{ width: `50%`, height: `${(item.value / Math.max(...mockAlertTrendData.map(d=>d.value))) * 170}px`, backgroundColor: item.color }}
                        title={`${item.label}: ${item.value}`}
                        />
                        <span className="text-[10px] text-gray-400 mt-1">{item.label}</span>
                    </div>
                ))}
            </div>
        </div>
        <div className="bg-gray-800 p-5 rounded-xl shadow-xl h-full flex flex-col">
            <h3 className="text-lg font-semibold text-gray-100 mb-3">Top 5 Vehicles by Alert Count</h3>
             {topVehiclesByAlerts.length > 0 ? (
                 <div className="flex-grow flex items-end space-x-2 px-2 border-b border-l border-gray-700 relative" style={{ height: `200px` }}>
                    <div className="absolute -left-7 top-0 bottom-8 flex flex-col justify-between text-xs text-gray-500" style={{height: `170px`}}>
                        <span>{Math.max(...topVehiclesByAlerts.map(d=>d.value), 0)}</span>
                        <span>0</span>
                    </div>
                    {topVehiclesByAlerts.map((item) => (
                        <div key={item.label} className="flex-1 flex flex-col items-center group h-full justify-end">
                            <div
                                className="group-hover:opacity-80 transition-opacity"
                                style={{ width: `50%`, height: `${(item.value / Math.max(...topVehiclesByAlerts.map(d=>d.value), 1)) * 170}px`, backgroundColor: item.color }}
                                title={`${item.label}: ${item.value}`}
                            />
                            <span className="text-[10px] text-gray-400 mt-1 truncate max-w-[50px]">{item.label}</span>
                        </div>
                    ))}
                </div>
            ) : <p className="text-gray-500 text-center py-8">No vehicle alert data.</p>}
        </div>
      </div>

      <div className="flex justify-end mt-6">
        <Link to="/alerts" className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-colors">
          View Detailed Alerts Log
        </Link>
      </div>
    </div>
  );
};

export default TelematicsDashboardPage;