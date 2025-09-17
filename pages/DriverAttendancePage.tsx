import React, { useState, useMemo, useCallback } from 'react';
import { Chauffeur, ChauffeurAttendance, AttendanceStatus, Location, Trip, TripStatus } from '../types';
import Modal from '../components/Modal';
import { ClipboardDocumentCheckIcon, ArrowDownTrayIcon, MapPinIcon } from '../constants';
import { exportToCsv } from '../services/reportService';

interface ChauffeurAttendancePageProps {
  attendance: ChauffeurAttendance[];
  chauffeurs: Chauffeur[];
  addAttendance: (record: Omit<ChauffeurAttendance, 'id'>) => void;
  updateAttendance: (record: ChauffeurAttendance) => void;
  deleteAttendance: (recordId: string) => void;
  trips: Trip[];
}

const inputFieldStyle = "bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-500 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm rounded-lg p-2.5";
const labelStyle = "block text-sm font-medium text-gray-300 mb-1";
const buttonPrimaryStyle = "px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-md transition-colors";
const buttonSecondaryStyle = "px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-lg shadow-sm transition-colors";

const initialFormState: Omit<ChauffeurAttendance, 'id'> = {
  chauffeurId: '',
  date: new Date().toISOString().split('T')[0],
  status: AttendanceStatus.PRESENT,
  notes: '',
};

interface AttendanceFormProps {
  onSubmit: (record: Omit<ChauffeurAttendance, 'id'>) => void;
  onCancel: () => void;
  initialData?: ChauffeurAttendance | null;
  chauffeurs: Chauffeur[];
}

const AttendanceForm: React.FC<AttendanceFormProps> = ({ onSubmit, onCancel, initialData, chauffeurs }) => {
  const [formData, setFormData] = useState<Omit<ChauffeurAttendance, 'id'>>(initialData || initialFormState);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.chauffeurId || !formData.date || !formData.status) {
      alert("Please select a chauffeur, date, and status.");
      return;
    }
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="chauffeurId" className={labelStyle}>Chauffeur *</label>
          <select name="chauffeurId" id="chauffeurId" value={formData.chauffeurId} onChange={handleChange} required className={inputFieldStyle}>
            <option value="">Select a Chauffeur</option>
            {chauffeurs.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="date" className={labelStyle}>Date *</label>
          <input type="date" name="date" id="date" value={formData.date} onChange={handleChange} required className={`${inputFieldStyle} dark:[color-scheme:dark]`} />
        </div>
      </div>
      <div>
        <label htmlFor="status" className={labelStyle}>Status *</label>
        <select name="status" id="status" value={formData.status} onChange={handleChange} required className={inputFieldStyle}>
          {Object.values(AttendanceStatus).map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="notes" className={labelStyle}>Notes</label>
        <textarea name="notes" id="notes" value={formData.notes || ''} onChange={handleChange} rows={3} className={inputFieldStyle} />
      </div>
      <div className="flex justify-end space-x-3 pt-4">
        <button type="button" onClick={onCancel} className={buttonSecondaryStyle}>Cancel</button>
        <button type="submit" className={buttonPrimaryStyle}>
          {initialData ? 'Update Record' : 'Add Record'}
        </button>
      </div>
    </form>
  );
};

const STANDARD_WORK_HOURS = 9;

const calculateWorkHours = (checkIn?: string, checkOut?: string): { total: string; overtime: string } => {
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

interface ChartDataItem { label: string; value: number; color: string; }

const DonutChart: React.FC<{ data: ChartDataItem[]; title: string; centerText?: string }> = ({ data, title, centerText }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  if (total === 0 && !centerText) return <div className="text-center text-gray-500 py-8 h-full flex items-center justify-center">No data for {title}.</div>;

  let cumulativePercent = 0;
  const radius = 0.9;
  const innerRadius = 0.6;

  const getCoordinates = (percent: number, r: number) => [r * Math.cos(2 * Math.PI * percent), r * Math.sin(2 * Math.PI * percent)];

  return (
    <div className="bg-gray-800 p-5 rounded-xl shadow-xl h-full flex flex-col min-h-[300px]">
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
            <text x="0" y="0.05" textAnchor="middle" dominantBaseline="middle" fontSize="0.35" fill="#e5e7eb" fontWeight="bold">
              {centerText}
            </text>
          )}
        </svg>
        <div className="text-xs space-y-1 text-gray-300">
           {data.filter(item => !item.label.toLowerCase().includes('other') && !item.label.toLowerCase().includes('not')).map((item, index) => (
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


const ChauffeurAttendancePage: React.FC<ChauffeurAttendancePageProps> = ({ attendance, chauffeurs, addAttendance, updateAttendance, deleteAttendance, trips }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ChauffeurAttendance | null>(null);
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterChauffeurId, setFilterChauffeurId] = useState('ALL');
  const [viewMode, setViewMode] = useState<'list' | 'charts'>('list');
  const [range, setRange] = useState<'weekly' | 'monthly'>('weekly');

  const chartData = useMemo(() => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    const daysInRange = range === 'weekly' ? 7 : 30;
    
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - daysInRange + 1);
    startDate.setHours(0, 0, 0, 0);

    const dateSet = new Set<string>();
    for (let i = 0; i < daysInRange; i++) {
        const d = new Date(startDate);
        d.setDate(startDate.getDate() + i);
        dateSet.add(d.toISOString().split('T')[0]);
    }

    const relevantAttendance = attendance.filter(a => dateSet.has(a.date));
    const totalPossibleAttendance = chauffeurs.length * daysInRange;

    const onJobCount = relevantAttendance.filter(a => a.status === AttendanceStatus.PRESENT || a.status === AttendanceStatus.HALF_DAY).length;
    const onLeaveCount = relevantAttendance.filter(a => a.status === AttendanceStatus.ON_LEAVE).length;
    const absentCount = relevantAttendance.filter(a => a.status === AttendanceStatus.ABSENT).length;


    return {
        onJobData: [
            { label: 'On Job', value: onJobCount, color: '#4CAF50' },
            { label: 'Not on Job', value: totalPossibleAttendance - onJobCount, color: '#4b5563' }
        ],
        onLeaveData: [
            { label: 'On Leave', value: onLeaveCount, color: '#2196F3' },
            { label: 'Not on Leave', value: totalPossibleAttendance - onLeaveCount, color: '#4b5563' }
        ],
        absentData: [
            { label: 'Absent', value: absentCount, color: '#F44336' },
            { label: 'Other', value: totalPossibleAttendance - absentCount, color: '#4b5563' }
        ],
        onJobCount,
        onLeaveCount,
        absentCount
    };
}, [attendance, chauffeurs, range]);

  const openAddModal = () => { setEditingRecord(null); setIsModalOpen(true); };
  const openEditModal = (record: ChauffeurAttendance) => { setEditingRecord(record); setIsModalOpen(true); };
  const closeModal = () => { setIsModalOpen(false); setEditingRecord(null); };

  const handleDelete = (recordId: string) => {
    if (window.confirm('Are you sure you want to delete this attendance record?')) {
      deleteAttendance(recordId);
    }
  };

  const displayData = useMemo(() => {
    const filteredChauffeurs = chauffeurs.filter(chauffeur => 
        filterChauffeurId === 'ALL' || chauffeur.id === filterChauffeurId
    );

    return filteredChauffeurs.map(chauffeur => {
        const record = attendance.find(a => a.chauffeurId === chauffeur.id && a.date === filterDate);
        return { chauffeur, record };
    });
  }, [chauffeurs, attendance, filterDate, filterChauffeurId]);

  const handleActionWithLocation = (
    action: 'check-in' | 'check-out',
    chauffeurId: string,
    recordToUpdate?: ChauffeurAttendance
  ) => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    
    const success = (position: GeolocationPosition) => {
      const location: Location = {
        lat: position.coords.latitude,
        lon: position.coords.longitude,
      };
      const now = new Date().toISOString();
      
      if (action === 'check-in') {
        const newRecord: Omit<ChauffeurAttendance, 'id'> = {
          chauffeurId,
          date: new Date().toISOString().split('T')[0],
          status: AttendanceStatus.PRESENT,
          checkInTimestamp: now,
          checkInLocation: location,
        };
        addAttendance(newRecord);
      } else if (action === 'check-out' && recordToUpdate) {
        const updatedRecord: ChauffeurAttendance = {
          ...recordToUpdate,
          checkOutTimestamp: now,
          checkOutLocation: location,
        };
        updateAttendance(updatedRecord);
      }
    };
    
    const error = () => {
      alert("Unable to retrieve your location. Please enable location services and try again.");
    };
    
    navigator.geolocation.getCurrentPosition(success, error);
  };
  
  const formatTime = (isoString?: string) => {
    if (!isoString) return '-';
    return new Date(isoString).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  };
  
  const locationLink = (location?: Location) => {
    if (!location) return null;
    return (
      <a 
        href={`https://www.google.com/maps?q=${location.lat},${location.lon}`} 
        target="_blank" 
        rel="noopener noreferrer"
        className="text-primary-400 hover:text-primary-300 ml-2"
        title={`View on Map: ${location.lat.toFixed(4)}, ${location.lon.toFixed(4)}`}
      >
        <MapPinIcon className="w-4 h-4" />
      </a>
    );
  };

  const getStatusPillClass = (status: AttendanceStatus) => {
    switch (status) {
      case AttendanceStatus.PRESENT: return 'bg-green-700 bg-opacity-30 text-green-300';
      case AttendanceStatus.ABSENT: return 'bg-red-700 bg-opacity-30 text-red-300';
      case AttendanceStatus.ON_LEAVE: return 'bg-blue-700 bg-opacity-30 text-blue-300';
      case AttendanceStatus.HALF_DAY: return 'bg-amber-700 bg-opacity-30 text-amber-300';
      default: return 'bg-gray-700 text-gray-300';
    }
  };

  const handleDownloadReport = useCallback(() => {
     const dataToExport = displayData.map(({ chauffeur, record }) => {
      const { total, overtime } = record ? calculateWorkHours(record.checkInTimestamp, record.checkOutTimestamp) : { total: 'N/A', overtime: 'N/A' };
      return {
        date: filterDate,
        chauffeurName: chauffeur.name,
        chauffeurLicense: chauffeur.licenseNumber,
        status: record?.status || 'Not Marked',
        checkIn: record?.checkInTimestamp ? formatTime(record.checkInTimestamp) : 'N/A',
        checkInLocation: record?.checkInLocation ? `${record.checkInLocation.lat}, ${record.checkInLocation.lon}` : 'N/A',
        checkOut: record?.checkOutTimestamp ? formatTime(record.checkOutTimestamp) : 'N/A',
        checkOutLocation: record?.checkOutLocation ? `${record.checkOutLocation.lat}, ${record.checkOutLocation.lon}` : 'N/A',
        totalHours: total,
        overtime: overtime,
        notes: record?.notes || '',
      };
    });
    const headers = [
      { key: 'date', label: 'Date' },
      { key: 'chauffeurName', label: 'Chauffeur Name' },
      { key: 'chauffeurLicense', label: 'License No.' },
      { key: 'status', label: 'Status' },
      { key: 'checkIn', label: 'Check-in Time' },
      { key: 'checkInLocation', label: 'Check-in Location' },
      { key: 'checkOut', label: 'Check-out Time' },
      { key: 'checkOutLocation', label: 'Check-out Location' },
      { key: 'totalHours', label: 'Total Duty Hours' },
      { key: 'overtime', label: 'Overtime Hours' },
      { key: 'notes', label: 'Notes' },
    ];
    exportToCsv(`chauffeur_attendance_${filterDate}.csv`, dataToExport, headers);
  }, [displayData, filterDate]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h1 className="text-3xl font-bold text-gray-100 flex items-center">
          <ClipboardDocumentCheckIcon className="w-8 h-8 mr-3 text-primary-400" /> Chauffeur Attendance
        </h1>
        <div className="flex items-center gap-4">
            <div className="flex items-center bg-gray-700 rounded-lg p-1">
                <button onClick={() => setViewMode('list')} className={`px-3 py-1 text-sm rounded-md transition-colors ${viewMode === 'list' ? 'bg-primary-600 text-white shadow' : 'text-gray-300 hover:bg-gray-600'}`}>List View</button>
                <button onClick={() => setViewMode('charts')} className={`px-3 py-1 text-sm rounded-md transition-colors ${viewMode === 'charts' ? 'bg-primary-600 text-white shadow' : 'text-gray-300 hover:bg-gray-600'}`}>Charts View</button>
            </div>
             {viewMode === 'charts' && (
                <select
                    value={range}
                    onChange={(e) => setRange(e.target.value as 'weekly' | 'monthly')}
                    className={`${inputFieldStyle} py-2 text-sm`}
                >
                    <option value="weekly">Last 7 Days</option>
                    <option value="monthly">Last 30 Days</option>
                </select>
            )}
            <button onClick={handleDownloadReport} className={`${buttonSecondaryStyle} flex items-center`}>
                <ArrowDownTrayIcon className="w-5 h-5 mr-2" /> Download Report
            </button>
            <button onClick={openAddModal} className={`${buttonPrimaryStyle} flex items-center`}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-2"><path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" /></svg>
                Add Manual Record
            </button>
        </div>
      </div>
      
      {viewMode === 'charts' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <DonutChart title="On Job" data={chartData.onJobData} centerText={`${chartData.onJobCount}`} />
            <DonutChart title="On Leave" data={chartData.onLeaveData} centerText={`${chartData.onLeaveCount}`} />
            <DonutChart title="Absent" data={chartData.absentData} centerText={`${chartData.absentCount}`} />
        </div>
      ) : (
      <>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-800 rounded-lg shadow">
            <div>
            <label htmlFor="filterDate" className={labelStyle}>Date</label>
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
            <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-750">
                <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Chauffeur</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Check-in</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Check-out</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Total Duty Hours</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Overtime (OT)</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Notes</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Actions</th>
                </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
                {displayData.map(({ chauffeur, record }) => {
                const isToday = new Date().toISOString().split('T')[0] === filterDate;
                const { total: totalHours, overtime } = record ? calculateWorkHours(record.checkInTimestamp, record.checkOutTimestamp) : { total: '-', overtime: '-' };
                const isOnTrip = trips.some(trip => trip.chauffeurId === chauffeur.id && trip.status === TripStatus.ONGOING);

                const displayStatus = record ? (record.checkOutTimestamp ? 'Duty Completed' : record.status) : 'Not Marked';
                const getDisplayPillClass = (rec: ChauffeurAttendance | undefined) => {
                    if (!rec) return 'bg-gray-600 text-gray-300';
                    if (rec.checkOutTimestamp) return 'bg-gray-600 text-gray-200'; // A neutral 'completed' color
                    return getStatusPillClass(rec.status);
                };

                return (
                    <tr key={chauffeur.id} className="hover:bg-gray-750">
                    <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center">
                        <img className="h-10 w-10 rounded-full object-cover" src={chauffeur?.imageUrl} alt={chauffeur?.name} />
                        <div className="ml-4">
                            <div className="text-sm font-medium text-gray-100">{chauffeur?.name || 'Unknown'}</div>
                            <div className="text-xs text-gray-400">{chauffeur?.licenseNumber}</div>
                        </div>
                        </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getDisplayPillClass(record)}`}>
                            {displayStatus}
                        </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
                        <div className="flex items-center">{formatTime(record?.checkInTimestamp)} {locationLink(record?.checkInLocation)}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
                        <div className="flex items-center">{formatTime(record?.checkOutTimestamp)} {locationLink(record?.checkOutLocation)}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300 font-medium">{totalHours}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-amber-300">{overtime}</td>
                    <td className="px-4 py-3 text-sm text-gray-400 max-w-xs truncate" title={record?.notes}>{record?.notes || '-'}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                        {isToday && !record && (
                            <button onClick={() => handleActionWithLocation('check-in', chauffeur.id)} className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-1.5 px-3 rounded">Check In</button>
                        )}
                        {isToday && record && !record.checkOutTimestamp && record.status !== AttendanceStatus.ON_LEAVE && record.status !== AttendanceStatus.ABSENT && (
                            <button 
                                onClick={() => {
                                    if (isOnTrip) {
                                        alert("Cannot check out. This driver is currently on an ongoing trip.");
                                        return;
                                    }
                                    handleActionWithLocation('check-out', chauffeur.id, record);
                                }} 
                                disabled={isOnTrip}
                                className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold py-1.5 px-3 rounded disabled:bg-gray-500 disabled:cursor-not-allowed"
                                title={isOnTrip ? "Driver is on an active trip and cannot check out" : ""}
                            >Check Out</button>
                        )}
                        {record && record.checkOutTimestamp && (
                            <span className="text-xs text-green-400">Completed</span>
                        )}
                        {record && !isToday && (
                            <div className="space-x-2">
                                <button onClick={() => openEditModal(record)} className="text-indigo-400 hover:text-indigo-300 text-xs">Edit</button>
                                <button onClick={() => handleDelete(record.id)} className="text-red-400 hover:text-red-300 text-xs">Delete</button>
                            </div>
                        )}
                    </td>
                    </tr>
                );
                })}
                {displayData.length === 0 && (
                    <tr>
                        <td colSpan={8} className="text-center py-10 text-gray-500">
                            No chauffeurs found for the selected filter.
                        </td>
                    </tr>
                )}
            </tbody>
            </table>
        </div>
      </>
      )}


      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingRecord ? 'Edit Manual Record' : 'Add Manual Record'}>
        <AttendanceForm
          onSubmit={(data) => { editingRecord ? updateAttendance({ ...data, id: editingRecord.id }) : addAttendance(data); closeModal(); }}
          onCancel={closeModal}
          initialData={editingRecord}
          chauffeurs={chauffeurs}
        />
      </Modal>
    </div>
  );
};

export default ChauffeurAttendancePage;