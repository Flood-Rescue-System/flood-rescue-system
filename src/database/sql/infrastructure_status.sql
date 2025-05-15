-- Create infrastructure status tables
CREATE TABLE IF NOT EXISTS road_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('open', 'closed', 'partially_open')),
  condition TEXT NOT NULL,
  latitude TEXT,
  longitude TEXT,
  subdivision_id INTEGER REFERENCES subdivisions(id),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, now()),
  updated_by UUID REFERENCES user_accounts(id)
);

CREATE TABLE IF NOT EXISTS bridge_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('safe', 'at_risk', 'closed')),
  water_level NUMERIC,
  latitude TEXT,
  longitude TEXT,
  subdivision_id INTEGER REFERENCES subdivisions(id),
  last_inspected TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, now()),
  inspected_by UUID REFERENCES user_accounts(id)
);

CREATE TABLE IF NOT EXISTS power_supply_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  area TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('normal', 'disrupted', 'restored')),
  estimated_restoration TIMESTAMP WITH TIME ZONE,
  subdivision_id INTEGER REFERENCES subdivisions(id),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, now()),
  updated_by UUID REFERENCES user_accounts(id)
);

CREATE TABLE IF NOT EXISTS network_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  area TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('normal', 'limited', 'down')),
  coverage INTEGER CHECK (coverage BETWEEN 0 AND 100),
  emergency_network BOOLEAN DEFAULT false,
  subdivision_id INTEGER REFERENCES subdivisions(id),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, now()),
  updated_by UUID REFERENCES user_accounts(id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS road_status_subdivision_idx ON road_status(subdivision_id);
CREATE INDEX IF NOT EXISTS bridge_status_subdivision_idx ON bridge_status(subdivision_id);
CREATE INDEX IF NOT EXISTS power_supply_status_subdivision_idx ON power_supply_status(subdivision_id);
CREATE INDEX IF NOT EXISTS network_status_subdivision_idx ON network_status(subdivision_id);

-- Add RLS policies
ALTER TABLE road_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE bridge_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE power_supply_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE network_status ENABLE ROW LEVEL SECURITY;

-- Allow read access to all authenticated users
CREATE POLICY "Allow read access to all users" ON road_status FOR SELECT USING (true);
CREATE POLICY "Allow read access to all users" ON bridge_status FOR SELECT USING (true);
CREATE POLICY "Allow read access to all users" ON power_supply_status FOR SELECT USING (true);
CREATE POLICY "Allow read access to all users" ON network_status FOR SELECT USING (true);

-- Allow write access only to admin and rescue users
CREATE POLICY "Allow write access to admin and rescue" ON road_status 
  FOR INSERT WITH CHECK (auth.uid() IN (
    SELECT id FROM user_accounts WHERE role IN ('admin', 'rescue')
  ));
CREATE POLICY "Allow write access to admin and rescue" ON bridge_status 
  FOR INSERT WITH CHECK (auth.uid() IN (
    SELECT id FROM user_accounts WHERE role IN ('admin', 'rescue')
  ));
CREATE POLICY "Allow write access to admin and rescue" ON power_supply_status 
  FOR INSERT WITH CHECK (auth.uid() IN (
    SELECT id FROM user_accounts WHERE role IN ('admin', 'rescue')
  ));
CREATE POLICY "Allow write access to admin and rescue" ON network_status 
  FOR INSERT WITH CHECK (auth.uid() IN (
    SELECT id FROM user_accounts WHERE role IN ('admin', 'rescue')
  )); 