import React, { useMemo, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Vehicle, Chauffeur, VehicleStatus, ChauffeurAttendance, AttendanceStatus, Trip, TripStatus, ReportedIssue, IssueStatus, IssueSeverity, ChauffeurOnboardingStatus, MaintenanceTask, User, MaintenanceTaskStatus } from '../types';
import { TruckIcon, UserGroupIcon, ClipboardDocumentCheckIcon, SunIcon, MoonIcon } from '../constants';

interface DashboardPageProps {
  vehicles: Vehicle[];
  chauffeurs: Chauffeur[];
  attendance: ChauffeurAttendance[];
  trips: Trip[];
  reportedIssues: ReportedIssue[];
  maintenanceTasks: MaintenanceTask[];
  users: User[];
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  accentColor: string; 
  linkTo?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, accentColor, linkTo }) => {
  const content = (
      <div className={`bg-gray-800 p-4 rounded-lg shadow-lg flex items-center space-x-3 border-l-4 ${accentColor}`}>
          {icon}
          <div>
              <p className="text-sm text-gray-400">{title}</p>
              <p className="text-2xl font-bold text-gray-100">{value}</p>
          </div>
      </div>
  );

  if (linkTo) {
      return <Link to={linkTo} className="block hover:opacity-90 transition-opacity">{content}</Link>;
  }
  return content;
};


interface TrendCardProps {
  title: string;
  value: number;
  trend: number;
  data: number[];
}

const TrendCard: React.FC<TrendCardProps> = ({ title, value, trend, data }) => {
  const trendColor = trend >= 0 ? 'text-green-400' : 'text-red-400';
  const trendIcon = trend >= 0 ? (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path fillRule="evenodd" d="M10 17a.75.75 0 01-.75-.75V5.612L5.03 9.83a.75.75 0 01-1.06-1.06l5.25-5.25a.75.75 0 011.06 0l5.25 5.25a.75.75 0 11-1.06 1.06L10.75 5.612V16.25A.75.75 0 0110 17z" clipRule="evenodd" />
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path fillRule="evenodd" d="M10 3a.75.75 0 01.75.75v10.638l4.22-4.22a.75.75 0 111.06 1.06l-5.25 5.25a.75.75 0 01-1.06 0l-5.25-5.25a.75.75 0 111.06-1.06L9.25 14.388V3.75A.75.75 0 0110 3z" clipRule="evenodd" />
    </svg>
  );

  const chartPoints = useMemo(() => {
    const width = 120;
    const height = 40;
    const max = Math.max(...data, 0);
    const min = Math.min(...data);
    const range = max - min > 0 ? max - min : 1;
    
    return data
      .map((d, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - ((d - min) / range) * height;
        return `${x},${y}`;
      })
      .join(' ');
  }, [data]);

  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-lg flex justify-between items-center">
      <div>
        <p className="text-sm text-gray-400">{title}</p>
        <p className="text-2xl font-bold text-gray-100">{value}</p>
        <div className={`flex items-center text-xs font-semibold ${trendColor}`}>
          {trendIcon}
          <span>{trend.toFixed(1)}% vs last week</span>
        </div>
      </div>
      <div className="w-32 h-12">
        <svg viewBox="0 0 120 40" className="w-full h-full">
          <polyline
            fill="none"
            stroke={trend >= 0 ? '#4ade80' : '#f87171'}
            strokeWidth="2"
            points={chartPoints}
          />
        </svg>
      </div>
    </div>
  );
};


interface MonthlyChartDataPoint {
  month: string;
  [key: string]: number | string;
}

interface MonthlyTripsBarChartProps {
  data: MonthlyChartDataPoint[];
  keys: string[];
  colors: { [key: string]: string };
}

const MonthlyTripsBarChart: React.FC<MonthlyTripsBarChartProps> = ({ data, keys, colors }) => {
  const chartHeight = 200;
  const barGap = 16;
  const barWidth = 40;
  const chartPadding = { top: 10, bottom: 30, left: 35, right: 10 };
  const chartWidth = data.length * (barWidth + barGap) + chartPadding.left + chartPadding.right;

  const yMax = Math.ceil(Math.max(...data.map(d => keys.reduce((sum, key) => sum + (d[key] as number), 0)), 0) / 5) * 5 || 5;
  const yTicks = 5;
  const yTickValues = Array.from({ length: yTicks + 1 }, (_, i) => yMax > 0 ? (yMax / yTicks) * i : 0);

  if (data.length === 0 || yMax <= 5) {
    return (
      <div className="flex-grow flex items-center justify-center text-gray-500">
        No trip data available for this period.
      </div>
    );
  }

  return (
    <div className="flex-grow overflow-x-auto">
      <svg width={chartWidth} height={chartHeight + chartPadding.top + chartPadding.bottom} aria-label="Monthly Trips Bar Chart">
        {yTickValues.map((tick, i) => (
          <g key={i} className="text-gray-500">
            <line
              x1={chartPadding.left}
              y1={chartPadding.top + chartHeight - (yMax > 0 ? (tick / yMax) * chartHeight : 0)}
              x2={chartWidth - chartPadding.right}
              y2={chartPadding.top + chartHeight - (yMax > 0 ? (tick / yMax) * chartHeight : 0)}
              stroke="currentColor" 
              strokeWidth="0.5"
              strokeDasharray="2,2"
            />
            <text
              x={chartPadding.left - 5}
              y={chartPadding.top + chartHeight - (yMax > 0 ? (tick / yMax) * chartHeight : 0) + 4}
              textAnchor="end"
              fontSize="10"
              fill="currentColor"
            >
              {tick.toLocaleString()}
            </text>
          </g>
        ))}
        {data.map((d, i) => {
          let currentStackHeight = 0;
          return (
            <g key={d.month} transform={`translate(${chartPadding.left + i * (barWidth + barGap) + barGap / 2}, 0)`}>
              {keys.map(key => {
                const value = d[key] as number;
                if (value === 0) return null;
                const barHeight = yMax > 0 ? (value / yMax) * chartHeight : 0;
                const yPos = chartPadding.top + chartHeight - barHeight - currentStackHeight;
                currentStackHeight += barHeight;
                return (
                  <rect
                    key={key}
                    x={0}
                    y={yPos}
                    width={barWidth}
                    height={barHeight}
                    fill={colors[key]}
                    rx="2"
                  >
                    <title>{`${d.month} - ${key}: ${value}`}</title>
                  </rect>
                );
              })}
              <text
                x={barWidth / 2}
                y={chartPadding.top + chartHeight + 15}
                textAnchor="middle"
                fontSize="10"
                fill="#9ca3af"
              >
                {d.month}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
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

const DashboardPage: React.FC<DashboardPageProps> = ({ vehicles, chauffeurs, attendance, trips, reportedIssues, maintenanceTasks, users }) => {
  const [tripChartRange, setTripChartRange] = useState<number>(6);
  const [attendanceChartRange, setAttendanceChartRange] = useState<'weekly' | 'monthly'>('weekly');

  const vehicleStats = useMemo(() => {
    const total = vehicles.length;
    const poolCars = vehicles.filter(v => v.carType === 'Pool Cars').length;
    const mCars = vehicles.filter(v => v.carType === 'M-Car').length;
    const testCars = vehicles.filter(v => v.carType === 'Test Cars').length;
    return { total, poolCars, mCars, testCars };
  }, [vehicles]);

  const approvedChauffeurs = useMemo(() => chauffeurs.filter(c => c.onboardingStatus === ChauffeurOnboardingStatus.APPROVED), [chauffeurs]);

  const chauffeurDashboardStats = useMemo(() => {
      const onTripChauffeurIds = new Set(trips.filter(t => t.status === TripStatus.ONGOING && t.chauffeurId).map(t => t.chauffeurId));
      
      const total = approvedChauffeurs.length;
      const pool = approvedChauffeurs.filter(c => !c.assignedVehicleId).length;
      const onTrip = onTripChauffeurIds.size;
      // Mocking on leave for chart purposes, consistent with the other dashboard
      const onLeave = Math.floor(total * 0.05);
      const available = total - onTrip - onLeave;

      return { total, pool, onTrip, available, onLeave };
  }, [approvedChauffeurs, trips]);

  const chauffeurStatusChartData = useMemo(() => [
      { label: 'On Trip', value: chauffeurDashboardStats.onTrip, color: '#8b5cf6' }, // Violet
      { label: 'Available', value: chauffeurDashboardStats.available, color: '#22c55e' }, // Green
      { label: 'On Leave (Est.)', value: chauffeurDashboardStats.onLeave, color: '#3b82f6' }, // Blue
  ].filter(d => d.value > 0), [chauffeurDashboardStats]);

  const topChauffeursByTrips = useMemo(() => {
      const tripCounts: { [key: string]: number } = {};
      trips.forEach(trip => {
          if(trip.chauffeurId && trip.status === TripStatus.COMPLETED) {
              tripCounts[trip.chauffeurId] = (tripCounts[trip.chauffeurId] || 0) + 1;
          }
      });
      return Object.entries(tripCounts)
          .map(([chauffeurId, count]) => ({
              name: chauffeurs.find(c => c.id === chauffeurId)?.name || 'Unknown',
              count
          }))
          .sort((a,b) => b.count - a.count)
          .slice(0, 5);
  }, [trips, chauffeurs]);

  const {
    present,
    onLeave,
    absent,
    unreported
  } = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todaysAttendance = attendance.filter(a => a.date === today);
    
    const presentCount = todaysAttendance.filter(a => a.status === AttendanceStatus.PRESENT || a.status === AttendanceStatus.HALF_DAY).length;
    const onLeaveCount = todaysAttendance.filter(a => a.status === AttendanceStatus.ON_LEAVE).length;
    const absentCount = todaysAttendance.filter(a => a.status === AttendanceStatus.ABSENT).length;
    const unreportedCount = chauffeurs.length - todaysAttendance.length;

    return { present: presentCount, onLeave: onLeaveCount, absent: absentCount, unreported: unreportedCount };
  }, [chauffeurs, attendance]);

  const { attendanceTrend, tripTrend } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const getDailyCounts = (data: any[], dateField: string, status: any, days: number, offset = 0) => {
        const counts = Array(days).fill(0);
        for (let i = 0; i < days; i++) {
            const targetDate = new Date(today);
            targetDate.setDate(today.getDate() - i - offset);
            const targetDateString = targetDate.toISOString().split('T')[0];

            counts[days - 1 - i] = data.filter(item => {
                const itemDate = new Date(item[dateField]);
                const itemDateString = itemDate.toISOString().split('T')[0];
                return itemDateString === targetDateString && item.status === status;
            }).length;
        }
        return counts;
    };

    const currentWeekAttendanceData = getDailyCounts(attendance, 'date', AttendanceStatus.PRESENT, 7);
    const previousWeekAttendanceData = getDailyCounts(attendance, 'date', AttendanceStatus.PRESENT, 7, 7);
    const currentWeekAttendanceTotal = currentWeekAttendanceData.reduce((a, b) => a + b, 0);
    const previousWeekAttendanceTotal = previousWeekAttendanceData.reduce((a, b) => a + b, 0);
    const attendanceTrendValue = previousWeekAttendanceTotal === 0 ? (currentWeekAttendanceTotal > 0 ? 100 : 0) : ((currentWeekAttendanceTotal - previousWeekAttendanceTotal) / previousWeekAttendanceTotal) * 100;
    
    const currentWeekTripsData = getDailyCounts(trips, 'scheduledStartDate', TripStatus.COMPLETED, 7);
    const previousWeekTripsData = getDailyCounts(trips, 'scheduledStartDate', TripStatus.COMPLETED, 7, 7);
    const currentWeekTripsTotal = currentWeekTripsData.reduce((a, b) => a + b, 0);
    const previousWeekTripsTotal = previousWeekTripsData.reduce((a, b) => a + b, 0);
    const tripTrendValue = previousWeekTripsTotal === 0 ? (currentWeekTripsTotal > 0 ? 100 : 0) : ((currentWeekTripsTotal - previousWeekTripsTotal) / previousWeekTripsTotal) * 100;

    return {
        attendanceTrend: { data: currentWeekAttendanceData, value: currentWeekAttendanceTotal, trend: attendanceTrendValue },
        tripTrend: { data: currentWeekTripsData, value: currentWeekTripsTotal, trend: tripTrendValue },
    };
  }, [attendance, trips]);

  const monthlyTripsData = useMemo(() => {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const today = new Date();
    const monthlyData: { [key: string]: { 'Guests Service Trips': number; 'E4 Trips': number } } = {};

    // Initialize last N months
    for (let i = tripChartRange - 1; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const monthKey = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
        monthlyData[monthKey] = { 'Guests Service Trips': 0, 'E4 Trips': 0 };
    }

    const dateLimit = new Date();
    dateLimit.setMonth(dateLimit.getMonth() - tripChartRange);
    dateLimit.setDate(1);
    dateLimit.setHours(0,0,0,0);


    trips.forEach(trip => {
        const tripDate = new Date(trip.scheduledStartDate);
        
        if (tripDate >= dateLimit) {
            const monthKey = `${monthNames[tripDate.getMonth()]} ${tripDate.getFullYear()}`;

            if (monthlyData[monthKey]) {
                if (trip.tripName.toLowerCase().includes('guest service')) {
                    monthlyData[monthKey]['Guests Service Trips']++;
                } else if (trip.tripName.toLowerCase().includes('e4 trip')) {
                    monthlyData[monthKey]['E4 Trips']++;
                }
            }
        }
    });
    
    return Object.entries(monthlyData).map(([month, counts]) => ({
        month: month.split(' ')[0], // Just show month name for brevity
        ...counts
    }));
  }, [trips, tripChartRange]);

  const attendanceChartData = useMemo(() => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    const daysInRange = attendanceChartRange === 'weekly' ? 7 : 30;
    
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

    return {
        onJobData: [
            { label: 'On Job', value: onJobCount, color: '#4CAF50' },
            { label: 'Not on Job', value: totalPossibleAttendance - onJobCount, color: '#4b5563' }
        ],
        onLeaveData: [
            { label: 'On Leave', value: onLeaveCount, color: '#2196F3' },
            { label: 'Not on Leave', value: totalPossibleAttendance - onLeaveCount, color: '#4b5563' }
        ],
        onJobCount,
        onLeaveCount,
    };
  }, [attendance, chauffeurs, attendanceChartRange]);
  
  const vehiclesInMaintenanceDetails = useMemo(() => {
    return vehicles
        .filter(v => v.status === VehicleStatus.MAINTENANCE)
        .map(vehicle => {
            const maintenanceTask = maintenanceTasks
                .filter(task => task.vehicleId === vehicle.id && task.status !== MaintenanceTaskStatus.COMPLETED && task.status !== MaintenanceTaskStatus.CANCELLED)
                .sort((a,b) => new Date(b.scheduledDate || 0).getTime() - new Date(a.scheduledDate || 0).getTime())[0];

            const user = users.find(u => u.id === vehicle.assignedEmployeeId);

            const maintenanceEntryDate = vehicle.statusHistory
                ?.slice()
                .reverse()
                .find(h => h.status === VehicleStatus.MAINTENANCE)?.date;

            return {
                vehicleId: vehicle.id,
                vehicleName: `${vehicle.make} ${vehicle.model} (${vehicle.licensePlate})`,
                userName: user?.name || 'N/A',
                sendDate: maintenanceEntryDate,
                vendorName: maintenanceTask?.garageName || 'Internal',
                issue: maintenanceTask?.description || 'Scheduled Maintenance',
                jobCardNumber: maintenanceTask?.jobCardNumber || 'N/A',
                status: maintenanceTask?.status || MaintenanceTaskStatus.SCHEDULED,
            };
        });
  }, [vehicles, maintenanceTasks, users]);

  const getMaintenanceStatusPillClass = (status: MaintenanceTaskStatus) => {
    const classMap: Record<MaintenanceTaskStatus, string> = {
        [MaintenanceTaskStatus.SCHEDULED]: 'bg-blue-700 bg-opacity-30 text-blue-300',
        [MaintenanceTaskStatus.IN_PROGRESS]: 'bg-yellow-700 bg-opacity-30 text-yellow-300',
        [MaintenanceTaskStatus.COMPLETED]: 'bg-green-700 bg-opacity-30 text-green-300',
        [MaintenanceTaskStatus.CANCELLED]: 'bg-red-700 bg-opacity-30 text-red-300',
        [MaintenanceTaskStatus.AWAITING_PARTS]: 'bg-amber-700 bg-opacity-30 text-amber-300',
        [MaintenanceTaskStatus.PENDING_APPROVAL]: 'bg-purple-700 bg-opacity-30 text-purple-300',
    };
    return classMap[status] || 'bg-gray-700 text-gray-300';
  };

  const getChauffeurNameById = useCallback((id: string) => {
      return chauffeurs.find(c => c.id === id)?.name || 'Unknown';
  }, [chauffeurs]);

  const getVehiclePlateById = useCallback((id: string | null) => {
      if (!id) return 'N/A';
      return vehicles.find(v => v.id === id)?.licensePlate || 'Unknown';
  }, [vehicles]);

  const recentIssues = useMemo(() => {
      return reportedIssues
          .filter(issue => issue.status === IssueStatus.OPEN || issue.status === IssueStatus.IN_PROGRESS)
          .sort((a, b) => new Date(b.reportDate).getTime() - new Date(a.reportDate).getTime())
          .slice(0, 5);
  }, [reportedIssues]);

  const getSeverityPillClass = (severity: IssueSeverity) => {
      switch (severity) {
          case IssueSeverity.HIGH: return 'bg-red-700 bg-opacity-40 text-red-300';
          case IssueSeverity.MEDIUM: return 'bg-amber-700 bg-opacity-40 text-amber-300';
          case IssueSeverity.LOW: return 'bg-sky-700 bg-opacity-40 text-sky-300';
          default: return 'bg-gray-700 bg-opacity-40 text-gray-300';
      }
  };

  const getStatusPillClass = (status: IssueStatus) => {
      switch (status) {
          case IssueStatus.OPEN: return 'bg-red-700 bg-opacity-30 text-red-300';
          case IssueStatus.IN_PROGRESS: return 'bg-yellow-700 bg-opacity-30 text-yellow-300';
          case IssueStatus.RESOLVED: return 'bg-green-700 bg-opacity-30 text-green-300';
          default: return 'bg-gray-700 bg-opacity-30 text-gray-300';
      }
  };
    
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-4xl font-bold text-gray-100">Fleet Dashboard</h1>
        <p className="text-gray-400 mt-2 text-lg">Comprehensive operational overview of your fleet.</p>
      </header>

      <section>
        <h2 className="text-2xl font-semibold text-gray-200 mb-4 border-b border-gray-700 pb-2">Vehicle Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Total Vehicles" value={vehicleStats.total} icon={<TruckIcon className="w-7 h-7 text-sky-400" />} accentColor="border-sky-500" />
            <StatCard title="Pool Cars" value={vehicleStats.poolCars} icon={<TruckIcon className="w-7 h-7 text-blue-400" />} accentColor="border-blue-500" />
            <StatCard title="M-Cars (Employee)" value={vehicleStats.mCars} icon={<TruckIcon className="w-7 h-7 text-gray-400" />} accentColor="border-gray-500" />
            <StatCard title="Test Cars" value={vehicleStats.testCars} icon={<TruckIcon className="w-7 h-7 text-indigo-400" />} accentColor="border-indigo-500" />
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-gray-200 mb-4 border-b border-gray-700 pb-2">Vehicles in Maintenance</h2>
        <div className="bg-gray-800 rounded-xl shadow-xl overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-750">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Vehicle</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Assigned User</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Send Date</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Vendor</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Issue</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Job Card #</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              {vehiclesInMaintenanceDetails.map(item => (
                <tr key={item.vehicleId} className="hover:bg-gray-750 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-200" title={item.vehicleName}>{item.vehicleName}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">{item.userName}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">{item.sendDate ? formatDate(item.sendDate) : 'N/A'}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">{item.vendorName}</td>
                  <td className="px-4 py-3 whitespace-normal max-w-xs text-sm text-gray-400 truncate" title={item.issue}>{item.issue}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300 font-mono">{item.jobCardNumber}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getMaintenanceStatusPillClass(item.status)}`}>
                        {item.status}
                    </span>
                  </td>
                </tr>
              ))}
              {vehiclesInMaintenanceDetails.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center text-gray-500 py-10">
                    No vehicles are currently in maintenance.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-gray-200 mb-4 border-b border-gray-700 pb-2">Chauffeur Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Chauffeurs" value={chauffeurDashboardStats.total} icon={<UserGroupIcon className="w-7 h-7 text-sky-400" />} accentColor="border-sky-500" linkTo="/chauffeurs/directory" />
          <StatCard title="Pool Chauffeurs" value={chauffeurDashboardStats.pool} icon={<UserGroupIcon className="w-7 h-7 text-blue-400" />} accentColor="border-blue-500" />
          <StatCard title="Chauffeurs on Trip" value={chauffeurDashboardStats.onTrip} icon={<UserGroupIcon className="w-7 h-7 text-purple-400" />} accentColor="border-purple-500" />
          <StatCard title="Available Chauffeurs" value={chauffeurDashboardStats.available} icon={<UserGroupIcon className="w-7 h-7 text-green-400" />} accentColor="border-green-500" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <DonutChart data={chauffeurStatusChartData} title="Chauffeur Live Status" centerText={`${chauffeurDashboardStats.total}`} />
          <div className="bg-gray-800 p-5 rounded-xl shadow-xl h-full flex flex-col">
            <h3 className="text-lg font-semibold text-gray-100 mb-3">Top 5 Chauffeurs (by Completed Trips)</h3>
            {topChauffeursByTrips.length > 0 ? (
              <ul className="space-y-2.5 text-sm">
                {topChauffeursByTrips.map((c, i) => (
                  <li key={i} className="flex justify-between items-center p-2 bg-gray-700 rounded-md">
                    <span className="text-gray-200">{i + 1}. {c.name}</span>
                    <span className="font-bold text-primary-300">{c.count} Trips</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-center text-gray-500 flex-grow flex items-center justify-center">No completed trip data available.</p>
            )}
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-gray-200 mb-4 border-b border-gray-700 pb-2">Trend Analysis (Last 7 Days)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TrendCard title="Attendance Trend" value={attendanceTrend.value} trend={attendanceTrend.trend} data={attendanceTrend.data} />
            <TrendCard title="Completed Trips Trend" value={tripTrend.value} trend={tripTrend.trend} data={tripTrend.data} />
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-gray-200 mb-4 border-b border-gray-700 pb-2">Today's Attendance</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Present" value={present} icon={<ClipboardDocumentCheckIcon className="w-7 h-7 text-green-400" />} accentColor="border-green-500" />
          <StatCard title="On Leave" value={onLeave} icon={<ClipboardDocumentCheckIcon className="w-7 h-7 text-blue-400" />} accentColor="border-blue-500" />
          <StatCard title="Absent" value={absent} icon={<ClipboardDocumentCheckIcon className="w-7 h-7 text-amber-400" />} accentColor="border-amber-500" />
          <StatCard title="Unreported" value={unreported} icon={<ClipboardDocumentCheckIcon className="w-7 h-7 text-red-400" />} accentColor="border-red-500" />
        </div>
      </section>

      <section>
        <div className="flex justify-between items-center flex-wrap gap-2 mb-4 border-b border-gray-700 pb-2">
            <h2 className="text-2xl font-semibold text-gray-200">Attendance Overview</h2>
            <select
                value={attendanceChartRange}
                onChange={(e) => setAttendanceChartRange(e.target.value as 'weekly' | 'monthly')}
                className="bg-gray-700 border border-gray-600 text-gray-200 text-xs rounded-lg focus:ring-primary-500 focus:border-primary-500 block p-1.5"
                aria-label="Select attendance chart time range"
            >
                <option value="weekly">Last 7 Days</option>
                <option value="monthly">Last 30 Days</option>
            </select>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DonutChart title="On Job" data={attendanceChartData.onJobData} centerText={`${attendanceChartData.onJobCount}`} />
            <DonutChart title="On Leave" data={attendanceChartData.onLeaveData} centerText={`${attendanceChartData.onLeaveCount}`} />
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-gray-200 mb-4 border-b border-gray-700 pb-2">Trip Overview</h2>
        <div className="grid grid-cols-1 gap-6">
          <div className="bg-gray-800 p-5 rounded-xl shadow-xl h-full flex flex-col min-h-[300px]">
            <div className="flex justify-between items-center flex-wrap gap-2 mb-3">
              <div className="flex-grow">
                  <h3 className="text-lg font-semibold text-gray-100">Monthly Trips by Type</h3>
              </div>
              <div className="flex items-center gap-4">
                  <div className="flex space-x-4 text-xs">
                      <div className="flex items-center">
                          <span className="w-2.5 h-2.5 rounded-sm mr-1.5" style={{ backgroundColor: '#2196F3' }}></span>
                          <span className="text-gray-300">Guests Service Trips</span>
                      </div>
                      <div className="flex items-center">
                          <span className="w-2.5 h-2.5 rounded-sm mr-1.5" style={{ backgroundColor: '#4CAF50' }}></span>
                          <span className="text-gray-300">E4 Trips</span>
                      </div>
                  </div>
                  <select
                      value={tripChartRange}
                      onChange={(e) => setTripChartRange(Number(e.target.value))}
                      className="bg-gray-700 border border-gray-600 text-gray-200 text-xs rounded-lg focus:ring-primary-500 focus:border-primary-500 block p-1.5"
                      aria-label="Select trip chart time range"
                  >
                      <option value="3">Last 3 Months</option>
                      <option value="6">Last 6 Months</option>
                      <option value="12">Last 12 Months</option>
                  </select>
              </div>
            </div>
            <MonthlyTripsBarChart
                data={monthlyTripsData}
                keys={['Guests Service Trips', 'E4 Trips']}
                colors={{
                    'Guests Service Trips': '#2196F3',
                    'E4 Trips': '#4CAF50',
                }}
            />
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-gray-200 mb-4 border-b border-gray-700 pb-2">Recent Reported Issues</h2>
        <div className="bg-gray-800 rounded-xl shadow-xl overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-750">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Chauffeur</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Vehicle Plate</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Issue</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Severity</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              {recentIssues.map(issue => (
                <tr key={issue.id} className="hover:bg-gray-750 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-200">{getChauffeurNameById(issue.chauffeurId)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{getVehiclePlateById(issue.vehicleId)}</td>
                  <td className="px-6 py-4 whitespace-normal max-w-sm text-sm text-gray-300 truncate" title={issue.issueDescription}>{issue.issueDescription}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{formatDate(issue.reportDate)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getSeverityPillClass(issue.severity)}`}>
                      {issue.severity}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusPillClass(issue.status)}`}>
                      {issue.status}
                    </span>
                  </td>
                </tr>
              ))}
              {recentIssues.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center text-gray-500 py-10">
                    No open issues reported recently.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

    </div>
  );
};

export default DashboardPage;