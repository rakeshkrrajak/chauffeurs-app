import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Chauffeur, Trip, TripStatus, ChauffeurOnboardingStatus } from '../../types';
import { UserGroupIcon, ChartPieIcon, ShieldCheckIcon } from '../../constants';

interface ChauffeurOverviewDashboardPageProps {
  chauffeurs: Chauffeur[];
  trips: Trip[];
}

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; accentColor?: string; linkTo?: string; }> =
({ title, value, icon, accentColor = 'border-primary-500 text-primary-400', linkTo }) => {
  const content = (
    <div className={`bg-gray-800 p-4 rounded-xl shadow-lg flex items-center space-x-3 border-l-4 ${accentColor.split(' ')[1] || 'border-primary-500'}`}>
      <div className={`shrink-0 p-2.5 bg-gray-700 rounded-lg ${accentColor.split(' ')[0] || 'text-primary-400'}`}>{icon}</div>
      <div>
        <p className="text-sm text-gray-400">{title}</p>
        <p className="text-2xl font-semibold text-gray-100">{value}</p>
      </div>
    </div>
  );
  if (linkTo) {
    return <Link to={linkTo} className="hover:opacity-90 transition-opacity">{content}</Link>;
  }
  return content;
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
              <text x="0" y="0.05" textAnchor="middle" dominantBaseline="middle" fontSize="0.35" fill="#e5e7eb" fontWeight="bold">
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

const getDaysUntilExpiry = (expiryDate?: string): number | null => {
    if (!expiryDate) return null;
    const today = new Date();
    today.setHours(0,0,0,0);
    const expDate = new Date(expiryDate);
    if (isNaN(expDate.getTime())) return null;
    return Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

const ChauffeurOverviewDashboardPage: React.FC<ChauffeurOverviewDashboardPageProps> = ({ chauffeurs, trips }) => {

    const approvedChauffeurs = useMemo(() => chauffeurs.filter(c => c.onboardingStatus === ChauffeurOnboardingStatus.APPROVED), [chauffeurs]);

    const dashboardStats = useMemo(() => {
        const onTripChauffeurIds = new Set(trips.filter(t => t.status === TripStatus.ONGOING && t.chauffeurId).map(t => t.chauffeurId));
        
        const total = approvedChauffeurs.length;
        const pool = approvedChauffeurs.filter(c => !c.assignedVehicleId).length;
        const onTrip = onTripChauffeurIds.size;
        // Mocking on leave for chart purposes
        const onLeave = Math.floor(total * 0.05);
        const available = total - onTrip - onLeave;

        return {
            total,
            pool,
            onTrip,
            available,
            onLeave,
        };
    }, [approvedChauffeurs, trips]);

    const chauffeurStatusChartData = useMemo(() => [
        { label: 'On Trip', value: dashboardStats.onTrip, color: '#8b5cf6' }, // Violet
        { label: 'Available', value: dashboardStats.available, color: '#22c55e' }, // Green
        { label: 'On Leave (Est.)', value: dashboardStats.onLeave, color: '#3b82f6' }, // Blue
    ].filter(d => d.value > 0), [dashboardStats]);

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
    
    const licensesExpiringSoon = useMemo(() => 
        approvedChauffeurs.map(c => ({
            chauffeur: c,
            daysLeft: getDaysUntilExpiry(c.dlExpiryDate),
        }))
        .filter(item => item.daysLeft !== null && item.daysLeft <= 30)
        .sort((a, b) => a.daysLeft! - b.daysLeft!)
        .slice(0, 5)
    , [approvedChauffeurs]);

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-100">Chauffeur Overview Dashboard</h1>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Total Chauffeurs" value={dashboardStats.total} icon={<UserGroupIcon className="w-7 h-7" />} accentColor="border-sky-500 text-sky-400" linkTo="/chauffeurs/directory" />
                <StatCard title="Pool Chauffeurs" value={dashboardStats.pool} icon={<UserGroupIcon className="w-7 h-7" />} accentColor="border-blue-500 text-blue-400" />
                <StatCard title="Chauffeurs on Trip" value={dashboardStats.onTrip} icon={<UserGroupIcon className="w-7 h-7" />} accentColor="border-purple-500 text-purple-400" />
                <StatCard title="Available Chauffeurs" value={dashboardStats.available} icon={<UserGroupIcon className="w-7 h-7" />} accentColor="border-green-500 text-green-400" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <DonutChart data={chauffeurStatusChartData} title="Chauffeur Live Status" centerText={`${dashboardStats.total}`} />
                <div className="bg-gray-800 p-5 rounded-xl shadow-xl h-full flex flex-col">
                    <h3 className="text-lg font-semibold text-gray-100 mb-3">Top 5 Chauffeurs (by Completed Trips)</h3>
                    {topChauffeursByTrips.length > 0 ? (
                         <ul className="space-y-2.5 text-sm">
                            {topChauffeursByTrips.map((c, i) => (
                                <li key={i} className="flex justify-between items-center p-2 bg-gray-700 rounded-md">
                                    <span className="text-gray-200">{i+1}. {c.name}</span>
                                    <span className="font-bold text-primary-300">{c.count} Trips</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-center text-gray-500 flex-grow flex items-center justify-center">No completed trip data available.</p>
                    )}
                </div>
            </div>
            
            <div className="bg-gray-800 p-5 rounded-xl shadow-xl">
                <h3 className="text-lg font-semibold text-gray-100 mb-3 flex items-center">
                    <ShieldCheckIcon className="w-6 h-6 mr-2 text-amber-400" />
                    Driver Licenses Expiring Soon
                </h3>
                 {licensesExpiringSoon.length > 0 ? (
                    <ul className="space-y-2.5 text-xs max-h-60 overflow-y-auto pr-2">
                    {licensesExpiringSoon.map(item => (
                        <li key={item.chauffeur.id} className={`p-2.5 rounded-md ${item.daysLeft! < 0 ? 'bg-red-900 bg-opacity-40' : 'bg-gray-700'}`}>
                            <div className="flex justify-between items-center">
                                <span className="font-medium text-gray-200" title={item.chauffeur.name}>{item.chauffeur.name}</span>
                                <span className={`font-semibold text-xs px-1.5 py-0.5 rounded-full ${item.daysLeft! < 0 ? 'bg-red-500 text-white' : 'bg-amber-500 text-white'}`}>
                                    {item.daysLeft! < 0 ? 'Expired' : `${item.daysLeft} days left`}
                                </span>
                            </div>
                            <p className="text-gray-400 text-[11px]">License: {item.chauffeur.licenseNumber}</p>
                        </li>
                    ))}
                    </ul>
                ) : (
                    <p className="text-gray-500 text-sm py-8 text-center">No licenses are expiring in the next 30 days.</p>
                )}
            </div>
        </div>
    );
};

export default ChauffeurOverviewDashboardPage;
