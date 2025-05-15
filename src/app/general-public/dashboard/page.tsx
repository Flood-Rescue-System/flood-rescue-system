"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  FiSettings,
  FiLogOut,
  FiAlertCircle,
  FiClock,
  FiMapPin,
  FiAlertTriangle,
  FiHome,
  FiBox,
  FiHeart,
  FiMessageCircle,
  FiCloud,
  FiActivity,
  FiMap,
  FiWind,
  FiDroplet,
  FiTrendingUp,
  FiTrendingDown,
  FiExternalLink,
  FiThermometer,
} from "react-icons/fi";
import EmergencySOSButton from "@/components/EmergencySOSButton";
import DonationModal from "@/components/DonationModal";
import ContactModal from "@/components/ContactModal";
import dynamic from "next/dynamic";
import { getWeatherData, WeatherData } from "@/services/weather";
import { toast } from "react-hot-toast";
import {
  getInfrastructureStatus,
  InfrastructureStatus,
} from "@/services/infrastructure";
import { getWaterLevels, WaterBody } from "@/services/water-levels";
import { getWeatherNews, NewsItem } from "@/services/news-feed";
import NewsChannelCarousel from "@/components/NewsChannelCarousel";

// Add these types at the top
type Alert = {
  id: string;
  location: string;
  description: string;
  timestamp: string;
  status: "pending" | "resolved";
  latitude: string;
  longitude: string;
};

type Camp = {
  id: string;
  name: string;
  location: string;
  capacity: number;
  current_occupancy: number;
  subdivisions: {
    name: string;
    districts: {
      name: string;
    };
  };
};

type WaterLevel = {
  id: number;
  location: string;
  level: number;
  timestamp: string;
  trend?: "rising" | "falling" | "stable";
};

type Resource = {
  id: string;
  name: string;
  type: string;
  quantity: number;
  unit: string;
  provider_name: string;
  contact_number: string;
  location: string;
};

const FloodMap = dynamic(() => import("@/components/FloodMap"), {
  ssr: false,
});

// First, let's update the InfrastructureStatus type at the top of the file
type InfrastructureStatus = {
  roads: {
    status: "open" | "closed" | "partially_open";
    condition: string;
  };
  powerSupply: {
    status: "normal" | "disrupted" | "restored";
    estimatedRestoration?: Date;
  };
  network: {
    status: "normal" | "limited" | "down";
    coverage: number;
    emergencyNetwork: boolean;
  };
  bridges: {
    status: "safe" | "at_risk" | "closed";
    waterLevel: number;
  };
};

export default function PublicDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [camps, setCamps] = useState<Camp[]>([]);
  const [waterLevels, setWaterLevels] = useState<WaterBody[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [isDonationModalOpen, setIsDonationModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  // Add new states for infrastructure and weather
  const [infrastructureStatus, setInfrastructureStatus] =
    useState<InfrastructureStatus | null>(null);

  const [weatherInfo, setWeatherInfo] = useState<WeatherData | null>(null);

  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);

  useEffect(() => {
    fetchUserProfile();
    fetchAlerts();
    fetchCamps();
    fetchWaterLevels();
    fetchResources();
    fetchInfrastructureStatus();
    fetchWeatherInfo();
    fetchNews();
  }, []);

  useEffect(() => {
    if (userProfile) {
      fetchInfrastructureStatus();
      fetchWaterLevels();
    }
  }, [userProfile]);

  const fetchUserProfile = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth/login");
        return;
      }

      const { data: profile, error } = await supabase
        .from("public_user_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      setUserProfile(profile);
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAlerts = async () => {
    try {
      const { data, error } = await supabase
        .from("rescue_requests")
        .select("*")
        .eq("status", "pending");

      if (error) throw error;
      setAlerts(data || []);
    } catch (error) {
      console.error("Error fetching alerts:", error);
    }
  };

  const fetchCamps = async () => {
    try {
      const { data, error } = await supabase
        .from("camps")
        .select("*, subdivisions(name, districts(name))");
      if (error) throw error;
      setCamps(data);
    } catch (error) {
      console.error("Error fetching camps:", error);
    }
  };

  const fetchWaterLevels = async () => {
    try {
      const data = await getWaterLevels(userProfile?.subdivision_id);
      setWaterLevels(data);
    } catch (error) {
      toast.error("Failed to load water level data");
    }
  };

  const fetchResources = async () => {
    try {
      const { data, error } = await supabase
        .from("resources")
        .select("*")
        .eq("status", "available")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setResources(data);
    } catch (error) {
      console.error("Error fetching resources:", error);
    }
  };

  const fetchInfrastructureStatus = async () => {
    try {
      // Only pass subdivisionId if it exists
      const data = await getInfrastructureStatus(
        userProfile?.subdivision_id || undefined
      );
      setInfrastructureStatus(data);
    } catch (error) {
      console.error("Error fetching infrastructure status:", error);
      toast.error("Failed to load infrastructure status");
    }
  };

  const fetchWeatherInfo = async () => {
    try {
      // Get user's location from profile or use default Kerala coordinates
      const lat = 10.8505; // Replace with user's location if available
      const lon = 76.2711;

      const data = await getWeatherData(lat, lon);
      setWeatherInfo(data);
    } catch (error) {
      console.error("Error fetching weather:", error);
      toast.error("Failed to fetch weather information");
    }
  };

  const fetchNews = async () => {
    try {
      const news = await getWeatherNews();
      setNewsItems(news);
    } catch (error) {
      toast.error("Failed to load news feed");
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.push("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Image
                src="/images/logo.png"
                alt="Logo"
                width={40}
                height={40}
                className="w-8 h-8"
              />
              <span className="ml-2 text-xl font-semibold">
                Flood Rescue System
              </span>
            </div>

            <div className="flex items-center gap-4">
              <Link
                href="/general-public/dashboard/settings"
                className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
              >
                <FiSettings className="w-5 h-5" />
              </Link>
              <button
                onClick={handleSignOut}
                className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
              >
                <FiLogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Weather Summary - Full Width */}
            <div className="md:col-span-2 lg:col-span-4">
              <div className="bg-white rounded-lg shadow p-4">
                {/* Compact weather summary with current conditions */}
                {weatherInfo && (
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold mb-2">
                        Current Weather
                      </h2>
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="text-2xl font-bold">
                            {weatherInfo.current.temp}°C
                          </p>
                          <p className="text-sm text-gray-500 capitalize">
                            {weatherInfo.current.description}
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="flex items-center gap-1">
                            <FiDroplet className="w-4 h-4" />
                            <span>{weatherInfo.current.humidity}%</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <FiWind className="w-4 h-4" />
                            <span>{weatherInfo.current.windSpeed} m/s</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Flood Risk Indicator */}
                    <div
                      className={`p-3 rounded-lg ${
                        weatherInfo.floodRisk.level === "high"
                          ? "bg-red-50 text-red-700"
                          : weatherInfo.floodRisk.level === "medium"
                          ? "bg-yellow-50 text-yellow-700"
                          : "bg-green-50 text-green-700"
                      }`}
                    >
                      <p className="font-medium">Flood Risk</p>
                      <p className="text-sm">{weatherInfo.floodRisk.level}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Stats - Full Width */}
            <div className="md:col-span-2 lg:col-span-4">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="bg-white rounded-lg shadow p-4">
                  <h3 className="font-medium text-gray-700">Active Camps</h3>
                  <p className="text-2xl font-bold mt-2">{camps.length}</p>
                  <p className="text-sm text-gray-500">
                    Total Capacity:{" "}
                    {camps.reduce((sum, camp) => sum + camp.capacity, 0)}
                  </p>
                </div>

                <div className="bg-white rounded-lg shadow p-4">
                  <h3 className="font-medium text-gray-700">Active Alerts</h3>
                  <p className="text-2xl font-bold mt-2">{alerts.length}</p>
                  <p className="text-sm text-gray-500">Pending Rescue</p>
                </div>

                <div className="bg-white rounded-lg shadow p-4">
                  <h3 className="font-medium text-gray-700">
                    Available Resources
                  </h3>
                  <p className="text-2xl font-bold mt-2">{resources.length}</p>
                  <p className="text-sm text-gray-500">
                    Types: {new Set(resources.map((r) => r.type)).size}
                  </p>
                </div>

                <div className="bg-white rounded-lg shadow p-4">
                  <h3 className="font-medium text-gray-700">Critical Areas</h3>
                  <p className="text-2xl font-bold mt-2">
                    {waterLevels.filter((wb) => wb.level > 70).length}
                  </p>
                  <p className="text-sm text-gray-500">Water Bodies</p>
                </div>

                <div className="bg-white rounded-lg shadow p-4">
                  <h3 className="font-medium text-gray-700">Total Occupancy</h3>
                  <p className="text-2xl font-bold mt-2">
                    {camps.reduce(
                      (sum, camp) => sum + camp.current_occupancy,
                      0
                    )}
                  </p>
                  <p className="text-sm text-gray-500">People in Camps</p>
                </div>

                <div className="bg-white rounded-lg shadow p-4">
                  <h3 className="font-medium text-gray-700">
                    Flood Risk Areas
                  </h3>
                  <p className="text-2xl font-bold mt-2">
                    {weatherInfo?.floodRisk.affectedAreas.length || 0}
                  </p>
                  <p className="text-sm text-gray-500">
                    {weatherInfo?.floodRisk.level === "high"
                      ? "High Alert"
                      : "Under Watch"}
                  </p>
                </div>
              </div>
            </div>

            {/* Infrastructure Status and Weather Forecast */}
            <div className="md:col-span-2 lg:col-span-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Infrastructure Status */}
              <div className="bg-white rounded-lg shadow p-4">
                <h2 className="text-lg font-semibold mb-2">
                  Infrastructure Status
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  {infrastructureStatus ? (
                    <>
                      <div className="p-3 rounded-lg bg-gray-50">
                        <div className="flex items-center gap-2">
                          <FiActivity className="w-5 h-5 text-blue-500" />
                          <h3 className="font-medium">Power Supply</h3>
                        </div>
                        <div
                          className={`mt-2 text-sm ${
                            infrastructureStatus.powerSupply.status === "normal"
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {infrastructureStatus.powerSupply.status === "normal"
                            ? "Normal"
                            : infrastructureStatus.powerSupply.status ===
                              "restored"
                            ? "Restored"
                            : "Disrupted"}
                        </div>
                      </div>

                      <div className="p-3 rounded-lg bg-gray-50">
                        <div className="flex items-center gap-2">
                          <FiMap className="w-5 h-5 text-blue-500" />
                          <h3 className="font-medium">Roads</h3>
                        </div>
                        <div
                          className={`mt-2 text-sm ${
                            infrastructureStatus.roads.status === "open"
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {infrastructureStatus.roads.status === "open"
                            ? "Open"
                            : infrastructureStatus.roads.status ===
                              "partially_open"
                            ? "Partially Open"
                            : "Closed"}
                        </div>
                      </div>

                      <div className="p-3 rounded-lg bg-gray-50">
                        <div className="flex items-center gap-2">
                          <FiCloud className="w-5 h-5 text-blue-500" />
                          <h3 className="font-medium">Network</h3>
                        </div>
                        <div
                          className={`mt-2 text-sm ${
                            infrastructureStatus.network.status === "normal"
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {infrastructureStatus.network.status === "normal"
                            ? "Normal"
                            : infrastructureStatus.network.status === "limited"
                            ? "Limited"
                            : "Down"}
                          <span className="text-gray-500 ml-1">
                            ({infrastructureStatus.network.coverage}% coverage)
                          </span>
                        </div>
                      </div>

                      <div className="p-3 rounded-lg bg-gray-50">
                        <div className="flex items-center gap-2">
                          <FiBox className="w-5 h-5 text-blue-500" />
                          <h3 className="font-medium">Bridges</h3>
                        </div>
                        <div
                          className={`mt-2 text-sm ${
                            infrastructureStatus.bridges.status === "safe"
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {infrastructureStatus.bridges.status === "safe"
                            ? "Safe"
                            : infrastructureStatus.bridges.status === "at_risk"
                            ? "At Risk"
                            : "Closed"}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="col-span-2 text-center text-gray-500 py-4">
                      No infrastructure data available
                    </div>
                  )}
                </div>
              </div>

              {/* Weather Forecast */}
              <div className="bg-white rounded-lg shadow p-4">
                <h2 className="text-lg font-semibold mb-2">Weather Forecast</h2>
                {weatherInfo && (
                  <div className="space-y-4">
                    {/* Next 24 Hours Summary */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 rounded-lg bg-gray-50">
                        <div className="flex items-center gap-2">
                          <FiCloud className="w-5 h-5 text-blue-500" />
                          <h3 className="font-medium">Next 24h</h3>
                        </div>
                        <div className="mt-2">
                          <span className="text-2xl font-bold">
                            {weatherInfo.forecast[0].rainfall}mm
                          </span>
                          <p className="text-sm text-gray-600">Expected Rain</p>
                        </div>
                      </div>

                      <div className="p-3 rounded-lg bg-gray-50">
                        <div className="flex items-center gap-2">
                          <FiThermometer className="w-5 h-5 text-blue-500" />
                          <h3 className="font-medium">Temperature</h3>
                        </div>
                        <div className="mt-2">
                          <span className="text-2xl font-bold">
                            {weatherInfo.forecast[0].temp}°C
                          </span>
                          <p className="text-sm text-gray-600">
                            {weatherInfo.forecast[0].description}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* 5-Day Forecast */}
                    <div className="space-y-2">
                      <h3 className="font-medium text-gray-700">
                        5-Day Forecast
                      </h3>
                      <div className="overflow-x-auto">
                        <div className="flex gap-4 pb-2">
                          {weatherInfo.forecast.map((forecast, index) => {
                            const date = new Date(forecast.timestamp * 1000);
                            const hour = date.getHours();
                            const isNight = hour >= 18 || hour < 6;

                            return (
                              <div
                                key={index}
                                className={`flex-shrink-0 p-3 rounded-lg ${
                                  isNight
                                    ? "bg-gray-800 text-white"
                                    : "bg-gray-50"
                                }`}
                              >
                                <div className="text-sm">
                                  {date.toLocaleDateString(undefined, {
                                    weekday: "short",
                                  })}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {date.toLocaleTimeString(undefined, {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </div>
                                <div className="text-lg font-bold mt-1">
                                  {forecast.temp}°C
                                </div>
                                <div className="text-sm mt-1">
                                  {forecast.rainfall > 0 && (
                                    <div className="flex items-center gap-1">
                                      <FiDroplet className="w-3 h-3" />
                                      {forecast.rainfall}mm
                                    </div>
                                  )}
                                </div>
                                <div className="text-xs mt-1 capitalize">
                                  {forecast.description}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Weather Warning */}
                    {weatherInfo.floodRisk.level !== "low" && (
                      <div className="p-3 rounded-lg bg-yellow-50">
                        <div className="flex items-center gap-2 mb-2">
                          <FiAlertTriangle className="w-5 h-5 text-yellow-500" />
                          <h3 className="font-medium text-yellow-700">
                            Weather Warning
                          </h3>
                        </div>
                        <p className="text-sm text-yellow-600">
                          {weatherInfo.floodRisk.description}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Map and News Channels side by side */}
            <div className="md:col-span-2 lg:col-span-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Situation Map */}
              <div className="bg-white rounded-lg shadow p-4 h-full flex flex-col">
                <h2 className="text-lg font-semibold mb-2">Situation Map</h2>
                <div
                  className="w-full h-[500px] relative"
                  style={{ zIndex: 0 }}
                >
                  <FloodMap
                    markers={[
                      ...camps.map((camp) => ({
                        position: [
                          parseFloat(camp.latitude || "10.8505"),
                          parseFloat(camp.longitude || "76.2711"),
                        ] as [number, number],
                        name: camp.name,
                        type: "camp" as const,
                        details: `Capacity: ${camp.capacity}, Current: ${camp.current_occupancy}`,
                      })),
                      ...alerts.map((alert) => ({
                        position: [
                          parseFloat(alert.latitude || "10.8505"),
                          parseFloat(alert.longitude || "76.2711"),
                        ] as [number, number],
                        name: "Emergency Alert",
                        type: "alert" as const,
                        details: alert.description,
                      })),
                    ]}
                  />
                </div>
              </div>

              {/* News Channel Box */}
              <div className="h-full">
                <NewsChannelCarousel />
              </div>
            </div>

            {/* Critical Water Levels and Active Camps Details */}
            <div className="md:col-span-2 lg:col-span-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Critical Water Levels */}
              <div className="bg-white rounded-lg shadow p-4">
                <h2 className="text-lg font-semibold mb-2">
                  Critical Water Levels
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  {waterLevels
                    .filter((wb) => wb.level > 70)
                    .slice(0, 4)
                    .map((wb) => (
                      <div key={wb.id} className="p-4 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{wb.name}</h4>
                            <p className="text-sm text-gray-600">
                              Current Level: {wb.level}%
                            </p>
                          </div>
                          <div className="flex items-center gap-1 text-sm">
                            {wb.trend === "rising" ? (
                              <FiTrendingUp className="text-red-500" />
                            ) : wb.trend === "falling" ? (
                              <FiTrendingDown className="text-green-500" />
                            ) : null}
                            <span className="text-gray-600">{wb.trend}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Active Camps Box */}
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">Active Relief Camps</h2>
                  <FiHome className="w-5 h-5 text-gray-400" />
                </div>
                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                  {camps.slice(0, 4).map((camp) => (
                    <div key={camp.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">{camp.name}</h3>
                          <p className="text-sm text-gray-600">
                            {camp.location}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-medium">
                            {camp.current_occupancy}/{camp.capacity}
                          </span>
                          <p className="text-xs text-gray-500">Occupancy</p>
                        </div>
                      </div>
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              (camp.current_occupancy / camp.capacity) * 100 >
                              90
                                ? "bg-red-500"
                                : (camp.current_occupancy / camp.capacity) *
                                    100 >
                                  75
                                ? "bg-yellow-500"
                                : "bg-green-500"
                            }`}
                            style={{
                              width: `${Math.min(
                                (camp.current_occupancy / camp.capacity) * 100,
                                100
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {camp.subdivisions?.name},{" "}
                        {camp.subdivisions?.districts?.name}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* News Feed and Resources - Side by side on larger screens */}
            <div className="md:col-span-1 lg:col-span-2">
              <div className="bg-white rounded-lg shadow p-4">
                <h2 className="text-lg font-semibold mb-2">Latest Updates</h2>
                <div className="space-y-2">
                  {newsItems.slice(0, 3).map((news, index) => (
                    <div
                      key={index}
                      className="border-b last:border-0 pb-4 last:pb-0"
                    >
                      <a
                        href={news.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block hover:bg-gray-50 rounded p-2 -mx-2 transition-colors"
                      >
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <h3 className="font-medium text-gray-900">
                              {news.title}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                              {news.description}
                            </p>
                            <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                              <span>{news.source}</span>
                              <span>•</span>
                              <span>
                                {new Date(news.pubDate).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <FiExternalLink className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
                        </div>
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="md:col-span-1 lg:col-span-2">
              <div className="bg-white rounded-lg shadow p-4">
                <h2 className="text-lg font-semibold mb-2">
                  Available Resources
                </h2>
                <div className="space-y-2">
                  {resources.slice(0, 3).map((resource) => (
                    <div key={resource.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">{resource.name}</h3>
                          <p className="text-sm text-gray-500">
                            {resource.location}
                          </p>
                        </div>
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                          {resource.quantity} {resource.unit}
                        </span>
                      </div>
                      <div className="mt-2 text-sm text-gray-600">
                        <p>Provider: {resource.provider_name}</p>
                        <p>Contact: {resource.contact_number}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Actions - Bottom of the page */}
            <div className="md:col-span-2 lg:col-span-4">
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setIsDonationModalOpen(true)}
                  className="p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow flex items-center justify-center gap-2"
                >
                  <FiHeart className="w-5 h-5 text-red-500" />
                  <span>Donate</span>
                </button>
                <button
                  onClick={() => setIsContactModalOpen(true)}
                  className="p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow flex items-center justify-center gap-2"
                >
                  <FiMessageCircle className="w-5 h-5 text-blue-500" />
                  <span>Contact</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {!isLoading && userProfile && (
          <div className="fixed bottom-6 right-6">
            <EmergencySOSButton
              userId={userProfile.user_id}
              onRequestCreated={fetchUserProfile}
            />
          </div>
        )}

        {/* Modals */}
        <DonationModal
          isOpen={isDonationModalOpen}
          onClose={() => setIsDonationModalOpen(false)}
          className="z-50"
        />
        <ContactModal
          isOpen={isContactModalOpen}
          onClose={() => setIsContactModalOpen(false)}
          className="z-50"
        />
      </main>
    </div>
  );
}
