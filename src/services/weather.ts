const API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
const BASE_URL = "https://api.openweathermap.org/data/2.5";

export interface WeatherData {
  current: {
    temp: number;
    humidity: number;
    windSpeed: number;
    windDirection: number; // in degrees
    rainfall: number;
    description: string;
    feelsLike: number;
    pressure: number;
  };
  forecast: {
    timestamp: number;
    temp: number;
    rainfall: number;
    description: string;
  }[];
  dailyForecast: Array<{
    date: number;
    temp: {
      day: number;
      min: number;
      max: number;
      night: number;
      eve: number;
      morn: number;
    };
    feelsLike: {
      day: number;
      night: number;
      eve: number;
      morn: number;
    };
    humidity: number;
    windSpeed: number;
    windDirection: number;
    description: string;
    rainfall: number;
    probability: number; // Probability of precipitation
  }>;
  floodRisk: {
    level: "low" | "medium" | "high";
    probability: number;
    warningType: string;
    affectedAreas: string[];
  };
  rainfall: {
    daily: number;
    weekly: number;
    monthly: number;
    historical: {
      lastWeek: number;
      lastMonth: number;
    };
  };
}

export async function getWeatherData(
  lat: number,
  lon: number
): Promise<WeatherData> {
  try {
    // Get current weather
    const currentResponse = await fetch(
      `${BASE_URL}/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
    );

    if (!currentResponse.ok) {
      const errorData = await currentResponse.json();
      throw new Error(errorData.message || "Weather data fetch failed");
    }

    const currentData = await currentResponse.json();

    // Get 5-day forecast with 3-hour steps
    const forecastResponse = await fetch(
      `${BASE_URL}/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
    );

    if (!forecastResponse.ok) {
      const errorData = await forecastResponse.json();
      throw new Error(errorData.message || "Forecast data fetch failed");
    }

    const forecastData = await forecastResponse.json();

    // Group forecast data by days
    const dailyForecasts = groupForecastsByDay(forecastData.list);

    return {
      current: {
        temp: Math.round(currentData.main.temp),
        humidity: currentData.main.humidity,
        windSpeed: currentData.wind.speed,
        windDirection: currentData.wind.deg,
        rainfall: currentData.rain?.["1h"] || 0,
        description: currentData.weather[0].description,
        feelsLike: Math.round(currentData.main.feels_like),
        pressure: currentData.main.pressure,
      },
      forecast: forecastData.list.slice(0, 8).map((hour: any) => ({
        timestamp: hour.dt * 1000,
        temp: Math.round(hour.main.temp),
        rainfall: hour.rain?.["3h"] || 0,
        description: hour.weather[0].description,
      })),
      dailyForecast: dailyForecasts.map((day: any) => ({
        date: day.dt * 1000,
        temp: {
          day: Math.round(day.temp.day),
          min: Math.round(day.temp.min),
          max: Math.round(day.temp.max),
          night: Math.round(day.temp.night),
          eve: Math.round(day.temp.eve),
          morn: Math.round(day.temp.morn),
        },
        feelsLike: {
          day: Math.round(day.main.feels_like),
          night: Math.round(day.main.feels_like),
          eve: Math.round(day.main.feels_like),
          morn: Math.round(day.main.feels_like),
        },
        humidity: day.main.humidity,
        windSpeed: day.wind.speed,
        windDirection: day.wind.deg,
        description: day.weather[0].description,
        rainfall: day.rain?.["3h"] || 0,
        probability: day.pop || 0,
      })),
      floodRisk: calculateFloodRisk(currentData, forecastData),
      rainfall: calculateRainfall(forecastData),
    };
  } catch (error) {
    console.error("Error fetching weather data:", error);
    return getMockWeatherData();
  }
}

// Helper function to group 3-hour forecasts into daily forecasts
function groupForecastsByDay(forecastList: any[]): any[] {
  const dailyForecasts: { [key: string]: any } = {};

  forecastList.forEach((forecast) => {
    const date = new Date(forecast.dt * 1000).toLocaleDateString();

    if (!dailyForecasts[date]) {
      dailyForecasts[date] = {
        dt: forecast.dt,
        temp: {
          day: forecast.main.temp,
          min: forecast.main.temp,
          max: forecast.main.temp,
          night: forecast.main.temp,
          eve: forecast.main.temp,
          morn: forecast.main.temp,
        },
        main: forecast.main,
        weather: forecast.weather,
        wind: forecast.wind,
        rain: forecast.rain,
        pop: forecast.pop,
      };
    } else {
      // Update min/max temperatures
      dailyForecasts[date].temp.min = Math.min(
        dailyForecasts[date].temp.min,
        forecast.main.temp
      );
      dailyForecasts[date].temp.max = Math.max(
        dailyForecasts[date].temp.max,
        forecast.main.temp
      );

      // Update time-specific temperatures based on hour
      const hour = new Date(forecast.dt * 1000).getHours();
      if (hour >= 5 && hour < 12) {
        dailyForecasts[date].temp.morn = forecast.main.temp;
      } else if (hour >= 12 && hour < 17) {
        dailyForecasts[date].temp.day = forecast.main.temp;
      } else if (hour >= 17 && hour < 22) {
        dailyForecasts[date].temp.eve = forecast.main.temp;
      } else {
        dailyForecasts[date].temp.night = forecast.main.temp;
      }
    }
  });

  return Object.values(dailyForecasts);
}

// Helper functions
function calculateFloodRisk(currentData: any, forecast: any) {
  const rainIntensity = currentData.rain?.["1h"] || 0;
  const isRaining = currentData.weather[0].main === "Rain";
  const humidity = currentData.main.humidity;
  const futureRain = forecast.list
    .slice(0, 3)
    .some((day: any) => day.weather[0].main === "Rain");

  if (rainIntensity > 50 || (isRaining && humidity > 85 && futureRain)) {
    return {
      level: "high" as const,
      probability: 0.8,
      warningType: "Heavy rainfall flooding",
      affectedAreas: ["Low-lying areas", "River banks", "Urban areas"],
    };
  } else if (rainIntensity > 25 || (isRaining && humidity > 75)) {
    return {
      level: "medium" as const,
      probability: 0.5,
      warningType: "Moderate flood risk",
      affectedAreas: ["Low-lying areas"],
    };
  }
  return {
    level: "low" as const,
    probability: 0.2,
    warningType: "Normal conditions",
    affectedAreas: [],
  };
}

function calculateRainfall(forecast: any) {
  const hourlyRainfall = forecast.list
    .slice(0, 24)
    .reduce((acc: number, hour: any) => acc + (hour.rain?.["3h"] || 0), 0);

  return {
    daily: hourlyRainfall,
    weekly: hourlyRainfall * 7 * 0.7,
    monthly: hourlyRainfall * 30 * 0.5,
    historical: {
      lastWeek: hourlyRainfall * 7 * 0.6,
      lastMonth: hourlyRainfall * 30 * 0.4,
    },
  };
}

// Fallback mock data function
function getMockWeatherData(): WeatherData {
  // Mock data for testing
  const currentTime = Date.now();
  const hourInMillis = 3600000;
  const dayInMillis = 24 * hourInMillis;

  return {
    current: {
      temp: 28,
      humidity: 75,
      windSpeed: 3.5,
      windDirection: 180,
      rainfall: 2.1,
      description: "Light rain",
      feelsLike: 30,
      pressure: 1012,
    },
    forecast: Array.from({ length: 8 }, (_, i) => ({
      timestamp: currentTime + i * hourInMillis,
      temp: 25 + Math.round(Math.random() * 5),
      rainfall: Math.round(Math.random() * 5 * 10) / 10,
      description: [
        "Clear sky",
        "Light rain",
        "Scattered clouds",
        "Moderate rain",
      ][Math.floor(Math.random() * 4)],
    })),
    dailyForecast: Array.from({ length: 16 }, (_, i) => ({
      date: currentTime + i * dayInMillis,
      temp: {
        day: 28 + Math.round(Math.random() * 4),
        min: 22 + Math.round(Math.random() * 3),
        max: 30 + Math.round(Math.random() * 3),
        night: 23 + Math.round(Math.random() * 3),
        eve: 27 + Math.round(Math.random() * 3),
        morn: 24 + Math.round(Math.random() * 3),
      },
      feelsLike: {
        day: 30 + Math.round(Math.random() * 4),
        night: 24 + Math.round(Math.random() * 3),
        eve: 28 + Math.round(Math.random() * 3),
        morn: 25 + Math.round(Math.random() * 3),
      },
      humidity: 65 + Math.round(Math.random() * 20),
      windSpeed: 2 + Math.round(Math.random() * 6),
      windDirection: Math.round(Math.random() * 360),
      description: [
        "Clear sky",
        "Light rain",
        "Scattered clouds",
        "Moderate rain",
      ][Math.floor(Math.random() * 4)],
      rainfall: Math.round(Math.random() * 10 * 10) / 10,
      probability: Math.random(),
    })),
    floodRisk: {
      level: "medium",
      probability: 0.4,
      warningType: "Moderate flood risk",
      affectedAreas: ["Low-lying areas"],
    },
    rainfall: {
      daily: 25.4,
      weekly: 120.7,
      monthly: 350.2,
      historical: {
        lastWeek: 115.3,
        lastMonth: 380.5,
      },
    },
  };
}
