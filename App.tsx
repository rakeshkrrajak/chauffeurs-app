import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardPage from './pages/DashboardPage';
import VehiclesPage from './pages/VehiclesPage';
import VehicleOnboardingPage from './pages/VehicleOnboardingPage';
import VehicleReportingDashboardPage from './pages/VehicleReportingDashboardPage';
import ChauffeursPage from './pages/DriversPage';
import ChauffeurOnboardingPage from './pages/ChauffeurOnboardingPage';
import UserManagementPage from './pages/UserManagementPage';
import EmployeeDirectoryPage from './pages/EmployeeDirectoryPage';
import EmployeeOnboardingPage from './pages/EmployeeOnboardingPage';
import PoolTripRequestsPage from './pages/chauffeurs/PoolTripRequestsPage';
import ChauffeurAttendancePage from './pages/DriverAttendancePage';
import ChauffeurPerformancePage from './pages/ChauffeurPerformancePage';
import MaintenanceDashboardPage from './pages/maintenance/MaintenanceDashboardPage';
import MaintenanceTasksPage from './pages/maintenance/MaintenanceTasksPage';
import MechanicsDirectoryPage from './pages/maintenance/MechanicsDirectoryPage';
import CostDashboardPage from './pages/cost_management/CostDashboardPage';
import VehicleCostEntryPage from './pages/cost_management/VehicleCostEntryPage';
import FuelLogPage from './pages/cost_management/FuelLogPage';
import CostCategoriesPage from './pages/cost_management/CostCategoriesPage';
import NotificationsPage from './pages/NotificationsPage';
import FuelCardPage from './pages/cost_management/FuelCardPage';
import TripsPage from './pages/TripsPage';
// New Chauffeur Connect Hub pages
import ChauffeurConnectDashboardPage from './pages/chauffeur_connect/ChauffeurConnectDashboardPage';
import TripDispatchPage from './pages/chauffeur_connect/TripDispatchPage';
import LeaveRequestsPage from './pages/chauffeur_connect/LeaveRequestsPage';
// New Chauffeur Overview Dashboard
import ChauffeurOverviewDashboardPage from './pages/chauffeurs/ChauffeurOverviewDashboardPage';
import TripLogPage from './pages/chauffeurs/CompletedTripsLogPage';
// New Email Log page
import TelematicsEmailLogPage from './pages/TelematicsEmailLogPage';


import { 
  Vehicle, Chauffeur, User, ChauffeurAttendance, Trip, ReportedIssue, Mechanic, MaintenanceTask, CostCategory, CostEntry, FuelLogEntry, SystemNotification, FuelCard, FuelCardStatus, SimulatedEmail, AlertType,
  VehicleStatus, UserRole, UserStatus, AttendanceStatus, Shift, TripStatus, IssueStatus, IssueSeverity, DocumentType, Document, MaintenanceType, MaintenanceTaskStatus, FuelType, NotificationType, TripDispatchStatus, ChauffeurOnboardingStatus, ChauffeurType,
  TripType,
  TripPurpose,
} from './types';
import { 
  MOCK_CHAUFFEURS_COUNT, MOCK_VEHICLES_COUNT, MOCK_USERS_COUNT, MOCK_CHAUFFEUR_ATTENDANCE_COUNT, MOCK_TRIPS_COUNT, MOCK_REPORTED_ISSUES_COUNT, MOCK_MAINTENANCE_TASKS_COUNT, MOCK_MECHANICS_COUNT, MOCK_COST_ENTRIES_COUNT, MOCK_FUEL_LOGS_COUNT, MOCK_FUEL_CARDS_COUNT,
} from './constants';

const generateMockId = () => Math.random().toString(36).substring(2, 10);
const generateVin = () => `W1K${Math.random().toString(36).substring(2, 15).toUpperCase()}`;

const generateFutureDate = (days: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
};

const generatePastDate = (days: number): string => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
}

const generateDateTimeString = (daysOffset: number, hour: number): string => {
    const date = new Date();
    date.setDate(date.getDate() + daysOffset);
    date.setHours(hour, 0, 0, 0);
    return date.toISOString();
}

const getVehicleImageText = (make: string, model: string): string => `${make} ${model}`;

/**
 * Checks for document expiries and generates simulated reminder emails.
 * This simulates a daily cron job that runs when the app loads.
 */
const checkAndGenerateRenewalEmails = (
    vehicles: Vehicle[], 
    users: User[], 
    existingEmails: SimulatedEmail[]
): SimulatedEmail[] => {
    const newEmails: SimulatedEmail[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of day
    const fleetTeamUsers = users.filter(u => u.role === UserRole.ADMIN || u.role === UserRole.FLEET_MANAGER);
    if (fleetTeamUsers.length === 0) return [];
    const fleetTeamEmails = fleetTeamUsers.map(u => u.email).join(', ');
    
    // --- Requirement 1 & 2: Consolidated Monthly Reminders ---
    const currentDay = today.getDate();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    if (currentDay <= 7 || currentDay === 20) {
        const firstDayOfNextMonth = new Date(currentYear, currentMonth + 1, 1);
        const nextMonthName = firstDayOfNextMonth.toLocaleString('default', { month: 'long' });
        const subject = `Vehicle Document Expiry Reminder for ${nextMonthName}`;

        // Check if a reminder for next month was already sent THIS month
        const alreadySentThisMonth = existingEmails.some(email => 
            email.subject === subject && 
            new Date(email.timestamp).getMonth() === currentMonth &&
            new Date(email.timestamp).getFullYear() === currentYear
        );

        if (!alreadySentThisMonth) {
            const lastDayOfNextMonth = new Date(currentYear, currentMonth + 2, 0);
            const expiringNextMonth = vehicles.flatMap(v => 
                (v.documents || []).filter(doc => 
                    (doc.type === DocumentType.INSURANCE || doc.type === DocumentType.PUC) && 
                    doc.expiryDate &&
                    new Date(doc.expiryDate) >= firstDayOfNextMonth &&
                    new Date(doc.expiryDate) <= lastDayOfNextMonth
                ).map(doc => ({ vehicle: v, docType: doc.type, expiryDate: doc.expiryDate }))
            );

            if (expiringNextMonth.length > 0) {
                const emailBody = `Dear Fleet Team,\n\nThis is a reminder that the following vehicle documents are expiring next month (${nextMonthName}):\n\n` + 
                                expiringNextMonth.map(item => `- ${item.vehicle.make} ${item.vehicle.model} (${item.vehicle.licensePlate}): ${item.docType} expires on ${new Date(item.expiryDate).toLocaleDateString('en-IN')}`).join('\n') + 
                                `\n\nPlease take the necessary action.\n\nRegards,\nFleetPro System`;
                
                newEmails.push({ 
                    id: generateMockId(), 
                    recipient: fleetTeamEmails, 
                    subject, 
                    body: emailBody, 
                    timestamp: new Date().toISOString(), 
                    vehicleId: null, 
                    alertType: AlertType.INSURANCE_PERMIT_RENEWAL 
                });
            }
        }
    }

    // --- Requirement 3: Urgent Warning for expired or soon-to-expire documents ---
    const sevenDaysFromNow = new Date(today);
    sevenDaysFromNow.setDate(today.getDate() + 7);

    vehicles.forEach(v => {
        if (!v.assignedEmployeeId) return;
        const assignedUser = users.find(u => u.id === v.assignedEmployeeId);
        if (!assignedUser) return;
        
        (v.documents || []).forEach(doc => {
            if ((doc.type === DocumentType.INSURANCE || doc.type === DocumentType.PUC) && doc.expiryDate) {
                const expiry = new Date(doc.expiryDate);
                expiry.setHours(0, 0, 0, 0); // Normalize expiry date to compare with `today`

                // FIX: Check for documents that have expired OR will expire within 7 days.
                if (expiry <= sevenDaysFromNow) {
                    
                    // Check if a warning for this specific document was already sent today
                    const alreadySentToday = existingEmails.some(email => 
                        email.vehicleId === v.id &&
                        email.subject.includes(`URGENT: ${doc.type} Expiry`) &&
                        new Date(email.timestamp).toISOString().split('T')[0] === today.toISOString().split('T')[0]
                    );

                    if (!alreadySentToday) {
                        const isExpired = expiry < today;
                        const expiryString = expiry.toLocaleDateString('en-IN');
                        const warningMessage = isExpired
                            ? `has EXPIRED on ${expiryString}`
                            : `is expiring in less than 7 days on ${expiryString}`;
                            
                        const emailBody = `Dear ${assignedUser.name},\n\n** URGENT WARNING **\n\nThe ${doc.type} for your assigned vehicle, ${v.make} ${v.model} (${v.licensePlate}), ${warningMessage}.\n\nPlease ensure the document is renewed and uploaded to the FleetPro portal immediately to avoid compliance issues.\n\nThis email has been copied to the fleet management team.\n\nRegards,\nFleetPro System`;
                        
                        newEmails.push({ 
                            id: generateMockId(), 
                            recipient: `${assignedUser.email}; CC: ${fleetTeamEmails}`, 
                            subject: `URGENT: ${doc.type} Expiry for Vehicle ${v.licensePlate}`, 
                            body: emailBody, 
                            timestamp: new Date().toISOString(), 
                            vehicleId: v.id, 
                            alertType: AlertType.INSURANCE_PERMIT_RENEWAL 
                        });
                    }
                }
            }
        });
    });

    return newEmails;
};


const generateInitialMockData = () => {
    // 1. Create specific users from sample data and add prefix
    const sampleUsers: User[] = [
      { id: 'user_bp', name: 'Bishwaroop Paul', email: 'bishwaroop.p@fleetpro.com', role: UserRole.FLEET_MANAGER, status: UserStatus.ACTIVE, createdAt: generatePastDate(150), empId: 'E1101', department: 'RD/IDF', level: 'L4', costCenter: 'CC110', contact: '+919876543210', address: '123 Koramangala, Bangalore', officeAddress: 'FleetPro EC Office, Bangalore' },
      { id: 'user_ra', name: 'Rajneesh Acharya', email: 'rajneesh.a@fleetpro.com', role: UserRole.FLEET_MANAGER, status: UserStatus.ACTIVE, createdAt: generatePastDate(140), empId: 'E1102', department: 'RD/IAZ', level: 'L5', costCenter: 'CC111', contact: '+919876543211', address: '456 Indiranagar, Bangalore', officeAddress: 'FleetPro BTG Office, Bangalore' },
      { id: 'user_vs', name: 'Vigneshwaran, Soundararajan', email: 'vignesh.s@fleetpro.com', role: UserRole.FLEET_MANAGER, status: UserStatus.ACTIVE, createdAt: generatePastDate(130), empId: 'E1103', department: 'RD/IDA', level: 'L4', costCenter: 'CC112', contact: '+919876543212', address: '789 HSR Layout, Bangalore', officeAddress: 'FleetPro EC Office, Bangalore' },
      { id: 'user_sp', name: 'Santosh Pamadi', email: 'santosh.p@fleetpro.com', role: UserRole.ADMIN, status: UserStatus.ACTIVE, createdAt: generatePastDate(300), empId: 'E1001', department: 'RD/ICI', level: 'L5', costCenter: '109120', contact: '+919876543213', address: '101 Whitefield, Bangalore', officeAddress: 'FleetPro BTG Office, Bangalore' },
    ];
    
    let employeeUsers: User[] = Array.from({ length: 8 }, (_, i) => {
        const firstNames = ["Ananya", "Rohan", "Saanvi", "Aditya", "Diya", "Arjun", "Myra", "Kabir"];
        const lastNames = ["Sharma", "Verma", "Patel", "Singh", "Gupta", "Kumar", "Reddy", "Joshi"];
        const name = `${firstNames[i]} ${lastNames[i]}`;
        return {
            id: `user_emp_${i+1}`,
            name: name,
            email: `${name.split(' ')[0].toLowerCase()}@fleetpro.com`,
            role: UserRole.EMPLOYEE,
            status: UserStatus.ACTIVE,
            createdAt: generatePastDate(120 - i * 15),
            empId: `E300${i+1}`,
            department: ['Sales', 'Marketing', 'Engineering', 'HR'][i % 4],
            level: `L${(i%3)+1}`,
            costCenter: `CC30${i}`,
            contact: `+9198765433${i.toString().padStart(2,'0')}`,
            address: `${200+i} Employee Colony, Bangalore`,
            officeAddress: `FleetPro ${i%2 === 0 ? 'EC' : 'BTG'} Office, Bangalore`
        };
    });
    employeeUsers = employeeUsers.map(u => ({ ...u, name: `Emp-${u.name}` }));
    const initialUsers: User[] = [...sampleUsers, ...employeeUsers];

    const sampleVehicles: Vehicle[] = [
      { id: 'veh_01', vin: 'W1KLF0EB2RA000245', make: 'Mercedes-Benz', model: 'E220d', year: 2024, licensePlate: 'KA53C0007TC0012', carType: 'Test Cars', status: VehicleStatus.ACTIVE, mileage: 1250, assignedEmployeeId: 'user_bp', fuelCardNumber: 'FC3450301405', color: 'Silver', location: 'EC', engineNumber: '65482080035992', dateOfRegistration: '2024-01-12', documents: [ { type: DocumentType.INSURANCE, number: '31022428670100', expiryDate: '2026-04-25', vendor: 'Tata AIG' }, { type: DocumentType.RC, expiryDate: '2039-01-11' }, { type: DocumentType.PUC, expiryDate: '2025-07-11' } ], starEaseMaintenance: "Yes" },
      { id: 'veh_02', vin: 'W1K6G7GB0RA214408', make: 'Mercedes-Benz', model: 'S580 4-matic', year: 2024, licensePlate: 'KA53C0007TC0011', carType: 'Test Cars', status: VehicleStatus.ACTIVE, mileage: 2100, assignedEmployeeId: 'user_ra', fuelCardNumber: 'HHVS0055473', color: 'Black', location: 'BTG', engineNumber: '17698030169564', dateOfRegistration: '2024-01-16', documents: [ { type: DocumentType.INSURANCE, number: '31022428670101', expiryDate: '2026-04-25', vendor: 'Tata AIG' }, { type: DocumentType.RC, expiryDate: '2039-01-15' }, { type: DocumentType.PUC, expiryDate: '2025-07-15' } ], starEaseMaintenance: "Yes" },
      { id: 'veh_03', vin: 'W1KRJ7JB6RF000324', make: 'Mercedes-Benz', model: 'AMG GT 63', year: 2024, licensePlate: 'KA53C0007TC0013', carType: 'Test Cars', status: VehicleStatus.MAINTENANCE, mileage: 3500, assignedEmployeeId: 'user_vs', fuelCardNumber: '#N/A', color: 'Red', location: 'EC', engineNumber: '17788060226368', dateOfRegistration: '2024-03-06', documents: [ { type: DocumentType.INSURANCE, number: '31022428670102', expiryDate: '2026-04-25', vendor: 'Tata AIG' }, { type: DocumentType.RC, expiryDate: '2039-03-05' }, { type: DocumentType.PUC, expiryDate: '2025-09-04' } ], starEaseMaintenance: "No" },
      { id: 'veh_04', vin: 'W1K2231632A026661', make: 'Mercedes-Benz', model: 'S Class 500', year: 2022, licensePlate: 'KA53C0007TC0003', carType: 'Pool Cars', status: VehicleStatus.ACTIVE, mileage: 25000, assignedEmployeeId: null, fuelCardNumber: 'HHVS0055483', color: 'White', location: 'BTG', engineNumber: '25693030318561', dateOfRegistration: '2022-11-17', documents: [ { type: DocumentType.INSURANCE, number: '31022428670100', expiryDate: '2025-09-26', vendor: 'Tata AIG' }, { type: DocumentType.RC, expiryDate: '2037-11-16' }, { type: DocumentType.PUC, expiryDate: '2025-05-16' } ], carVendorName: 'Sundaram Motors', starEaseMaintenance: "No", ioNumber: 'IO-109120', dealerName: 'Sundaram Motors' },
    ];
    sampleVehicles.forEach(v => {
        v.statusHistory = [{ status: VehicleStatus.ACTIVE, date: v.dateOfRegistration! }];
        if (v.assignedEmployeeId) {
            v.assignmentHistory = [{ assignedToId: v.assignedEmployeeId, assignedToName: initialUsers.find(u=>u.id === v.assignedEmployeeId)?.name || 'Unknown', type: 'Employee', startDate: v.dateOfRegistration!, endDate: null, startMileage: 0, endMileage: null }];
        } else { v.assignmentHistory = []; }
        if (v.carType === 'Test Cars') { v.assignedChauffeurId = null; }
    });
    const initialVehicles: Vehicle[] = [...sampleVehicles];
    const vehicleMakesAndModels = [ { make: 'Mercedes-Benz', models: ["C-Class", "GLA", "GLE", "E-Class", "S-Class", "GLC", "A-Class Limousine"] }, ];
    const colors = ["White", "Black", "Silver", "Blue", "Red"]; const locations = ["Bangalore", "Mumbai", "Delhi", "Chennai", "EC", "BTG"];
    if (MOCK_VEHICLES_COUNT > sampleVehicles.length) {
      Array.from({ length: MOCK_VEHICLES_COUNT - sampleVehicles.length }, (_, i) => {
          const makeModelInfo = vehicleMakesAndModels[i % vehicleMakesAndModels.length]; const make = makeModelInfo.make; const model = makeModelInfo.models[i % makeModelInfo.models.length]; const year = 2018 + (i % 6); const dateOfRegistration = generatePastDate(i * 100 + 365);
          const randomStatus = Math.random(); let status: VehicleStatus;
          if (randomStatus < 0.75) status = VehicleStatus.ACTIVE; else if (randomStatus < 0.9) status = VehicleStatus.MAINTENANCE; else if (randomStatus < 0.98) status = VehicleStatus.INACTIVE; else status = VehicleStatus.RETIRED;
          const hasPuc = Math.random() > 0.2; const docs: Document[] = [ { type: DocumentType.RC, number: `RC${String(10000 + i).padStart(8, '0')}`, expiryDate: generateFutureDate(Math.random() > 0.8 ? -10 : Math.floor(Math.random() * 730)) }, { type: DocumentType.INSURANCE, number: `INS${String(10000 + i).padStart(8, '0')}`, expiryDate: generateFutureDate(Math.random() > 0.8 ? -20 : Math.floor(Math.random() * 365)), startDate: generatePastDate(365), vendor: "Bajaj Allianz" }, { type: DocumentType.FITNESS, number: `FIT${String(10000 + i).padStart(8, '0')}`, expiryDate: generateFutureDate(Math.random() > 0.8 ? -5 : Math.floor(Math.random() * 730)) }, ];
          if(hasPuc) { docs.push({ type: DocumentType.PUC, number: `PUC${String(10000 + i).padStart(8, '0')}`, expiryDate: generateFutureDate(Math.random() > 0.8 ? 10 : Math.floor(Math.random() * 180)), startDate: generatePastDate(180) }); }
          initialVehicles.push({ id: generateMockId(), vin: generateVin(), make, model, year, licensePlate: `KA${String(i + 10).padStart(2, '0')}CD${String(2000 + i).padStart(4, '0')}`, status: status, mileage: 20000 + Math.floor(Math.random() * 150000), imageUrl: `https://placehold.co/600x400/1f2937/9ca3af?text=${encodeURIComponent(getVehicleImageText(make, model))}`, documents: docs, shift: Object.values(Shift)[i % Object.values(Shift).length], assignedChauffeurId: null, color: colors[i % colors.length], location: locations[i % locations.length], engineNumber: `EN${generateMockId().toUpperCase()}`, dateOfRegistration: dateOfRegistration, leaseCloseDate: generateFutureDate(365 * 2 + i), ownershipType: i % 2 === 0 ? 'Leased' : 'Owned', isStd: i % 3 === 0, starEaseMaintenance: i % 2 === 0 ? "Yes" : "No", statusHistory: [{ status: VehicleStatus.ACTIVE, date: dateOfRegistration }], assignmentHistory: [], ioNumber: `IO-${1000 + i}`, documentLink: 'https://example.com/docs/doc.pdf', soldTo: i % 10 === 0 ? 'Internal Transfer' : undefined, dealerName: i % 2 === 0 ? 'Vantage Auto' : 'Prestige Motors', });
      });
    }
    const today = new Date(); const oneMonthAgo = new Date(today.getFullYear(), today.getMonth() - 1, 15); const twoMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 2, 15);
    initialVehicles.forEach((v, i) => {
        if (!v.statusHistory || v.statusHistory.length === 0) { v.statusHistory = [{ status: v.status, date: v.dateOfRegistration! }]; }
        if (i === 5 && v.dateOfRegistration && new Date(v.dateOfRegistration) < oneMonthAgo) { v.statusHistory = [ { status: VehicleStatus.ACTIVE, date: v.dateOfRegistration! }, { status: VehicleStatus.MAINTENANCE, date: oneMonthAgo.toISOString() } ]; v.status = VehicleStatus.MAINTENANCE; }
        if (i === 6 && v.dateOfRegistration && new Date(v.dateOfRegistration) < twoMonthsAgo) { v.statusHistory = [ { status: VehicleStatus.ACTIVE, date: v.dateOfRegistration! }, { status: VehicleStatus.MAINTENANCE, date: twoMonthsAgo.toISOString() }, { status: VehicleStatus.ACTIVE, date: oneMonthAgo.toISOString() } ]; v.status = VehicleStatus.ACTIVE; }
        if (i === 7 && v.dateOfRegistration && new Date(v.dateOfRegistration) < twoMonthsAgo) { v.statusHistory = [ { status: VehicleStatus.ACTIVE, date: v.dateOfRegistration! }, { status: VehicleStatus.INACTIVE, date: twoMonthsAgo.toISOString() } ]; v.status = VehicleStatus.INACTIVE; }
    });
    const chauffeurFirstNames = [ "Rajesh", "Priya", "Amit", "Sunita", "Vikram", "Anjali", "Sanjay", "Deepa", "Manoj", "Rohan", "Sonia", "Vijay", "Geeta", "Arun", "Meena", "Naveen", "Pooja", "Suresh", "Kavita", "Anil", "Rekha", "Nitin", "Aditya", "Kabir", "Arjun" ]; const chauffeurLastNames = [ "Kumar", "Sharma", "Singh", "Devi", "Rathod", "Mehta", "Patel", "Rao", "Gupta", "Verma", "Joshi", "Das", "Chauhan", "Malik", "Yadav", "Saxena", "Iyer", "Nair", "Mishra", "Pandey", "Reddy", "Naidu", "Chopra", "Kaur", "Menon" ];
    let initialChauffeurs: Chauffeur[] = Array.from({ length: MOCK_CHAUFFEURS_COUNT }, (_, i) => {
        const name = `${chauffeurFirstNames[i]} ${chauffeurLastNames[i]}`; const randomStatus = Math.random(); let onboardingStatus: ChauffeurOnboardingStatus;
        if (randomStatus < 0.8) { onboardingStatus = ChauffeurOnboardingStatus.APPROVED; } else if (randomStatus < 0.95) { onboardingStatus = ChauffeurOnboardingStatus.AWAITING_APPROVAL; } else { onboardingStatus = ChauffeurOnboardingStatus.INVITED; }
        return { id: generateMockId(), name: name, licenseNumber: `DL${String(10000 + i).padStart(8, '0')}`, contact: `+91987654321${i}`, assignedVehicleId: null, imageUrl: `https://placehold.co/200x200/075985/e0f2fe?text=${name.charAt(0)}&font=montserrat}`, dlExpiryDate: generateFutureDate(Math.random() > 0.7 ? -15 : Math.floor(Math.random() * 730)), onboardingStatus: onboardingStatus, chauffeurType: i % 3 === 0 ? ChauffeurType.M_CAR : ChauffeurType.POOL, };
    });
    initialChauffeurs = initialChauffeurs.map(c => ({...c, name: `DRV-${c.name}`}));
    const employeesToAssign = employeeUsers; const assignableVehicles = initialVehicles.filter(v => v.status === VehicleStatus.ACTIVE && !v.assignedEmployeeId && v.carType !== 'Test Cars' && v.carType !== 'Pool Cars');
    const assignmentsToMake = Math.min(assignableVehicles.length, Math.floor(employeesToAssign.length * 0.7));
    for(let i=0; i < assignmentsToMake; i++) { assignableVehicles[i].assignedEmployeeId = employeesToAssign[i].id; }
    initialVehicles.forEach(v => {
        if (v.carType === 'Test Cars') { v.assignedChauffeurId = null; } else if (v.assignedEmployeeId) { v.carType = 'M-Car'; } else { v.carType = 'Pool Cars'; v.assignedChauffeurId = null; }
    });
    const mCars = initialVehicles.filter(v => v.carType === 'M-Car'); const availableChauffeurs = initialChauffeurs.filter(c => !c.assignedVehicleId && c.onboardingStatus === ChauffeurOnboardingStatus.APPROVED && c.chauffeurType === ChauffeurType.M_CAR);
    const chauffeurAssignmentsToMake = Math.min(mCars.length, availableChauffeurs.length);
    for (let i = 0; i < chauffeurAssignmentsToMake; i++) {
        const vehicle = mCars[i]; const chauffeur = availableChauffeurs[i];
        if (vehicle && chauffeur) { vehicle.assignedChauffeurId = chauffeur.id; chauffeur.assignedVehicleId = vehicle.id; chauffeur.reportingManager = vehicle.assignedEmployeeId; }
    }
    const vehWithHistory = initialVehicles.find(v => v.licensePlate === 'KA53C0007TC0003');
    if (vehWithHistory) {
        vehWithHistory.assignmentHistory = [ { assignedToId: 'user_emp_1', assignedToName: initialUsers.find(u => u.id === 'user_emp_1')?.name || '', type: 'Employee', startDate: vehWithHistory.dateOfRegistration!, endDate: generatePastDate(180), startMileage: 0, endMileage: 10000 }, { assignedToId: 'user_ra', assignedToName: initialUsers.find(u => u.id === 'user_ra')?.name || '', type: 'Employee', startDate: generatePastDate(179), endDate: generatePastDate(5), startMileage: 10000, endMileage: 24500 }, ];
    }

    // Craft specific policy scenarios for demonstration
    const findUnassignedVehicle = (excludeIds: string[]): Vehicle | undefined => initialVehicles.find(v => !v.assignedEmployeeId && !excludeIds.includes(v.id));
    const assignedForScenario: string[] = [];

    const empExceededKm = initialUsers.find(u => u.id === 'user_emp_2');
    const empExceededTime = initialUsers.find(u => u.id === 'user_emp_3');
    const empApproachingKm = initialUsers.find(u => u.id === 'user_emp_4');
    const empApproachingTime = initialUsers.find(u => u.id === 'user_emp_5');
    const empWithinLimits = initialUsers.find(u => u.id === 'user_emp_1');

    // Scenario 1: Exceeded KM (using two past vehicles)
    const vehForExceededKm1 = findUnassignedVehicle(assignedForScenario);
    if (vehForExceededKm1) assignedForScenario.push(vehForExceededKm1.id);
    const vehForExceededKm2 = findUnassignedVehicle(assignedForScenario);
    if (vehForExceededKm2) assignedForScenario.push(vehForExceededKm2.id);

    if (empExceededKm && vehForExceededKm1 && vehForExceededKm2) {
        // This is a past assignment on a different car, contributing to the user's total KM
        vehForExceededKm1.assignmentHistory = (vehForExceededKm1.assignmentHistory || []).concat([{
            assignedToId: empExceededKm.id, assignedToName: empExceededKm.name, type: 'Employee',
            startDate: generatePastDate(700), endDate: generatePastDate(300),
            startMileage: 1000, endMileage: 41000, // 40,000 km driven
        }]);
        // This is the current assignment
        vehForExceededKm2.mileage = 28000;
        vehForExceededKm2.assignedEmployeeId = empExceededKm.id;
        vehForExceededKm2.assignmentHistory = (vehForExceededKm2.assignmentHistory || []).concat([{
            assignedToId: empExceededKm.id, assignedToName: empExceededKm.name, type: 'Employee',
            startDate: generatePastDate(299), endDate: null,
            startMileage: 3000, endMileage: null, // Driven: 25,000 km
        }]);
    }

    // Scenario 2: Exceeded Time
    const vehForExceededTime = findUnassignedVehicle(assignedForScenario);
    if (vehForExceededTime) {
        assignedForScenario.push(vehForExceededTime.id);
        if (empExceededTime) {
            vehForExceededTime.assignedEmployeeId = empExceededTime.id;
            vehForExceededTime.assignmentHistory = (vehForExceededTime.assignmentHistory || []).concat([{
                assignedToId: empExceededTime.id, assignedToName: empExceededTime.name, type: 'Employee',
                startDate: generatePastDate(365 * 3 + 60), // 3 years, 2 months ago
                endDate: null, startMileage: 0, endMileage: null,
            }]);
        }
    }

    // Scenario 3: Approaching KM
    const vehForApproachingKm = findUnassignedVehicle(assignedForScenario);
    if (vehForApproachingKm) {
        assignedForScenario.push(vehForApproachingKm.id);
        if (empApproachingKm) {
            vehForApproachingKm.mileage = 56000;
            vehForApproachingKm.assignedEmployeeId = empApproachingKm.id;
            vehForApproachingKm.assignmentHistory = (vehForApproachingKm.assignmentHistory || []).concat([{
                assignedToId: empApproachingKm.id, assignedToName: empApproachingKm.name, type: 'Employee',
                startDate: generatePastDate(500), endDate: null,
                startMileage: 1000, endMileage: null, // Drove 55,000 km
            }]);
        }
    }

    // Scenario 4: Approaching Time
    const vehForApproachingTime = findUnassignedVehicle(assignedForScenario);
    if (vehForApproachingTime) {
        assignedForScenario.push(vehForApproachingTime.id);
        if (empApproachingTime) {
            vehForApproachingTime.assignedEmployeeId = empApproachingTime.id;
            vehForApproachingTime.assignmentHistory = (vehForApproachingTime.assignmentHistory || []).concat([{
                assignedToId: empApproachingTime.id, assignedToName: empApproachingTime.name, type: 'Employee',
                startDate: generatePastDate(30 * 32), // 32 months ago
                endDate: null, startMileage: 0, endMileage: null,
            }]);
        }
    }

    // Scenario 5: Well Within Limits
    const vehForWithinLimits = findUnassignedVehicle(assignedForScenario);
    if (vehForWithinLimits) {
        assignedForScenario.push(vehForWithinLimits.id);
        if (empWithinLimits) {
             vehForWithinLimits.mileage = 15000;
             vehForWithinLimits.assignedEmployeeId = empWithinLimits.id;
             vehForWithinLimits.assignmentHistory = (vehForWithinLimits.assignmentHistory || []).concat([{
                assignedToId: empWithinLimits.id, assignedToName: empWithinLimits.name, type: 'Employee',
                startDate: generatePastDate(180), // 6 months ago
                endDate: null, startMileage: 500, endMileage: null, // Drove 14,500 km
            }]);
        }
    }


    const initialTrips: Trip[] = [];
    const assignedChauffeursWithVehicles = initialChauffeurs.filter(c => c.assignedVehicleId);
    if (assignedChauffeursWithVehicles.length > 0) {
        for (let i = 0; i < MOCK_TRIPS_COUNT; i++) {
            const chauffeur = assignedChauffeursWithVehicles[i % assignedChauffeursWithVehicles.length];
            const vehicle = initialVehicles.find(v => v.id === chauffeur.assignedVehicleId);
            const startDayOffset = (i % 60) - 30; // Widen date range for more data
            const status = Object.values(TripStatus)[i % Object.values(TripStatus).length];
            const isPoolTrip = (i % 4 === 0) || (vehicle?.carType === 'Pool Cars');
            const tripType = Object.values(TripType)[i % Object.values(TripType).length];
    
            let tripPurpose: TripPurpose;
            let bookingMadeForEmployeeId: string | null = null;
            let guestName: string | undefined;
            let tripName: string;
    
            if (isPoolTrip) {
                tripPurpose = TripPurpose.POOL;
                guestName = ['Guest A (Pool)', 'Guest B (Pool)', 'Guest C (Pool)'][i % 3];
                tripName = `Pool Trip for ${guestName}`;
            } else if (vehicle && vehicle.assignedEmployeeId) {
                // This is an M-Car trip
                bookingMadeForEmployeeId = vehicle.assignedEmployeeId;
                const isEmployeePersonalTrip = Math.random() > 0.4; // 60% employee trips
                if (isEmployeePersonalTrip) {
                    tripPurpose = TripPurpose.EMPLOYEE;
                    tripName = `Employee Duty #${i}`;
                    guestName = undefined; // No guest for personal employee trips
                } else {
                    tripPurpose = TripPurpose.GUEST;
                    guestName = ['Client VIP 1', 'Client VIP 2'][i % 2];
                    tripName = `Guest Pickup for ${guestName}`;
                }
            } else {
                // Fallback for unassigned M-Cars or other cases
                tripPurpose = TripPurpose.GUEST;
                guestName = 'Corporate Guest';
                tripName = `Guest Duty #${i}`;
            }
            
            initialTrips.push({
                id: generateMockId(),
                tripName: tripName,
                vehicleId: isPoolTrip ? null : vehicle?.id,
                chauffeurId: isPoolTrip ? null : chauffeur.id,
                origin: ['Airport T1', 'Corporate Office', 'Hotel Grand', 'City Center'][i % 4],
                destination: ['Client Site', 'Factory Unit', 'Downtown', 'Exhibition Hall'][i % 4],
                waypoints: [],
                scheduledStartDate: generateDateTimeString(startDayOffset, 9 + (i % 5)),
                actualStartDate: status === TripStatus.ONGOING || status === TripStatus.COMPLETED ? generateDateTimeString(startDayOffset, 9) : undefined,
                actualEndDate: status === TripStatus.COMPLETED ? generateDateTimeString(startDayOffset, 17) : undefined,
                status: isPoolTrip ? TripStatus.PLANNED : status,
                dispatchStatus: isPoolTrip ? TripDispatchStatus.PENDING : undefined,
                tripType: tripType,
                otherTripTypeDetail: isPoolTrip && tripType === TripType.OTHER ? `Custom Event #${i}` : undefined,
                guestName: guestName,
                guestEmail: isPoolTrip ? `guest${i}@example.com` : undefined,
                guestPhone: isPoolTrip ? `+9198765123${(i % 100).toString().padStart(2, '0')}` : undefined,
                // Added fields
                tripPurpose: tripPurpose,
                bookingMadeForEmployeeId: bookingMadeForEmployeeId,
            });
        }
    }
    if (assignedChauffeursWithVehicles.length > 3) {
        for (let day = 1; day <= 5; day++) {
            for (let tripCount = 0; tripCount < 2; tripCount++) {
                const chauffeur = assignedChauffeursWithVehicles[tripCount % assignedChauffeursWithVehicles.length]; const vehicleId = chauffeur.assignedVehicleId; const startHour = 8 + (tripCount * 4); const endHour = startHour + 2 + Math.floor(Math.random() * 2);
                initialTrips.push({ id: generateMockId(), tripName: `Completed Trip - Day ${day}, #${tripCount+1}`, vehicleId: vehicleId, chauffeurId: chauffeur.id, origin: ['Whitefield', 'Marathahalli'][tripCount % 2], destination: ['Electronic City', 'MG Road'][tripCount % 2], waypoints: [], scheduledStartDate: generateDateTimeString(-day, startHour), actualStartDate: generateDateTimeString(-day, startHour), actualEndDate: generateDateTimeString(-day, endHour), status: TripStatus.COMPLETED, notes: `Trip completed successfully by ${chauffeur.name}. No issues reported.`, tripType: Object.values(TripType)[(day + tripCount) % Object.values(TripType).length] });
            }
        }
    }
    if (assignedChauffeursWithVehicles.length > 2) {
        for (let i = 0; i < 2; i++) {
            const chauffeur = assignedChauffeursWithVehicles[i]; const vehicleId = chauffeur.assignedVehicleId;
            initialTrips.push({ id: generateMockId(), tripName: `Ongoing Trip #${i + 1}`, vehicleId: vehicleId, chauffeurId: chauffeur.id, origin: ['Malleshwaram', 'Jayanagar'][i], destination: ['Whitefield', 'Electronic City'][i], waypoints: [], scheduledStartDate: generateDateTimeString(0, 9 + i * 2), actualStartDate: generateDateTimeString(0, 9 + i * 2), actualEndDate: undefined, status: TripStatus.ONGOING, notes: `Trip is currently in progress.`, tripType: Object.values(TripType)[i % Object.values(TripType).length] });
        }
    }
    if (assignedChauffeursWithVehicles.length > 3) {
        for (let day = 1; day <= 2; day++) {
             const chauffeur = assignedChauffeursWithVehicles[day]; const vehicleId = chauffeur.assignedVehicleId;
             initialTrips.push({ id: generateMockId(), tripName: `Upcoming Trip - Day ${day}`, vehicleId: vehicleId, chauffeurId: chauffeur.id, origin: ['Airport', 'Railway Station'][day-1], destination: ['Koramangala', 'Indiranagar'][day-1], waypoints: [], scheduledStartDate: generateDateTimeString(day, 10), actualStartDate: undefined, actualEndDate: undefined, status: TripStatus.PLANNED, notes: `This trip is scheduled for the future.`, tripType: Object.values(TripType)[(day * 2) % Object.values(TripType).length] });
        }
    }
    initialTrips.push({ id: 'rejected_trip_1', tripName: 'RK-trip', vehicleId: null, chauffeurId: null, origin: 'EC Office', destination: 'Client Location', waypoints: [], scheduledStartDate: generateDateTimeString(-1, 14), status: TripStatus.PLANNED, dispatchStatus: TripDispatchStatus.REJECTED, rejectionReason: 'Chauffeur unavailable', createdBy: 'Manager', guestName: 'Rakesh K.' });
    const initialAttendance: ChauffeurAttendance[] = [];
    for(let i=0; i < MOCK_CHAUFFEUR_ATTENDANCE_COUNT; i++) {
        const chauffeur = initialChauffeurs[i % initialChauffeurs.length]; const date = generatePastDate(Math.floor(i / initialChauffeurs.length));
        if (initialAttendance.some(a => a.chauffeurId === chauffeur.id && a.date === date)) continue;
        const status = Object.values(AttendanceStatus)[i % Object.values(AttendanceStatus).length];
        initialAttendance.push({ id: generateMockId(), chauffeurId: chauffeur.id, date: date, status: status, checkInTimestamp: status === AttendanceStatus.PRESENT || status === AttendanceStatus.HALF_DAY ? new Date(new Date(date).setHours(9, Math.floor(Math.random() * 30))).toISOString() : undefined, checkOutTimestamp: status === AttendanceStatus.PRESENT ? new Date(new Date(date).setHours(18, Math.floor(Math.random() * 60))).toISOString() : undefined, });
    }
    const initialReportedIssues: ReportedIssue[] = [];
    if (initialChauffeurs.length > 0 && initialVehicles.length > 0) {
        const issueDescriptions = ["Engine rattling noise.", "Brake pedal feels spongy.", "Check engine light is on.", "Tire pressure low warning.", "A/C not cooling effectively.", "Suspension feels bumpy.", "Headlight bulb is out.", "Wipers are not working properly."];
        for (let i = 0; i < MOCK_REPORTED_ISSUES_COUNT; i++) {
            const chauffeur = initialChauffeurs[i % initialChauffeurs.length]; const vehicle = initialVehicles[i % initialVehicles.length];
            initialReportedIssues.push({ id: generateMockId(), chauffeurId: chauffeur.id, vehicleId: vehicle.id, reportDate: generatePastDate(i), issueDescription: issueDescriptions[i % issueDescriptions.length], status: Object.values(IssueStatus)[i % Object.values(IssueStatus).length], severity: Object.values(IssueSeverity)[i % Object.values(IssueSeverity).length], });
        }
    }
    const initialMechanics: Mechanic[] = Array.from({ length: MOCK_MECHANICS_COUNT }, (_, i) => ({ id: generateMockId(), name: i < 2 ? `Internal Team ${i+1}` : `Vendor Garage #${i-1}`, phoneNumber: `+91876543210${i}`, specialties: ['Engine', 'Body Work', 'Tires', 'Electrical'][i % 4].split(','), isInternal: i < 2, }));
    const initialMaintenanceTasks: MaintenanceTask[] = [];
     if (initialVehicles.length > 0) {
        for (let i = 0; i < MOCK_MAINTENANCE_TASKS_COUNT; i++) {
            const vehicle = initialVehicles[i % initialVehicles.length]; const status = Object.values(MaintenanceTaskStatus)[i % Object.values(MaintenanceTaskStatus).length]; const type = Object.values(MaintenanceType)[i % Object.values(MaintenanceType).length]; const scheduledDate = generatePastDate(30 - i); const completionDate = status === MaintenanceTaskStatus.COMPLETED ? generatePastDate(30 - i - 2) : undefined; const partsCost = type === MaintenanceType.CORRECTIVE || type === MaintenanceType.UPGRADE ? 5000 + Math.random() * 15000 : 1000 + Math.random() * 4000; const laborCost = 1000 + Math.random() * 3000;
            initialMaintenanceTasks.push({ id: generateMockId(), jobCardNumber: `JC-${String(1001 + i).padStart(4,'0')}`, vehicleId: vehicle.id, title: `${type} Service for ${vehicle.licensePlate}`, maintenanceType: type, status: status, scheduledDate: scheduledDate, completionDate: completionDate, totalCost: status === MaintenanceTaskStatus.COMPLETED ? partsCost + laborCost : 0, partsCost: status === MaintenanceTaskStatus.COMPLETED ? partsCost : 0, laborCost: status === MaintenanceTaskStatus.COMPLETED ? laborCost : 0, odometerAtMaintenance: vehicle.mileage - (500 + Math.random() * 2000), });
        }
    }
    const initialCostCategories: CostCategory[] = [ { id: 'cat_fuel', name: 'Fuel', isSystemDefined: true }, { id: 'cat_maintenance', name: 'Scheduled Maintenance', isSystemDefined: true }, { id: 'cat_repairs', name: 'Repairs & Parts', isSystemDefined: true }, { id: 'cat_tolls', name: 'Tolls & Fees', isSystemDefined: false }, { id: 'cat_cleaning', name: 'Cleaning & Detailing', isSystemDefined: false }, { id: 'cat_insurance', name: 'Insurance Premium', isSystemDefined: true }, { id: 'cat_compliance', name: 'Compliance (PUC/Permit)', isSystemDefined: true }, ];
    const initialCostEntries: CostEntry[] = [];
    if (initialVehicles.length > 0) {
        for (let i = 0; i < MOCK_COST_ENTRIES_COUNT; i++) {
            const vehicle = initialVehicles[i % initialVehicles.length]; const category = initialCostCategories[i % initialCostCategories.length];
            if (category.name === 'Fuel') continue;
            initialCostEntries.push({ id: generateMockId(), date: generatePastDate(i), costCategoryId: category.id, vehicleId: vehicle.id, tripId: null, amount: 500 + Math.random() * 5000, description: `${category.name} for ${vehicle.licensePlate}`, });
        }
    }
    const initialFuelLogs: FuelLogEntry[] = [];
    if(initialVehicles.length > 0) {
        for(let i=0; i<MOCK_FUEL_LOGS_COUNT; i++) {
            const vehicle = initialVehicles[i % initialVehicles.length]; const quantity = 20 + Math.random() * 30; const costPerUnit = 95 + Math.random() * 10;
            initialFuelLogs.push({ id: generateMockId(), vehicleId: vehicle.id, date: generatePastDate(Math.floor(i/2)), fuelType: FuelType.DIESEL, quantity: quantity, costPerUnit: costPerUnit, totalCost: quantity * costPerUnit, odometerReading: vehicle.mileage - (i * 50), });
        }
    }
    const initialFuelCards: FuelCard[] = Array.from({ length: MOCK_FUEL_CARDS_COUNT }, (_, i) => {
        const poolCars = initialVehicles.filter(v => v.carType === 'Pool Cars'); const assignedPoolCar = poolCars.length > i ? poolCars[i] : null;
        return { id: generateMockId(), cardNumber: `FC${String(1000 + i).padStart(8,'0')}`, issuanceDate: generatePastDate(100 + i*10), expiryDate: generateFutureDate(365 * 2 - i*10), assignedChauffeurId: null, assignedVehicleId: assignedPoolCar?.id || null, status: i % 5 === 4 ? FuelCardStatus.INACTIVE : FuelCardStatus.ACTIVE, provider: ['HP', 'Indian Oil', 'Shell'][i%3] as any, };
    });
    
    return {
        initialUsers, initialVehicles, initialChauffeurs, initialAttendance, initialTrips,
        initialReportedIssues, initialMechanics, initialMaintenanceTasks, initialCostCategories,
        initialCostEntries, initialFuelLogs, initialFuelCards, initialEmails: []
    };
}

const App: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [chauffeurs, setChauffeurs] = useState<Chauffeur[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [chauffeurAttendance, setChauffeurAttendance] = useState<ChauffeurAttendance[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [reportedIssues, setReportedIssues] = useState<ReportedIssue[]>([]);
  const [mechanics, setMechanics] = useState<Mechanic[]>([]);
  const [maintenanceTasks, setMaintenanceTasks] = useState<MaintenanceTask[]>([]);
  const [costCategories, setCostCategories] = useState<CostCategory[]>([]);
  const [costEntries, setCostEntries] = useState<CostEntry[]>([]);
  const [fuelLogs, setFuelLogs] = useState<FuelLogEntry[]>([]);
  const [fuelCards, setFuelCards] = useState<FuelCard[]>([]);
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [simulatedEmails, setSimulatedEmails] = useState<SimulatedEmail[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load data from localStorage or generate mock data on initial load
  useEffect(() => {
    try {
      const savedVehicles = localStorage.getItem('fleetpro_vehicles');
      if (savedVehicles) {
        setVehicles(JSON.parse(savedVehicles));
        setChauffeurs(JSON.parse(localStorage.getItem('fleetpro_chauffeurs') || '[]'));
        setUsers(JSON.parse(localStorage.getItem('fleetpro_users') || '[]'));
        setChauffeurAttendance(JSON.parse(localStorage.getItem('fleetpro_attendance') || '[]'));
        setTrips(JSON.parse(localStorage.getItem('fleetpro_trips') || '[]'));
        setReportedIssues(JSON.parse(localStorage.getItem('fleetpro_issues') || '[]'));
        setMechanics(JSON.parse(localStorage.getItem('fleetpro_mechanics') || '[]'));
        setMaintenanceTasks(JSON.parse(localStorage.getItem('fleetpro_maintenance') || '[]'));
        setCostCategories(JSON.parse(localStorage.getItem('fleetpro_cost_categories') || '[]'));
        setCostEntries(JSON.parse(localStorage.getItem('fleetpro_cost_entries') || '[]'));
        setFuelLogs(JSON.parse(localStorage.getItem('fleetpro_fuel_logs') || '[]'));
        setFuelCards(JSON.parse(localStorage.getItem('fleetpro_fuel_cards') || '[]'));
        setNotifications(JSON.parse(localStorage.getItem('fleetpro_notifications') || '[]'));
        setSimulatedEmails(JSON.parse(localStorage.getItem('fleetpro_emails') || '[]'));
      } else {
        const mockData = generateInitialMockData();
        setVehicles(mockData.initialVehicles);
        setChauffeurs(mockData.initialChauffeurs);
        setUsers(mockData.initialUsers);
        setChauffeurAttendance(mockData.initialAttendance);
        setTrips(mockData.initialTrips);
        setReportedIssues(mockData.initialReportedIssues);
        setMechanics(mockData.initialMechanics);
        setMaintenanceTasks(mockData.initialMaintenanceTasks);
        setCostCategories(mockData.initialCostCategories);
        setCostEntries(mockData.initialCostEntries);
        setFuelLogs(mockData.initialFuelLogs);
        setFuelCards(mockData.initialFuelCards);
        setSimulatedEmails(mockData.initialEmails);
      }
    } catch (error) {
      console.error("Failed to load or parse data from localStorage. Regenerating mock data.", error);
      const mockData = generateInitialMockData();
      setVehicles(mockData.initialVehicles);
      setChauffeurs(mockData.initialChauffeurs);
      // ... set all other states from mockData
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Effect to check for and generate renewal emails on app load (simulates a daily cron job)
  useEffect(() => {
    if (isLoading) return; // Don't run until data is loaded

    const generatedEmails = checkAndGenerateRenewalEmails(vehicles, users, simulatedEmails);
    
    if (generatedEmails.length > 0) {
      // Prepend new emails to the list to show them at the top
      setSimulatedEmails(prevEmails => [...generatedEmails, ...prevEmails]);
    }
    // This effect runs once per app session after data is loaded to simulate a daily check.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

  // Save state to localStorage whenever it changes
  useEffect(() => { if (!isLoading) localStorage.setItem('fleetpro_vehicles', JSON.stringify(vehicles)); }, [vehicles, isLoading]);
  useEffect(() => { if (!isLoading) localStorage.setItem('fleetpro_chauffeurs', JSON.stringify(chauffeurs)); }, [chauffeurs, isLoading]);
  useEffect(() => { if (!isLoading) localStorage.setItem('fleetpro_users', JSON.stringify(users)); }, [users, isLoading]);
  useEffect(() => { if (!isLoading) localStorage.setItem('fleetpro_attendance', JSON.stringify(chauffeurAttendance)); }, [chauffeurAttendance, isLoading]);
  useEffect(() => { if (!isLoading) localStorage.setItem('fleetpro_trips', JSON.stringify(trips)); }, [trips, isLoading]);
  useEffect(() => { if (!isLoading) localStorage.setItem('fleetpro_issues', JSON.stringify(reportedIssues)); }, [reportedIssues, isLoading]);
  useEffect(() => { if (!isLoading) localStorage.setItem('fleetpro_mechanics', JSON.stringify(mechanics)); }, [mechanics, isLoading]);
  useEffect(() => { if (!isLoading) localStorage.setItem('fleetpro_maintenance', JSON.stringify(maintenanceTasks)); }, [maintenanceTasks, isLoading]);
  useEffect(() => { if (!isLoading) localStorage.setItem('fleetpro_cost_categories', JSON.stringify(costCategories)); }, [costCategories, isLoading]);
  useEffect(() => { if (!isLoading) localStorage.setItem('fleetpro_cost_entries', JSON.stringify(costEntries)); }, [costEntries, isLoading]);
  useEffect(() => { if (!isLoading) localStorage.setItem('fleetpro_fuel_logs', JSON.stringify(fuelLogs)); }, [fuelLogs, isLoading]);
  useEffect(() => { if (!isLoading) localStorage.setItem('fleetpro_fuel_cards', JSON.stringify(fuelCards)); }, [fuelCards, isLoading]);
  useEffect(() => { if (!isLoading) localStorage.setItem('fleetpro_notifications', JSON.stringify(notifications)); }, [notifications, isLoading]);
  useEffect(() => { if (!isLoading) localStorage.setItem('fleetpro_emails', JSON.stringify(simulatedEmails)); }, [simulatedEmails, isLoading]);


  const createNotification = useCallback((
    type: NotificationType, 
    subject: string, 
    details: string, 
    relatedIds: { tripId?: string; chauffeurId?: string; vehicleId?: string }
  ) => {
    const newNotification: SystemNotification = {
      id: generateMockId(),
      type,
      subject,
      details,
      timestamp: new Date().toISOString(),
      isRead: false,
      relatedTripId: relatedIds.tripId,
      relatedChauffeurId: relatedIds.chauffeurId,
      relatedVehicleId: relatedIds.vehicleId,
    };
    setNotifications(prev => [newNotification, ...prev]);
  }, []);
  
  const simulateChauffeurResponse = useCallback((tripId: string, chauffeurId: string, vehicleId: string) => {
    const trip = trips.find(t => t.id === tripId);
    const chauffeur = chauffeurs.find(c => c.id === chauffeurId);
    if (!trip || !chauffeur) return;

    setTimeout(() => {
        const accepts = Math.random() > 0.2; // 80% chance of accepting
        if (accepts) {
            createNotification(
                NotificationType.TRIP_ACCEPTED,
                `Trip Accepted: ${chauffeur.name}`,
                `Chauffeur ${chauffeur.name} has accepted trip "${trip.tripName}".`,
                { tripId, chauffeurId, vehicleId }
            );
            
            setVehicles(prevVehicles => prevVehicles.map(v => 
                v.id === vehicleId ? { ...v, assignedChauffeurId: chauffeurId } : v
            ));
            setChauffeurs(prevChauffeurs => prevChauffeurs.map(c =>
                c.id === chauffeurId ? { ...c, assignedVehicleId: vehicleId } : c
            ));

            setTrips(prev => prev.map(t => {
                if (t.id === tripId) {
                    return { 
                        ...t, 
                        status: TripStatus.PLANNED, 
                        dispatchStatus: TripDispatchStatus.ACCEPTED, 
                        chauffeurId: chauffeurId, 
                        vehicleId: vehicleId,
                        offeredToChauffeurId: null,
                        offeredVehicleId: null 
                    };
                }
                return t;
            }));
        } else {
            const reason = "Scheduling conflict with another appointment.";
            createNotification(
                NotificationType.TRIP_REJECTED,
                `Trip Rejected: ${chauffeur.name}`,
                `Chauffeur ${chauffeur.name} rejected trip "${trip.tripName}". Reason: ${reason}`,
                { tripId, chauffeurId }
            );
            setTrips(prev => prev.map(t => {
                if (t.id === tripId) {
                    return { 
                        ...t, 
                        dispatchStatus: TripDispatchStatus.REJECTED, 
                        offeredToChauffeurId: null, 
                        offeredVehicleId: null,
                        rejectionReason: reason 
                    };
                }
                return t;
            }));
        }
    }, 10000 + Math.random() * 5000); // 10-15 second delay
  }, [trips, chauffeurs, createNotification]);

  const dispatchTripToChauffeur = useCallback((
    tripId: string,
    chauffeurId: string,
    vehicleId: string,
    purposeData: { tripPurpose: TripPurpose; bookingMadeForEmployeeId?: string | null }
  ) => {
      const trip = trips.find(t => t.id === tripId);
      const chauffeur = chauffeurs.find(c => c.id === chauffeurId);
      const vehicle = vehicles.find(v => v.id === vehicleId);
      if (!trip || !chauffeur || !vehicle) return;

      setTrips(prev => prev.map(t => t.id === tripId ? {
          ...t,
          dispatchStatus: TripDispatchStatus.AWAITING_ACCEPTANCE,
          offeredToChauffeurId: chauffeurId,
          offeredVehicleId: vehicleId,
          rejectionReason: undefined,
          ...purposeData,
      } : t));

      createNotification(
          NotificationType.TRIP_DISPATCH,
          `Trip offered to ${chauffeur.name}`,
          `A new trip "${trip.tripName}" from ${trip.origin} to ${trip.destination} with vehicle ${vehicle.licensePlate} has been offered to ${chauffeur.name}. Awaiting response.`,
          { tripId, chauffeurId, vehicleId }
      );
      
      simulateChauffeurResponse(tripId, chauffeurId, vehicleId);

  }, [trips, chauffeurs, vehicles, createNotification, simulateChauffeurResponse]);


  const addVehicle = useCallback((vehicleData: Omit<Vehicle, 'id' | 'imageUrl'>) => {
    const newVehicle: Vehicle = {
      ...vehicleData,
      id: generateMockId(),
      imageUrl: `https://placehold.co/600x400/1f2937/9ca3af?text=${encodeURIComponent(getVehicleImageText(vehicleData.make, vehicleData.model))}`,
      statusHistory: [{ status: vehicleData.status, date: new Date().toISOString() }],
      assignmentHistory: [],
    };
    
    if(newVehicle.assignedEmployeeId) {
        newVehicle.assignmentHistory.push({
            assignedToId: newVehicle.assignedEmployeeId,
            assignedToName: users.find(u => u.id === newVehicle.assignedEmployeeId)?.name || 'Unknown',
            type: 'Employee',
            startDate: new Date().toISOString(),
            endDate: null,
        });
    }

    setVehicles(prev => [newVehicle, ...prev]);

    if (newVehicle.assignedChauffeurId) {
        setChauffeurs(prev => prev.map(c => 
            c.id === newVehicle.assignedChauffeurId ? { ...c, assignedVehicleId: newVehicle.id } : c
        ));
    }
  }, [users]);


  const updateVehicle = useCallback((vehicleData: Vehicle, transferReason?: string) => {
    const oldVehicle = vehicles.find(v => v.id === vehicleData.id);
    if (oldVehicle) {
        const newEmails: SimulatedEmail[] = [];
        const updatedDocs: { type: DocumentType, newExpiry: string }[] = [];
        
        (vehicleData.documents || []).forEach(newDoc => {
            if (newDoc.type === DocumentType.INSURANCE || newDoc.type === DocumentType.PUC) {
                const oldDoc = oldVehicle.documents?.find(d => d.type === newDoc.type);
                if (newDoc.expiryDate && (!oldDoc || !oldDoc.expiryDate || newDoc.expiryDate !== oldDoc.expiryDate)) {
                    updatedDocs.push({ type: newDoc.type, newExpiry: newDoc.expiryDate });
                }
            }
        });

        if (updatedDocs.length > 0 && vehicleData.assignedEmployeeId) {
            const assignedUser = users.find(u => u.id === vehicleData.assignedEmployeeId);
            const fleetTeamUsers = users.filter(u => u.role === UserRole.ADMIN || u.role === UserRole.FLEET_MANAGER);
            const fleetTeamEmails = fleetTeamUsers.map(u => u.email).join(', ');

            if (assignedUser && fleetTeamEmails) {
                updatedDocs.forEach(updatedDoc => {
                    // 1. Send confirmation email
                    const emailBody = `Dear ${assignedUser.name},\n\nThis is a confirmation that the ${updatedDoc.type} for your assigned vehicle, ${vehicleData.make} ${vehicleData.model} (${vehicleData.licensePlate}), has been updated in the system.\n\nNew Expiry Date: ${new Date(updatedDoc.newExpiry).toLocaleDateString('en-IN')}\n\nA copy of this confirmation has been sent to the fleet team.\n\nThank you,\nFleetPro System`;
                    newEmails.push({
                        id: generateMockId(),
                        recipient: `${assignedUser.email}; CC: ${fleetTeamEmails}`,
                        subject: `Confirmation: ${updatedDoc.type} Updated for Vehicle ${vehicleData.licensePlate}`,
                        body: emailBody,
                        timestamp: new Date().toISOString(),
                        vehicleId: vehicleData.id,
                        alertType: AlertType.INSURANCE_PERMIT_RENEWAL,
                    });

                    // 2. Immediately check if a new warning is needed for expired or soon-to-expire documents
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const sevenDaysFromNow = new Date(today);
                    sevenDaysFromNow.setDate(today.getDate() + 7);
                    const expiry = new Date(updatedDoc.newExpiry);
                    expiry.setHours(0, 0, 0, 0); // Normalize expiry date

                    if (expiry <= sevenDaysFromNow) {
                        const isExpired = expiry < today;
                        const expiryString = expiry.toLocaleDateString('en-IN');
                        const warningMessage = isExpired
                            ? `has EXPIRED on ${expiryString}`
                            : `is expiring in less than 7 days on ${expiryString}`;
                            
                        const urgentEmailBody = `Dear ${assignedUser.name},\n\n** URGENT WARNING **\n\nThe ${updatedDoc.type} for your assigned vehicle, ${vehicleData.make} ${vehicleData.model} (${vehicleData.licensePlate}), ${warningMessage}.\n\nPlease ensure the document is renewed and uploaded to the FleetPro portal immediately to avoid compliance issues.\n\nThis email has been copied to the fleet management team.\n\nRegards,\nFleetPro System`;
                        newEmails.push({
                            id: generateMockId(),
                            recipient: `${assignedUser.email}; CC: ${fleetTeamEmails}`,
                            subject: `URGENT: ${updatedDoc.type} Expiry for Vehicle ${vehicleData.licensePlate}`,
                            body: urgentEmailBody,
                            timestamp: new Date().toISOString(),
                            vehicleId: vehicleData.id,
                            alertType: AlertType.INSURANCE_PERMIT_RENEWAL
                        });
                    }
                });
            }
        }
        if (newEmails.length > 0) {
            setSimulatedEmails(prevEmails => [...newEmails, ...prevEmails]);
        }
    }

    setVehicles(prev => {
        const oldVehicle = prev.find(v => v.id === vehicleData.id);
        if (!oldVehicle) return prev;
        
        if (oldVehicle.assignedEmployeeId !== vehicleData.assignedEmployeeId) {
            const now = new Date().toISOString();
            const history = [...(vehicleData.assignmentHistory || [])];
            
            const lastAssignment = history.slice().reverse().find(h => h.endDate === null);
            if (lastAssignment) {
                lastAssignment.endDate = now;
                lastAssignment.endMileage = vehicleData.mileage;
            }

            if (vehicleData.assignedEmployeeId) {
                history.push({
                    assignedToId: vehicleData.assignedEmployeeId,
                    assignedToName: users.find(u => u.id === vehicleData.assignedEmployeeId)?.name || 'Unknown',
                    type: 'Employee',
                    startDate: now,
                    endDate: null,
                    startMileage: vehicleData.mileage,
                    endMileage: null,
                    transferReason: transferReason,
                });
            }
            vehicleData.assignmentHistory = history;
        }

        if (oldVehicle.status !== vehicleData.status) {
            const history = [...(vehicleData.statusHistory || [])];
            history.push({ status: vehicleData.status, date: new Date().toISOString() });
            vehicleData.statusHistory = history;
        }

        return prev.map(v => v.id === vehicleData.id ? vehicleData : v);
    });
    
    setChauffeurs(prev => prev.map(c => {
        if (c.assignedVehicleId === vehicleData.id) { return { ...c, assignedVehicleId: null }; }
        if (c.id === vehicleData.assignedChauffeurId) { return { ...c, assignedVehicleId: vehicleData.id }; }
        return c;
    }));
  }, [users, vehicles, setSimulatedEmails]);
  
  const deleteVehicle = useCallback((vehicleId: string) => {
    setVehicles(prev => prev.filter(v => v.id !== vehicleId));
    setChauffeurs(prev => prev.map(c => c.assignedVehicleId === vehicleId ? {...c, assignedVehicleId: null} : c));
  }, []);

  const addChauffeur = useCallback((chauffeurData: Omit<Chauffeur, 'id' | 'imageUrl' | 'onboardingStatus'>) => {
    const name = chauffeurData.name;
    const newChauffeur: Chauffeur = {
      ...chauffeurData,
      id: generateMockId(),
      imageUrl: `https://placehold.co/200x200/075985/e0f2fe?text=${name.charAt(0)}&font=montserrat}`,
      onboardingStatus: ChauffeurOnboardingStatus.INVITED,
    };
    setChauffeurs(prev => [newChauffeur, ...prev]);

    createNotification( NotificationType.GENERIC_ALERT, `Chauffeur Invited: ${name}`, `An invitation has been sent to ${name} (${chauffeurData.contact}). They need to download the app and sign up.`, { chauffeurId: newChauffeur.id } );

    setTimeout(() => {
        setChauffeurs(prev => prev.map(c => c.id === newChauffeur.id ? { ...c, onboardingStatus: ChauffeurOnboardingStatus.AWAITING_APPROVAL } : c ));
        createNotification( NotificationType.CHAUFFEUR_ONBOARD, `Approval Needed: ${name}`, `${name} has completed the signup process and is awaiting your approval to join the fleet.`, { chauffeurId: newChauffeur.id } );
    }, 15000 + Math.random() * 10000);

    if (newChauffeur.assignedVehicleId) {
        setVehicles(prev => prev.map(v => v.id === newChauffeur.assignedVehicleId ? {...v, assignedChauffeurId: newChauffeur.id} : v));
    }
  }, [createNotification]);
  
  const addChauffeursBatch = useCallback((chauffeursData: Omit<Chauffeur, 'id' | 'imageUrl' | 'onboardingStatus'>[]) => {
      const newChauffeurs: Chauffeur[] = chauffeursData.map(c => ({
          ...c,
          id: generateMockId(),
          imageUrl: `https://placehold.co/200x200/075985/e0f2fe?text=${c.name.charAt(0)}&font=montserrat}`,
          onboardingStatus: ChauffeurOnboardingStatus.APPROVED,
      }));
      setChauffeurs(prev => [...newChauffeurs, ...prev]);
  }, []);

  const approveChauffeur = useCallback((chauffeurId: string) => {
    let chauffeurName = '';
    setChauffeurs(prev => prev.map(c => {
        if (c.id === chauffeurId) {
            chauffeurName = c.name;
            return { ...c, onboardingStatus: ChauffeurOnboardingStatus.APPROVED };
        }
        return c;
    }));
    if (chauffeurName) { createNotification( NotificationType.CHAUFFEUR_ONBOARD, `Chauffeur Approved: ${chauffeurName}`, `${chauffeurName} has been approved and is now an active chauffeur in the fleet.`, { chauffeurId: chauffeurId } ); }
  }, [createNotification]);

  const updateChauffeur = useCallback((chauffeurData: Chauffeur) => {
    setChauffeurs(prev => {
        const oldChauffeur = prev.find(c => c.id === chauffeurData.id);
        if (oldChauffeur?.assignedVehicleId !== chauffeurData.assignedVehicleId) {
            setVehicles(v_prev => v_prev.map(v => {
                if (v.id === oldChauffeur?.assignedVehicleId) return {...v, assignedChauffeurId: null};
                if (v.id === chauffeurData.assignedVehicleId) return {...v, assignedChauffeurId: chauffeurData.id};
                return v;
            }));
        }
        return prev.map(c => c.id === chauffeurData.id ? chauffeurData : c);
    });
  }, []);
  
  const deleteChauffeur = useCallback((chauffeurId: string) => {
    const chauffeurToDelete = chauffeurs.find(c => c.id === chauffeurId);
    setChauffeurs(prev => prev.filter(c => c.id !== chauffeurId));
    if (chauffeurToDelete?.assignedVehicleId) {
        setVehicles(prev => prev.map(v => v.id === chauffeurToDelete.assignedVehicleId ? {...v, assignedChauffeurId: null} : v));
    }
  }, [chauffeurs]);
  
  const addUser = useCallback((userData: Omit<User, 'id' | 'createdAt'>) => {
    const newUser: User = { ...userData, id: generateMockId(), createdAt: new Date().toISOString(), };
    setUsers(prev => [newUser, ...prev]);
  }, []);
  
  const updateUser = useCallback((userData: User) => { setUsers(prev => prev.map(u => u.id === userData.id ? userData : u)); }, []);
  const toggleUserStatus = useCallback((userId: string) => { setUsers(prev => prev.map(u => u.id === userId ? {...u, status: u.status === UserStatus.ACTIVE ? UserStatus.INACTIVE : UserStatus.ACTIVE} : u)); }, []);
  const addEmployeeAndAssign = useCallback((userData: Omit<User, 'id' | 'createdAt' | 'status' | 'role'>, vehicleId: string | null, chauffeurId: string | null) => {
    const newEmployee: User = { ...userData, id: generateMockId(), createdAt: new Date().toISOString(), status: UserStatus.ACTIVE, role: UserRole.EMPLOYEE, };
    setUsers(prev => [newEmployee, ...prev]);
    if (vehicleId) { setVehicles(prev => prev.map(v => v.id === vehicleId ? { ...v, assignedEmployeeId: newEmployee.id, assignedChauffeurId: chauffeurId } : v)); }
    if (chauffeurId) { setChauffeurs(prev => prev.map(c => c.id === chauffeurId ? { ...c, assignedVehicleId: vehicleId } : c)); }
  }, []);
  const addAttendance = useCallback((record: Omit<ChauffeurAttendance, 'id'>) => { setChauffeurAttendance(prev => [{ ...record, id: generateMockId() }, ...prev]); }, []);
  const updateAttendance = useCallback((record: ChauffeurAttendance) => { setChauffeurAttendance(prev => prev.map(a => a.id === record.id ? record : a)); }, []);
  const deleteAttendance = useCallback((recordId: string) => { setChauffeurAttendance(prev => prev.filter(a => a.id !== recordId)); }, []);
  const addTrip = useCallback((tripData: Omit<Trip, 'id'>) => { setTrips(prev => [{ ...tripData, id: generateMockId() }, ...prev]); }, []);
  const updateTrip = useCallback((tripData: Trip) => { setTrips(prev => prev.map(t => t.id === tripData.id ? tripData : t)); }, []);
  const cancelTrip = useCallback((tripId: string) => { setTrips(prev => prev.map(t => t.id === tripId ? { ...t, status: TripStatus.CANCELLED } : t)); }, []);
  const setNotificationsAsRead = useCallback(() => { setTimeout(() => { setNotifications(prev => prev.map(n => ({ ...n, isRead: true }))); }, 2000); }, []);

  const availableVehiclesForOnboarding = useMemo(() => vehicles.filter(v => !v.assignedEmployeeId), [vehicles]);
  const availableChauffeursForOnboarding = useMemo(() => chauffeurs.filter(c => !c.assignedVehicleId), [chauffeurs]);
  const employeeUsers = useMemo(() => users.filter(u => u.role === UserRole.EMPLOYEE), [users]);

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-72">
        <Header notifications={notifications} />
        <main className="flex-1 overflow-y-auto bg-gray-900 p-6 lg:p-8">
          {isLoading ? (
            <div className="text-center text-gray-400">Loading Fleet Data...</div>
          ) : (
            <Routes>
              <Route path="/" element={<DashboardPage vehicles={vehicles} chauffeurs={chauffeurs} attendance={chauffeurAttendance} trips={trips} reportedIssues={reportedIssues} maintenanceTasks={maintenanceTasks} users={users} />} />
              <Route path="/vehicles" element={<Navigate to="/vehicles/directory" replace />} />
              <Route path="/vehicles/directory" element={<VehiclesPage vehicles={vehicles} chauffeurs={chauffeurs} users={users} updateVehicle={updateVehicle} deleteVehicle={deleteVehicle} maintenanceTasks={maintenanceTasks} fuelLogs={fuelLogs} reportedIssues={reportedIssues} />} />
              <Route path="/vehicles/onboard" element={<VehicleOnboardingPage addVehicle={addVehicle} chauffeurs={chauffeurs} users={users} vehicles={vehicles} />} />
              <Route path="/vehicles/reporting" element={<VehicleReportingDashboardPage vehicles={vehicles} maintenanceTasks={maintenanceTasks} fuelLogs={fuelLogs} />} />
              <Route path="/chauffeurs" element={<Navigate to="/chauffeurs/overview" replace />} />
              <Route path="/chauffeurs/overview" element={<ChauffeurOverviewDashboardPage chauffeurs={chauffeurs} trips={trips} />} />
              <Route path="/chauffeurs/directory" element={<ChauffeursPage chauffeurs={chauffeurs} vehicles={vehicles} users={users} addChauffeur={addChauffeur} addChauffeursBatch={addChauffeursBatch} updateChauffeur={updateChauffeur} deleteChauffeur={deleteChauffeur} approveChauffeur={approveChauffeur} />} />
              <Route path="/chauffeurs/onboard" element={<ChauffeurOnboardingPage addChauffeur={addChauffeur} vehicles={vehicles} users={users} />} />
              <Route path="/chauffeurs/trip-log" element={<TripLogPage trips={trips} chauffeurs={chauffeurs} vehicles={vehicles} users={users} />} />
              <Route path="/chauffeurs/pool-trip-requests" element={<PoolTripRequestsPage trips={trips} addTrip={addTrip} />} />
              <Route path="/chauffeurs/attendance" element={<ChauffeurAttendancePage attendance={chauffeurAttendance} chauffeurs={chauffeurs} addAttendance={addAttendance} updateAttendance={updateAttendance} deleteAttendance={deleteAttendance} trips={trips}/>} />
              <Route path="/chauffeurs/performance" element={<ChauffeurPerformancePage chauffeurs={chauffeurs} attendance={chauffeurAttendance} vehicles={vehicles} users={users} />} />
              <Route path="/chauffeur-connect/status" element={<ChauffeurConnectDashboardPage chauffeurs={chauffeurs} vehicles={vehicles} trips={trips} attendance={chauffeurAttendance} updateTrip={updateTrip} />} />
              <Route path="/chauffeur-connect/dispatch" element={<TripDispatchPage trips={trips} chauffeurs={chauffeurs} vehicles={vehicles} dispatchTrip={dispatchTripToChauffeur} attendance={chauffeurAttendance} users={users} />} />
              <Route path="/chauffeur-connect/leaves" element={<LeaveRequestsPage />} />
              <Route path="/maintenance/dashboard" element={<MaintenanceDashboardPage vehicles={vehicles} maintenanceTasks={maintenanceTasks} mechanics={mechanics} />} />
              <Route path="/maintenance/tasks" element={<MaintenanceTasksPage tasks={maintenanceTasks} vehicles={vehicles} mechanics={mechanics} addTask={()=>{}} updateTask={()=>{}} deleteTask={()=>{}} />} />
              <Route path="/maintenance/mechanics" element={<MechanicsDirectoryPage mechanics={mechanics} addMechanic={()=>{}} updateMechanic={()=>{}} deleteMechanic={()=>{}} />} />
              <Route path="/costs/dashboard" element={<CostDashboardPage costEntries={costEntries} fuelLogs={fuelLogs} vehicles={vehicles} costCategories={costCategories} />} />
              <Route path="/costs/vehicle-entry" element={<VehicleCostEntryPage costEntries={costEntries} vehicles={vehicles} categories={costCategories} addCostEntry={()=>{}} updateCostEntry={()=>{}} deleteCostEntry={()=>{}} />} />
              <Route path="/costs/fuel-log" element={<FuelLogPage fuelLogs={fuelLogs} vehicles={vehicles} fuelCards={fuelCards} chauffeurs={chauffeurs} addFuelLog={()=>{}} updateFuelLog={()=>{}} deleteFuelLog={()=>{}} />} />
              <Route path="/costs/fuel-cards" element={<FuelCardPage fuelCards={fuelCards} chauffeurs={chauffeurs} vehicles={vehicles} fuelLogs={fuelLogs} addCard={()=>{}} updateCard={()=>{}} deleteCard={()=>{}} />} />
              <Route path="/costs/categories" element={<CostCategoriesPage categories={costCategories} addCategory={()=>{}} updateCategory={()=>{}} deleteCategory={()=>{}} />} />
              <Route path="/employees/directory" element={<EmployeeDirectoryPage users={employeeUsers} vehicles={vehicles} updateUser={updateUser} toggleUserStatus={toggleUserStatus} />} />
              <Route path="/employees/onboard" element={<EmployeeOnboardingPage addEmployeeAndAssign={addEmployeeAndAssign} availableVehicles={availableVehiclesForOnboarding} availableChauffeurs={availableChauffeursForOnboarding} />} />
              <Route path="/monitoring/notifications" element={<NotificationsPage notifications={notifications} setAsRead={setNotificationsAsRead} />} />
              <Route path="/monitoring/email-log" element={<TelematicsEmailLogPage emails={simulatedEmails} vehicles={vehicles} />} />
              <Route path="/admin/users" element={<UserManagementPage users={users} vehicles={vehicles} addUser={addUser} updateUser={updateUser} toggleUserStatus={toggleUserStatus} />} />
            </Routes>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;