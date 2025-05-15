export type Resource = {
  id: string;
  team_lead_id: string;
  name: string;
  type: "food" | "clothing" | "transport" | "medical" | "shelter" | "other";
  quantity: number;
  unit: string;
  provider_name: string;
  provider_type: "shop" | "industry" | "company" | "individual" | "other";
  contact_number: string;
  location: string;
  notes?: string;
  status: "available" | "low" | "unavailable";
  subdivision_id: number;
  created_at: string;
  updated_at: string;
};
