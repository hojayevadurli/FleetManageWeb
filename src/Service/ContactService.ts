import api from "@/lib/Api";

export interface ContactMessage {
    firstName: string;
    lastName: string;
    email: string;
    message: string;
}

export const sendMessage = async (data: ContactMessage) => {
    return (await api.post("/api/contact", data)).data;
};
