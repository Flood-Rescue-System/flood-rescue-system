-- Create water level monitoring tables
CREATE TABLE IF NOT EXISTS water_bodies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('dam', 'river', 'lake')),
  max_capacity NUMERIC,
  warning_level NUMERIC,
  danger_level NUMERIC,
  latitude TEXT,
  longitude TEXT,
  subdivision_id INTEGER REFERENCES subdivisions(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS water_level_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  water_body_id UUID REFERENCES water_bodies(id),
  current_level NUMERIC NOT NULL,
  trend TEXT CHECK (trend IN ('rising', 'falling', 'stable')),
  rate_of_change NUMERIC, -- units per hour
  reading_time TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, now()),
  recorded_by UUID REFERENCES user_accounts(id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS water_bodies_subdivision_idx ON water_bodies(subdivision_id);
CREATE INDEX IF NOT EXISTS water_level_readings_water_body_idx ON water_level_readings(water_body_id);
CREATE INDEX IF NOT EXISTS water_level_readings_time_idx ON water_level_readings(reading_time);

-- Add sample data
INSERT INTO water_bodies (name, type, max_capacity, warning_level, danger_level, latitude, longitude, subdivision_id) VALUES
('Idukki Dam', 'dam', 2403, 2380, 2390, '9.8456', '76.9708', 1),
('Mullaperiyar Dam', 'dam', 142, 136, 138, '9.5293', '77.1416', 1),
('Pampa River', 'river', NULL, 5.5, 6.2, '9.3327', '76.7780', 2),
('Periyar River', 'river', NULL, 4.8, 5.5, '10.1632', '76.2079', 1),
('Chalakudy River', 'river', NULL, 4.2, 5.0, '10.3004', '76.3344', 2);

-- Add mock readings
INSERT INTO water_level_readings (water_body_id, current_level, trend, rate_of_change) 
SELECT 
  wb.id,
  CASE 
    WHEN wb.type = 'dam' THEN wb.max_capacity * 0.85 + (random() * 10)
    ELSE wb.warning_level + (random() * 2 - 1)
  END,
  (ARRAY['rising', 'falling', 'stable'])[floor(random() * 3 + 1)],
  random() * 0.5 - 0.25
FROM water_bodies wb;

-- Add this view to get the latest readings
CREATE OR REPLACE VIEW latest_water_readings AS
SELECT DISTINCT ON (water_body_id)
  water_body_id,
  current_level,
  trend,
  rate_of_change,
  reading_time
FROM water_level_readings
ORDER BY water_body_id, reading_time DESC;

-- Update the water bodies query to use the view
CREATE OR REPLACE VIEW water_bodies_with_readings AS
SELECT 
  wb.*,
  lr.current_level,
  lr.trend,
  lr.rate_of_change,
  lr.reading_time
FROM water_bodies wb
LEFT JOIN latest_water_readings lr ON wb.id = lr.water_body_id; 