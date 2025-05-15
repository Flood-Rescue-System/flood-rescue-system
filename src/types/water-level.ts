export type WaterLevelCamera = {
  id: string;
  name: string;
  roi_coords: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  };
  max_value: number;
  min_value: number;
  threshold: number;
  current_level?: number;
  status: 'active' | 'inactive' | 'error';
  created_at: string;
  updated_at: string;
}; 