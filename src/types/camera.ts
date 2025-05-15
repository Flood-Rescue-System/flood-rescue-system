export type RescueCamera = {
  id: string;
  team_lead_id: string;
  location_name: string;
  feed_type: "rtsp" | "webcam" | "phone";
  config: {
    deviceId?: string;
    qrCode?: string;
    url?: string;
  };
  status: "online" | "offline";
  subdivision_id: number;
  created_at: string;
  updated_at: string;
};
