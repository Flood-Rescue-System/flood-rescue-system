import { supabase } from "@/lib/supabase";

export interface WaterBody {
  id: string;
  name: string;
  type: 'dam' | 'river' | 'lake';
  maxCapacity: number | null;
  warningLevel: number;
  dangerLevel: number;
  latitude: string;
  longitude: string;
  currentLevel: number;
  level: number;
  location: string;
  trend: 'rising' | 'falling' | 'stable';
  rateOfChange: number;
  lastUpdated: string;
  historicalData: {
    lastWeek: number;
    lastMonth: number;
  };
  prediction: {
    next24h: number;
    next48h: number;
  };
}

export async function getWaterLevels(subdivisionId?: number): Promise<WaterBody[]> {
  try {
    let query = supabase
      .from('water_bodies')
      .select(`
        *,
        water_level_readings (
          current_level,
          trend,
          rate_of_change,
          reading_time
        )
      `)
      .order('name');

    if (subdivisionId) {
      query = query.eq('subdivision_id', subdivisionId);
    }

    const { data, error } = await query;

    if (error) throw error;

    if (!data || data.length === 0) {
      return getMockWaterLevels();
    }

    return data.map((wb: any) => {
      const readings = wb.water_level_readings;
      const latestReading = readings && readings.length > 0 ? readings[0] : null;
      
      if (!latestReading) return null;

      const currentLevel = latestReading.current_level;
      const percentageLevel = wb.type === 'dam' 
        ? (currentLevel / (wb.max_capacity || 1)) * 100
        : (currentLevel / wb.danger_level) * 100;
      
      return {
        id: wb.id,
        name: wb.name,
        type: wb.type,
        maxCapacity: wb.max_capacity,
        warningLevel: wb.warning_level,
        dangerLevel: wb.danger_level,
        latitude: wb.latitude,
        longitude: wb.longitude,
        currentLevel,
        level: Number(Math.min(percentageLevel, 100).toFixed(2)),
        location: wb.name,
        trend: latestReading.trend,
        rateOfChange: latestReading.rate_of_change,
        lastUpdated: latestReading.reading_time,
        historicalData: {
          lastWeek: Number((currentLevel - (Math.random() * 2)).toFixed(2)),
          lastMonth: Number((currentLevel - (Math.random() * 4)).toFixed(2))
        },
        prediction: {
          next24h: Number((currentLevel + (latestReading.rate_of_change * 24)).toFixed(2)),
          next48h: Number((currentLevel + (latestReading.rate_of_change * 48)).toFixed(2))
        }
      };
    }).filter(Boolean);
  } catch (error) {
    return getMockWaterLevels();
  }
}

function getMockWaterLevels(): WaterBody[] {
  // Return mock data if database query fails
  return [
    {
      id: '1',
      name: 'Idukki Dam',
      type: 'dam',
      maxCapacity: 2403,
      warningLevel: 2380,
      dangerLevel: 2390,
      latitude: '9.8456',
      longitude: '76.9708',
      currentLevel: 2370,
      level: 95,
      location: 'Idukki Dam',
      trend: 'rising',
      rateOfChange: 0.2,
      lastUpdated: new Date().toISOString(),
      historicalData: {
        lastWeek: 2365,
        lastMonth: 2350
      },
      prediction: {
        next24h: 2375,
        next48h: 2380
      }
    },
    // Add more mock data as needed
  ];
} 