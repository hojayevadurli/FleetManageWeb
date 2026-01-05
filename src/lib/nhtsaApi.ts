import axios from 'axios';

export interface VinDecodeResult {
    make: string;
    model: string;
    year: number;
    errorCode?: string;
    errorText?: string;
}

export const validateVin = (vin: string): boolean => {
    // Basic regex: 17 alphanumeric, excludes I, O, Q
    // Note: Some older vehicles might have different formats, but for standard 17-char VINs:
    const vinRegex = /^[A-HJ-NPR-Z0-9]{17}$/i;
    return vinRegex.test(vin);
};

export const decodeVin = async (vin: string): Promise<VinDecodeResult | null> => {
    try {
        // Using DecodeVinValues for a flatter 'Values' response
        const response = await axios.get(`https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${vin}?format=json`);

        if (response.data && response.data.Results && response.data.Results.length > 0) {
            const data = response.data.Results[0];

            // Check for API-level errors in the response text
            if (data.ErrorCode && data.ErrorCode !== "0") {
                console.warn("VIN Decode Warning:", data.ErrorText);
                // We might still want to return partial data if available, but usually error code != 0 means issues.
                // However, sometimes it returns info + warning. Let's try to parse if Make is present.
                if (!data.Make) return null;
            }

            return {
                make: data.Make || '',
                model: data.Model || '',
                year: parseInt(data.ModelYear) || new Date().getFullYear(),
                errorCode: data.ErrorCode,
                errorText: data.ErrorText
            };
        }
        return null;
    } catch (error) {
        console.error("Failed to decode VIN:", error);
        return null;
    }
};
