export interface SupportTicket {
    publicId: string;
    type: string;
    rating: number | null;
    title: string;
    description: string;
    status: string;
    createdAt: string;
    createdBy: string;
}
