


import React, { useState, useMemo, useCallback } from 'react';
// FIX: Added missing imports for TelematicsAlert and AlertType
import { TelematicsAlert, AlertType, Vehicle } from '../types';
import { Link, useLocation } from 'react-router-dom';
import { BellAlertIcon, ArrowDownTrayIcon } from '../constants';
import { exportToCsv } from '../services/reportService';


interface TelematicsAlertsPageProps {
  alerts: TelematicsAlert[];
  vehicles: Vehicle[];
  acknowledgeAlert: (alertId: string) => void;
}

const inputFieldStyle = "bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-500 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm rounded-lg p-2.5";
const labelStyle = "block text-sm font-medium text-gray-300 mb-1";

const TelematicsAlertsPage: React.FC<TelematicsAlertsPageProps> = ({ alerts, vehicles, acknowledgeAlert }) => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialVehicleIdFilter = queryParams.get('vehicleId') || 'ALL';

  const [filterType, setFilterType] = useState<AlertType | 'ALL'>('ALL');
  const [filterAcknowledged, setFilterAcknowledged] = useState<'ALL' | 'ACKNOWLEDGED' | 'PENDING'>('PENDING');
  const [filterVehicleId, setFilterVehicleId] = useState<string>(initialVehicleIdFilter);
  const [searchTerm, setSearchTerm] = useState<string>('');

  const getVehicleName = useCallback((vehicleId?: string | null): string => {
    if (!vehicleId) return 'N/A (System Alert)';
    const vehicle = vehicles.find(v => v.id === vehicleId);
    return vehicle ? `${vehicle.make} ${vehicle.model} (${vehicle.licensePlate})` : 'Unknown Vehicle';
  }, [vehicles]);

  const filteredAlerts = useMemo(() => {
    return alerts.filter(alert =>
      (filterType === 'ALL' || alert.type === filterType) &&
      (filterVehicleId === 'ALL' || alert.vehicleId === filterVehicleId) &&
      (filterAcknowledged === 'ALL' ||
       (filterAcknowledged === 'ACKNOWLEDGED' && alert.isAcknowledged) ||
       (filterAcknowledged === 'PENDING' && !alert.isAcknowledged)) &&
      (searchTerm === '' || 
       alert.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
       (alert.vehicleName && alert.vehicleName.toLowerCase().includes(searchTerm.toLowerCase())) ||
       alert.type.toLowerCase().includes(searchTerm.toLowerCase()))
    ).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [alerts, filterType, filterVehicleId, filterAcknowledged, searchTerm]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
  };
  
  const handleDownloadReport = useCallback(() => {
    const dataToExport = filteredAlerts.map(alert => ({
      timestamp: formatDate(alert.timestamp),
      vehicle: getVehicleName(alert.vehicleId),
      type: alert.type,
      details: alert.details,
      status: alert.isAcknowledged ? 'Acknowledged' : 'Pending',
      location: alert.location ? `${alert.location.lat.toFixed(4)}, ${alert.location.lon.toFixed(4)}` : 'N/A'
    }));

    const headers = [
      { key: 'timestamp', label: 'Timestamp' },
      { key: 'vehicle', label: 'Vehicle' },
      { key: 'type', label: 'Alert Type' },
      { key: 'details', label: 'Details' },
      { key: 'status', label: 'Status' },
      { key: 'location', label: 'Location' },
    ];
    
    exportToCsv(`fleetpro_alerts_report_${new Date().toISOString().split('T')[0]}.csv`, dataToExport, headers);
  }, [filteredAlerts, getVehicleName]);


  const getAlertStyles = (type: AlertType, isAcknowledged: boolean): { card: string; text: string; icon: string; } => {
    if (isAcknowledged) return { 
        card: 'border-gray-700 bg-gray-800 bg-opacity-70', 
        text: 'text-gray-400', 
        icon: 'text-gray-500' 
    };
    switch (type) {
      case AlertType.SPEEDING:
      case AlertType.UNAUTHORIZED_USE:
      case AlertType.DEVICE_OFFLINE:
      case AlertType.COST_EXCEEDED_LIMIT:
      case AlertType.MAINTENANCE_OVERDUE:
        return { 
            card: 'border-red-700 bg-red-900 bg-opacity-40', 
            text: 'text-red-300', 
            icon: 'text-red-400' 
        };
      case AlertType.IDLING:
      case AlertType.HARSH_BRAKING:
      case AlertType.MAINTENANCE_DUE:
      case AlertType.INSURANCE_PERMIT_RENEWAL:
        return { 
            card: 'border-amber-700 bg-amber-900 bg-opacity-40', 
            text: 'text-amber-300', 
            icon: 'text-amber-400' 
        };
      default:
        return { 
            card: 'border-sky-700 bg-sky-900 bg-opacity-40', 
            text: 'text-sky-300', 
            icon: 'text-sky-400'
        };
    }
  };

   const getAlertIconElement = (type: AlertType, iconColorClass: string) => {
    // Customize icons per alert type if desired
    return <BellAlertIcon className={`w-6 h-6 mr-3 ${iconColorClass}`} />;
  };


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h1 className="text-3xl font-bold text-gray-100 flex items-center">
          <BellAlertIcon className="w-8 h-8 mr-3 text-primary-400" />
          Telematics Alerts
        </h1>
        <button onClick={handleDownloadReport} className="bg-gray-700 hover:bg-gray-600 text-gray-200 font-semibold py-2.5 px-5 rounded-lg shadow-md transition-colors duration-150 ease-in-out flex items-center">
            <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
            Download Report
        </button>
      </div>
      <p className="text-sm text-gray-400 -mt-2">Monitor and manage real-time alerts from your fleet devices.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-800 rounded-lg shadow">
        <div>
          <label htmlFor="filterVehicleId" className={labelStyle}>Filter by Vehicle</label>
          <select 
            id="filterVehicleId" 
            value={filterVehicleId} 
            onChange={(e) => setFilterVehicleId(e.target.value)} 
            className={`${inputFieldStyle} mt-1 pr-8`}
            aria-label="Filter alerts by vehicle"
          >
            <option value="ALL">All Vehicles / System</option>
            {vehicles.map(v => <option key={v.id} value={v.id}>{v.make} {v.model} ({v.licensePlate})</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="filterType" className={labelStyle}>Filter by Alert Type</label>
          <select 
            id="filterType" 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value as AlertType | 'ALL')} 
            className={`${inputFieldStyle} mt-1 pr-8`}
            aria-label="Filter alerts by type"
          >
            <option value="ALL">All Types</option>
            {Object.values(AlertType).map(type => <option key={type} value={type}>{type}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="filterAcknowledged" className={labelStyle}>Filter by Status</label>
          <select 
            id="filterAcknowledged" 
            value={filterAcknowledged} 
            onChange={(e) => setFilterAcknowledged(e.target.value as 'ALL' | 'ACKNOWLEDGED' | 'PENDING')} 
            className={`${inputFieldStyle} mt-1 pr-8`}
            aria-label="Filter alerts by acknowledgement status"
          >
            <option value="ALL">All</option>
            <option value="PENDING">Pending</option>
            <option value="ACKNOWLEDGED">Acknowledged</option>
          </select>
        </div>
        <div>
          <label htmlFor="searchTerm" className={labelStyle}>Search Alerts</label>
          <input
            type="text"
            id="searchTerm"
            placeholder="Search details, vehicle..."
            className={`${inputFieldStyle} mt-1`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Search alerts"
          />
        </div>
      </div>
      
      <div className="space-y-4">
        {filteredAlerts.length > 0 ? filteredAlerts.map(alert => {
          const alertStyles = getAlertStyles(alert.type, alert.isAcknowledged);
          return (
            <div key={alert.id} className={`p-4 rounded-lg shadow-md border-l-4 ${alertStyles.card}`} role="alertitem">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className={`text-lg font-semibold ${alertStyles.text} flex items-center`}>
                      {getAlertIconElement(alert.type, alertStyles.icon)}
                      {alert.type}
                  </h3>
                  <p className={`text-sm ${alertStyles.text}`}>{alert.details}</p>
                   <p className="text-xs text-gray-500 mt-1">
                    Vehicle: {alert.vehicleId ? <Link to={`/vehicles?view=${alert.vehicleId}`} className="text-primary-400 hover:underline">{getVehicleName(alert.vehicleId)}</Link> : getVehicleName(alert.vehicleId)}
                  </p>
                  <p className="text-xs text-gray-500">
                    Time: {formatDate(alert.timestamp)}
                    {alert.location && ` | Location: ${alert.location.lat.toFixed(4)}, ${alert.location.lon.toFixed(4)}`}
                  </p>
                  {alert.relatedCostEntryId && (
                      <p className="text-xs text-gray-500">Related Cost: <Link to={`/costs/vehicle-entry?costId=${alert.relatedCostEntryId}`} className="text-primary-400 hover:underline">View Cost</Link></p>
                  )}
                  {alert.relatedMaintenanceTaskId && (
                      <p className="text-xs text-gray-500">Related Maintenance: <Link to={`/maintenance/tasks?taskId=${alert.relatedMaintenanceTaskId}`} className="text-primary-400 hover:underline">View Task</Link></p>
                  )}
                </div>
                {!alert.isAcknowledged && (
                  <button 
                    onClick={() => acknowledgeAlert(alert.id)}
                    className="bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold py-1.5 px-3 rounded-md transition-colors"
                    aria-label={`Acknowledge alert: ${alert.type} for ${getVehicleName(alert.vehicleId)}`}
                  >
                    Acknowledge
                  </button>
                )}
              </div>
               {alert.isAcknowledged && <p className="mt-2 text-xs text-green-400 font-medium">Acknowledged</p>}
            </div>
          );
        }) : (
          <div className="text-center py-10 text-gray-500" role="status" aria-live="polite">
            <BellAlertIcon className="w-16 h-16 mx-auto text-gray-600 mb-4" /> {/* Adjusted icon color */}
            <p className="text-xl">No alerts match your current filters.</p>
            <p>Try adjusting the filters or check back later.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TelematicsAlertsPage;