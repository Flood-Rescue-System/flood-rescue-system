-- Insert water bodies with specific UUID
INSERT INTO water_bodies (id, name, type, max_capacity, warning_level, danger_level, latitude, longitude, subdivision_id) VALUES
('fb52280d-7d5b-4744-a9e1-f2cb4297d81d', 'Idukki Dam', 'dam', 2403, 2380, 2390, '9.8456', '76.9708', 1),
(gen_random_uuid(), 'Mullaperiyar Dam', 'dam', 142, 136, 138, '9.5293', '77.1416', 1),
(gen_random_uuid(), 'Pampa River', 'river', NULL, 5.5, 6.2, '9.3327', '76.7780', 2),
(gen_random_uuid(), 'Periyar River', 'river', NULL, 4.8, 5.5, '10.1632', '76.2079', 1),
(gen_random_uuid(), 'Chalakudy River', 'river', NULL, 4.2, 5.0, '10.3004', '76.3344', 2);

-- Insert readings for each water body
INSERT INTO water_level_readings (water_body_id, current_level, trend, rate_of_change, reading_time)
SELECT 
  wb.id,
  CASE 
    WHEN wb.type = 'dam' THEN 
      CASE 
        WHEN wb.id = 'fb52280d-7d5b-4744-a9e1-f2cb4297d81d' THEN 2375.5  -- Specific level for Idukki Dam
        ELSE wb.max_capacity * 0.85 + (random() * 10)
      END
    ELSE wb.warning_level + (random() * 2 - 1)
  END,
  CASE floor(random() * 3)
    WHEN 0 THEN 'rising'
    WHEN 1 THEN 'falling'
    ELSE 'stable'
  END,
  CASE 
    WHEN wb.id = 'fb52280d-7d5b-4744-a9e1-f2cb4297d81d' THEN 0.2  -- Specific rate for Idukki Dam
    ELSE random() * 0.5 - 0.25
  END,
  NOW() - (interval '1 hour' * floor(random() * 24))  -- Random reading time within last 24 hours
FROM water_bodies wb;

-- Add historical readings for trending data
INSERT INTO water_level_readings (water_body_id, current_level, trend, rate_of_change, reading_time)
SELECT 
  'fb52280d-7d5b-4744-a9e1-f2cb4297d81d',
  2375.5 - (random() * 5),
  'rising',
  0.2,
  NOW() - (interval '1 day' * generate_series(1, 7))  -- Last 7 days of readings
FROM generate_series(1, 7); 