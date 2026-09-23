/**
 * AI Service — All calls proxy through the FleetManage backend.
 * The Gemini API key is NEVER exposed to the browser.
 */
import { Equipment, WorkOrder, ReceiptParsedData, FuelParsedData, Warranty, DriverLicenseParsedData } from "./types";
import { SettlementScanResult } from "./settlementsApi";

const API_URL = import.meta.env.VITE_API_URL as string; // e.g. https://localhost:7297/api

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem("auth_token");
  return {
    Authorization: `Bearer ${token}`,
  };
}

// ─── helpers ───────────────────────────────────────────────────────────

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

async function postFile(endpoint: string, file: File | Blob, fileName?: string): Promise<string> {
  const form = new FormData();
  form.append("file", file, fileName ?? (file instanceof File ? file.name : "upload"));

  const res = await fetch(`${API_URL}/ai/${endpoint}`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: form,
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`AI request failed (${res.status}): ${body}`);
  }

  return res.text();
}

async function postAsk(systemInstruction: string, prompt: string): Promise<string> {
  const res = await fetch(`${API_URL}/ai/ask`, {
    method: "POST",
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ systemInstruction, prompt }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`AI ask failed (${res.status}): ${body}`);
  }

  return res.text();
}

function fileFromBase64(base64Data: string, mimeType: string): Blob {
  const bytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
  return new Blob([bytes], { type: mimeType });
}

// ─── Driver License ────────────────────────────────────────────────────

export const parseDriverLicense = async (
  base64Data: string,
  mimeType: string
): Promise<DriverLicenseParsedData | null> => {
  try {
    const blob = fileFromBase64(base64Data, mimeType);
    const ext = mimeType.includes("png") ? "png" : mimeType.includes("pdf") ? "pdf" : "jpg";
    const raw = await postFile("parse-license", blob, `license.${ext}`);
    const parsed = safeJsonParse<any>(raw);
    if (!parsed) return null;

    return {
      firstName: parsed.firstName || "",
      lastName: parsed.lastName || "",
      dob: parsed.dob,
      address: parsed.address,
      addressComponents: parsed.addressComponents,
      dlNumber: parsed.dlNumber,
      dlIssueDate: parsed.dlIssueDate,
      dlExpireDate: parsed.dlExpireDate,
      licenseState: parsed.licenseState,
      confidence: parsed.confidence,
    };
  } catch (error) {
    console.error("Driver license parsing error:", error);
    return null;
  }
};

// ─── Receipt / Invoice parsing ─────────────────────────────────────────

export const parseReceipt = async (
  base64Data: string,
  mimeType: string
): Promise<ReceiptParsedData | null> => {
  try {
    const blob = fileFromBase64(base64Data, mimeType);
    const ext = mimeType.includes("png") ? "png" : mimeType.includes("pdf") ? "pdf" : "jpg";
    const raw = await postFile("parse-invoice-file", blob, `receipt.${ext}`);
    const parsed = safeJsonParse<any>(raw);
    if (!parsed) return null;

    // Normalise into the ReceiptParsedData shape the UI expects
    const businessAddress = parsed.businessAddress || {};
    const items = Array.isArray(parsed.lineItems)
      ? parsed.lineItems.map((it: any) => ({
          description: String(it.description || ""),
          cost: Number(it.amount || it.cost || 0),
          type: String(it.category || it.type || "misc").toLowerCase(),
        }))
      : Array.isArray(parsed.items)
        ? parsed.items.map((it: any) => ({
            description: String(it.description || ""),
            cost: Number(it.cost || it.amount || 0),
            type: String(it.type || "misc").toLowerCase(),
          }))
        : [];

    return {
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
      businessName: String(parsed.vendorName || parsed.businessName || ""),
      date: parsed.invoiceDate || parsed.date || undefined,
      items,
      total: Number(parsed.total || 0),
      notes: parsed.summary || parsed.notes || undefined,
      unitNumber: parsed.unitNumber || undefined,
      odometer: parsed.mileage || parsed.odometer || undefined,
    };
  } catch (error: any) {
    console.error("Receipt parsing error:", error);
    const msg = error?.message || "";
    if (msg.includes("429") || msg.includes("Quota")) {
      throw new Error("Daily AI quota exceeded. Please try again tomorrow or upgrade your plan.");
    }
    return null;
  }
};

// ─── Fuel Receipt ──────────────────────────────────────────────────────

export const parseFuelReceipt = async (
  base64Data: string,
  mimeType: string
): Promise<FuelParsedData | null> => {
  try {
    const blob = fileFromBase64(base64Data, mimeType);
    const ext = mimeType.includes("png") ? "png" : mimeType.includes("pdf") ? "pdf" : "jpg";
    const raw = await postFile("parse-fuel-receipt", blob, `fuel.${ext}`);
    const parsed = safeJsonParse<any>(raw);
    if (!parsed) return null;

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

// ─── Truck Owner Settlement ────────────────────────────────────────────

export const parseSettlementDocument = async (
  base64Data: string,
  mimeType: string
): Promise<SettlementScanResult | null> => {
  try {
    const blob = fileFromBase64(base64Data, mimeType);
    const ext = mimeType.includes("png") ? "png" : mimeType.includes("pdf") ? "pdf" : "jpg";
    const raw = await postFile("parse-settlement", blob, `settlement.${ext}`);
    const parsed = safeJsonParse<any>(raw);
    if (!parsed) return null;

    const num = (v: any) => (v === null || v === undefined || v === "" ? undefined : Number(v));
    const numOr0 = (v: any) => Number(v) || 0;

    return {
      billDate: parsed.billDate || undefined,
      periodStart: parsed.periodStart || undefined,
      periodEnd: parsed.periodEnd || undefined,
      checkDate: parsed.checkDate || undefined,
      vendorName: parsed.vendorName || undefined,
      mcNumber: parsed.mcNumber || undefined,
      externalId: parsed.externalId || undefined,
      settlementNumber: parsed.settlementNumber || undefined,
      driverName: parsed.driverName || undefined,
      driverId: parsed.driverId || undefined,
      unitNumber: parsed.unitNumber || undefined,
      totalGrossBill: num(parsed.totalGrossBill),
      deductions: num(parsed.deductions),
      totalNetBill: num(parsed.totalNetBill),
      loads: Array.isArray(parsed.loads) ? parsed.loads.map((l: any) => ({
        loadNumber: l.loadNumber || undefined,
        pickupLocation: l.pickupLocation || undefined,
        deliveryLocation: l.deliveryLocation || undefined,
        deliveryDate: l.deliveryDate || undefined,
        loadedMiles: numOr0(l.loadedMiles),
        emptyMiles: numOr0(l.emptyMiles),
        totalMiles: numOr0(l.totalMiles),
        grossAmount: numOr0(l.grossAmount),
        paymentAmount: numOr0(l.paymentAmount),
      })) : [],
      tollTransactions: Array.isArray(parsed.tollTransactions) ? parsed.tollTransactions.map((t: any) => ({
        type: t.type || "Toll",
        driverNameRaw: t.driverName || undefined,
        transactionDate: t.date || undefined,
        description: t.description || undefined,
        exitPlaza: t.exitPlaza || undefined,
        city: t.city || undefined,
        state: t.state || undefined,
        totalAmount: numOr0(t.totalAmount),
      })) : [],
      billInformation: Array.isArray(parsed.billInformation) ? parsed.billInformation.map((b: any) => ({
        nature: b.nature || "",
        description: b.description || undefined,
        quantity: numOr0(b.quantity) || 1,
        rate: numOr0(b.rate),
        totalAmount: numOr0(b.totalAmount),
      })) : [],
      deductionItems: Array.isArray(parsed.deductionItems) ? parsed.deductionItems.map((d: any) => ({
        type: d.type || "",
        description: d.description || undefined,
        quantity: numOr0(d.quantity) || 1,
        rate: numOr0(d.rate),
        totalAmount: numOr0(d.totalAmount),
      })) : [],
    };
  } catch (error) {
    console.warn("Settlement parsing error:", error);
    return null;
  }
};

// ─── Document Parsing ──────────────────────────────────────────────────

export const parseDocumentWithAI = async (
  base64Data: string,
  mimeType: string
): Promise<{
  docType: string;
  issueDate?: string;
  expirationDate?: string;
  notes?: string;
} | null> => {
  try {
    const blob = fileFromBase64(base64Data, mimeType);
    const ext = mimeType.includes("png") ? "png" : mimeType.includes("pdf") ? "pdf" : "jpg";
    const raw = await postFile("parse-document", blob, `document.${ext}`);
    const parsed = safeJsonParse<any>(raw);
    if (!parsed) return null;

    return {
      docType: parsed.docType || "Other",
      issueDate: parsed.issueDate || undefined,
      expirationDate: parsed.expirationDate || undefined,
      notes: parsed.notes || undefined,
    };
  } catch (error) {
    console.warn("Document parsing error:", error);
    return null;
  }
};

// ─── Equipment Chat ────────────────────────────────────────────────────

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
    warranties.map((w) => ({
      provider: w.provider,
      description: w.description,
      status: w.status,
      start: w.startDate,
      end: w.endDate,
      fileCount: w.files?.length || 0,
    }))
  )}

EQUIPMENT SPECIFICATIONS:
- Unit ID: ${equipment.unitNumber}
- Vehicle: ${equipment.year} ${equipment.make} ${equipment.model}`;

  try {
    const raw = await postAsk(systemInstruction, prompt);
    return { text: raw || "Diagnostic data unavailable.", sources: [] };
  } catch (error: any) {
    console.error("Equipment chat connection failure:", error);
    const errorMsg = error?.message || "";
    if (errorMsg.includes("429") || errorMsg.includes("Quota")) {
      return { text: "AI usage limit reached for today. Please try again later.", sources: [] };
    }
    return {
      text: "Connection error. The AI service is temporarily unavailable. Please verify your internet connection.",
      sources: [],
    };
  }
};

// ─── Generic helpers (Grounded, Deep-thinking) ─────────────────────────

export const getGroundedResponse = async (query: string) => {
  try {
    const raw = await postAsk("You are a helpful assistant.", query);
    return { text: raw || "", sources: [] };
  } catch (error) {
    console.error("Grounded response failure:", error);
    return { text: "AI reasoning is currently limited. Please try a simpler question.", sources: [] };
  }
};

export const getDeepThinkingResponse = async (query: string): Promise<string> => {
  try {
    const raw = await postAsk("You are a deep-thinking analytical assistant.", query);
    return raw || "Deep analysis produced no result.";
  } catch (error) {
    console.error("Deep thinking connection failure:", error);
    return "The reasoning engine is temporarily unavailable. Please try again in a few minutes.";
  }
};

// ─── Vendor Intelligence ───────────────────────────────────────────────

export const verifyVendorAddress = async (name: string, address: string) => {
  const prompt = `Verify if "${name}" at "${address}" is a real business. 
    Output JSON: { "officialAddress": string | null, "mapsUri": string | null, "confidence": number }`;
  try {
    const raw = await postAsk("You are a business verification assistant. Return only valid JSON.", prompt);
    return safeJsonParse<any>(raw);
  } catch (e) {
    console.error(e);
    return null;
  }
};

export const searchVendorSuggestions = async (
  query: string,
  location?: { latitude: number; longitude: number }
) => {
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
    const raw = await postAsk("You are a business search assistant. Return only valid JSON array.", prompt);
    return safeJsonParse<any[]>(raw) || [];
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
    const raw = await postAsk("You are a business information assistant. Return only valid JSON.", prompt);
    return safeJsonParse<any>(raw);
  } catch (e) {
    console.error(e);
    return null;
  }
};

export const findShopsNearby = async (location: { latitude: number; longitude: number }) => {
  const prompt = `Find 5 real heavy-duty truck repair shops near ${location.latitude}, ${location.longitude}. 
    Return a JSON array: [{ "name": "Business Name", "address": "Full Address", "lat": number, "lng": number, "uri": "google maps url" }]`;

  try {
    const raw = await postAsk("You are a location-based business search assistant. Return only valid JSON array.", prompt);
    return safeJsonParse<any[]>(raw) || [];
  } catch (e) {
    console.error(e);
    return [];
  }
};
