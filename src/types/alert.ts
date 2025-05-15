export type Alert = {
  id: string;
  location: string;
  description: string;
  timestamp: string;
  status: "pending" | "resolved";
  latitude: string;
  longitude: string;
}; 