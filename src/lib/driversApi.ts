import { Driver, DriverOperatingStatus, DriverHiringStage, DriverComplianceStatus, DriverDocument, DriverNote, TimeOffRequest } from "./types";
import { addDays, subDays } from "date-fns";

// Mock Data
const MOCK_DRIVERS: Driver[] = [
    {
        id: "1",
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com",
        phone: "555-0101",
        operatingStatus: DriverOperatingStatus.Active,
        isBlacklisted: false,
        complianceStatus: DriverComplianceStatus.Good,
        driverNumber: "DRV-001",
        hireDate: "2023-01-15",
        homeTerminal: "Chicago, IL",
        currentAssetId: "TRK-101",
        currentAssettNumber: "101",
        rating: 4.8,
        totalSpend: 1250.00,
        photoUrl: "https://i.pravatar.cc/150?u=1"
    },
    {
        id: "2",
        firstName: "Sarah",
        lastName: "Smith",
        email: "sarah.smith@example.com",
        phone: "555-0102",
        operatingStatus: DriverOperatingStatus.Active,
        isBlacklisted: false,
        complianceStatus: DriverComplianceStatus.AttentionNeeded,
        driverNumber: "DRV-002",
        hireDate: "2023-03-10",
        homeTerminal: "Dallas, TX",
        currentAssetId: "TRK-105",
        currentAssettNumber: "105",
        rating: 4.5,
        totalSpend: 850.50,
        photoUrl: "https://i.pravatar.cc/150?u=2"
    },
    {
        id: "3",
        firstName: "Mike",
        lastName: "Johnson",
        email: "mike.j@example.com",
        phone: "555-0103",
        operatingStatus: DriverOperatingStatus.OnLeave,
        isBlacklisted: false,
        complianceStatus: DriverComplianceStatus.NonCompliant,
        driverNumber: "DRV-003",
        hireDate: "2022-11-01",
        homeTerminal: "Chicago, IL",
        rating: 3.9,
        totalSpend: 0,
        photoUrl: "https://i.pravatar.cc/150?u=3"
    },
    {
        id: "4",
        firstName: "David",
        lastName: "Williams (Candidate)",
        email: "david.w@example.com",
        phone: "555-0201",
        hiringStage: DriverHiringStage.Interview,
        isBlacklisted: false,
        complianceStatus: DriverComplianceStatus.Good,
        driverNumber: "",
        homeTerminal: "Miami, FL",
        rating: 0,
        totalSpend: 0,
        photoUrl: "https://i.pravatar.cc/150?u=4"
    },
    {
        id: "5",
        firstName: "Robert",
        lastName: "Brown (Restricted)",
        email: "bob.b@example.com",
        phone: "555-9999",
        operatingStatus: DriverOperatingStatus.Terminated,
        isBlacklisted: true,
        complianceStatus: DriverComplianceStatus.NonCompliant,
        driverNumber: "DRV-999",
        hireDate: "2021-05-15",
        terminationDate: "2023-12-01",
        homeTerminal: "Chicago, IL",
        rating: 2.1,
        totalSpend: 0,
        photoUrl: "https://i.pravatar.cc/150?u=5"
    },
];

const MOCK_DOCUMENTS: DriverDocument[] = [
    {
        id: "d1",
        driverId: "1",
        docType: "CDL",
        fileName: "cdl_john_doe.pdf",
        fileUrl: "#",
        status: "Valid",
        expirationDate: addDays(new Date(), 180).toISOString(),
        daysUntilExpiration: 180
    },
    {
        id: "d2",
        driverId: "2",
        docType: "Medical Card",
        fileName: "med_card_sarah.pdf",
        fileUrl: "#",
        status: "Expiring",
        expirationDate: addDays(new Date(), 12).toISOString(),
        daysUntilExpiration: 12
    }
];

export const driversApi = {
    getDrivers: async (): Promise<Driver[]> => {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 800));
        return MOCK_DRIVERS;
    },

    getDriverById: async (id: string): Promise<Driver | undefined> => {
        await new Promise(resolve => setTimeout(resolve, 500));
        return MOCK_DRIVERS.find(d => d.id === id);
    },

    async createDriver(driver: Omit<Driver, "id">): Promise<Driver> {
        return new Promise((resolve) => {
            const newDriver: Driver = {
                ...driver,
                id: (MOCK_DRIVERS.length + 1).toString(),
                complianceStatus: DriverComplianceStatus.Good, // Default
                totalSpend: 0,
                rating: 0
            };
            MOCK_DRIVERS.push(newDriver);
            setTimeout(() => resolve(newDriver), 800);
        });
    },

    async updateDriver(id: string, updates: Partial<Driver>): Promise<Driver> {
        return new Promise((resolve, reject) => {
            const index = MOCK_DRIVERS.findIndex(d => d.id === id);
            if (index === -1) {
                setTimeout(() => reject(new Error("Driver not found")), 500);
                return;
            }
            MOCK_DRIVERS[index] = { ...MOCK_DRIVERS[index], ...updates };
            setTimeout(() => resolve(MOCK_DRIVERS[index]), 800);
        });
    },

    getDriverDocuments: async (driverId: string): Promise<DriverDocument[]> => {
        await new Promise(resolve => setTimeout(resolve, 600));
        return MOCK_DOCUMENTS.filter(d => d.driverId === driverId);
    },

    async uploadDocument(driverId: string, file: File, metadata: { docType: string, expirationDate?: string, notes?: string }): Promise<DriverDocument> {
        return new Promise((resolve) => {
            const newDoc: DriverDocument = {
                id: `d${MOCK_DOCUMENTS.length + 1}`,
                driverId,
                docType: metadata.docType,
                fileName: file.name,
                fileUrl: URL.createObjectURL(file), // Create a local URL for preview
                status: metadata.expirationDate && new Date(metadata.expirationDate) < new Date() ? 'Expired' : 'Valid',
                expirationDate: metadata.expirationDate,
                daysUntilExpiration: metadata.expirationDate ? Math.ceil((new Date(metadata.expirationDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : undefined
            };
            MOCK_DOCUMENTS.push(newDoc);
            setTimeout(() => resolve(newDoc), 800);
        });
    },

    getDriverTimeOffRequests: async (driverId: string): Promise<TimeOffRequest[]> => {
        await new Promise(resolve => setTimeout(resolve, 400));
        // Return mock requests
        if (driverId === '1') {
            return [{
                id: 't1',
                driverId: '1',
                driverName: 'John Doe',
                startDate: subDays(new Date(), 5).toISOString(),
                endDate: subDays(new Date(), 2).toISOString(),
                type: 'HomeTime',
                status: 'Approved',
                requestedAt: subDays(new Date(), 10).toISOString()
            }];
        }
        return [];
    }
};
