import api from "@/lib/Api.temp";

export const uploadsApi = {
  uploadWorkOrderFiles: async (files: File[]): Promise<string[]> => {
    const form = new FormData();
    files.forEach((f) => form.append("files", f));

    const res = await api.post<string[]>("/uploads/workorders", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    return res.data;
  },

  uploadDocument: async (file: File): Promise<string> => {
    const form = new FormData();
    // The backend /uploads/workorders endpoint likely expects "files" as a collection
    form.append("files", file);

    // Using /uploads/workorders as a generic upload handler since /uploads/documents doesn't exist
    const res = await api.post<string[]>("/uploads/workorders", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    if (Array.isArray(res.data) && res.data.length > 0) return res.data[0];
    throw new Error("Upload failed: No URL returned");
  }
};
