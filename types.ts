// FIX: Add missing React import for React.SVGProps and React.ReactNode types.
import React from 'react';

// FIX: Removed self-import of 'Shift' which was causing a conflict with its own declaration.
export enum Shift {
  DAY = 'Day Shift',
  NIGHT = 'Night Shift',
  FLEXIBLE = 'Flexible',
}

export enum VehicleStatus {
  ACTIVE = 'Active',
  MAINTENANCE = 'Maintenance',
  INACTIVE = 'Inactive',
  RETIRED = 'Retired',
  REMOVED = 'Removed', 
}

export interface Location {
  lat: number;
  lon: number;
  timestamp?: string;
}

export enum DocumentType {
    RC = 'Registration Certificate',
    INSURANCE = 'Insurance',
    FITNESS = 'Fitness Certificate',
    PUC = 'PUC Certificate',
    PERMIT = 'Permit',
    OTHER = 'Other',
}

export interface Document {
    type: DocumentType;
    number?: string;
    expiryDate: string;
    startDate?: string;
    vendor?: string;
    fileName?: string;
    documentUrl?: string; // Mock URL for uploaded file
}

export interface Vehicle {
  id: string;
  vin: string; // Chassis Number
  make: string;
  model: string;
  year: number;
  licensePlate: string; // Registration Number
  status: VehicleStatus;
  mileage: number; // Total Distance Travelled
  imageUrl?: string; 
  assignedChauffeurId?: string | null; // "Driver Name"
  shift?: Shift;
  
  // New fields from FR-VM-002, FR-VM-004
  carType?: string; // e.g., Sedan, SUV, Pool Car
  fuelCardNumber?: string;
  color?: string;
  location?: string; // e.g., Bangalore Office
  engineNumber?: string;
  dateOfRegistration?: string;
  leaseCloseDate?: string;
  isStd?: boolean;
  isNonStd?: boolean;
  starEaseMaintenance?: 'Yes' | 'No' | 'Not Applicable';
  ownershipType?: 'Leased' | 'Owned' | 'Rented';
  carVendorName?: string;
  distanceSinceMaintenance?: number;

  // New fields from FR-VM-005 (Ownership)
  assignedEmployeeId?: string | null; // links to a User for corporate assignment
  
  // New fields from FR-VM-006 (Documentation)
  documents?: Document[];
  
  // For lifecycle tracking history (mocked)
  statusHistory?: { status: VehicleStatus, date: string }[];
  assignmentHistory?: { 
    assignedToId: string, 
    assignedToName: string, 
    type: 'Employee' | 'Chauffeur', 
    startDate: string, 
    endDate: string | null, 
    transferReason?: string,
    // New fields for Kilometer Tracking Policy
    startMileage?: number;
    endMileage?: number | null;
  }[];


  // Added properties for Telematics and Compliance
  lastKnownLocation?: Location;
  currentSpeedKmph?: number;
  isIgnitionOn?: boolean;
  isAIS140Compliant?: boolean;

  // New fields from latest request
  ioNumber?: string;
  documentLink?: string;
  soldTo?: string;
  dealerName?: string;
}

export enum ChauffeurOnboardingStatus {
  INVITED = 'Invited',
  AWAITING_APPROVAL = 'Awaiting Approval',
  APPROVED = 'Approved',
  REJECTED = 'Rejected',
}

export enum ChauffeurDutyStatus {
  ON_DUTY = 'On Duty',
  OFF_DUTY = 'Off Duty',
  AVAILABLE = 'Available',
  ON_TRIP = 'On Trip',
  AWAITING_ACCEPTANCE = 'Awaiting Acceptance',
}

export enum ChauffeurType {
  M_CAR = 'M-Car Chauffeur',
  POOL = 'Pool Chauffeur',
}

export interface Chauffeur {
  id: string;
  name: string;
  licenseNumber: string;
  contact: string;
  assignedVehicleId?: string | null;
  imageUrl?: string;
  dlExpiryDate?: string;

  // New fields from FR-DM-002
  empId?: string;
  email?: string;
  gender?: 'Male' | 'Female' | 'Other';
  office?: string; // Location
  team?: string;
  reportingManager?: string; // Assigned Employee ID
  
  // New fields for Chauffeur Connect App
  dutyStatus?: ChauffeurDutyStatus;
  onboardingStatus: ChauffeurOnboardingStatus;

  // New fields from user request
  chauffeurType?: ChauffeurType;
  aadharCardFileName?: string;
  panCardFileName?: string;
  policeVerificationFileName?: string;
}

export enum UserRole {
  ADMIN = "Admin",
  FLEET_MANAGER = "Fleet Manager",
  EMPLOYEE = "Employee",
}

export enum UserStatus {
  ACTIVE = "Active",
  INACTIVE = "Inactive",
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string; 
  // Added fields for employee assignment
  empId?: string;
  department?: string;
  level?: string;
  costCenter?: string;
  // New fields for chauffeur communication
  address?: string;
  officeAddress?: string;
  contact?: string;
}

export interface NavigationItem {
  name: string;
  path: string;
  icon: (props: React.SVGProps<SVGSVGElement>) => React.ReactNode;
  children?: NavigationItem[];
}

export interface GroundingChunk {
  web?: {
    uri?: string; 
    title?: string; 
  };
  retrievedContext?: {
    uri?: string; 
    title?: string; 
  };
}

// FIX: Added missing TelematicsAlert, AlertType, and SimulatedEmail types.
// ----- Telematics & Alerts -----
export enum AlertType {
    SPEEDING = 'Speeding',
    IDLING = 'Idling',
    HARSH_BRAKING = 'Harsh Braking',
    UNAUTHORIZED_USE = 'Unauthorized Use',
    GEOFENCE_ENTRY = 'Geofence Entry',
    GEOFENCE_EXIT = 'Geofence Exit',
    DEVICE_OFFLINE = 'Device Offline',
    MAINTENANCE_DUE = 'Maintenance Due',
    MAINTENANCE_OVERDUE = 'Maintenance Overdue',
    INSURANCE_PERMIT_RENEWAL = 'Insurance/Permit Renewal',
    COST_EXCEEDED_LIMIT = 'Cost Exceeded Limit',
}

export interface TelematicsAlert {
    id: string;
    vehicleId: string | null;
    type: AlertType;
    details: string;
    timestamp: string;
    isAcknowledged: boolean;
    location?: Location;
    vehicleName?: string;
    relatedCostEntryId?: string;
    relatedMaintenanceTaskId?: string;
}

export interface SimulatedEmail {
    id: string;
    recipient: string;
    subject: string;
    body: string;
    timestamp: string;
    vehicleId: string | null;
    alertType: AlertType | null;
}

// ----- System Notifications -----
export enum NotificationType {
    TRIP_DISPATCH = 'Trip Dispatch',
    TRIP_ACCEPTED = 'Trip Accepted',
    TRIP_REJECTED = 'Trip Rejected',
    CHAUFFEUR_ONBOARD = 'Chauffeur Onboarded',
    POLICY_BREACH = 'Policy Breach',
    GENERIC_ALERT = 'Generic Alert',
}

export interface SystemNotification {
    id: string;
    type: NotificationType;
    subject: string;
    details: string;
    timestamp: string;
    isRead: boolean;
    relatedTripId?: string;
    relatedChauffeurId?: string;
    relatedVehicleId?: string;
}

// ----- Trips & Costs Types -----
export enum TripStatus {
  PLANNED = 'Planned',
  ONGOING = 'Ongoing',
  COMPLETED = 'Completed',
  CANCELLED = 'Cancelled',
  DELAYED = 'Delayed',
}

export enum TripDispatchStatus {
    PENDING = 'Pending Dispatch',
    AWAITING_ACCEPTANCE = 'Awaiting Acceptance',
    ACCEPTED = 'Accepted',
    REJECTED = 'Rejected',
}

export enum TripType {
    AIRPORT = 'Airport',
    OUTSTATION = 'Outstation',
    GUEST_HOTEL_PICKUP = 'Guest Hotel Pickup',
    GUEST_OFFICE_PICKUP = 'Guest Office Pickup',
    AD_HOC = 'Ad Hoc',
    OTHER = 'Other',
}

export enum TripPurpose {
    EMPLOYEE = 'Employee Trip',
    GUEST = 'Guest Trip',
    POOL = 'Pool Trip',
}

export interface Waypoint {
  id: string;
  address: string;
  sequence: number;
  purpose?: string;
  notes?: string;
}

export interface SuggestedStop {
  id: string;
  name: string;
  type: 'Toll' | 'Fuel' | 'Rest Area' | 'Other';
  locationHint?: string;
  estimatedCost?: number;
  notes?: string;
}

export interface CostCategory {
  id: string;
  name: string;
  description?: string;
  isSystemDefined: boolean;
}

export interface CostEntry {
    id: string;
    date: string;
    costCategoryId: string;
    vehicleId: string;
    tripId: string | null;
    amount: number;
    description?: string;
    vendor?: string;
    receiptFileName?: string;
}

export enum FuelType {
    PETROL = "Petrol",
    DIESEL = "Diesel",
    CNG = "CNG",
    ELECTRIC = "Electric",
    OTHER = "Other",
}

export enum FuelCardStatus {
    ACTIVE = "Active",
    INACTIVE = "Inactive",
    LOST = "Lost",
}

export interface FuelCard {
    id: string;
    cardNumber: string;
    issuanceDate: string;
    expiryDate: string;
    assignedChauffeurId: string | null;
    assignedVehicleId: string | null; // Must be a pool car
    status: FuelCardStatus;
    provider: 'HP' | 'Indian Oil' | 'Shell' | 'Other';
}

export interface FuelLogEntry {
    id: string;
    vehicleId: string;
    date: string;
    fuelType: FuelType;
    quantity: number; // In liters, kg (for CNG), or kWh (for Electric)
    costPerUnit: number;
    totalCost: number;
    odometerReading: number;
    stationName?: string;
    fuelBillFileName?: string;
    fuelCardId?: string | null; // Link to FuelCard
    submittedByChauffeurId?: string | null;
}

export interface Trip {
  id: string;
  tripName: string;
  vehicleId: string | null;
  chauffeurId: string | null;
  origin: string;
  destination: string;
  waypoints: Waypoint[];
  scheduledStartDate: string;
  scheduledEndDate?: string;
  actualStartDate?: string;
  actualEndDate?: string;
  actualStartLocation?: Location;
  actualEndLocation?: Location;
  status: TripStatus;
  routeSuggestion?: string;
  suggestedStops?: SuggestedStop[];
  estimatedDistanceKm?: number;
  estimatedDuration?: string;
  tripCosts?: CostEntry[];
  // New fields for Chauffeur Connect App
  dispatchStatus?: TripDispatchStatus;
  offeredToChauffeurId?: string | null;
  offeredVehicleId?: string | null;
  rejectionReason?: string;
  notes?: string; // Notes from chauffeur
  createdBy?: 'Manager' | 'Chauffeur';
  // New fields for pool trip requests
  tripType?: TripType;
  otherTripTypeDetail?: string;
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
  // New fields for M-Car purpose tracking
  tripPurpose?: TripPurpose;
  bookingMadeForEmployeeId?: string | null;
}


// ----- Maintenance Types -----
export enum MaintenanceType {
  PREVENTIVE = 'Preventive',
  CORRECTIVE = 'Corrective',
  PREDICTIVE = 'Predictive',
  EMERGENCY = 'Emergency',
  INSPECTION = 'Inspection',
  UPGRADE = 'Upgrade',
}

export enum MaintenanceTaskStatus {
  SCHEDULED = 'Scheduled',
  IN_PROGRESS = 'In Progress',
  COMPLETED = 'Completed',
  CANCELLED = 'Cancelled',
  AWAITING_PARTS = 'Awaiting Parts',
  PENDING_APPROVAL = 'Pending Approval',
}

export interface MaintenancePart {
    name: string;
    quantity: number;
    cost?: number; // Cost per unit
}

export interface MaintenanceTask { // Represents a "Job Card"
    id: string;
    jobCardNumber?: string; // FR-JC-001
    vehicleId: string;
    title: string;
    description?: string; // Problem Description
    maintenanceType: MaintenanceType;
    status: MaintenanceTaskStatus;
    scheduledDate?: string;
    completionDate?: string;
    mechanicId?: string | null;
    garageName?: string;
    partsReplaced?: MaintenancePart[];
    laborCost?: number;
    partsCost?: number;
    totalCost?: number;
    odometerAtMaintenance?: number;
    notes?: string;
    receiptFileName?: string; // For invoices
    isFreeService?: boolean; // FR-JC-004
}

export interface Mechanic {
    id: string;
    name: string; // Could be person's name or vendor/shop name
    contactPerson?: string;
    phoneNumber: string;
    email?: string;
    address?: string;
    specialties?: string[];
    rating?: number; // e.g., 1-5
    notes?: string;
    isInternal: boolean;
}

// ----- Chauffeur Attendance Types -----
export enum AttendanceStatus {
  PRESENT = "Present",
  ABSENT = "Absent",
  ON_LEAVE = "On Leave",
  HALF_DAY = "Half Day",
}

export interface ChauffeurAttendance {
  id: string;
  chauffeurId: string;
  date: string;
  status: AttendanceStatus;
  checkInTimestamp?: string;
  checkInLocation?: Location;
  checkOutTimestamp?: string;
  checkOutLocation?: Location;
  notes?: string;
}

// ----- Chauffeur Leave Management Types -----
export enum LeaveRequestStatus {
  PENDING = 'Pending',
  APPROVED = 'Approved',
  REJECTED = 'Rejected',
}

export interface LeaveRequest {
  id: string;
  chauffeurId: string;
  startDate: string; // ISO Date string
  endDate: string; // ISO Date string
  reason: string;
  status: LeaveRequestStatus;
  requestedAt: string; // ISO DateTime string
}

// ----- Reported Issues -----
export enum IssueStatus {
  OPEN = 'Open',
  IN_PROGRESS = 'In Progress',
  RESOLVED = 'Resolved',
}

export enum IssueSeverity {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
}

export interface ReportedIssue {
  id: string;
  chauffeurId: string;
  vehicleId: string | null;
  reportDate: string;
  issueDescription: string;
  status: IssueStatus;
  severity: IssueSeverity;
}