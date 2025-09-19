import React, { useMemo, useState, useEffect } from 'react';
import { PaperAirplaneIcon } from '../../constants';
import { Trip, TripDispatchStatus, Chauffeur, Vehicle, VehicleStatus, TripStatus, ChauffeurType, ChauffeurOnboardingStatus, ChauffeurAttendance, AttendanceStatus, TripPurpose, User } from '../../types';
import Modal from '../../components/Modal';

interface TripCardProps {
  trip: Trip;
  onDispatch: (tripId: string) => void;
  chauffeurs: Chauffeur[];
  vehicles: Vehicle[];
}

const TripCard: React.FC<TripCardProps> = ({ trip, onDispatch, chauffeurs, vehicles }) => {
  const canBeDispatched = trip.dispatchStatus === TripDispatchStatus.PENDING || trip.dispatchStatus === TripDispatchStatus.REJECTED;
  const chauffeur = trip.chauffeurId ? chauffeurs.find(c => c.id === trip.chauffeurId) : null;
  const vehicle = trip.vehicleId ? vehicles.find(v => v.id === trip.vehicleId) : null;
  
  const isStarted = trip.status === TripStatus.ONGOING;
  const isCompleted = trip.status === TripStatus.COMPLETED;

  return (
    <div className="bg-gray-700 p-3 rounded-lg shadow-md mb-3 text-sm flex flex-col justify-between min-h-[130px]">
      <div>
        <h4 className="font-bold text-gray-100 truncate" title={trip.tripName}>{trip.tripName}</h4>
        <p className="text-gray-400 text-xs">{trip.origin} to {trip.destination}</p>
        <p className="text-gray-400 text-xs">
          Scheduled: {new Date(trip.scheduledStartDate).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
        </p>
        {chauffeur && <p className="text-sky-300 text-xs mt-1">Chauffeur: {chauffeur.name}</p>}
        {vehicle && <p className="text-sky-300 text-xs">Vehicle: {vehicle.licensePlate}</p>}
        
        {isStarted && trip.actualStartDate && <p className="text-yellow-300 text-xs mt-1 font-semibold">Started: {new Date(trip.actualStartDate).toLocaleTimeString('en-IN', {hour: '2-digit', minute: '2-digit'})}</p>}
        {isCompleted && trip.actualEndDate && <p className="text-green-300 text-xs mt-1 font-semibold">Completed: {new Date(trip.actualEndDate).toLocaleTimeString('en-IN', {hour: '2-digit', minute: '2-digit'})}</p>}
        
        {trip.rejectionReason && (
          <p className="text-red-400 text-xs mt-1 italic">
            Reason: {trip.rejectionReason}
          </p>
        )}
      </div>
      {canBeDispatched && (
        <button 
          onClick={() => onDispatch(trip.id)} 
          className="mt-2 w-full text-center bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold py-1.5 rounded-md transition-colors"
        >
          {trip.dispatchStatus === TripDispatchStatus.REJECTED ? 'Re-Dispatch' : 'Dispatch'}
        </button>
      )}
    </div>
  );
};


interface ColumnProps {
  title: string;
  trips: Trip[];
  onDispatch: (tripId: string) => void;
  accentColor: string;
  chauffeurs: Chauffeur[];
  vehicles: Vehicle[];
}

const DispatchColumn: React.FC<ColumnProps> = ({ title, trips, onDispatch, accentColor, chauffeurs, vehicles }) => {
  return (
    <div className="bg-gray-800 rounded-lg p-3 flex flex-col h-full">
      <h3 className={`font-semibold text-gray-200 border-b-2 pb-2 mb-3 flex-shrink-0 ${accentColor}`}>
        {title} ({trips.length})
      </h3>
      <div className="flex-1 overflow-y-auto pr-1">
        {trips.map(trip => <TripCard key={trip.id} trip={trip} onDispatch={onDispatch} chauffeurs={chauffeurs} vehicles={vehicles} />)}
        {trips.length === 0 && <p className="text-xs text-gray-500 text-center pt-4">No trips in this status.</p>}
      </div>
    </div>
  );
};


interface DispatchModalProps {
  trip: Trip;
  onDispatch: () => void;
  onClose: () => void;
  // State and handlers from parent
  selectedCarType: 'M-Car' | 'Pool Car' | '';
  setSelectedCarType: (type: 'M-Car' | 'Pool Car' | '') => void;
  tripPurpose: 'Employee' | 'Guest' | '';
  setTripPurpose: (purpose: 'Employee' | 'Guest' | '') => void;
  selectedChauffeur: string;
  setSelectedChauffeur: (id: string) => void;
  selectedVehicle: string;
  setSelectedVehicle: (id: string) => void;
  // Data sources
  availableChauffeurs: Chauffeur[];
  availableVehicles: Vehicle[];
  chauffeurs: Chauffeur[];
  vehicles: Vehicle[];
  users: User[];
}

const DispatchModal: React.FC<DispatchModalProps> = ({ 
    trip, onDispatch, onClose,
    selectedCarType, setSelectedCarType,
    tripPurpose, setTripPurpose,
    selectedChauffeur, setSelectedChauffeur,
    selectedVehicle, setSelectedVehicle,
    availableChauffeurs, availableVehicles,
    chauffeurs, vehicles, users
}) => {
    
    useEffect(() => {
        // Auto-select vehicle for M-Car chauffeur if one is selected
        if (selectedCarType === 'M-Car' && selectedChauffeur) {
            const chauffeur = chauffeurs.find(c => c.id === selectedChauffeur);
            setSelectedVehicle(chauffeur?.assignedVehicleId || '');
        }
    }, [selectedCarType, selectedChauffeur, chauffeurs, setSelectedVehicle]);
    
    const assignedEmployee = useMemo(() => {
        if (selectedCarType === 'M-Car' && selectedChauffeur) {
            const chauffeur = chauffeurs.find(c => c.id === selectedChauffeur);
            if (chauffeur?.reportingManager) {
                return users.find(u => u.id === chauffeur.reportingManager);
            }
        }
        return null;
    }, [selectedCarType, selectedChauffeur, chauffeurs, users]);

    return (
        <Modal isOpen={true} onClose={onClose} title={`Dispatch Trip: ${trip.tripName}`}>
            <div className="space-y-4">
                <p className="text-sm text-gray-300">Select trip type, an available chauffeur, and a vehicle to send this request to.</p>
                
                {/* Step 1: Car Type Selection */}
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Step 1: Select Trip Type</label>
                    <div className="flex space-x-4">
                        <label className={`flex items-center p-3 rounded-lg border-2 w-1/2 cursor-pointer transition-colors ${selectedCarType === 'M-Car' ? 'bg-primary-950 border-primary-500' : 'bg-gray-700 border-gray-600 hover:bg-gray-600'}`}>
                            <input type="radio" name="carType" value="M-Car" checked={selectedCarType === 'M-Car'} onChange={(e) => setSelectedCarType(e.target.value as any)} className="w-4 h-4 text-primary-600 bg-gray-700 border-gray-500 focus:ring-primary-600 focus:ring-offset-gray-800"/>
                            <span className="ml-3 text-sm font-medium text-gray-200">M-Car Trip</span>
                        </label>
                        <label className={`flex items-center p-3 rounded-lg border-2 w-1/2 cursor-pointer transition-colors ${selectedCarType === 'Pool Car' ? 'bg-primary-950 border-primary-500' : 'bg-gray-700 border-gray-600 hover:bg-gray-600'}`}>
                            <input type="radio" name="carType" value="Pool Car" checked={selectedCarType === 'Pool Car'} onChange={(e) => setSelectedCarType(e.target.value as any)} className="w-4 h-4 text-primary-600 bg-gray-700 border-gray-500 focus:ring-primary-600 focus:ring-offset-gray-800"/>
                            <span className="ml-3 text-sm font-medium text-gray-200">Pool Car Trip</span>
                        </label>
                    </div>
                </div>

                {selectedCarType === 'M-Car' && (
                    <div className="pt-4 border-t border-gray-700">
                        <label htmlFor="trip-purpose-select" className="block text-sm font-medium text-gray-400 mb-2">Step 2: Select M-Car Trip Purpose</label>
                        <select 
                            id="trip-purpose-select"
                            value={tripPurpose}
                            onChange={(e) => setTripPurpose(e.target.value as any)}
                            className="bg-gray-700 border-gray-600 text-gray-200 block w-full shadow-sm sm:text-sm rounded-lg p-2.5"
                        >
                            <option value="">Select Purpose...</option>
                            <option value="Employee">Assigned Employee Trip</option>
                            <option value="Guest">Guest Purpose</option>
                        </select>
                        {tripPurpose === 'Employee' && (
                            <div className="mt-2 p-2 bg-gray-750 rounded-md text-xs">
                                {assignedEmployee ? (
                                    <>
                                        <p className="text-gray-300">This trip will be logged for:</p>
                                        <p className="font-semibold text-gray-100">{assignedEmployee.name} (Level: {assignedEmployee.level || 'N/A'})</p>
                                    </>
                                ) : (
                                    <p className="text-amber-400">Please select a chauffeur to see the assigned employee.</p>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Step 2/3: Chauffeur and Vehicle Selection */}
                {selectedCarType && (
                    <div className="space-y-4 pt-4 border-t border-gray-700">
                         <label className="block text-sm font-medium text-gray-400">{selectedCarType === 'M-Car' ? 'Step 3' : 'Step 2'}: Assign Resources</label>
                        <div>
                            <label htmlFor="chauffeur-select" className="block text-xs font-medium text-gray-400 mb-1">Chauffeur</label>
                            <select 
                                id="chauffeur-select"
                                value={selectedChauffeur} 
                                onChange={e => setSelectedChauffeur(e.target.value)}
                                className="bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-500 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm rounded-lg p-2.5"
                            >
                                <option value="">Select a Chauffeur...</option>
                                {availableChauffeurs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="vehicle-select" className="block text-xs font-medium text-gray-400 mb-1">Vehicle</label>
                            <select 
                                id="vehicle-select"
                                value={selectedVehicle} 
                                onChange={e => setSelectedVehicle(e.target.value)}
                                disabled={selectedCarType === 'M-Car'}
                                className="bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-500 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm rounded-lg p-2.5 disabled:bg-gray-600 disabled:cursor-not-allowed"
                            >
                                <option value="">Select a Vehicle...</option>
                                {selectedCarType === 'M-Car' && selectedVehicle && <option value={selectedVehicle}>{vehicles.find(v => v.id === selectedVehicle)?.licensePlate}</option>}
                                {availableVehicles.map(v => <option key={v.id} value={v.id}>{v.make} {v.model} ({v.licensePlate})</option>)}
                            </select>
                        </div>
                    </div>
                )}
                <div className="flex justify-end space-x-2 pt-2">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-600 hover:bg-gray-500 rounded-lg">Cancel</button>
                    <button 
                        onClick={onDispatch} 
                        disabled={!selectedChauffeur || !selectedVehicle || (selectedCarType === 'M-Car' && !tripPurpose)}
                        className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg disabled:opacity-50"
                    >
                        Send Request
                    </button>
                </div>
            </div>
        </Modal>
    )
}

interface TripDispatchPageProps {
    trips: Trip[];
    chauffeurs: Chauffeur[];
    vehicles: Vehicle[];
    dispatchTrip: (tripId: string, chauffeurId: string, vehicleId: string, purposeData: { tripPurpose: TripPurpose; bookingMadeForEmployeeId?: string | null }) => void;
    attendance: ChauffeurAttendance[];
    users: User[];
}

const TripDispatchPage: React.FC<TripDispatchPageProps> = ({ trips, chauffeurs, vehicles, dispatchTrip, attendance, users }) => {
    const [dispatchingTrip, setDispatchingTrip] = useState<Trip | null>(null);
    const [selectedCarType, setSelectedCarType] = useState<'M-Car' | 'Pool Car' | ''>('');
    const [tripPurpose, setTripPurpose] = useState<'Employee' | 'Guest' | ''>('');
    const [selectedChauffeur, setSelectedChauffeur] = useState('');
    const [selectedVehicle, setSelectedVehicle] = useState('');

    const twentyFourHoursAgo = useMemo(() => new Date(Date.now() - 24 * 60 * 60 * 1000), []);

    const tripsForBoard = useMemo(() => trips.filter(t => 
        t.tripPurpose === TripPurpose.POOL || t.dispatchStatus
    ), [trips]);

    const pendingTrips = useMemo(() => tripsForBoard.filter(t => t.dispatchStatus === TripDispatchStatus.PENDING), [tripsForBoard]);
    const awaitingTrips = useMemo(() => tripsForBoard.filter(t => t.dispatchStatus === TripDispatchStatus.AWAITING_ACCEPTANCE), [tripsForBoard]);
    const acceptedTrips = useMemo(() => tripsForBoard.filter(t => t.dispatchStatus === TripDispatchStatus.ACCEPTED && t.status === TripStatus.PLANNED), [tripsForBoard]);
    const startedTrips = useMemo(() => tripsForBoard.filter(t => t.status === TripStatus.ONGOING), [tripsForBoard]);
    const completedTrips = useMemo(() => tripsForBoard.filter(t => t.status === TripStatus.COMPLETED && t.actualEndDate && new Date(t.actualEndDate) > twentyFourHoursAgo), [tripsForBoard, twentyFourHoursAgo]);
    const rejectedTrips = useMemo(() => tripsForBoard.filter(t => t.dispatchStatus === TripDispatchStatus.REJECTED), [tripsForBoard]);
    
    const busyVehicleIds = useMemo(() => 
        new Set(trips.filter(t => t.status === TripStatus.ONGOING && t.vehicleId).map(t => t.vehicleId))
    , [trips]);

    const busyChauffeurIds = useMemo(() => 
        new Set(trips.filter(t => t.status === TripStatus.ONGOING && t.chauffeurId).map(t => t.chauffeurId))
    , [trips]);
    
    const onDutyChauffeurIds = useMemo(() => {
        const todayStr = new Date().toISOString().split('T')[0];
        return new Set(
            attendance
                .filter(a => a.date === todayStr && (a.status === AttendanceStatus.PRESENT || a.status === AttendanceStatus.HALF_DAY))
                .map(a => a.chauffeurId)
        );
    }, [attendance]);


     const availableChauffeurs = useMemo(() => {
        if (!dispatchingTrip) return [];

        const filterFn = (c: Chauffeur) => 
            c.onboardingStatus === ChauffeurOnboardingStatus.APPROVED &&
            !busyChauffeurIds.has(c.id);

        if (selectedCarType === 'M-Car') {
            return chauffeurs.filter(c => c.chauffeurType === ChauffeurType.M_CAR && filterFn(c));
        }
        if (selectedCarType === 'Pool Car') {
            return chauffeurs.filter(c => c.chauffeurType === ChauffeurType.POOL && filterFn(c));
        }
        return [];
    }, [dispatchingTrip, selectedCarType, chauffeurs, busyChauffeurIds]);

    const availableVehicles = useMemo(() => {
        if (!dispatchingTrip || selectedCarType !== 'Pool Car') return [];
        return vehicles.filter(v =>
            v.carType === 'Pool Cars' &&
            v.status === VehicleStatus.ACTIVE &&
            !busyVehicleIds.has(v.id)
        );
    }, [dispatchingTrip, selectedCarType, vehicles, busyVehicleIds]);

    useEffect(() => {
        // Reset selections when the modal opens for a new trip
        if (dispatchingTrip) {
            setSelectedCarType('');
            setTripPurpose('');
            setSelectedChauffeur('');
            setSelectedVehicle('');
        }
    }, [dispatchingTrip]);
    
    useEffect(() => {
        // Reset chauffeur and vehicle when car type changes
        setTripPurpose('');
        setSelectedChauffeur('');
        setSelectedVehicle('');
    }, [selectedCarType]);


    const handleDispatch = (tripId: string) => {
        const tripToDispatch = trips.find(t => t.id === tripId);
        if(tripToDispatch) {
            setDispatchingTrip(tripToDispatch);
        }
    }

    const handleConfirmDispatch = () => {
        if (!dispatchingTrip) return;

        let purposeData: { tripPurpose: TripPurpose; bookingMadeForEmployeeId?: string | null };

        if (selectedCarType === 'M-Car') {
            if (tripPurpose === 'Employee') {
                const chauffeur = chauffeurs.find(c => c.id === selectedChauffeur);
                const employeeId = chauffeur?.reportingManager || null;
                purposeData = { tripPurpose: TripPurpose.EMPLOYEE, bookingMadeForEmployeeId: employeeId };
            } else { // Guest
                purposeData = { tripPurpose: TripPurpose.GUEST, bookingMadeForEmployeeId: null };
            }
        } else { // Pool Car
            purposeData = { tripPurpose: TripPurpose.POOL, bookingMadeForEmployeeId: null };
        }
        
        dispatchTrip(dispatchingTrip.id, selectedChauffeur, selectedVehicle, purposeData);
        setDispatchingTrip(null);
    }
  
  return (
    <div className="flex flex-col h-full space-y-4">
      <h1 className="text-3xl font-bold text-gray-100 flex items-center flex-shrink-0">
        <PaperAirplaneIcon className="w-8 h-8 mr-3 text-primary-400" />
        Trip Dispatch Center (Pool)
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 flex-1 min-h-0">
        <DispatchColumn 
            title="Pending Dispatch" 
            trips={pendingTrips} 
            onDispatch={handleDispatch} 
            accentColor="border-gray-500"
            chauffeurs={chauffeurs}
            vehicles={vehicles}
        />
        <DispatchColumn 
            title="Awaiting Acceptance" 
            trips={awaitingTrips} 
            onDispatch={handleDispatch}
            accentColor="border-yellow-500"
            chauffeurs={chauffeurs}
            vehicles={vehicles}
        />
        <DispatchColumn 
            title="Accepted" 
            trips={acceptedTrips} 
            onDispatch={handleDispatch}
            accentColor="border-sky-500"
            chauffeurs={chauffeurs}
            vehicles={vehicles}
        />
        <DispatchColumn 
            title="Trip Started" 
            trips={startedTrips} 
            onDispatch={handleDispatch}
            accentColor="border-blue-500"
            chauffeurs={chauffeurs}
            vehicles={vehicles}
        />
        <DispatchColumn 
            title="Trip Completed" 
            trips={completedTrips} 
            onDispatch={handleDispatch}
            accentColor="border-green-500"
            chauffeurs={chauffeurs}
            vehicles={vehicles}
        />
        <DispatchColumn 
            title="Rejected" 
            trips={rejectedTrips} 
            onDispatch={handleDispatch}
            accentColor="border-red-500"
            chauffeurs={chauffeurs}
            vehicles={vehicles}
        />
      </div>

      {dispatchingTrip && (
        <DispatchModal 
            trip={dispatchingTrip}
            onDispatch={handleConfirmDispatch}
            onClose={() => setDispatchingTrip(null)}
            // State
            selectedCarType={selectedCarType}
            setSelectedCarType={setSelectedCarType}
            tripPurpose={tripPurpose}
            setTripPurpose={setTripPurpose}
            selectedChauffeur={selectedChauffeur}
            setSelectedChauffeur={setSelectedChauffeur}
            selectedVehicle={selectedVehicle}
            setSelectedVehicle={setSelectedVehicle}
            // Data
            availableChauffeurs={availableChauffeurs}
            availableVehicles={availableVehicles}
            chauffeurs={chauffeurs}
            vehicles={vehicles}
            users={users}
        />
      )}
    </div>
  );
};

export default TripDispatchPage;