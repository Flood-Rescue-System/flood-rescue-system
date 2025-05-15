export interface EmergencySOS {
  id: string;
  name: string;
  phone: string;
  affected_people: number;
  water_level: string;
  medical_assistance?: string;
  latitude: string;
  longitude: string;
  status: "pending" | "assigned" | "in_progress" | "resolved";
  created_at: string;
  updated_at: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  status: "unread" | "read";
  created_at: string;
  updated_at: string;
}
