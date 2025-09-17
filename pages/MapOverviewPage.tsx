


import React from 'react';
// FIX: Added missing imports for TelematicsAlert and AlertType
import { Vehicle, TelematicsAlert, AlertType } from '../types';
import { MapPinIcon, BANGALORE_CENTER_LAT, BANGALORE_CENTER_LON, BANGALORE_MAP_COORD_VARIATION_LAT, BANGALORE_MAP_COORD_VARIATION_LON } from '../constants';

interface MapOverviewPageProps {
  vehicles: Vehicle[];
  alerts: TelematicsAlert[];
}

const MapOverviewPage: React.FC<MapOverviewPageProps> = ({ vehicles, alerts }) => {
  const getHash = (inputString: string): number => {
    let hash = 0;
    for (let i = 0; i < inputString.length; i++) {
        const char = inputString.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0; 
    }
    return hash;
  };


  const getMockPosition = (vehicle: Vehicle, index: number) => {
    if (vehicle.lastKnownLocation && 
        vehicle.lastKnownLocation.lat >= BANGALORE_CENTER_LAT - BANGALORE_MAP_COORD_VARIATION_LAT &&
        vehicle.lastKnownLocation.lat <= BANGALORE_CENTER_LAT + BANGALORE_MAP_COORD_VARIATION_LAT &&
        vehicle.lastKnownLocation.lon >= BANGALORE_CENTER_LON - BANGALORE_MAP_COORD_VARIATION_LON &&
        vehicle.lastKnownLocation.lon <= BANGALORE_CENTER_LON + BANGALORE_MAP_COORD_VARIATION_LON) {
        
        const topPercent = 50 + ((vehicle.lastKnownLocation.lat - BANGALORE_CENTER_LAT) / (BANGALORE_MAP_COORD_VARIATION_LAT * 2)) * 100;
        const leftPercent = 50 + ((vehicle.lastKnownLocation.lon - BANGALORE_CENTER_LON) / (BANGALORE_MAP_COORD_VARIATION_LON * 2)) * 100;

        return { 
            top: `${Math.max(5, Math.min(95, topPercent))}%`, 
            left: `${Math.max(5, Math.min(95, leftPercent))}%` 
        };
    }

    const hash = getHash(vehicle.id + index);
    const top = 10 + (Math.abs(hash) % 70); 
    const left = 5 + (Math.abs(hash >> 8) % 80); 
    return { top: `${top}%`, left: `${left}%` };
  };


  const getVehicleAlertStatus = (vehicleId: string): 'critical' | 'warning' | null => {
    const unacknowledgedAlerts = alerts.filter(a => a.vehicleId === vehicleId && !a.isAcknowledged);
    if (unacknowledgedAlerts.length === 0) return null;
    if (unacknowledgedAlerts.some(a => [AlertType.SPEEDING, AlertType.UNAUTHORIZED_USE, AlertType.DEVICE_OFFLINE, AlertType.COST_EXCEEDED_LIMIT].includes(a.type))) {
      return 'critical';
    }
    if (unacknowledgedAlerts.some(a => [AlertType.IDLING, AlertType.HARSH_BRAKING, AlertType.MAINTENANCE_DUE, AlertType.MAINTENANCE_OVERDUE].includes(a.type))) {
      return 'warning';
    }
    return null;
  };

  const CompassIcon = () => (
      <svg className="w-12 h-12 text-gray-500" fill="none" viewBox="0 0 50 50" stroke="currentColor">
        <circle cx="25" cy="25" r="22" strokeWidth="1.5" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M25 5L22 12M25 5L28 12M25 5L25 15" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M25 45L22 38M25 45L28 38M25 45L25 35" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M5 25L12 22M5 25L12 28M5 25L15 25" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M45 25L38 22M45 25L38 28M45 25L35 25" />
        <circle cx="25" cy="25" r="3" strokeWidth="1.5" />
        <text x="25" y="4" textAnchor="middle" fontSize="5" className="fill-gray-500 font-sans">N</text>
      </svg>
    );

  const mapBackgroundStyle = {
      backgroundColor: '#1f2937', // gray-800
      backgroundImage: `
        linear-gradient(rgba(107, 114, 128, 0.1) 1px, transparent 1px),
        linear-gradient(90deg, rgba(107, 114, 128, 0.1) 1px, transparent 1px)
      `,
      backgroundSize: '25px 25px',
    };


  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-100">Vehicle Map Overview</h1>
      <p className="text-gray-400">
        Simulated real-time vehicle locations and basic telematics data. Click pins for details.
      </p>
      
      <div className="bg-gray-800 p-6 rounded-xl shadow-xl">
        <h2 className="text-xl font-semibold text-gray-100 mb-4">Live Vehicle Map</h2>
        <div 
          className="relative w-full h-[500px] bg-gray-700 rounded-lg overflow-hidden border-2 border-gray-600"
          style={mapBackgroundStyle}
        >
          <div className="absolute top-4 right-4 opacity-50">
            <CompassIcon />
          </div>

          <div className="absolute bottom-4 right-4 flex flex-col space-y-1">
            <button className="w-8 h-8 bg-gray-800 text-gray-300 text-lg font-bold rounded-md opacity-70 hover:opacity-100 transition-opacity" aria-label="Zoom in">+</button>
            <button className="w-8 h-8 bg-gray-800 text-gray-300 text-lg font-bold rounded-md opacity-70 hover:opacity-100 transition-opacity" aria-label="Zoom out">-</button>
          </div>

          {vehicles.map((vehicle, index) => {
            const position = getMockPosition(vehicle, index);
            const alertStatus = getVehicleAlertStatus(vehicle.id);
            let pinColor = "text-primary-400 group-hover:text-primary-300";
            if (alertStatus === 'critical') pinColor = "text-red-400 group-hover:text-red-300 animate-pulse";
            else if (alertStatus === 'warning') pinColor = "text-amber-400 group-hover:text-amber-300";

            return (
              <div
                key={vehicle.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
                style={{ 
                    top: position.top, 
                    left: position.left,
                    transition: 'top 1s ease-in-out, left 1s ease-in-out' 
                }}
                title={`${vehicle.make} ${vehicle.model} (${vehicle.licensePlate})`}
              >
                <MapPinIcon className={`w-8 h-8 ${pinColor} transition-colors`} />
                <div className="absolute bottom-full mb-2 w-max p-2 text-xs bg-gray-900 text-gray-200 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                  {vehicle.make} {vehicle.model} ({vehicle.licensePlate})<br/>
                  Status: {vehicle.status}<br/>
                  Speed: {vehicle.currentSpeedKmph !== undefined ? `${vehicle.currentSpeedKmph} km/h` : 'N/A'}<br/>
                  Ignition: {vehicle.isIgnitionOn ? 'On' : 'Off'}<br/>
                  AIS 140: {vehicle.isAIS140Compliant ? 'Yes' : 'No'}<br/>
                  {vehicle.lastKnownLocation && vehicle.lastKnownLocation.timestamp && `Last Seen: ${new Date(vehicle.lastKnownLocation.timestamp).toLocaleTimeString()}`}<br/>
                  {alertStatus && <span className={`font-bold ${alertStatus === 'critical' ? 'text-red-300' : 'text-amber-300'}`}>Active {alertStatus} alert!</span>}
                </div>
              </div>
            );
          })}
           {vehicles.length === 0 && (
            <div className="absolute inset-0 flex justify-center items-center">
              <p className="text-gray-500 text-lg">No vehicles to display on the map.</p>
            </div>
          )}
        </div>
         <div className="mt-4 text-xs text-gray-500">
            Map pins update periodically to simulate movement. Colors indicate alert status: Red (Critical), Amber (Warning). Background is a stylized representation. Pin positions are simulated based on last known location if available and within mock Bangalore bounds, otherwise pseudo-randomly within map.
        </div>
      </div>
      
      {vehicles.length > 0 && (
        <div className="bg-gray-800 p-6 rounded-xl shadow-xl mt-6">
            <h3 className="text-lg font-semibold text-gray-100 mb-3">Vehicle List for Map</h3>
            <ul className="divide-y divide-gray-700 max-h-96 overflow-y-auto">
                {vehicles.map(vehicle => (
                    <li key={vehicle.id} className="py-3 flex items-center space-x-3">
                        <MapPinIcon className="w-5 h-5 text-primary-400 shrink-0" />
                        <div>
                            <p className="font-medium text-gray-200">{vehicle.make} {vehicle.model} - {vehicle.licensePlate}</p>
                            <p className="text-sm text-gray-400">
                                Speed: {vehicle.currentSpeedKmph !== undefined ? `${vehicle.currentSpeedKmph} km/h` : 'N/A'}, Ign: {vehicle.isIgnitionOn ? 'On' : 'Off'}
                            </p>
                        </div>
                         {getVehicleAlertStatus(vehicle.id) && (
                            <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-semibold
                                ${getVehicleAlertStatus(vehicle.id) === 'critical' ? 'bg-red-700 bg-opacity-40 text-red-300' : 'bg-amber-700 bg-opacity-40 text-amber-300'}`}>
                                Alert!
                            </span>
                        )}
                    </li>
                ))}
            </ul>
        </div>
      )}

    </div>
  );
};

export default MapOverviewPage;