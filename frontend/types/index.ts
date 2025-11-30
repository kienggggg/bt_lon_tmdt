export interface TicketType {
  id: string;
  name: string; // Ví dụ: Vé VIP, Early Bird
  price: string; // Postgres numeric được driver trả về dạng string
  initial_quantity: number;
  remaining_quantity: number;
  start_sale_date?: string;
  end_sale_date?: string;
}

export interface Event {
  id: string;
  slug: string;
  title: string;
  description: string;
  location: string;
  start_time: string;
  end_time?: string;
  is_online: boolean;
  speakers?: any;
  agenda?: any;
  ticket_types: TicketType[];
}

export interface User {
  id: string;
  email: string;
  role: string;
}