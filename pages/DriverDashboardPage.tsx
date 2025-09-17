


import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
// FIX: Added missing imports for TelematicsAlert and AlertType
import { Chauffeur, Trip, TripStatus, TelematicsAlert, AlertType } from '../types';
import { UserGroupIcon, ShieldCheckIcon, BellAlertIcon, RouteIcon } from '../constants';

interface ChauffeurDashboardPageProps {
  chauffeurs: Chauffeur[];
  trips: Trip[];
  alerts: TelematicsAlert[];
}

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; accentColor?: string; subtext?: string; }> =
({ title, value, icon, accentColor = 'border-primary-500 text-primary-400', subtext }) => (
  <div className={`bg-gray-800 p-4 rounded-xl shadow-lg flex items-center space-x-3 border-l-4 ${accentColor.split(' ')[1] || 'border-primary-500'}`}>
    <div className={`shrink-0 p-2.5 bg-gray-700 rounded-lg ${accentColor.split(' ')[0] || 'text-primary-400'}`}>{icon}</div>
    <div>
      <p className="text-xs sm:text-sm text-gray-400">{title}</p>
      <p className="text-xl sm:text-2xl font-semibold text-gray-100">{value}</p>
      {subtext && <p className="text-xs text-gray-500 mt-0.5">{subtext}</p>}
    </div>
  </div>
);

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


const getDaysUntilExpiry = (expiryDate?: string): number | null => {
  if (!expiryDate) return null;
  const today = new Date();
  today.setHours(0,0,0,0);
  const expDate = new Date(expiryDate);
  if (isNaN(expDate.getTime())) return null;
  return Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

const ChauffeurDashboardPage: React.FC<ChauffeurDashboardPageProps> = ({ chauffeurs, trips, alerts }) => {
  const onTripChauffeurIds = useMemo(() =>
    new Set(trips.filter(t => t.status === TripStatus.ONGOING).map(t => t.chauffeurId)),
  [trips]);

  const totalChauffeurs = chauffeurs.length;
  const onTripChauffeursCount = onTripChauffeurIds.size;
  const onLeaveChauffeursCount = Math.floor(totalChauffeurs * 0.05); // Mock data: 5% on leave
  const availableChauffeursCount = totalChauffeurs - onTripChauffeursCount - onLeaveChauffeursCount;

  const licensesExpiringSoonCount = useMemo(() =>
    chauffeurs.filter(d => {
      const days = getDaysUntilExpiry(d.dlExpiryDate);
      return days !== null && days >= 0 && days <= 30;
    }).length,
  [chauffeurs]);
  
  const safetyAlerts = useMemo(() => alerts.filter(a => [AlertType.SPEEDING, AlertType.HARSH_BRAKING].includes(a.type)), [alerts]);

  const chauffeurStatusData = useMemo(() => [
    { label: 'On Trip', value: onTripChauffeursCount, color: '#2196F3' },
    { label: 'Available', value: availableChauffeursCount, color: '#4CAF50' },
    { label: 'On Leave (Est.)', value: onLeaveChauffeursCount, color: '#FF9800' },
  ].filter(d => d.value > 0), [onTripChauffeursCount, availableChauffeursCount, onLeaveChauffeursCount]);

  const topChauffeursByAlerts = useMemo(() => {
      const chauffeurAlerts: { [key: string]: number } = {};
      alerts.forEach(alert => {
          const trip = trips.find(t => t.vehicleId === alert.vehicleId && (t.status === TripStatus.ONGOING || t.status === TripStatus.COMPLETED));
          if(trip && trip.chauffeurId) {
            chauffeurAlerts[trip.chauffeurId] = (chauffeurAlerts[trip.chauffeurId] || 0) + 1;
          }
      });

      return Object.entries(chauffeurAlerts)
        .map(([chauffeurId, count]) => ({
            name: chauffeurs.find(c => c.id === chauffeurId)?.name || 'Unknown',
            count
        }))
        .sort((a,b) => b.count - a.count)
        .slice(0, 5);

  }, [alerts, trips, chauffeurs]);

  const mostTripsByChauffeur = useMemo(() => {
    const tripCounts: { [key: string]: number } = {};
    trips.forEach(trip => {
      if(trip.chauffeurId) {
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

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-100">Chauffeur Performance Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Chauffeurs" value={totalChauffeurs} icon={<UserGroupIcon className="w-6 h-6" />} accentColor="border-sky-500 text-sky-400" />
        <StatCard title="Chauffeurs On Trip" value={onTripChauffeursCount} icon={<RouteIcon className="w-6 h-6" />} accentColor="border-blue-500 text-blue-400" />
        <StatCard title="Available Chauffeurs" value={availableChauffeursCount} icon={<UserGroupIcon className="w-6 h-6" />} accentColor="border-green-500 text-green-400" />
        <StatCard title="Licenses Expiring Soon" value={licensesExpiringSoonCount} icon={<ShieldCheckIcon className="w-6 h-6" />} accentColor="border-amber-500 text-amber-400" subtext="Next 30 days" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DonutChart data={chauffeurStatusData} title="Chauffeur Status" centerText={`${totalChauffeurs}`} />
        <div className="bg-gray-800 p-5 rounded-xl shadow-xl h-full flex flex-col">
            <h3 className="text-lg font-semibold text-gray-100 mb-3">Chauffeur Leaderboards</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-grow">
                <div>
                    <h4 className="font-semibold text-gray-300 text-sm mb-2">Most Trips Completed</h4>
                    <ul className="space-y-1.5 text-sm">
                        {mostTripsByChauffeur.map((c, i) => (
                             <li key={i} className="flex justify-between items-center p-1 bg-gray-700 rounded"><span className="text-gray-200">{c.name}</span> <span className="font-bold text-primary-300">{c.count}</span></li>
                        ))}
                    </ul>
                </div>
                <div>
                     <h4 className="font-semibold text-gray-300 text-sm mb-2">Most Safety Alerts (Mock)</h4>
                    <ul className="space-y-1.5 text-sm">
                       {topChauffeursByAlerts.map((c, i) => (
                             <li key={i} className="flex justify-between items-center p-1 bg-gray-700 rounded"><span className="text-gray-200">{c.name}</span> <span className="font-bold text-red-400">{c.count}</span></li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
      </div>

      <div className="bg-gray-800 p-5 rounded-xl shadow-xl">
        <h3 className="text-lg font-semibold text-gray-100 mb-3">Recent Safety Alerts by Chauffeur (Mock)</h3>
        {safetyAlerts.length > 0 ? (
          <ul className="space-y-2 text-sm text-gray-300">
             {safetyAlerts.slice(0,4).map((alert, i) => (
                 <li key={alert.id} className="p-2 bg-gray-750 rounded-md">
                    <strong className="text-red-400">{alert.type}:</strong> Chauffeur Rajesh Kumar (KA01XY1234) on {new Date(alert.timestamp).toLocaleDateString()}.
                 </li>
             ))}
          </ul>
        ) : (
          <p className="text-gray-500 text-sm py-4">No significant safety incidents recorded recently.</p>
        )}
        <Link to="/alerts" className="block mt-3 text-right text-xs text-primary-400 hover:text-primary-300 hover:underline">Review All Alerts &rarr;</Link>
      </div>

    </div>
  );
};

export default ChauffeurDashboardPage;