


import React, { useState, useMemo } from 'react';
// FIX: Added missing imports for SimulatedEmail and AlertType
import { SimulatedEmail, Vehicle, AlertType } from '../types';
import Modal from '../components/Modal';
import { EnvelopeIcon } from '../constants';

interface TelematicsEmailLogPageProps {
  emails: SimulatedEmail[];
  vehicles: Vehicle[];
}

const inputFieldStyle = "bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-500 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm rounded-lg p-2.5";
const labelStyle = "block text-sm font-medium text-gray-300 mb-1";

const TelematicsEmailLogPage: React.FC<TelematicsEmailLogPageProps> = ({ emails, vehicles }) => {
  const [selectedEmail, setSelectedEmail] = useState<SimulatedEmail | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterVehicleId, setFilterVehicleId] = useState('ALL');
  const [filterAlertType, setFilterAlertType] = useState<AlertType | 'ALL' | 'NONE'>('ALL');


  const handleViewEmail = (email: SimulatedEmail) => {
    setSelectedEmail(email);
  };

  const closeModal = () => {
    setSelectedEmail(null);
  };

  const filteredEmails = useMemo(() => {
    return emails.filter(email => {
      const vehicle = vehicles.find(v => v.id === email.vehicleId);
      const vehicleName = vehicle ? `${vehicle.make} ${vehicle.model} (${vehicle.licensePlate})` : '';
      
      const matchesSearch = searchTerm === '' ||
        email.recipient.toLowerCase().includes(searchTerm.toLowerCase()) ||
        email.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        email.body.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (vehicleName && vehicleName.toLowerCase().includes(searchTerm.toLowerCase()));
        
      const matchesVehicle = filterVehicleId === 'ALL' || email.vehicleId === filterVehicleId;
      
      const matchesAlertType = filterAlertType === 'ALL' || 
                             (filterAlertType === 'NONE' && !email.alertType) ||
                             email.alertType === filterAlertType;

      return matchesSearch && matchesVehicle && matchesAlertType;
    }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [emails, searchTerm, vehicles, filterVehicleId, filterAlertType]);

  const getVehicleDisplay = (vehicleId?: string | null) => {
    if (!vehicleId) return 'N/A';
    const vehicle = vehicles.find(v => v.id === vehicleId);
    return vehicle ? `${vehicle.make} ${vehicle.model} (${vehicle.licensePlate})` : 'Unknown Vehicle';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-100 flex items-center">
        <EnvelopeIcon className="w-8 h-8 mr-3 text-primary-400" />
        Telematics Email Log
      </h1>
      <p className="text-sm text-gray-400">History of simulated email notifications sent to drivers for alerts.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-800 rounded-lg shadow">
        <div>
          <label htmlFor="searchTerm" className={labelStyle}>Search Emails</label>
          <input
            type="text"
            id="searchTerm"
            placeholder="Search recipient, subject, body, vehicle..."
            className={`${inputFieldStyle} mt-1`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="filterVehicleId" className={labelStyle}>Filter by Vehicle</label>
          <select 
            id="filterVehicleId" 
            value={filterVehicleId} 
            onChange={(e) => setFilterVehicleId(e.target.value)} 
            className={`${inputFieldStyle} mt-1 pr-8`}
          >
            <option value="ALL">All Vehicles</option>
            {vehicles.map(v => <option key={v.id} value={v.id}>{v.make} {v.model} ({v.licensePlate})</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="filterAlertType" className={labelStyle}>Filter by Alert Type</label>
          <select 
            id="filterAlertType" 
            value={filterAlertType} 
            onChange={(e) => setFilterAlertType(e.target.value as AlertType | 'ALL' | 'NONE')} 
            className={`${inputFieldStyle} mt-1 pr-8`}
          >
            <option value="ALL">All Alert Types</option>
            <option value="NONE">General (No Alert)</option>
            {Object.values(AlertType).map(type => <option key={type} value={type}>{type}</option>)}
          </select>
        </div>
      </div>
      
      <div className="bg-gray-800 shadow-xl rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-gray-750">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Timestamp</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Recipient</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Subject</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Vehicle</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Alert Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-gray-800 divide-y divide-gray-700">
            {filteredEmails.map(email => (
              <tr key={email.id} className="hover:bg-gray-750 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{formatDate(email.timestamp)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{email.recipient}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 truncate max-w-xs" title={email.subject}>{email.subject}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{getVehicleDisplay(email.vehicleId)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{email.alertType || 'General'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button 
                    onClick={() => handleViewEmail(email)}
                    className="text-primary-400 hover:text-primary-300 hover:underline"
                  >
                    View Email
                  </button>
                </td>
              </tr>
            ))}
            {filteredEmails.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-10 text-gray-500">
                  No email logs found matching your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedEmail && (
        <Modal isOpen={!!selectedEmail} onClose={closeModal} title="Email Details" size="xl">
          <div className="space-y-3 text-sm">
            <p><strong className="text-gray-200">Timestamp:</strong> <span className="text-gray-300">{formatDate(selectedEmail.timestamp)}</span></p>
            <p><strong className="text-gray-200">Recipient:</strong> <span className="text-gray-300">{selectedEmail.recipient}</span></p>
            <p><strong className="text-gray-200">Subject:</strong> <span className="text-gray-300">{selectedEmail.subject}</span></p>
            {selectedEmail.vehicleId && <p><strong className="text-gray-200">Vehicle:</strong> <span className="text-gray-300">{getVehicleDisplay(selectedEmail.vehicleId)}</span></p>}
            {selectedEmail.alertType && <p><strong className="text-gray-200">Alert Type:</strong> <span className="text-gray-300">{selectedEmail.alertType}</span></p>}
            <div className="mt-2 pt-2 border-t border-gray-700">
              <h4 className="font-semibold text-gray-200 mb-1">Body:</h4>
              <pre className="bg-gray-700 p-3 rounded-md text-gray-300 whitespace-pre-wrap text-xs overflow-x-auto max-h-60">
                {selectedEmail.body}
              </pre>
            </div>
            <div className="flex justify-end mt-4">
                <button onClick={closeModal} className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-600 hover:bg-gray-500 rounded-lg shadow-sm transition-colors">
                    Close
                </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default TelematicsEmailLogPage;