import api from "@/lib/Api";

export type DocKind = "invoice" | "receipt" | "work_order" | "unknown";

export interface CreateDocumentDto {
  fileUrl: string;
  fileType: string;
  docKind: DocKind;
  vendorNameRaw?: string | null;
  runAiExtract?: boolean; // backend stub ok
  assetType?: "truck" | "trailer";
  assetId?: string;
}

export interface DocumentDto {
  id: string;
  fileUrl: string;
  fileType: string;
  docKind: string;
  vendorNameRaw?: string | null;
  status: string;
  confidenceScore?: number | null;
  extractedJson?: any;
  createdAt: string;
  updatedAt: string;
}

export const documentsApi = {
  list: async (args?: { assetType?: "truck" | "trailer"; assetId?: string; page?: number; pageSize?: number }) => {
    const res = await api.get<DocumentDto[]>("/documents", { params: args });
    return res.data;
  },

  create: async (dto: CreateDocumentDto) => {
    const res = await api.post<DocumentDto>("/documents", dto);
    return res.data;
  },

  updateExtracted: async (
    id: string,
    body: { ExtractedJson: any; VendorNameRaw?: string | null; ConfidenceScore?: number | null; Status?: string }
  ) => {
    const res = await api.put(`/documents/${id}/extracted`, body);
    return res.data;
  },
};
