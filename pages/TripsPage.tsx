

import React, { useState, useMemo, useCallback } from 'react';
import { Trip, Vehicle, Chauffeur, Waypoint, TripStatus, SuggestedStop, VehicleStatus, CostCategory, CostEntry, Location } from '../types'; // Added VehicleStatus
import Modal from '../components/Modal';
import { getTripSuggestionsFromGemini } from '../services/geminiService';
import { RouteIcon, ArrowDownTrayIcon, MapPinIcon } from '../constants'; 
import { exportToCsv } from '../services/reportService';

const generateMockId = () => Math.random().toString(36).substring(2, 10);

interface TripsPageProps {
  trips: Trip[];
  vehicles: Vehicle[];
  chauffeurs: Chauffeur[];
  costCategories: CostCategory[]; 
  addTrip: (trip: Omit<Trip, 'id'>) => void;
  updateTrip: (trip: Trip) => void;
  cancelTrip: (tripId: string) => void;
}

const initialTripFormState: Omit<Trip, 'id'> = {
  tripName: '',
  vehicleId: null,
  chauffeurId: null,
  origin: '',
  destination: '',
  waypoints: [],
  scheduledStartDate: new Date().toISOString().split('T')[0] + 'T09:00', 
  status: TripStatus.PLANNED,
  routeSuggestion: '',
  suggestedStops: [],
  estimatedDistanceKm: 0,
  estimatedDuration: '',
  tripCosts: [],
};

// Common style for input fields in dark theme
const inputFieldStyle = "bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-500 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm rounded-lg p-2.5";
const labelStyle = "block text-sm font-medium text-gray-300 mb-1";
const buttonPrimaryStyle = "px-6 py-2.5 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-md transition-colors";
const buttonSecondaryStyle = "px-6 py-2.5 text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-lg shadow-sm transition-colors";
const buttonSmallActionStyle = "text-xs py-1.5 px-3 rounded-md transition-colors";


interface TripFormProps {
  onSubmit: (trip: Omit<Trip, 'id'>) => void;
  onCancel: () => void;
  initialData?: Trip | null;
  vehicles: Vehicle[];
  chauffeurs: Chauffeur[];
  costCategories: CostCategory[];
}

const TripForm: React.FC<TripFormProps> = ({ onSubmit, onCancel, initialData, vehicles, chauffeurs, costCategories }) => {
  const [formData, setFormData] = useState<Omit<Trip, 'id'>>(
    initialData ? JSON.parse(JSON.stringify(initialData)) : JSON.parse(JSON.stringify(initialTripFormState))
  );
  const [isFetchingAISuggestions, setIsFetchingAISuggestions] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: (name === 'vehicleId' || name === 'chauffeurId') && value === "" ? null :
               name === 'estimatedDistanceKm' ? parseInt(value, 10) || 0 : value
    }));
  };

  const handleWaypointChange = (index: number, field: keyof Waypoint, value: string) => {
    const updatedWaypoints = [...(formData.waypoints || [])];
    updatedWaypoints[index] = { ...updatedWaypoints[index], [field]: value };
    setFormData(prev => ({ ...prev, waypoints: updatedWaypoints }));
  };

  const addWaypoint = () => {
    const newWaypoint: Waypoint = { id: generateMockId(), address: '', sequence: (formData.waypoints?.length || 0) + 1, purpose: '' };
    setFormData(prev => ({ ...prev, waypoints: [...(prev.waypoints || []), newWaypoint] }));
  };

  const removeWaypoint = (index: number) => {
    setFormData(prev => ({ ...prev, waypoints: (prev.waypoints || []).filter((_, i) => i !== index) }));
  };
  
  const handleSuggestedStopChange = (index: number, field: keyof SuggestedStop, value: string | number) => {
    const updatedStops = [...(formData.suggestedStops || [])];
    updatedStops[index] = { ...updatedStops[index], [field]: value } as SuggestedStop;
    setFormData(prev => ({ ...prev, suggestedStops: updatedStops }));
  };

  const addSuggestedStop = () => {
    const newStop: SuggestedStop = { id: generateMockId(), name: '', type: 'Other', locationHint:'' };
    setFormData(prev => ({ ...prev, suggestedStops: [...(prev.suggestedStops || []), newStop] }));
  };

  const removeSuggestedStop = (index: number) => {
     setFormData(prev => ({ ...prev, suggestedStops: (prev.suggestedStops || []).filter((_, i) => i !== index) }));
  };

  const handleTripCostChange = (index: number, field: keyof CostEntry, value: string | number) => {
    const updatedTripCosts = [...(formData.tripCosts || [])];
    const valToSet = field === 'amount' ? Number(value) : value;
    updatedTripCosts[index] = { ...updatedTripCosts[index], [field]: valToSet };
    setFormData(prev => ({ ...prev, tripCosts: updatedTripCosts }));
  };

  const addTripCost = () => {
    const newCostEntry: CostEntry = { 
        id: generateMockId(), 
        date: new Date().toISOString().split('T')[0], 
        costCategoryId: costCategories.length > 0 ? costCategories[0].id : '', 
        amount: 0, 
        description: '',
        vehicleId: formData.vehicleId || '',
        tripId: '', // will be set on submit
    };
    setFormData(prev => ({ ...prev, tripCosts: [...(prev.tripCosts || []), newCostEntry] }));
  };

  const removeTripCost = (index: number) => {
    setFormData(prev => ({ ...prev, tripCosts: (prev.tripCosts || []).filter((_, i) => i !== index) }));
  };


  const fetchAISuggestions = async () => {
    if (!formData.origin || !formData.destination) {
      setAiError("Please enter Origin and Destination before fetching AI suggestions.");
      return;
    }
    setIsFetchingAISuggestions(true);
    setAiError(null);
    const waypointAddresses = (formData.waypoints || []).map(wp => wp.address).filter(Boolean);
    const selectedVehicle = vehicles.find(v => v.id === formData.vehicleId);
    const vehicleType = selectedVehicle ? `${selectedVehicle.make} ${selectedVehicle.model}` : 'commercial truck';

    const result = await getTripSuggestionsFromGemini(formData.origin, formData.destination, waypointAddresses, vehicleType);
    if (result.error) {
      setAiError(result.error);
    } else {
      setFormData(prev => ({
        ...prev,
        routeSuggestion: result.routeSuggestion || prev.routeSuggestion,
        suggestedStops: result.suggestedStops && result.suggestedStops.length > 0 ? result.suggestedStops : prev.suggestedStops,
        estimatedDistanceKm: result.estimatedDistance ? parseInt(result.estimatedDistance.replace(/\D/g,''),10) || prev.estimatedDistanceKm : prev.estimatedDistanceKm,
        estimatedDuration: result.estimatedDuration || prev.estimatedDuration,
      }));
    }
    setIsFetchingAISuggestions(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.tripName || !formData.origin || !formData.destination || !formData.scheduledStartDate) {
      alert("Please fill in Trip Name, Origin, Destination, and Scheduled Start Date.");
      return;
    }
    const waypointsWithIds = (formData.waypoints || []).map(wp => ({...wp, id: wp.id || generateMockId() }));
    const stopsWithIds = (formData.suggestedStops || []).map(st => ({...st, id: st.id || generateMockId() }));
    const costsWithIds = (formData.tripCosts || []).map(tc => ({...tc, id: tc.id || generateMockId()}));

    onSubmit({...formData, waypoints: waypointsWithIds, suggestedStops: stopsWithIds, tripCosts: costsWithIds});
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-sm">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="tripName" className={labelStyle}>Trip Name *</label>
          <input type="text" name="tripName" id="tripName" value={formData.tripName} onChange={handleChange} required className={`${inputFieldStyle} mt-1`} />
        </div>
        <div>
            <label htmlFor="scheduledStartDate" className={labelStyle}>Scheduled Start Date & Time *</label>
            <input type="datetime-local" name="scheduledStartDate" id="scheduledStartDate" value={formData.scheduledStartDate ? formData.scheduledStartDate.substring(0,16) : ''} onChange={handleChange} required className={`${inputFieldStyle} mt-1 dark:[color-scheme:dark]`} />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="vehicleId" className={labelStyle}>Assign Vehicle</label>
          <select name="vehicleId" id="vehicleId" value={formData.vehicleId || ""} onChange={handleChange} className={`${inputFieldStyle} mt-1 pr-8`}>
            <option value="">Select Vehicle</option>
            {vehicles.filter(v => v.status === VehicleStatus.ACTIVE || v.status === VehicleStatus.MAINTENANCE).map(v => (
              <option key={v.id} value={v.id}>{v.make} {v.model} ({v.licensePlate})</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="chauffeurId" className={labelStyle}>Assign Chauffeur</label>
          <select name="chauffeurId" id="chauffeurId" value={formData.chauffeurId || ""} onChange={handleChange} className={`${inputFieldStyle} mt-1 pr-8`}>
            <option value="">Select Chauffeur</option>
            {chauffeurs.map(d => (
              <option key={d.id} value={d.id}>{d.name} ({d.licenseNumber})</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label htmlFor="origin" className={labelStyle}>Origin Address *</label>
        <input type="text" name="origin" id="origin" value={formData.origin} onChange={handleChange} required className={`${inputFieldStyle} mt-1`} placeholder="e.g., Mumbai Port, Maharashtra"/>
      </div>
      <div>
        <label htmlFor="destination" className={labelStyle}>Destination Address *</label>
        <input type="text" name="destination" id="destination" value={formData.destination} onChange={handleChange} required className={`${inputFieldStyle} mt-1`} placeholder="e.g., Jaipur Market, Rajasthan"/>
      </div>

      <fieldset className="border border-gray-700 p-3 rounded-md">
        <legend className="text-md font-medium text-gray-300 px-1">Waypoints (Multi-Stops)</legend>
        {(formData.waypoints || []).map((waypoint, index) => (
          <div key={waypoint.id || index} className="grid grid-cols-1 md:grid-cols-6 gap-2 mb-2 p-2 border-b border-gray-700 last:border-b-0">
            <input type="text" placeholder={`Stop ${index + 1} Address`} value={waypoint.address} onChange={(e) => handleWaypointChange(index, 'address', e.target.value)} className={`md:col-span-3 ${inputFieldStyle}`} />
            <input type="text" placeholder="Purpose (e.g., Pickup)" value={waypoint.purpose || ''} onChange={(e) => handleWaypointChange(index, 'purpose', e.target.value)} className={`md:col-span-2 ${inputFieldStyle}`} />
            <button type="button" onClick={() => removeWaypoint(index)} className={`${buttonSmallActionStyle} text-red-400 hover:text-red-300 hover:bg-red-700 bg-opacity-20 md:col-span-1 self-center`}>Remove</button>
          </div>
        ))}
        <button type="button" onClick={addWaypoint} className={`${buttonSmallActionStyle} mt-2 bg-sky-700 bg-opacity-50 text-sky-300 hover:bg-sky-600`}>Add Waypoint</button>
      </fieldset>
      
      <div className="my-4 p-3 bg-gray-750 rounded-md border border-gray-600">
        <button 
            type="button" 
            onClick={fetchAISuggestions} 
            disabled={isFetchingAISuggestions}
            className="w-full bg-sky-600 hover:bg-sky-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-150 ease-in-out disabled:opacity-60 flex items-center justify-center"
        >
            {isFetchingAISuggestions ? (
                <><svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Fetching AI Suggestions...</>
            ) : "Get AI Route & Stop Suggestions"}
        </button>
        {aiError && <p className="mt-2 text-xs text-red-400 bg-red-900 bg-opacity-30 p-2 rounded">{aiError}</p>}
      </div>

      <div>
        <label htmlFor="routeSuggestion" className={labelStyle}>AI Route Suggestion (Editable)</label>
        <textarea name="routeSuggestion" id="routeSuggestion" value={formData.routeSuggestion || ''} onChange={handleChange} rows={3} className={`${inputFieldStyle} mt-1`} placeholder="AI suggestions will appear here..."/>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
            <label htmlFor="estimatedDistanceKm" className={labelStyle}>Est. Distance (km)</label>
            <input type="number" name="estimatedDistanceKm" id="estimatedDistanceKm" value={formData.estimatedDistanceKm || ''} onChange={handleChange} className={`${inputFieldStyle} mt-1`} />
        </div>
        <div>
            <label htmlFor="estimatedDuration" className={labelStyle}>Est. Duration</label>
            <input type="text" name="estimatedDuration" id="estimatedDuration" value={formData.estimatedDuration || ''} onChange={handleChange} className={`${inputFieldStyle} mt-1`} placeholder="e.g., 8 hours 15 mins" />
        </div>
      </div>

       <fieldset className="border border-gray-700 p-3 rounded-md mt-4">
        <legend className="text-md font-medium text-gray-300 px-1">Suggested Stops (Editable)</legend>
        {(formData.suggestedStops || []).map((stop, index) => (
          <div key={stop.id || index} className="grid grid-cols-1 md:grid-cols-7 gap-2 mb-2 p-2 border-b border-gray-700 last:border-b-0 items-center">
            <input type="text" placeholder="Stop Name" value={stop.name} onChange={(e) => handleSuggestedStopChange(index, 'name', e.target.value)} className={`md:col-span-2 ${inputFieldStyle}`} />
            <select value={stop.type} onChange={(e) => handleSuggestedStopChange(index, 'type', e.target.value)} className={`md:col-span-1 ${inputFieldStyle} pr-8`}>
                <option value="Toll">Toll</option>
                <option value="Fuel">Fuel</option>
                <option value="Rest Area">Rest Area</option>
                <option value="Other">Other</option>
            </select>
            <input type="number" placeholder="Cost (INR)" value={stop.estimatedCost || ''} onChange={(e) => handleSuggestedStopChange(index, 'estimatedCost', parseInt(e.target.value) || 0)} className={`md:col-span-1 ${inputFieldStyle}`} disabled={stop.type !== 'Toll'} />
            <input type="text" placeholder="Notes/Hint" value={stop.notes || ''} onChange={(e) => handleSuggestedStopChange(index, 'notes', e.target.value)} className={`md:col-span-2 ${inputFieldStyle}`} />
            <button type="button" onClick={() => removeSuggestedStop(index)} className={`${buttonSmallActionStyle} text-red-400 hover:text-red-300 hover:bg-red-700 bg-opacity-20 md:col-span-1 self-center`}>Remove</button>
          </div>
        ))}
        <button type="button" onClick={addSuggestedStop} className={`${buttonSmallActionStyle} mt-2 bg-emerald-700 bg-opacity-50 text-emerald-300 hover:bg-emerald-600`}>Add Custom Stop</button>
      </fieldset>
      
        <fieldset className="border border-gray-700 p-3 rounded-md mt-4">
            <legend className="text-md font-medium text-gray-300 px-1">Trip Specific Costs</legend>
            {(formData.tripCosts || []).map((cost, index) => (
                <div key={cost.id || index} className="grid grid-cols-1 md:grid-cols-8 gap-2 mb-2 p-2 border-b border-gray-700 last:border-b-0 items-center">
                    <input 
                        type="date" 
                        value={cost.date ? cost.date.substring(0,10) : ''} 
                        onChange={(e) => handleTripCostChange(index, 'date', e.target.value)} 
                        className={`md:col-span-2 ${inputFieldStyle} dark:[color-scheme:dark]`}
                    />
                    <select 
                        value={cost.costCategoryId} 
                        onChange={(e) => handleTripCostChange(index, 'costCategoryId', e.target.value)} 
                        className={`md:col-span-2 ${inputFieldStyle} pr-8`}
                    >
                        <option value="">Select Category</option>
                        {costCategories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                    </select>
                    <input 
                        type="number" 
                        placeholder="Amount" 
                        value={cost.amount} 
                        onChange={(e) => handleTripCostChange(index, 'amount', e.target.value)} 
                        className={`md:col-span-1 ${inputFieldStyle}`} 
                    />
                    <input 
                        type="text" 
                        placeholder="Description" 
                        value={cost.description || ''} 
                        onChange={(e) => handleTripCostChange(index, 'description', e.target.value)} 
                        className={`md:col-span-2 ${inputFieldStyle}`} 
                    />
                    <button type="button" onClick={() => removeTripCost(index)} className={`${buttonSmallActionStyle} text-red-400 hover:text-red-300 hover:bg-red-700 bg-opacity-20 md:col-span-1 self-center`}>Remove</button>
                </div>
            ))}
            <button type="button" onClick={addTripCost} className={`${buttonSmallActionStyle} mt-2 bg-rose-700 bg-opacity-50 text-rose-300 hover:bg-rose-600`}>Add Trip Cost</button>
        </fieldset>

      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-700 mt-4">
        <button type="button" onClick={onCancel} className={buttonSecondaryStyle}>Cancel</button>
        <button type="submit" className={buttonPrimaryStyle}>
          {initialData ? 'Update Trip' : 'Plan Trip'}
        </button>
      </div>
    </form>
  );
};


const TripsPage: React.FC<TripsPageProps> = ({ trips, vehicles, chauffeurs, costCategories, addTrip, updateTrip, cancelTrip }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [selectedTripDetails, setSelectedTripDetails] = useState<Trip | null>(null);
  const [filterStatus, setFilterStatus] = useState<TripStatus | 'ALL'>('ALL');

  const openAddModal = () => {
    setEditingTrip(null);
    setIsModalOpen(true);
  };

  const openEditModal = (trip: Trip) => {
    setEditingTrip(trip);
    setSelectedTripDetails(null); 
    setIsModalOpen(true);
  };
  
  const viewTripDetails = (trip: Trip) => {
    setSelectedTripDetails(trip);
    setEditingTrip(null); 
    setIsModalOpen(true); 
  }

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTrip(null);
    setSelectedTripDetails(null);
  };

  const handleFormSubmit = (tripData: Omit<Trip, 'id'>) => {
    if (editingTrip) {
      updateTrip({ ...editingTrip, ...tripData });
    } else {
      addTrip(tripData);
    }
    closeModal();
  };

  const handleUpdateTripStatus = (tripId: string, status: TripStatus) => {
    const trip = trips.find(t => t.id === tripId);
    if (trip) {
        let mutableTrip = {...trip, status}; 
        if(status === TripStatus.ONGOING && !mutableTrip.actualStartDate) {
            mutableTrip.actualStartDate = new Date().toISOString();
        } else if (status === TripStatus.COMPLETED && !mutableTrip.actualEndDate) {
            mutableTrip.actualEndDate = new Date().toISOString();
            if(!mutableTrip.actualStartDate) { 
                mutableTrip.actualStartDate = mutableTrip.actualEndDate; 
            }
        }
        updateTrip(mutableTrip); 
        if(selectedTripDetails?.id === tripId) { 
            setSelectedTripDetails(mutableTrip); 
        }
    }
  };
  
  const handleCancelTrip = (tripId: string) => {
    if (window.confirm('Are you sure you want to cancel this trip?')) {
        cancelTrip(tripId);
         if(selectedTripDetails?.id === tripId) { 
            setSelectedTripDetails(prev => prev ? {...prev, status: TripStatus.CANCELLED } : null);
        }
    }
  };

  const filteredTrips = useMemo(() => {
    if (filterStatus === 'ALL') return trips;
    return trips.filter(trip => trip.status === filterStatus);
  }, [trips, filterStatus]);

  const getVehicleInfo = useCallback((vehicleId: string | null) => vehicles.find(v => v.id === vehicleId), [vehicles]);
  const getChauffeurInfo = useCallback((chauffeurId: string | null) => chauffeurs.find(d => d.id === chauffeurId), [chauffeurs]);
  const getCostCategoryName = useCallback((categoryId: string) => costCategories.find(c => c.id === categoryId)?.name || 'Unknown Category', [costCategories]);

  const formatDate = (dateString?: string, includeTime = true) => {
    if (!dateString) return 'N/A';
    try {
      const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
      if (includeTime) {
        options.hour = '2-digit';
        options.minute = '2-digit';
        options.hour12 = true;
      }
      return new Date(dateString).toLocaleDateString('en-IN', options);
    } catch { return 'Invalid Date'; }
  };
  
  const getStatusColor = (status: TripStatus) => {
    switch (status) {
      case TripStatus.PLANNED: return 'bg-blue-700 bg-opacity-30 text-blue-300';
      case TripStatus.ONGOING: return 'bg-yellow-700 bg-opacity-30 text-yellow-300';
      case TripStatus.COMPLETED: return 'bg-green-700 bg-opacity-30 text-green-300';
      case TripStatus.CANCELLED: return 'bg-red-700 bg-opacity-30 text-red-300';
      case TripStatus.DELAYED: return 'bg-orange-700 bg-opacity-30 text-orange-300';
      default: return 'bg-gray-700 bg-opacity-30 text-gray-300';
    }
  };
  
  const handleDownloadReport = useCallback(() => {
    const dataToExport = filteredTrips.map(trip => {
      const vehicle = getVehicleInfo(trip.vehicleId);
      const chauffeur = getChauffeurInfo(trip.chauffeurId);
      return {
        tripName: trip.tripName,
        status: trip.status,
        origin: trip.origin,
        destination: trip.destination,
        scheduledStartDate: formatDate(trip.scheduledStartDate),
        vehicle: vehicle ? `${vehicle.make} ${vehicle.model} (${vehicle.licensePlate})` : 'N/A',
        chauffeur: chauffeur ? chauffeur.name : 'N/A',
        estimatedDistanceKm: trip.estimatedDistanceKm || 'N/A',
        estimatedDuration: trip.estimatedDuration || 'N/A',
        totalCost: (trip.tripCosts || []).reduce((sum, cost) => sum + cost.amount, 0),
      };
    });

    const headers = [
      { key: 'tripName', label: 'Trip Name' },
      { key: 'status', label: 'Status' },
      { key: 'origin', label: 'Origin' },
      { key: 'destination', label: 'Destination' },
      { key: 'scheduledStartDate', label: 'Scheduled Start' },
      { key: 'vehicle', label: 'Vehicle' },
      { key: 'chauffeur', label: 'Chauffeur' },
      { key: 'estimatedDistanceKm', label: 'Est. Distance (km)' },
      { key: 'estimatedDuration', label: 'Est. Duration' },
      { key: 'totalCost', label: 'Total Logged Cost (INR)' },
    ];
    
    exportToCsv(`fleetpro_trips_report_${new Date().toISOString().split('T')[0]}.csv`, dataToExport, headers);
  }, [filteredTrips, getVehicleInfo, getChauffeurInfo, formatDate]);


  const TripDetailModal: React.FC<{ trip: Trip; onClose: () => void }> = ({ trip, onClose }) => {
    const vehicle = getVehicleInfo(trip.vehicleId);
    const chauffeur = getChauffeurInfo(trip.chauffeurId);
    const totalTripCost = trip.tripCosts?.reduce((sum, cost) => sum + cost.amount, 0) || 0;

    return (
        <Modal isOpen={true} onClose={onClose} title={`Trip Details: ${trip.tripName}`} size="xl">
            <div className="space-y-3 text-sm text-gray-300">
                <p><strong>Status:</strong> <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusColor(trip.status)}`}>{trip.status}</span></p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
                    <p><strong className="text-gray-200">Origin:</strong> {trip.origin}</p>
                    <p><strong className="text-gray-200">Destination:</strong> {trip.destination}</p>
                    <p><strong className="text-gray-200">Scheduled Start:</strong> {formatDate(trip.scheduledStartDate)}</p>
                    {trip.scheduledEndDate && <p><strong className="text-gray-200">Scheduled End:</strong> {formatDate(trip.scheduledEndDate)}</p>}
                    {trip.actualStartDate && <p><strong className="text-gray-200">Actual Start:</strong> {formatDate(trip.actualStartDate)}</p>}
                    {trip.actualEndDate && <p><strong className="text-gray-200">Actual End:</strong> {formatDate(trip.actualEndDate)}</p>}
                     {trip.actualStartLocation && (
                        <p className="flex items-center col-span-1"><strong className="text-gray-200 mr-2">Actual Start Location:</strong>
                            <a href={`https://www.google.com/maps?q=${trip.actualStartLocation.lat},${trip.actualStartLocation.lon}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-primary-400 hover:underline">
                                <MapPinIcon className="w-4 h-4 mr-1"/>
                                ({trip.actualStartLocation.lat.toFixed(4)}, {trip.actualStartLocation.lon.toFixed(4)})
                            </a>
                        </p>
                    )}
                    {trip.actualEndLocation && (
                        <p className="flex items-center col-span-1"><strong className="text-gray-200 mr-2">Actual End Location:</strong>
                            <a href={`https://www.google.com/maps?q=${trip.actualEndLocation.lat},${trip.actualEndLocation.lon}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-primary-400 hover:underline">
                                <MapPinIcon className="w-4 h-4 mr-1"/>
                                ({trip.actualEndLocation.lat.toFixed(4)}, {trip.actualEndLocation.lon.toFixed(4)})
                            </a>
                        </p>
                    )}
                    <p><strong className="text-gray-200">Vehicle:</strong> {vehicle ? `${vehicle.make} ${vehicle.model} (${vehicle.licensePlate})` : 'N/A'}</p>
                    <p><strong className="text-gray-200">Chauffeur:</strong> {chauffeur ? `${chauffeur.name} (${chauffeur.licenseNumber})` : 'N/A'}</p>
                    {trip.estimatedDistanceKm && <p><strong className="text-gray-200">Est. Distance:</strong> {trip.estimatedDistanceKm} km</p>}
                    {trip.estimatedDuration && <p><strong className="text-gray-200">Est. Duration:</strong> {trip.estimatedDuration}</p>}
                </div>
                
                {trip.waypoints && trip.waypoints.length > 0 && (
                    <div>
                        <h4 className="font-semibold mt-2 text-gray-200">Waypoints:</h4>
                        <ul className="list-decimal list-inside ml-4 bg-gray-750 p-2 rounded">
                            {trip.waypoints.map(wp => <li key={wp.id}><strong className="text-gray-100">{wp.address}</strong> {wp.purpose && `(${wp.purpose})`} {wp.notes && `- ${wp.notes}`}</li>)}
                        </ul>
                    </div>
                )}

                {trip.routeSuggestion && <div className="mt-2 p-2 bg-sky-900 bg-opacity-30 rounded"><h4 className="font-semibold text-sky-300">AI Route Suggestion:</h4><p className="whitespace-pre-wrap">{trip.routeSuggestion}</p></div>}
               
                {trip.suggestedStops && trip.suggestedStops.length > 0 && (
                    <div>
                        <h4 className="font-semibold mt-2 text-gray-200">Suggested Stops (AI):</h4>
                        <ul className="list-disc list-inside ml-4 bg-amber-900 bg-opacity-30 p-2 rounded">
                            {trip.suggestedStops.map(stop => (
                                <li key={stop.id}>
                                    <strong className="text-amber-200">{stop.name}</strong> ({stop.type})
                                    {stop.type === 'Toll' && stop.estimatedCost && ` - Est. Cost: ₹${stop.estimatedCost}`}
                                    {stop.notes && ` - ${stop.notes}`}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                 {trip.tripCosts && trip.tripCosts.length > 0 && (
                    <div>
                        <h4 className="font-semibold mt-2 text-gray-200">Logged Trip Costs:</h4>
                        <ul className="list-disc list-inside ml-4 bg-rose-900 bg-opacity-30 p-2 rounded">
                            {trip.tripCosts.map(cost => (
                                <li key={cost.id}>
                                    <strong className="text-rose-200">{getCostCategoryName(cost.costCategoryId)}:</strong> ₹{cost.amount.toLocaleString()}
                                    {cost.description && ` (${cost.description})`}
                                    <span className="text-xs text-gray-400"> - {formatDate(cost.date, false)}</span>
                                </li>
                            ))}
                        </ul>
                        <p className="font-semibold mt-1 text-gray-100">Total Trip Cost: ₹{totalTripCost.toLocaleString()}</p>
                    </div>
                )}

                <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-gray-700">
                    {trip.status === TripStatus.PLANNED && <button onClick={() => handleUpdateTripStatus(trip.id, TripStatus.ONGOING)} className="btn-sm btn-yellow">Start Trip</button>}
                    {trip.status === TripStatus.ONGOING && <button onClick={() => handleUpdateTripStatus(trip.id, TripStatus.COMPLETED)} className="btn-sm btn-green">Mark Completed</button>}
                    {trip.status === TripStatus.ONGOING && <button onClick={() => handleUpdateTripStatus(trip.id, TripStatus.DELAYED)} className="btn-sm btn-orange">Mark Delayed</button>}
                    {(trip.status === TripStatus.PLANNED || trip.status === TripStatus.DELAYED) && <button onClick={() => openEditModal(trip)} className="btn-sm btn-blue">Edit</button>}
                    {trip.status !== TripStatus.COMPLETED && trip.status !== TripStatus.CANCELLED && <button onClick={() => handleCancelTrip(trip.id)} className="btn-sm btn-red">Cancel Trip</button>}
                </div>
                 <style>{`
                    .btn-sm { padding: 0.3rem 0.8rem; border-radius: 0.25rem; font-weight: 500; transition: background-color 0.2s; }
                    .btn-yellow { background-color: #ca8a04; color: white; } .btn-yellow:hover { background-color: #a16207; } /* Tailwind yellow-600, yellow-700 */
                    .btn-green { background-color: #16a34a; color: white; } .btn-green:hover { background-color: #15803d; } /* Tailwind green-600, green-700 */
                    .btn-orange { background-color: #ea580c; color: white; } .btn-orange:hover { background-color: #c2410c; }/* Tailwind orange-600, orange-700 */
                    .btn-blue { background-color: #2563eb; color: white; } .btn-blue:hover { background-color: #1d4ed8; } /* Tailwind blue-600, blue-700 */
                    .btn-red { background-color: #dc2626; color: white; } .btn-red:hover { background-color: #b91c1c; } /* Tailwind red-600, red-700 */
                `}</style>
            </div>
        </Modal>
    );
  }


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h1 className="text-3xl font-bold text-gray-100 flex items-center">
            <RouteIcon className="w-8 h-8 mr-3 text-primary-400"/> Trip & Route Management
        </h1>
        <div className="flex items-center gap-4">
            <button onClick={handleDownloadReport} className="bg-gray-700 hover:bg-gray-600 text-gray-200 font-semibold py-2.5 px-5 rounded-lg shadow-md transition-colors duration-150 ease-in-out flex items-center">
              <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
              Download Report
            </button>
            <button
              onClick={openAddModal}
              className={`${buttonPrimaryStyle} flex items-center`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-2"><path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" /></svg>
              Plan New Trip
            </button>
        </div>
      </div>

      <div className="flex items-center space-x-3 bg-gray-800 p-3 rounded-lg shadow">
        <label htmlFor="filterStatus" className="text-sm font-medium text-gray-300">Filter by Status:</label>
        <select 
            id="filterStatus" 
            name="filterStatus" 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value as TripStatus | 'ALL')}
            className={`${inputFieldStyle} text-sm py-1.5 pr-8`}
        >
            <option value="ALL">All Statuses</option>
            {Object.values(TripStatus).map(status => (
                <option key={status} value={status}>{status}</option>
            ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTrips.map(trip => {
          const vehicle = getVehicleInfo(trip.vehicleId);
          const chauffeur = getChauffeurInfo(trip.chauffeurId);
          return (
            <div key={trip.id} className="bg-gray-800 rounded-xl shadow-xl overflow-hidden transition-all hover:shadow-2xl">
              <div className="p-5">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold text-primary-400 truncate" title={trip.tripName}>{trip.tripName}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusColor(trip.status)}`}>{trip.status}</span>
                </div>
                <p className="text-xs text-gray-400"><strong>Origin:</strong> {trip.origin}</p>
                <p className="text-xs text-gray-400"><strong>Destination:</strong> {trip.destination}</p>
                <p className="text-xs text-gray-400"><strong>Start:</strong> {formatDate(trip.scheduledStartDate, false)}</p>
                {vehicle && <p className="text-xs text-gray-400"><strong>Vehicle:</strong> {vehicle.make} {vehicle.model} ({vehicle.licensePlate})</p>}
                {chauffeur && <p className="text-xs text-gray-400"><strong>Chauffeur:</strong> {chauffeur.name}</p>}
                {trip.waypoints && trip.waypoints.length > 0 && <p className="text-xs text-gray-400"><strong>Stops:</strong> {trip.waypoints.length}</p>}
                {(trip.tripCosts?.length || 0) > 0 && <p className="text-xs text-gray-400"><strong>Costs Logged:</strong> {trip.tripCosts?.length}</p>}
              </div>
              <div className="p-3 bg-gray-750 border-t border-gray-700 flex justify-end space-x-2">
                <button onClick={() => viewTripDetails(trip)} className="text-xs text-primary-400 hover:text-primary-300 font-semibold py-1 px-2 rounded hover:bg-gray-700">Details</button>
                {(trip.status === TripStatus.PLANNED || trip.status === TripStatus.DELAYED) && 
                    <button onClick={() => openEditModal(trip)} className="text-xs text-amber-400 hover:text-amber-300 font-semibold py-1 px-2 rounded hover:bg-gray-700">Edit</button>}
                {trip.status !== TripStatus.COMPLETED && trip.status !== TripStatus.CANCELLED &&
                    <button onClick={() => handleCancelTrip(trip.id)} className="text-xs text-red-400 hover:text-red-300 font-semibold py-1 px-2 rounded hover:bg-gray-700">Cancel</button>}
              </div>
            </div>
          );
        })}
        {filteredTrips.length === 0 && (
          <p className="col-span-full text-center text-gray-500 py-10">No trips match your current filters.</p>
        )}
      </div>

      {(isModalOpen && !selectedTripDetails) && (
        <Modal isOpen={isModalOpen && !selectedTripDetails} onClose={closeModal} title={editingTrip ? 'Edit Trip Plan' : 'Plan New Trip'} size="4xl">
          <TripForm
            onSubmit={handleFormSubmit}
            onCancel={closeModal}
            initialData={editingTrip}
            vehicles={vehicles}
            chauffeurs={chauffeurs}
            costCategories={costCategories}
          />
        </Modal>
      )}

      {selectedTripDetails && (
         <TripDetailModal trip={selectedTripDetails} onClose={closeModal} />
      )}

    </div>
  );
};

export default TripsPage;