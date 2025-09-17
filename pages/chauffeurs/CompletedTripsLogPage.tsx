import React, { useState, useMemo, useCallback } from 'react';
import { Trip, Chauffeur, Vehicle, TripStatus, TripDispatchStatus, Location, TripType, User, TripPurpose } from '../../types';
import { DocumentReportIcon, ArrowDownTrayIcon, MapPinIcon } from '../../constants';
import { exportToCsv } from '../../services/reportService';

interface TripLogPageProps {
  trips: Trip[];
  chauffeurs: Chauffeur[];
  vehicles: Vehicle[];
  users: User[];
}

const inputFieldStyle = "bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-500 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm rounded-lg p-2.5";
const labelStyle = "block text-sm font-medium text-gray-300 mb-1";
type FilterStatus = TripStatus | 'ALL' | 'REJECTED';


const calculateDuration = (start?: string, end?: string): string => {
    if (!start || !end) return 'N/A';
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffMs = endDate.getTime() - startDate.getTime();
    if (diffMs < 0) return 'Invalid';

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.round((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours}h ${minutes}m`;
};

const LocationDisplay: React.FC<{ location?: Location, fallback: string }> = ({ location, fallback }) => {
    if (location) {
        return (
            <a
                href={`https://www.google.com/maps?q=${location.lat},${location.lon}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-primary-400 hover:text-primary-300 hover:underline"
                title={`View on Map`}
            >
                <MapPinIcon className="w-4 h-4 mr-1 shrink-0" />
                {`${location.lat.toFixed(4)}, ${location.lon.toFixed(4)}`}
            </a>
        );
    }
    return <span title={fallback}>{fallback}</span>;
};


const TripLogPage: React.FC<TripLogPageProps> = ({ trips, chauffeurs, vehicles, users }) => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 30);
  
    const [startDate, setStartDate] = useState(thirtyDaysAgo.toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);
    const [selectedChauffeurId, setSelectedChauffeurId] = useState('ALL');
    const [tripTypeFilter, setTripTypeFilter] = useState<TripType | 'ALL'>('ALL');
    const [filterStatus, setFilterStatus] = useState<FilterStatus>('ALL');
    const [userTypeFilter, setUserTypeFilter] = useState<'ALL' | 'EMPLOYEE' | 'GUEST'>('ALL');


    const getChauffeurName = useCallback((id: string | null) => id ? chauffeurs.find(c => c.id === id)?.name || 'Unknown' : 'N/A', [chauffeurs]);
    const getVehiclePlate = useCallback((id: string | null) => id ? vehicles.find(v => v.id === id)?.licensePlate || 'Unknown' : 'N/A', [vehicles]);
    const formatDate = (dateString?: string) => dateString ? new Date(dateString).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) : 'N/A';
    
    const getUserTypeDetails = useCallback((trip: Trip): string => {
        if (trip.tripPurpose === TripPurpose.EMPLOYEE && trip.bookingMadeForEmployeeId) {
            const employee = users.find(u => u.id === trip.bookingMadeForEmployeeId);
            return employee ? `${employee.name} - ${employee.level || 'N/A'}` : 'Unknown Employee';
        }
        if (trip.tripPurpose === TripPurpose.GUEST) {
            return 'Guest';
        }
        if (trip.tripPurpose === TripPurpose.POOL || trip.tripType) {
            return trip.guestName || 'Pool Guest';
        }
        // Fallback for older M-Car trips before tripPurpose was introduced.
        if (trip.chauffeurId && !trip.tripType) { 
            return 'M-Car/General';
        }
        return 'N/A';
    }, [users]);

    const getStatusPillClass = (status: TripStatus | 'REJECTED') => {
        switch (status) {
            case TripStatus.PLANNED: return 'bg-blue-700 bg-opacity-40 text-blue-300';
            case TripStatus.ONGOING: return 'bg-yellow-700 bg-opacity-40 text-yellow-300';
            case TripStatus.COMPLETED: return 'bg-green-700 bg-opacity-40 text-green-300';
            case TripStatus.CANCELLED: return 'bg-red-700 bg-opacity-40 text-red-300';
            case 'REJECTED': return 'bg-red-700 bg-opacity-40 text-red-300';
            case TripStatus.DELAYED: return 'bg-orange-700 bg-opacity-40 text-orange-300';
            default: return 'bg-gray-700 text-gray-300';
        }
    };

    const filteredTrips = useMemo(() => {
        return trips.filter(trip => {
            const isTerminal = trip.status === TripStatus.COMPLETED || trip.status === TripStatus.CANCELLED || trip.dispatchStatus === TripDispatchStatus.REJECTED;
            if(!isTerminal) return false;
            
            const tripDateToFilter = (trip.status === TripStatus.COMPLETED && trip.actualEndDate) 
                ? new Date(trip.actualEndDate) 
                : new Date(trip.scheduledStartDate);
            
            const startFilterDate = new Date(startDate);
            startFilterDate.setHours(0,0,0,0);
            const endFilterDate = new Date(endDate);
            endFilterDate.setHours(23,59,59,999);
            
            if (tripDateToFilter < startFilterDate || tripDateToFilter > endFilterDate) return false;
            if (selectedChauffeurId !== 'ALL' && trip.chauffeurId !== selectedChauffeurId) return false;
            
            if (filterStatus !== 'ALL') {
                if (filterStatus === 'REJECTED') {
                    if (trip.dispatchStatus !== TripDispatchStatus.REJECTED) return false;
                } else if (trip.status !== filterStatus) {
                    return false;
                }
            }
            
            if (tripTypeFilter !== 'ALL') {
                if (!trip.tripType || trip.tripType !== tripTypeFilter) return false;
            }

            if (userTypeFilter !== 'ALL') {
                if (userTypeFilter === 'EMPLOYEE') {
                    if (trip.tripPurpose !== TripPurpose.EMPLOYEE) return false;
                } else if (userTypeFilter === 'GUEST') {
                    if (trip.tripPurpose !== TripPurpose.GUEST && trip.tripPurpose !== TripPurpose.POOL) return false;
                }
            }

            return true;
        }).sort((a,b) => {
             const dateA = (a.status === TripStatus.COMPLETED && a.actualEndDate) ? new Date(a.actualEndDate) : new Date(a.scheduledStartDate);
             const dateB = (b.status === TripStatus.COMPLETED && b.actualEndDate) ? new Date(b.actualEndDate) : new Date(b.scheduledStartDate);
             return dateB.getTime() - dateA.getTime();
        });
    }, [trips, startDate, endDate, selectedChauffeurId, tripTypeFilter, filterStatus, userTypeFilter]);

    const handleDownloadReport = useCallback(() => {
        const dataToExport = filteredTrips.map(trip => ({
            chauffeur: getChauffeurName(trip.chauffeurId),
            startDate: formatDate(trip.actualStartDate || trip.scheduledStartDate),
            endDate: formatDate(trip.actualEndDate),
            duration: calculateDuration(trip.actualStartDate, trip.actualEndDate),
            pickup: trip.actualStartLocation ? `${trip.actualStartLocation.lat}, ${trip.actualStartLocation.lon}` : trip.origin,
            dropoff: trip.actualEndLocation ? `${trip.actualEndLocation.lat}, ${trip.actualEndLocation.lon}` : trip.destination,
            tripType: trip.tripType === TripType.OTHER ? trip.otherTripTypeDetail : trip.tripType || 'M-Car',
            userType: getUserTypeDetails(trip),
            status: trip.dispatchStatus === TripDispatchStatus.REJECTED ? 'Rejected' : trip.status,
        }));
        
        const headers = [
            { key: 'chauffeur', label: 'Chauffeur' },
            { key: 'startDate', label: 'Start Date & Time' },
            { key: 'endDate', label: 'End Date & Time' },
            { key: 'duration', label: 'Total Trip Hours' },
            { key: 'pickup', label: 'Pick up Location' },
            { key: 'dropoff', label: 'Drop Location' },
            { key: 'tripType', label: 'Trip Type' },
            { key: 'userType', label: 'User Type' },
            { key: 'status', label: 'Status' },
        ];

        exportToCsv(`trip_log_${startDate}_to_${endDate}.csv`, dataToExport, headers);
    }, [filteredTrips, getChauffeurName, formatDate, startDate, endDate, getUserTypeDetails]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h1 className="text-3xl font-bold text-gray-100 flex items-center">
            <DocumentReportIcon className="w-8 h-8 mr-3 text-primary-400" /> Trip Log
        </h1>
        <button onClick={handleDownloadReport} className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2.5 px-5 rounded-lg shadow-md transition-colors duration-150 ease-in-out flex items-center">
            <ArrowDownTrayIcon className="w-5 h-5 mr-2" /> Download Report
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 p-4 bg-gray-800 rounded-lg shadow">
        <div>
            <label htmlFor="startDate" className={labelStyle}>Start Date</label>
            <input type="date" id="startDate" value={startDate} onChange={e => setStartDate(e.target.value)} className={`${inputFieldStyle} mt-1 dark:[color-scheme:dark]`} />
        </div>
        <div>
            <label htmlFor="endDate" className={labelStyle}>End Date</label>
            <input type="date" id="endDate" value={endDate} onChange={e => setEndDate(e.target.value)} className={`${inputFieldStyle} mt-1 dark:[color-scheme:dark]`} />
        </div>
        <div>
            <label htmlFor="selectedChauffeurId" className={labelStyle}>Chauffeur</label>
            <select id="selectedChauffeurId" value={selectedChauffeurId} onChange={e => setSelectedChauffeurId(e.target.value)} className={`${inputFieldStyle} mt-1 pr-8`}>
                <option value="ALL">All Chauffeurs</option>
                {chauffeurs.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
        </div>
        <div>
            <label htmlFor="filterStatus" className={labelStyle}>Status</label>
            <select id="filterStatus" value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)} className={`${inputFieldStyle} mt-1 pr-8`}>
                <option value="ALL">All Statuses</option>
                <option value={TripStatus.COMPLETED}>Completed</option>
                <option value={TripStatus.CANCELLED}>Cancelled</option>
                <option value="REJECTED">Rejected</option>
            </select>
        </div>
        <div>
            <label htmlFor="tripTypeFilter" className={labelStyle}>Trip Type</label>
            <select id="tripTypeFilter" value={tripTypeFilter} onChange={e => setTripTypeFilter(e.target.value as any)} className={`${inputFieldStyle} mt-1 pr-8`}>
                <option value="ALL">All Types</option>
                {Object.values(TripType).map(type => <option key={type} value={type}>{type}</option>)}
            </select>
        </div>
        <div>
            <label htmlFor="userTypeFilter" className={labelStyle}>User Type</label>
            <select id="userTypeFilter" value={userTypeFilter} onChange={e => setUserTypeFilter(e.target.value as any)} className={`${inputFieldStyle} mt-1 pr-8`}>
                <option value="ALL">All User Types</option>
                <option value="EMPLOYEE">Employee</option>
                <option value="GUEST">Guest</option>
            </select>
        </div>
      </div>

      <div className="bg-gray-800 shadow-xl rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-700 text-sm">
            <thead className="bg-gray-750">
                <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-400 uppercase">Chauffeur</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-400 uppercase">Start Date & Time</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-400 uppercase">End Date & Time</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-400 uppercase">Total Trip Hours</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-400 uppercase">Pick up Location</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-400 uppercase">Drop Location</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-400 uppercase">Trip Type</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-400 uppercase">User Type</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-400 uppercase">Status</th>
                </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
                {filteredTrips.map(trip => {
                    const displayStatus = trip.dispatchStatus === TripDispatchStatus.REJECTED ? 'REJECTED' : trip.status;
                    const displayStatusLabel = trip.dispatchStatus === TripDispatchStatus.REJECTED ? 'Rejected' : trip.status;
                    
                    return (
                        <tr key={trip.id} className="hover:bg-gray-750">
                            <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-100">{getChauffeurName(trip.chauffeurId)}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-gray-300">{formatDate(trip.actualStartDate || trip.scheduledStartDate)}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-gray-300">{formatDate(trip.actualEndDate)}</td>
                            <td className="px-4 py-3 whitespace-nowrap font-semibold text-gray-200">{calculateDuration(trip.actualStartDate, trip.actualEndDate)}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-gray-300">
                               <LocationDisplay location={trip.actualStartLocation} fallback={trip.origin} />
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-gray-300">
                               <LocationDisplay location={trip.actualEndLocation} fallback={trip.destination} />
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-gray-300">
                                {trip.tripType === TripType.OTHER ? trip.otherTripTypeDetail : trip.tripType || 'M-Car'}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-gray-300">
                                {getUserTypeDetails(trip)}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusPillClass(displayStatus)}`}>
                                    {displayStatusLabel}
                                </span>
                            </td>
                        </tr>
                    );
                })}
                {filteredTrips.length === 0 && (
                    <tr>
                        <td colSpan={9} className="text-center py-10 text-gray-500">
                            No trips found for the selected filters.
                        </td>
                    </tr>
                )}
            </tbody>
        </table>
      </div>
    </div>
  );
};

export default TripLogPage;