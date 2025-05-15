export type Camp = {
  id: string;
  team_lead_id: string;
  name: string;
  location: string;
  capacity: number;
  current_occupancy: number;
  status: "active" | "full" | "closed";
  contact_number: string;
  facilities: string[];
  address: string;
  subdivision_id: number;
  created_at: string;
  updated_at: string;
  latitude: string;
  longitude: string;
  subdivisions: {
    name: string;
    districts: {
      name: string;
    };
  };
};
