import React, { useState, useMemo } from 'react';
import { Trip, TripStatus, TripDispatchStatus, TripType } from '../../types';
import Modal from '../../components/Modal';
import { CalendarDaysIcon } from '../../constants';

interface PoolTripRequestsPageProps {
  trips: Trip[];
  addTrip: (trip: Omit<Trip, 'id'>) => void;
}

const inputFieldStyle = "bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-500 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm rounded-lg p-2.5";
const labelStyle = "block text-sm font-medium text-gray-300 mb-1";
const buttonPrimaryStyle = "px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-md transition-colors";
const buttonSecondaryStyle = "px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-lg shadow-sm transition-colors";

interface TripRequestFormProps {
  onSubmit: (trip: Omit<Trip, 'id'>) => void;
  onCancel: () => void;
}

const TripRequestForm: React.FC<TripRequestFormProps> = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    tripName: '',
    origin: '',
    destination: '',
    scheduledStartDate: new Date().toISOString().slice(0, 16),
    tripType: TripType.AD_HOC,
    otherTripTypeDetail: '',
    guestName: '',
    guestEmail: '',
    guestPhone: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.tripName || !formData.origin || !formData.destination || !formData.guestName) {
      alert("Please fill all required fields (*).");
      return;
    }
    const newTrip: Omit<Trip, 'id'> = {
      ...formData,
      vehicleId: null,
      chauffeurId: null,
      waypoints: [],
      status: TripStatus.PLANNED,
      dispatchStatus: TripDispatchStatus.PENDING,
      scheduledStartDate: new Date(formData.scheduledStartDate).toISOString(),
    };
    onSubmit(newTrip);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="tripName" className={labelStyle}>Trip Name / Purpose *</label>
        <input type="text" name="tripName" value={formData.tripName} onChange={handleChange} required className={inputFieldStyle} />
      </div>
       <div>
        <label htmlFor="tripType" className={labelStyle}>Trip Type *</label>
        <select name="tripType" value={formData.tripType} onChange={handleChange} required className={inputFieldStyle}>
            {Object.values(TripType).map(type => <option key={type} value={type}>{type}</option>)}
        </select>
      </div>
      {formData.tripType === TripType.OTHER && (
        <div>
            <label htmlFor="otherTripTypeDetail" className={labelStyle}>Other Trip Type Details *</label>
            <textarea name="otherTripTypeDetail" value={formData.otherTripTypeDetail} onChange={handleChange} required rows={2} className={inputFieldStyle} />
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="origin" className={labelStyle}>Origin *</label>
          <input type="text" name="origin" value={formData.origin} onChange={handleChange} required className={inputFieldStyle} />
        </div>
        <div>
          <label htmlFor="destination" className={labelStyle}>Destination *</label>
          <input type="text" name="destination" value={formData.destination} onChange={handleChange} required className={inputFieldStyle} />
        </div>
      </div>
      <div className="pt-4 border-t border-gray-600">
        <h3 className="text-md font-medium text-gray-200 mb-2">Guest Details</h3>
         <div>
            <label htmlFor="guestName" className={labelStyle}>Guest Name *</label>
            <input type="text" name="guestName" value={formData.guestName} onChange={handleChange} required className={inputFieldStyle} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
                <label htmlFor="guestEmail" className={labelStyle}>Guest Email ID</label>
                <input type="email" name="guestEmail" value={formData.guestEmail} onChange={handleChange} className={inputFieldStyle} />
            </div>
            <div>
                <label htmlFor="guestPhone" className={labelStyle}>Guest Phone Number</label>
                <input type="tel" name="guestPhone" value={formData.guestPhone} onChange={handleChange} className={inputFieldStyle} />
            </div>
        </div>
      </div>
      <div>
        <label htmlFor="scheduledStartDate" className={labelStyle}>Scheduled Start Date & Time *</label>
        <input type="datetime-local" name="scheduledStartDate" value={formData.scheduledStartDate} onChange={handleChange} required className={`${inputFieldStyle} dark:[color-scheme:dark]`} />
      </div>
      <div className="flex justify-end space-x-3 pt-4">
        <button type="button" onClick={onCancel} className={buttonSecondaryStyle}>Cancel</button>
        <button type="submit" className={buttonPrimaryStyle}>Create Request</button>
      </div>
    </form>
  );
};


const PoolTripRequestsPage: React.FC<PoolTripRequestsPageProps> = ({ trips, addTrip }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const poolTrips = useMemo(() =>
    trips.filter(t => t.dispatchStatus)
         .sort((a, b) => new Date(b.scheduledStartDate).getTime() - new Date(a.scheduledStartDate).getTime()),
    [trips]
  );

  const getStatusPillClass = (status?: TripDispatchStatus) => {
    switch (status) {
      case TripDispatchStatus.PENDING: return 'bg-gray-600 text-gray-200';
      case TripDispatchStatus.AWAITING_ACCEPTANCE: return 'bg-yellow-700 bg-opacity-40 text-yellow-300';
      case TripDispatchStatus.ACCEPTED: return 'bg-green-700 bg-opacity-40 text-green-300';
      case TripDispatchStatus.REJECTED: return 'bg-red-700 bg-opacity-40 text-red-300';
      default: return 'bg-gray-700 bg-opacity-30 text-gray-300';
    }
  };

  const formatDate = (isoString: string) => new Date(isoString).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h1 className="text-3xl font-bold text-gray-100 flex items-center">
          <CalendarDaysIcon className="w-8 h-8 mr-3 text-primary-400" /> Pool Trip Requests
        </h1>
        <button onClick={() => setIsModalOpen(true)} className={`${buttonPrimaryStyle} flex items-center`}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-2"><path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" /></svg>
          Create New Trip Request
        </button>
      </div>
      
      <p className="text-gray-400">Create and monitor unassigned trips that need to be dispatched to pool chauffeurs.</p>

      <div className="bg-gray-800 shadow-xl rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-gray-750">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Trip Purpose</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Trip Type</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Guest Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Route</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Scheduled Start</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Dispatch Status</th>
            </tr>
          </thead>
          <tbody className="bg-gray-800 divide-y divide-gray-700">
            {poolTrips.map(trip => (
              <tr key={trip.id} className="hover:bg-gray-750">
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-200">{trip.tripName}</td>
                 <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">{trip.tripType === TripType.OTHER ? trip.otherTripTypeDetail : trip.tripType}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">{trip.guestName || 'N/A'}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
                  {trip.origin} &rarr; {trip.destination}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">{formatDate(trip.scheduledStartDate)}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusPillClass(trip.dispatchStatus)}`}>
                    {trip.dispatchStatus}
                  </span>
                </td>
              </tr>
            ))}
            {poolTrips.length === 0 && (
              <tr><td colSpan={6} className="text-center py-10 text-gray-500">No pool trip requests found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Pool Trip Request">
        <TripRequestForm
          onSubmit={(data) => { addTrip(data); setIsModalOpen(false); }}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  );
};

export default PoolTripRequestsPage;