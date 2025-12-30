import api from "@/lib/Api";

export const uploadsApi = {
  uploadWorkOrderFiles: async (files: File[]): Promise<string[]> => {
    const form = new FormData();
    files.forEach((f) => form.append("files", f));

    const res = await api.post<string[]>("/uploads/workorders", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    return res.data;
  },
};
