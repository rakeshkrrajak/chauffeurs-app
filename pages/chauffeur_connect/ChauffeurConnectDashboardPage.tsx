import React, { useMemo, useCallback } from 'react';
import { Chauffeur, Vehicle, Trip, ChauffeurAttendance, TripStatus, AttendanceStatus, TripDispatchStatus, ChauffeurDutyStatus, Location } from '../../types';
import { MapPinIcon, UserGroupIcon } from '../../constants';

// Re-using a similar StatCard component for consistency
const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; accentColor: string; }> = ({ title, value, icon, accentColor }) => (
  <div className={`bg-gray-800 p-4 rounded-lg shadow-lg flex items-center space-x-3 border-l-4 ${accentColor}`}>
    {icon}
    <div>
      <p className="text-sm text-gray-400">{title}</p>
      <p className="text-2xl font-bold text-gray-100">{value}</p>
    </div>
  </div>
);


interface ChauffeurConnectDashboardPageProps {
  chauffeurs: Chauffeur[];
  vehicles: Vehicle[];
  trips: Trip[];
  attendance: ChauffeurAttendance[];
  updateTrip: (trip: Trip) => void;
}

const ChauffeurConnectDashboardPage: React.FC<ChauffeurConnectDashboardPageProps> = ({ chauffeurs, vehicles, trips, attendance, updateTrip }) => {
  
  const calculateWorkHours = useCallback((checkIn?: string, checkOut?: string): { total: string; overtime: string } => {
    if (!checkIn) return { total: '—', overtime: '—' };
    const startTime = new Date(checkIn);
    const endTime = checkOut ? new Date(checkOut) : new Date(); // Use current time if not checked out
    
    const durationMillis = endTime.getTime() - startTime.getTime();
    if (durationMillis <= 0) return { total: '0h 0m', overtime: '—' };

    const durationHoursDecimal = durationMillis / (1000 * 60 * 60);
    const totalH = Math.floor(durationHoursDecimal);
    const totalM = Math.round((durationHoursDecimal - totalH) * 60);
    
    // Only calculate overtime if checked out
    let overtimeFormatted = '—';
    if (checkOut) {
        const overtimeHoursDecimal = durationHoursDecimal - 9; // Assuming 9-hour shift
        if (overtimeHoursDecimal > 0.01) {
            const otH = Math.floor(overtimeHoursDecimal);
            const otM = Math.round((overtimeHoursDecimal - otH) * 60);
            overtimeFormatted = `${otH}h ${otM}m`;
        }
    }
    
    return { total: `${totalH}h ${totalM}m`, overtime: overtimeFormatted };
  }, []);
  
  const formatTime = (isoString?: string) => {
    if (!isoString) return '—';
    return new Date(isoString).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  }

  const liveChauffeurData = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const todaysAttendance = attendance.filter(a => a.date === todayStr);

    return chauffeurs.map(chauffeur => {
        const attendanceRecord = todaysAttendance.find(a => a.chauffeurId === chauffeur.id);
        
        const chauffeurTrips = trips.filter(t => 
            (t.chauffeurId === chauffeur.id || t.offeredToChauffeurId === chauffeur.id) &&
            t.status !== TripStatus.CANCELLED && t.status !== TripStatus.COMPLETED
        );

        const activeTrip = chauffeurTrips.find(t => t.status === TripStatus.ONGOING);
        const awaitingAcceptanceTrip = chauffeurTrips.find(t => t.dispatchStatus === TripDispatchStatus.AWAITING_ACCEPTANCE);
        
        // FIX: Find the next upcoming trip that is PLANNED, regardless of how it was assigned (M-Car or accepted Pool trip).
        const actionableTrip = chauffeurTrips
            .filter(t =>
                !activeTrip && // Not already on an active trip
                t.status === TripStatus.PLANNED // The trip must be planned
            )
            .sort((a, b) => new Date(a.scheduledStartDate).getTime() - new Date(b.scheduledStartDate).getTime())[0];

        let displayStatus: string = ChauffeurDutyStatus.OFF_DUTY;
        let currentTripDisplay = '—';
        let upcomingTripDisplay = '—';
        let tripForActionButton = activeTrip || actionableTrip || null; // The trip to show buttons for

        if (attendanceRecord) {
            if (attendanceRecord.status === AttendanceStatus.ON_LEAVE) {
                displayStatus = 'On Leave';
            } else if (attendanceRecord.status === AttendanceStatus.PRESENT || attendanceRecord.status === AttendanceStatus.HALF_DAY) {
                if (activeTrip) {
                    displayStatus = ChauffeurDutyStatus.ON_TRIP;
                    currentTripDisplay = `${activeTrip.tripName} (${activeTrip.origin} → ${activeTrip.destination})`;
                } else if (awaitingAcceptanceTrip) {
                    displayStatus = ChauffeurDutyStatus.AWAITING_ACCEPTANCE;
                    currentTripDisplay = `Awaiting response for: ${awaitingAcceptanceTrip.tripName}`;
                } else if (actionableTrip) {
                    displayStatus = 'Ready for Trip'; // New, clearer status
                    upcomingTripDisplay = `${actionableTrip.tripName} @ ${formatTime(actionableTrip.scheduledStartDate)}`;
                } else {
                    displayStatus = ChauffeurDutyStatus.AVAILABLE;
                }
            }
        } else {
            if (actionableTrip) {
                displayStatus = 'Off Duty (Upcoming Trip)';
                upcomingTripDisplay = `${actionableTrip.tripName} @ ${formatTime(actionableTrip.scheduledStartDate)}`;
            }
        }

        const { total, overtime } = calculateWorkHours(attendanceRecord?.checkInTimestamp, attendanceRecord?.checkOutTimestamp);
        const permanentVehicle = vehicles.find(v => v.id === chauffeur.assignedVehicleId);
        const tripVehicle = tripForActionButton?.vehicleId ? vehicles.find(v => v.id === tripForActionButton.vehicleId) : null;

        let vehicleInfo = 'N/A';
        if (tripVehicle) {
            vehicleInfo = `${tripVehicle.make} ${tripVehicle.model} (${tripVehicle.licensePlate})`;
        } else if (permanentVehicle) {
            vehicleInfo = `${permanentVehicle.make} ${permanentVehicle.model} (${permanentVehicle.licensePlate})`;
        }

        return {
            ...chauffeur,
            displayStatus,
            checkInTime: attendanceRecord?.checkInTimestamp,
            checkOutTime: attendanceRecord?.checkOutTimestamp,
            totalDutyHours: total,
            overtimeHours: overtime,
            currentTrip: currentTripDisplay,
            upcomingTripDisplay: upcomingTripDisplay,
            actionableTrip: tripForActionButton,
            vehicleInfo,
        };
    });
  }, [chauffeurs, vehicles, trips, attendance, calculateWorkHours, formatTime]);
  
  const dashboardStats = useMemo(() => {
    return {
      onDuty: liveChauffeurData.filter(c => ['Available', 'On Trip', 'Awaiting Acceptance', 'Ready for Trip'].includes(c.displayStatus)).length,
      available: liveChauffeurData.filter(c => c.displayStatus === 'Available' || c.displayStatus === 'Ready for Trip').length,
      onTrip: liveChauffeurData.filter(c => c.displayStatus === 'On Trip').length,
      offDuty: liveChauffeurData.filter(c => c.displayStatus === 'Off Duty' || c.displayStatus === 'On Leave' || c.displayStatus === 'Off Duty (Upcoming Trip)').length,
    }
  }, [liveChauffeurData]);

  const handleStartTrip = (trip: Trip) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location: Location = {
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        };
        updateTrip({
          ...trip,
          status: TripStatus.ONGOING,
          actualStartDate: new Date().toISOString(),
          actualStartLocation: location,
        });
      },
      () => {
        alert('Could not retrieve location. Starting trip without location data.');
        updateTrip({
          ...trip,
          status: TripStatus.ONGOING,
          actualStartDate: new Date().toISOString(),
        });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleCompleteTrip = (trip: Trip) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location: Location = {
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        };
        updateTrip({
          ...trip,
          status: TripStatus.COMPLETED,
          actualEndDate: new Date().toISOString(),
          actualEndLocation: location,
        });
      },
      () => {
        alert('Could not retrieve location. Completing trip without location data.');
        updateTrip({
          ...trip,
          status: TripStatus.COMPLETED,
          actualEndDate: new Date().toISOString(),
        });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const getStatusPillClass = (status: string) => {
    switch (status) {
      case ChauffeurDutyStatus.ON_TRIP: return 'bg-purple-700 bg-opacity-40 text-purple-300';
      case ChauffeurDutyStatus.AWAITING_ACCEPTANCE: return 'bg-yellow-700 bg-opacity-40 text-yellow-300 animate-pulse';
      case ChauffeurDutyStatus.AVAILABLE: return 'bg-green-700 bg-opacity-40 text-green-300';
      case 'Ready for Trip': return 'bg-teal-700 bg-opacity-40 text-teal-300';
      case 'On Leave': return 'bg-blue-700 bg-opacity-40 text-blue-300';
      case 'Off Duty (Upcoming Trip)': return 'bg-gray-600 bg-opacity-60 text-sky-300';
      case ChauffeurDutyStatus.OFF_DUTY:
      default:
        return 'bg-gray-600 bg-opacity-40 text-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-100 flex items-center">
        <MapPinIcon className="w-8 h-8 mr-3 text-primary-400" />
        Chauffeur Live Status
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="On Duty" value={dashboardStats.onDuty} icon={<UserGroupIcon className="w-7 h-7 text-green-400" />} accentColor="border-green-500" />
        <StatCard title="Available" value={dashboardStats.available} icon={<UserGroupIcon className="w-7 h-7 text-sky-400" />} accentColor="border-sky-500" />
        <StatCard title="On Trip" value={dashboardStats.onTrip} icon={<UserGroupIcon className="w-7 h-7 text-purple-400" />} accentColor="border-purple-500" />
        <StatCard title="Off Duty / On Leave" value={dashboardStats.offDuty} icon={<UserGroupIcon className="w-7 h-7 text-gray-500" />} accentColor="border-gray-600" />
      </div>

      <div className="bg-gray-800 shadow-xl rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-750">
                <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Chauffeur</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Current Activity</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Next Trip</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Assigned Vehicle</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Duty Hours</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Actions</th>
                </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
                {liveChauffeurData.map(chauffeur => (
                    <tr key={chauffeur.id} className="hover:bg-gray-750 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center">
                                <img className="h-10 w-10 rounded-full object-cover" src={chauffeur.imageUrl} alt={chauffeur.name} />
                                <div className="ml-3">
                                    <div className="text-sm font-medium text-gray-100">{chauffeur.name}</div>
                                    <div className="text-xs text-gray-400">{chauffeur.contact}</div>
                                </div>
                            </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusPillClass(chauffeur.displayStatus)}`}>
                                {chauffeur.displayStatus}
                            </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300 truncate max-w-xs" title={chauffeur.currentTrip}>
                            {chauffeur.currentTrip}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300 truncate max-w-xs" title={chauffeur.upcomingTripDisplay}>
                            {chauffeur.upcomingTripDisplay}
                        </td>
                         <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">{chauffeur.vehicleInfo}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
                           {chauffeur.checkInTime ? (
                                <>
                                    <span>{formatTime(chauffeur.checkInTime)} - {formatTime(chauffeur.checkOutTime)}</span>
                                    <span className="block text-xs text-gray-400">Total: {chauffeur.totalDutyHours}</span>
                                </>
                           ) : '—'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          {chauffeur.actionableTrip && chauffeur.actionableTrip.status === TripStatus.PLANNED && (
                            <button onClick={() => handleStartTrip(chauffeur.actionableTrip!)} className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-1 px-3 rounded">
                              Start Trip
                            </button>
                          )}
                          {chauffeur.actionableTrip && chauffeur.actionableTrip.status === TripStatus.ONGOING && (
                             <button onClick={() => handleCompleteTrip(chauffeur.actionableTrip!)} className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-1 px-3 rounded">
                              Complete Trip
                            </button>
                          )}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>

    </div>
  );
};

export default ChauffeurConnectDashboardPage;