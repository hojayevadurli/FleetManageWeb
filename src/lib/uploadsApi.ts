import api from "@/lib/Api";

export const uploadsApi = {
  uploadWorkOrderFiles: async (files: File[]): Promise<string[]> => {
    const form = new FormData();

    files.forEach((file) => {
      form.append("files", file);
    });

    const response = await api.post<string[]>("/uploads/workorders", form);

    return response.data;
  },

  uploadDocument: async (file: File): Promise<string> => {
    const form = new FormData();

    // Backend expects "files" as collection
    form.append("files", file);

    const response = await api.post<string[]>("/uploads/workorders", form);

    if (Array.isArray(response.data) && response.data.length > 0) {
      return response.data[0];
    }

    throw new Error("Upload failed: No URL returned");
  },
};