import { GoogleGenAI } from "@google/genai";
import { parse, isValid, format } from "date-fns";
import { Equipment, WorkOrder, ReceiptParsedData, FuelParsedData, Warranty } from "./types";

// Vite env only
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;

function requireKey(): string {
  if (!GEMINI_API_KEY) {
    throw new Error("Missing Gemini API key. Set VITE_GEMINI_API_KEY in your Vite .env file.");
  }
  return GEMINI_API_KEY;
}

let aiInstance: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (aiInstance) return aiInstance;

  const key = requireKey();
  aiInstance = new GoogleGenAI({
    apiKey: key,
    httpOptions: { apiVersion: "v1beta" },
  });
  return aiInstance;
}

// -----------------------------
// Helpers
// -----------------------------
function safeJsonParse<T>(text: string): T | null {
  try {
    return JSON.parse(text) as T;
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]) as T;
    } catch {
      return null;
    }
  }
}

function normalizeReceiptResult(parsed: any): ReceiptParsedData | null {
  if (!parsed) return null;

  const businessAddress = parsed.businessAddress || {};
  const items = Array.isArray(parsed.items) ? parsed.items : [];

  const normalized: ReceiptParsedData = {
    businessAddress: {
      street: String(businessAddress.street || ""),
      city: String(businessAddress.city || ""),
      state: String(businessAddress.state || ""),
      zip: String(businessAddress.zip || ""),
    },
    businessContact: parsed.businessContact
      ? {
        phone: parsed.businessContact.phone ? String(parsed.businessContact.phone) : undefined,
        email: parsed.businessContact.email ? String(parsed.businessContact.email) : undefined,
        website: parsed.businessContact.website ? String(parsed.businessContact.website) : undefined,
      }
      : undefined,
    businessName: String(parsed.businessName || ""),
    date: (() => {
      if (!parsed.date) return undefined;
      const raw = String(parsed.date).trim();
      // Try common formats
      const formats = ["yyyy-MM-dd", "MM/dd/yyyy", "M/d/yyyy", "MMM d, yyyy", "MM-dd-yyyy"];
      for (const fmt of formats) {
        const d = parse(raw, fmt, new Date());
        if (isValid(d)) {
          return format(d, "yyyy-MM-dd");
        }
      }
      return undefined; // consistent fallback
    })(),
    items: items.map((it: any) => ({
      description: String(it.description || ""),
      cost: Number(it.cost || 0),
      type: String(it.type || "fee"),
    })),
    total: Number(parsed.total || 0),
    notes: parsed.notes ? String(parsed.notes) : undefined,
    unitNumber: parsed.unitNumber ? String(parsed.unitNumber) : undefined,
    odometer: parsed.odometer ? Number(parsed.odometer) : undefined,
  };

  const hasAnything =
    !!normalized.businessName ||
    !!normalized.date ||
    normalized.items.length > 0 ||
    !!normalized.total ||
    !!normalized.unitNumber ||
    !!normalized.businessAddress.street;

  return hasAnything ? normalized : null;
}

// -----------------------------
// Receipt parsing
// -----------------------------
export const parseReceipt = async (
  base64Data: string,
  mimeType: string
): Promise<ReceiptParsedData | null> => {
  const prompt = `Analyze this receipt and extract in this PRIORITY ORDER:

1. BUSINESS ADDRESS (highest priority) - Extract EXACT values as printed:
   - Street address
   - City
   - State
   - ZIP code

2. BUSINESS CONTACT:
   - Phone number
   - Email address
   - Website URL

3. BUSINESS NAME

4. SERVICE DETAILS:
   - Date (YYYY-MM-DD)
   - Items (parts/labor/fee/tax)
   - Total
   - Unit/Truck number if present

OUTPUT RULES:
- Respond with ONLY valid JSON (no markdown, no commentary).
- Use this exact JSON shape:

{
  "businessAddress": { "street": "", "city": "", "state": "", "zip": "" },
  "businessContact": { "phone": "", "email": "", "website": "" },
  "businessName": "",
  "date": "YYYY-MM-DD",
  "items": [ { "description": "", "cost": 0, "type": "parts|labor|fee|tax" } ],
  "total": 0,
  "notes": "",
  "unitNumber": "",
  "odometer": 0
}`;

  try {
    let res;
    try {
      res = await getAiClient().models.generateContent({
        model: "gemini-2.0-flash",
        contents: [
          {
            role: "user",
            parts: [
              { inlineData: { mimeType, data: base64Data } },
              { text: prompt },
            ],
          },
        ],
      });
    } catch (e) {
      console.warn("gemini-2.0-flash receipt parsing failed, trying 1.5-flash...", e);
      res = await getAiClient().models.generateContent({
        model: "gemini-1.5-flash",
        contents: [
          {
            role: "user",
            parts: [
              { inlineData: { mimeType, data: base64Data } },
              { text: prompt },
            ],
          },
        ],
      });
    }

    const text = res.text ?? "";
    const parsed = safeJsonParse<any>(text);
    return normalizeReceiptResult(parsed);

  } catch (error: any) {
    console.error("Receipt parsing error details:", error);

    // Check for 429 or Quota Exceeded
    const msg = error?.message || "";
    if (msg.includes("429") || msg.includes("Quota exceeded") || msg.includes("RESOURCE_EXHAUSTED")) {
      throw new Error("Daily AI quota exceeded. Please try again tomorrow or upgrade your plan.");
    }

    return null;
  }
};

// -----------------------------
// Fuel Receipt Parsing
// -----------------------------
export const parseFuelReceipt = async (
  base64Data: string,
  mimeType: string
): Promise<FuelParsedData | null> => {
  const prompt = `Analyze this FUEL/GAS receipt and extract:
1. STATION NAME & ADDRESS
2. DATE (YYYY-MM-DD)
3. FUEL TYPE (Diesel, DEF, Gas, or Other)
4. TOTAL GALLONS (or liters, but specify as "gallons")
5. UNIT PRICE (Price per gallon)
6. TOTAL COST
7. UNIT/TRUCK NUMBER (if written or printed)
8. ODOMETER (if present)
9. STATE/PROVINCE of the station

OUTPUT RULES:
- Respond with ONLY valid JSON.
- Use this exact JSON shape:
{
  "businessName": "",
  "businessAddress": "",
  "date": "YYYY-MM-DD",
  "fuelType": "Diesel|DEF|Gas|Other",
  "gallons": 0,
  "unitPrice": 0,
  "total": 0,
  "unitNumber": "",
  "odometer": 0,
  "state": ""
}`;

  try {
    let res;
    try {
      res = await getAiClient().models.generateContent({
        model: "gemini-2.0-flash",
        contents: [
          {
            role: "user",
            parts: [
              { inlineData: { mimeType, data: base64Data } },
              { text: prompt },
            ],
          },
        ],
      });
    } catch (e) {
      console.warn("gemini-2.0-flash fuel parsing failed, trying 1.5-flash...", e);
      res = await getAiClient().models.generateContent({
        model: "gemini-1.5-flash",
        contents: [
          {
            role: "user",
            parts: [
              { inlineData: { mimeType, data: base64Data } },
              { text: prompt },
            ],
          },
        ],
      });
    }

    const text = res.text ?? "";
    const parsed = safeJsonParse<any>(text);

    if (!parsed) {
      throw new Error("AI returned empty or invalid JSON");
    }

    return {
      businessName: String(parsed.businessName || ""),
      businessAddress: String(parsed.businessAddress || ""),
      date: String(parsed.date || ""),
      fuelType: (parsed.fuelType || "Diesel") as any,
      gallons: Number(parsed.gallons || 0),
      unitPrice: Number(parsed.unitPrice || 0),
      total: Number(parsed.total || 0),
      unitNumber: parsed.unitNumber ? String(parsed.unitNumber) : undefined,
      odometer: parsed.odometer ? Number(parsed.odometer) : undefined,
      state: parsed.state ? String(parsed.state) : undefined,
    };

  } catch (error) {
    console.warn("Fuel parsing error:", error);
    return null;
  }
};

// -----------------------------
// Document Parsing
// -----------------------------
export const parseDocumentWithAI = async (
  base64Data: string,
  mimeType: string
): Promise<{
  docType: string;
  issueDate?: string;
  expirationDate?: string;
  notes?: string;
} | null> => {
  const prompt = `Analyze this vehicle document (PDF/Image) and extract the following:
1. DOCUMENT TYPE: Classify as one of: "Registration", "Title", "Insurance", "Warranty", "Lease", "DOT Inspection", or "Other".
2. ISSUE DATE: Date the document was issued or effective from (YYYY-MM-DD).
3. EXPIRATION DATE: Date the document expires (YYYY-MM-DD). Critical for Insurance/Registration.
4. NOTES: A very brief (1 sentence) summary of key details (e.g. "Policy #12345", "Expires soon").

OUTPUT JSON ONLY:
{
  "docType": "string",
  "issueDate": "YYYY-MM-DD" or null,
  "expirationDate": "YYYY-MM-DD" or null,
  "notes": "string"
}`;

  try {
    const res = await getAiClient().models.generateContent({
      model: "gemini-2.0-flash",
      contents: [
        {
          role: "user",
          parts: [
            { inlineData: { mimeType, data: base64Data } },
            { text: prompt },
          ],
        },
      ],
    });

    const parsed = safeJsonParse<any>(res.text || "");
    if (!parsed) return null;

    return {
      docType: parsed.docType || "Other",
      issueDate: parsed.issueDate || undefined,
      expirationDate: parsed.expirationDate || undefined,
      notes: parsed.notes || undefined
    };
  } catch (error) {
    console.warn("Document parsing error:", error);
    return null;
  }
};

// -----------------------------
// Equipment Chat
// -----------------------------
export const getEquipmentChatResponse = async (
  equipment: Equipment,
  history: WorkOrder[],
  prompt: string,
  warranties: Warranty[] = []
): Promise<{ text: string; sources: any[] }> => {
  const systemInstruction = `You are the specialized FleetManage.ai Expert Consultant for Unit ${equipment.unitNumber}.

MAINTENANCE HISTORY:
${JSON.stringify(
    history.map((h) => ({
      date: (h as any).date,
      wo: (h as any).woNumber,
      desc: (h as any).description,
      vendor: (h as any).vendor,
      cost: (h as any).totalCost,
    }))
  )}

WARRANTY COVERAGE:
${JSON.stringify(
    warranties.map(w => ({
      provider: w.provider,
      description: w.description,
      status: w.status,
      start: w.startDate,
      end: w.endDate,
      fileCount: w.files?.length || 0
    }))
  )}

EQUIPMENT SPECIFICATIONS:
- Unit ID: ${equipment.unitNumber}
- Vehicle: ${equipment.year} ${equipment.make} ${equipment.model}`;

  try {
    try {
      console.log("[AI] Attempting response with gemini-2.0-flash...");
      const res = await getAiClient().models.generateContent({
        model: "gemini-2.0-flash",
        contents: [{ role: "user", parts: [{ text: systemInstruction }, { text: prompt }] }],
      });
      return { text: res.text ?? "Diagnostic data unavailable.", sources: [] };
    } catch (innerError) {
      console.warn("[AI] gemini-2.0-flash failed, falling back to 1.5-flash. Error:", innerError);
      const res = await getAiClient().models.generateContent({
        model: "gemini-1.5-flash",
        contents: [{ role: "user", parts: [{ text: systemInstruction }, { text: prompt }] }],
      });
      return { text: (res.text ?? "Diagnostic data unavailable.") + " (Legacy Engine)", sources: [] };
    }
  } catch (error: any) {
    console.error("Equipment chat connection failure:", error);
    const errorMsg = error?.message || "";
    if (errorMsg.includes("429") || errorMsg.includes("Quota")) {
      return { text: "AI usage limit reached for today. Please try again later.", sources: [] };
    }
    return { text: "Connection error. The AI service is temporarily unavailable. Please verify your internet connection or API key.", sources: [] };
  }
};

export const getGroundedResponse = async (query: string) => {
  try {
    const res = await getAiClient().models.generateContent({
      model: "gemini-1.5-flash", // More stable for simple grounded queries
      contents: [{ role: "user", parts: [{ text: query }] }],
    });
    return { text: res.text ?? "", sources: [] };
  } catch (error) {
    console.error("Grounded response failure:", error);
    return { text: "AI reasoning is currently limited. Please try a simpler question.", sources: [] };
  }
};

export const getDeepThinkingResponse = async (query: string): Promise<string> => {
  try {
    const ai = getAiClient();
    try {
      const res = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: [{ role: "user", parts: [{ text: query }] }],
      });
      return res.text ?? "Deep analysis produced no result.";
    } catch (inner) {
      const res = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: [{ role: "user", parts: [{ text: query }] }],
      });
      return res.text ?? "Deep analysis produced no result.";
    }
  } catch (error) {
    console.error("Deep thinking connection failure:", error);
    return "The reasoning engine is temporarily unavailable. Please try again in a few minutes.";
  }
};
// -----------------------------
// Vendor Intelligence
// -----------------------------
export const verifyVendorAddress = async (name: string, address: string) => {
  const prompt = `Verify if "${name}" at "${address}" is a real business. 
    Output JSON: { "officialAddress": string | null, "mapsUri": string | null, "confidence": number }`;

  try {
    const res = await getAiClient().models.generateContent({
      model: "gemini-2.0-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });
    return safeJsonParse<any>(res.text || "");
  } catch (e) {
    console.error(e);
    return null;
  }
};

export const searchVendorSuggestions = async (query: string, location?: { latitude: number; longitude: number }) => {
  const locString = location ? ` near ${location.latitude}, ${location.longitude}` : "";
  const prompt = `Search for heavy-duty truck repair businesses matching "${query}"${locString}.
    Use Google Maps data to find REAL businesses. Return a JSON array of up to 5 suggestions:
    [{
      "title": "Exact Business Name",
      "address": "Full Street Address with City, State ZIP",
      "rating": number (Google rating, or null if not available),
      "uri": "Google Maps URL"
    }]
    
    Only return actual businesses you can verify exist. Be accurate with names and addresses.`;

  try {
    const res = await getAiClient().models.generateContent({
      model: "gemini-2.0-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });
    return safeJsonParse<any[]>(res.text || "") || [];
  } catch (e) {
    console.error(e);
    return [];
  }
};


export const fetchDetailedVendorInfo = async (name: string, address: string) => {
  const prompt = `Find comprehensive business information for "${name}" at "${address}".
    Use Google Maps and business directories to get accurate, verified information.
    
    Return ONLY valid JSON in this exact format:
    {
      "name": "Exact Business Name",
      "street": "Street Address",
      "city": "City",
      "state": "State Code (e.g., TX)",
      "zip": "ZIP Code",
      "phone": "Phone number or null",
      "website": "Website URL or null",
      "email": "Email or null",
      "rating": "Google rating (number) or null",
      "reviewCount": "Number of reviews or null",
      "types": ["Service Type 1", "Service Type 2"],
      "hours": "Business hours description or null",
      "verified": true
    }
    
    For types, focus on services like: Engine Repair, Transmission, Brakes, Tires, Electrical, Diagnostics, etc.
    Only return information you can verify is accurate.`;

  try {
    const res = await getAiClient().models.generateContent({
      model: "gemini-2.0-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });
    return safeJsonParse<any>(res.text || "");
  } catch (e) {
    console.error(e);
    return null;
  }
};

export const findShopsNearby = async (location: { latitude: number; longitude: number }) => {
  const prompt = `Find 5 real heavy-duty truck repair shops near ${location.latitude}, ${location.longitude}. 
    Return a JSON array: [{ "name": "Business Name", "address": "Full Address", "lat": number, "lng": number, "uri": "google maps url" }]`;

  try {
    const res = await getAiClient().models.generateContent({
      model: "gemini-2.0-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });
    return safeJsonParse<any[]>(res.text || "") || [];
  } catch (e) {
    console.error(e);
    return [];
  }
};
