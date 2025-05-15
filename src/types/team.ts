export interface Team {
  id: string;
  full_name: string;
  phone_number: string;
  alternate_phone?: string;
  designation: string;
  subdivision_id: number;
  created_at: string;
  members: {
    id: string;
    team_lead_id: string;
    full_name: string;
    phone_number: string;
    created_at: string;
  }[];
  subdivisions: {
    name: string;
    districts: {
      name: string;
    };
  };
}
