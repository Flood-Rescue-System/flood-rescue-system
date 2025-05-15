-- Insert mock data for road status
INSERT INTO road_status (name, status, condition, latitude, longitude, subdivision_id) VALUES
('MC Road', 'open', 'Good condition', '9.9816', '76.2999', 1),
('NH-66', 'partially_open', 'Minor flooding', '9.9312', '76.2673', 1),
('SH-1', 'closed', 'Major flooding', '9.9677', '76.2384', 2),
('Bypass Road', 'open', 'Normal traffic', '9.9891', '76.3234', 2),
('Market Road', 'partially_open', 'Construction work', '9.9734', '76.2832', 1);

-- Insert mock data for bridge status
INSERT INTO bridge_status (name, status, water_level, latitude, longitude, subdivision_id) VALUES
('Marthanda Varma Bridge', 'safe', 12.5, '9.9677', '76.2384', 1),
('Wellington Bridge', 'at_risk', 15.8, '9.9891', '76.3234', 2),
('Pampa Bridge', 'closed', 18.2, '9.9312', '76.2673', 1),
('Railway Bridge', 'safe', 10.3, '9.9816', '76.2999', 2),
('Old Town Bridge', 'at_risk', 14.7, '9.9734', '76.2832', 1);

-- Insert mock data for power supply status
INSERT INTO power_supply_status (area, status, estimated_restoration, subdivision_id) VALUES
('Aluva', 'normal', NULL, 1),
('Perumbavoor', 'disrupted', NOW() + INTERVAL '2 hours', 2),
('Angamaly', 'restored', NULL, 1),
('Kalady', 'disrupted', NOW() + INTERVAL '4 hours', 2),
('Edappally', 'normal', NULL, 1);

-- Insert mock data for network status
INSERT INTO network_status (area, status, coverage, emergency_network, subdivision_id) VALUES
('Central Zone', 'normal', 95, false, 1),
('North Zone', 'limited', 65, true, 2),
('South Zone', 'normal', 88, false, 1),
('East Zone', 'down', 20, true, 2),
('West Zone', 'limited', 72, true, 1); 