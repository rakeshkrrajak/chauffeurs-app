import React, { useState, useMemo, useCallback } from 'react';
import { DocumentReportIcon, ArrowDownTrayIcon } from '../../constants';
import { Trip, Chauffeur, Vehicle, User, TripStatus, TripPurpose } from '../../types';
import { exportToCsv } from '../../services/reportService';

// Styles from other pages
const inputFieldStyle = "bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-500 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm rounded-lg p-2.5";
const labelStyle = "block text-sm font-medium text-gray-300 mb-1";

interface TripLogPageProps {
  trips: Trip[];
  chauffeurs: Chauffeur[];
  vehicles: Vehicle[];
  users: User[];
}

const TripLogPage: React.FC<TripLogPageProps> = ({ trips, chauffeurs, vehicles, users }) => {
    const today = new Date();
    const oneMonthAgo = new Date(today);
    oneMonthAgo.setMonth(today.getMonth() - 1);

    const [startDate, setStartDate] = useState(oneMonthAgo.toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);
    const [filterChauffeur, setFilterChauffeur] = useState('ALL');
    const [searchTerm, setSearchTerm] = useState('');

    const getChauffeurName = useCallback((chauffeurId: string | null) => {
        if (!chauffeurId) return 'N/A';
        return chauffeurs.find(c => c.id === chauffeurId)?.name || 'Unknown';
    }, [chauffeurs]);
    
    const getVehiclePlate = useCallback((vehicleId: string | null) => {
        if (!vehicleId) return 'N/A';
        return vehicles.find(v => v.id === vehicleId)?.licensePlate || 'Unknown';
    }, [vehicles]);

    const getTripFor = useCallback((trip: Trip): string => {
        if (trip.tripPurpose === TripPurpose.EMPLOYEE && trip.bookingMadeForEmployeeId) {
            return users.find(u => u.id === trip.bookingMadeForEmployeeId)?.name || 'Unknown Employee';
        }
        if (trip.tripPurpose === TripPurpose.GUEST && trip.guestName) {
            return `Guest: ${trip.guestName}`;
        }
        if (trip.tripPurpose === TripPurpose.POOL) {
            return `Pool Trip (${trip.guestName || 'N/A'})`;
        }
        return 'N/A';
    }, [users]);
    
    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    const calculateDuration = (start?: string, end?: string) => {
        if (!start || !end) return 'N/A';
        const diff = new Date(end).getTime() - new Date(start).getTime();
        if (diff <= 0) return 'N/A';
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.round((diff % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}m`;
    };

    const filteredLogs = useMemo(() => {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        return trips.filter(trip => {
            if (trip.status !== TripStatus.COMPLETED || !trip.actualEndDate) {
                return false;
            }
            const tripDate = new Date(trip.actualEndDate);
            const matchesDate = tripDate >= start && tripDate <= end;
            const matchesChauffeur = filterChauffeur === 'ALL' || trip.chauffeurId === filterChauffeur;
            const searchTermLower = searchTerm.toLowerCase();
            const matchesSearch = searchTerm === '' ||
                trip.tripName.toLowerCase().includes(searchTermLower) ||
                (trip.notes && trip.notes.toLowerCase().includes(searchTermLower)) ||
                getChauffeurName(trip.chauffeurId).toLowerCase().includes(searchTermLower) ||
                getVehiclePlate(trip.vehicleId).toLowerCase().includes(searchTermLower);

            return matchesDate && matchesChauffeur && matchesSearch;
        }).sort((a, b) => new Date(b.actualEndDate!).getTime() - new Date(a.actualEndDate!).getTime());

    }, [trips, startDate, endDate, filterChauffeur, searchTerm, getChauffeurName, getVehiclePlate]);

    const handleDownloadReport = useCallback(() => {
        const dataToExport = filteredLogs.map(trip => ({
            tripName: trip.tripName,
            chauffeur: getChauffeurName(trip.chauffeurId),
            vehicle: getVehiclePlate(trip.vehicleId),
            tripFor: getTripFor(trip),
            startDate: formatDate(trip.actualStartDate),
            endDate: formatDate(trip.actualEndDate),
            duration: calculateDuration(trip.actualStartDate, trip.actualEndDate),
            origin: trip.origin,
            destination: trip.destination,
            notes: trip.notes || '',
        }));

        const headers = [
            { key: 'tripName', label: 'Trip Name' },
            { key: 'chauffeur', label: 'Chauffeur' },
            { key: 'vehicle', label: 'Vehicle' },
            { key: 'tripFor', label: 'Trip For' },
            { key: 'startDate', label: 'Start Time' },
            { key: 'endDate', label: 'End Time' },
            { key: 'duration', label: 'Duration' },
            { key: 'origin', label: 'Origin' },
            { key: 'destination', label: 'Destination' },
            { key: 'notes', label: 'Notes from Chauffeur' },
        ];
        
        exportToCsv(`trip_log_report_${startDate}_to_${endDate}.csv`, dataToExport, headers);
    }, [filteredLogs, startDate, endDate, getChauffeurName, getVehiclePlate, getTripFor, formatDate]);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-4">
                <h1 className="text-3xl font-bold text-gray-100 flex items-center">
                    <DocumentReportIcon className="w-8 h-8 mr-3 text-primary-400" />
                    Completed Trip Log
                </h1>
                <button onClick={handleDownloadReport} className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2.5 px-5 rounded-lg shadow-md flex items-center">
                    <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
                    Download Report
                </button>
            </div>
            
            <p className="text-gray-400">Review the history of all completed trips.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-800 rounded-lg shadow">
                <div>
                    <label htmlFor="startDate" className={labelStyle}>Start Date</label>
                    <input type="date" id="startDate" value={startDate} onChange={e => setStartDate(e.target.value)} className={`${inputFieldStyle} mt-1 dark:[color-scheme:dark]`} />
                </div>
                <div>
                    <label htmlFor="endDate" className={labelStyle}>End Date</label>
                    <input type="date" id="endDate" value={endDate} onChange={e => setEndDate(e.target.value)} className={`${inputFieldStyle} mt-1 dark:[color-scheme:dark]`} />
                </div>
                <div>
                    <label htmlFor="filterChauffeur" className={labelStyle}>Chauffeur</label>
                    <select id="filterChauffeur" value={filterChauffeur} onChange={e => setFilterChauffeur(e.target.value)} className={`${inputFieldStyle} mt-1 pr-8`}>
                        <option value="ALL">All Chauffeurs</option>
                        {chauffeurs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="searchTerm" className={labelStyle}>Search</label>
                    <input type="text" id="searchTerm" placeholder="Trip name, notes..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className={`${inputFieldStyle} mt-1`} />
                </div>
            </div>

            <div className="bg-gray-800 shadow-xl rounded-lg overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700 text-sm">
                    <thead className="bg-gray-750">
                        <tr>
                            <th className="px-4 py-3 text-left font-medium text-gray-400 uppercase">Trip / Purpose</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-400 uppercase">Chauffeur & Vehicle</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-400 uppercase">Trip For</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-400 uppercase">Trip Period</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-400 uppercase">Duration</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-400 uppercase">Route</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-400 uppercase">Notes</th>
                        </tr>
                    </thead>
                    <tbody className="bg-gray-800 divide-y divide-gray-700">
                        {filteredLogs.map(trip => (
                            <tr key={trip.id} className="hover:bg-gray-750">
                                <td className="px-4 py-3 font-medium text-gray-200">{trip.tripName}</td>
                                <td className="px-4 py-3">
                                    <div className="text-gray-300">{getChauffeurName(trip.chauffeurId)}</div>
                                    <div className="text-xs text-gray-400">{getVehiclePlate(trip.vehicleId)}</div>
                                </td>
                                <td className="px-4 py-3 text-gray-300">{getTripFor(trip)}</td>
                                <td className="px-4 py-3">
                                    <div className="text-gray-300">{formatDate(trip.actualStartDate)}</div>
                                    <div className="text-xs text-gray-400">to {formatDate(trip.actualEndDate)}</div>
                                </td>
                                <td className="px-4 py-3 font-semibold text-gray-200">{calculateDuration(trip.actualStartDate, trip.actualEndDate)}</td>
                                <td className="px-4 py-3">
                                    <div className="text-gray-300">{trip.origin} &rarr; {trip.destination}</div>
                                </td>
                                <td className="px-4 py-3 text-gray-400 max-w-xs truncate" title={trip.notes || ''}>{trip.notes || '-'}</td>
                            </tr>
                        ))}
                        {filteredLogs.length === 0 && (
                            <tr>
                                <td colSpan={7} className="text-center py-10 text-gray-500">
                                    No completed trips found for the selected filters.
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
