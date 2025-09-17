import React, { useState, useMemo, useCallback } from 'react';
import { Chauffeur, ChauffeurAttendance, Vehicle, User, Location } from '../types';
import { DocumentChartBarIcon, ArrowDownTrayIcon } from '../constants';
import { exportToCsv } from '../services/reportService';

interface ChauffeurPerformancePageProps {
  chauffeurs: Chauffeur[];
  attendance: ChauffeurAttendance[];
  vehicles: Vehicle[];
  users: User[];
}

const inputFieldStyle = "bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-500 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm rounded-lg p-2.5";
const labelStyle = "block text-sm font-medium text-gray-300 mb-1";
const buttonSecondaryStyle = "px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-lg shadow-sm transition-colors";

const STANDARD_WORK_HOURS = 9;

const calculateWorkHours = (checkIn?: string | null, checkOut?: string | null): { total: string; overtime: string } => {
    if (!checkIn || !checkOut) {
        return { total: '-', overtime: '-' };
    }
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const durationMillis = checkOutDate.getTime() - checkInDate.getTime();

    if (durationMillis <= 0) {
        return { total: '-', overtime: '-' };
    }

    const durationHoursDecimal = durationMillis / (1000 * 60 * 60);
    const totalH = Math.floor(durationHoursDecimal);
    const totalM = Math.round((durationHoursDecimal - totalH) * 60);
    const totalFormatted = `${totalH}h ${totalM}m`;

    const overtimeHoursDecimal = durationHoursDecimal - STANDARD_WORK_HOURS;
    let overtimeFormatted = '-';
    if (overtimeHoursDecimal > 0.01) { // Check for more than a minute of OT
        const otH = Math.floor(overtimeHoursDecimal);
        const otM = Math.round((overtimeHoursDecimal - otH) * 60);
        overtimeFormatted = `${otH}h ${otM}m`;
    }

    return { total: totalFormatted, overtime: overtimeFormatted };
};

const ChauffeurPerformancePage: React.FC<ChauffeurPerformancePageProps> = ({ chauffeurs, attendance, vehicles, users }) => {
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterChauffeurId, setFilterChauffeurId] = useState('ALL');

  const reportData = useMemo(() => {
    // 1. Group attendance records by chauffeur and date to find min/max times
    const dailyAttendanceMap = new Map<string, {
        chauffeurId: string;
        date: string;
        minCheckIn: string | null;
        maxCheckOut: string | null;
        checkInLocation: Location | undefined;
    }>();

    attendance.forEach(record => {
        if (record.date !== filterDate) return;
        if (filterChauffeurId !== 'ALL' && record.chauffeurId !== filterChauffeurId) return;

        const key = `${record.chauffeurId}-${record.date}`;
        let dayData = dailyAttendanceMap.get(key);

        if (!dayData) {
            dayData = {
                chauffeurId: record.chauffeurId,
                date: record.date,
                minCheckIn: record.checkInTimestamp || null,
                maxCheckOut: record.checkOutTimestamp || null,
                checkInLocation: record.checkInLocation,
            };
        } else {
            if (record.checkInTimestamp && (!dayData.minCheckIn || new Date(record.checkInTimestamp) < new Date(dayData.minCheckIn))) {
                dayData.minCheckIn = record.checkInTimestamp;
                dayData.checkInLocation = record.checkInLocation;
            }
            if (record.checkOutTimestamp && (!dayData.maxCheckOut || new Date(record.checkOutTimestamp) > new Date(dayData.maxCheckOut))) {
                dayData.maxCheckOut = record.checkOutTimestamp;
            }
        }
        dailyAttendanceMap.set(key, dayData);
    });

    // 2. Map grouped data to the final report format with all required lookups
    return Array.from(dailyAttendanceMap.values()).map(dayData => {
        const chauffeur = chauffeurs.find(c => c.id === dayData.chauffeurId);
        if (!chauffeur) return null;

        const vehicle = vehicles.find(v => v.id === chauffeur.assignedVehicleId);
        const employee = vehicle ? users.find(u => u.id === vehicle.assignedEmployeeId) : null;

        const { total, overtime } = calculateWorkHours(dayData.minCheckIn, dayData.maxCheckOut);

        return {
            id: `${dayData.chauffeurId}-${dayData.date}`,
            premiseName: employee?.name || 'N/A (Pool Car/Unassigned)',
            driverName: chauffeur.name,
            driverId: chauffeur.empId || chauffeur.id,
            signInDate: dayData.date,
            minSignInTime: dayData.minCheckIn ? new Date(dayData.minCheckIn).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '-',
            maxSignOutTime: dayData.maxCheckOut ? new Date(dayData.maxCheckOut).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '-',
            totalDutyHours: total,
            overtimeHours: overtime,
            location: dayData.checkInLocation ? `${dayData.checkInLocation.lat.toFixed(4)}, ${dayData.checkInLocation.lon.toFixed(4)}` : 'N/A',
        };
    }).filter((item): item is NonNullable<typeof item> => item !== null);
  }, [attendance, chauffeurs, vehicles, users, filterDate, filterChauffeurId]);

  const handleDownloadReport = useCallback(() => {
    const dataToExport = reportData.map(row => ({
        ...row,
        signInDate: new Date(row.signInDate).toLocaleDateString('en-IN'),
    }));
    const headers = [
        { key: 'premiseName', label: 'Premise Name' },
        { key: 'driverName', label: 'Driver Name' },
        { key: 'driverId', label: 'Driver ID' },
        { key: 'signInDate', label: 'Sign-in Date' },
        { key: 'minSignInTime', label: 'Min Sign-in Time' },
        { key: 'maxSignOutTime', label: 'Max Sign-out Time' },
        { key: 'totalDutyHours', label: 'Total Duty Hours' },
        { key: 'overtimeHours', label: 'Overtime Hours' },
        { key: 'location', label: 'Location' },
    ];
    exportToCsv(`chauffeur_performance_${filterDate}.csv`, dataToExport, headers);
  }, [reportData, filterDate]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h1 className="text-3xl font-bold text-gray-100 flex items-center">
          <DocumentChartBarIcon className="w-8 h-8 mr-3 text-primary-400" />
          Chauffeur Performance Report
        </h1>
        <button onClick={handleDownloadReport} className={`${buttonSecondaryStyle} flex items-center`}>
          <ArrowDownTrayIcon className="w-5 h-5 mr-2" /> Download Report
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-800 rounded-lg shadow">
        <div>
          <label htmlFor="filterDate" className={labelStyle}>Report Date</label>
          <input type="date" id="filterDate" value={filterDate} onChange={e => setFilterDate(e.target.value)} className={`${inputFieldStyle} mt-1 dark:[color-scheme:dark]`} />
        </div>
        <div>
          <label htmlFor="filterChauffeurId" className={labelStyle}>Chauffeur</label>
          <select id="filterChauffeurId" value={filterChauffeurId} onChange={e => setFilterChauffeurId(e.target.value)} className={`${inputFieldStyle} mt-1 pr-8`}>
            <option value="ALL">All Chauffeurs</option>
            {chauffeurs.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-gray-800 shadow-xl rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-700 text-sm">
          <thead className="bg-gray-750">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-400 uppercase">Premise Name</th>
              <th className="px-4 py-3 text-left font-medium text-gray-400 uppercase">Driver Name</th>
              <th className="px-4 py-3 text-left font-medium text-gray-400 uppercase">Driver ID</th>
              <th className="px-4 py-3 text-left font-medium text-gray-400 uppercase">Sign-in / out Time</th>
              <th className="px-4 py-3 text-left font-medium text-gray-400 uppercase">Total Duty</th>
              <th className="px-4 py-3 text-left font-medium text-gray-400 uppercase">Overtime</th>
              <th className="px-4 py-3 text-left font-medium text-gray-400 uppercase">Location</th>
            </tr>
          </thead>
          <tbody className="bg-gray-800 divide-y divide-gray-700">
            {reportData.map(row => (
              <tr key={row.id} className="hover:bg-gray-750">
                <td className="px-4 py-3 whitespace-nowrap text-gray-300">{row.premiseName}</td>
                <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-100">{row.driverName}</td>
                <td className="px-4 py-3 whitespace-nowrap text-gray-400">{row.driverId}</td>
                <td className="px-4 py-3 whitespace-nowrap text-gray-300">{row.minSignInTime} - {row.maxSignOutTime}</td>
                <td className="px-4 py-3 whitespace-nowrap font-semibold text-gray-200">{row.totalDutyHours}</td>
                <td className="px-4 py-3 whitespace-nowrap font-semibold text-amber-300">{row.overtimeHours}</td>
                <td className="px-4 py-3 whitespace-nowrap text-gray-400">{row.location}</td>
              </tr>
            ))}
            {reportData.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-10 text-gray-500">
                  No attendance data found for the selected date and chauffeur.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ChauffeurPerformancePage;
