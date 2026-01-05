export type FleetType = 'TRUCK' | 'TRAILER' | 'HEAVY_EQUIPMENT';

export const FLEET_TYPES: Record<FleetType, string> = {
    TRUCK: 'Trucks',
    TRAILER: 'Trailers',
    HEAVY_EQUIPMENT: 'Heavy Equipment'
};

export const TRUCK_TYPES = [
    'Day Cab Tractor',
    'Sleeper Tractor',
    'Box Truck',
    'Straight Truck',
    'Dump Truck',
    'Flatbed Truck',
    'Tow Truck',
    'Delivery Van',
    'Service/Utility Truck',
    'Refrigerated Truck'
] as const;

export const TRAILER_TYPES = [
    'Auto Hauler',
    'Box Truck', // Included in request, though unusual for trailer
    'Conestoga',
    'Curtain Side',
    'Double Drop',
    'Drybox',
    'Dry Van',
    'Dump/Tipper',
    'Flatbed',
    'Intermodal Chassis',
    'Livestock',
    'Lowboy',
    'Reefer',
    'Removable Gooseneck',
    'Stake',
    'Step Deck',
    'Tanker'
] as const;

export const HEAVY_EQUIPMENT_TYPES = [
    'Backhoe',
    'Boom Truck',
    'Bulldozer',
    'Crane',
    'Dump Truck', // Also here in request
    'Excavator',
    'Forklift',
    'Front Loader',
    'Grader',
    'Trencher'
] as const;

export const TRUCK_MANUFACTURERS = [
    'Freightliner',
    'Peterbilt',
    'Kenworth',
    'Volvo',
    'Mack',
    'International',
    'Western Star',
    'Ford',
    'Ram',
    'Chevrolet/GMC',
    'Isuzu',
    'Hino'
] as const;

export const TRAILER_MANUFACTURERS = [
    'CIMC',
    'Great Dane',
    'Hyundai Translead',
    'Stoughton',
    'Utility',
    'Vanguard',
    'Wabash'
] as const;

export const HEAVY_EQUIPMENT_MANUFACTURERS = [
    'Caterpillar',
    'John Deere',
    'Komatsu',
    'Liebherr'
] as const;

export const getSpecificTypes = (fleetType: FleetType) => {
    switch (fleetType) {
        case 'TRUCK': return TRUCK_TYPES;
        case 'TRAILER': return TRAILER_TYPES;
        case 'HEAVY_EQUIPMENT': return HEAVY_EQUIPMENT_TYPES;
    }
};

export const getManufacturers = (fleetType: FleetType) => {
    switch (fleetType) {
        case 'TRUCK': return TRUCK_MANUFACTURERS;
        case 'TRAILER': return TRAILER_MANUFACTURERS;
        case 'HEAVY_EQUIPMENT': return HEAVY_EQUIPMENT_MANUFACTURERS;
    }
};

export const US_STATES = [
    { name: 'Alabama', code: 'AL' }, { name: 'Alaska', code: 'AK' }, { name: 'Arizona', code: 'AZ' },
    { name: 'Arkansas', code: 'AR' }, { name: 'California', code: 'CA' }, { name: 'Colorado', code: 'CO' },
    { name: 'Connecticut', code: 'CT' }, { name: 'Delaware', code: 'DE' }, { name: 'Florida', code: 'FL' },
    { name: 'Georgia', code: 'GA' }, { name: 'Hawaii', code: 'HI' }, { name: 'Idaho', code: 'ID' },
    { name: 'Illinois', code: 'IL' }, { name: 'Indiana', code: 'IN' }, { name: 'Iowa', code: 'IA' },
    { name: 'Kansas', code: 'KS' }, { name: 'Kentucky', code: 'KY' }, { name: 'Louisiana', code: 'LA' },
    { name: 'Maine', code: 'ME' }, { name: 'Maryland', code: 'MD' }, { name: 'Massachusetts', code: 'MA' },
    { name: 'Michigan', code: 'MI' }, { name: 'Minnesota', code: 'MN' }, { name: 'Mississippi', code: 'MS' },
    { name: 'Missouri', code: 'MO' }, { name: 'Montana', code: 'MT' }, { name: 'Nebraska', code: 'NE' },
    { name: 'Nevada', code: 'NV' }, { name: 'New Hampshire', code: 'NH' }, { name: 'New Jersey', code: 'NJ' },
    { name: 'New Mexico', code: 'NM' }, { name: 'New York', code: 'NY' }, { name: 'North Carolina', code: 'NC' },
    { name: 'North Dakota', code: 'ND' }, { name: 'Ohio', code: 'OH' }, { name: 'Oklahoma', code: 'OK' },
    { name: 'Oregon', code: 'OR' }, { name: 'Pennsylvania', code: 'PA' }, { name: 'Rhode Island', code: 'RI' },
    { name: 'South Carolina', code: 'SC' }, { name: 'South Dakota', code: 'SD' }, { name: 'Tennessee', code: 'TN' },
    { name: 'Texas', code: 'TX' }, { name: 'Utah', code: 'UT' }, { name: 'Vermont', code: 'VT' },
    { name: 'Virginia', code: 'VA' }, { name: 'Washington', code: 'WA' }, { name: 'West Virginia', code: 'WV' },
    { name: 'Wisconsin', code: 'WI' }, { name: 'Wyoming', code: 'WY' }, { name: 'District of Columbia', code: 'DC' }
];
