"use client";

import { useState, useEffect } from "react";
import { useGeolocated } from "react-geolocated";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { toast } from "react-hot-toast";

export default function EmergencySOSForm() {
  const [isMounted, setIsMounted] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    affectedPeople: "",
    waterLevel: "",
    medicalAssistance: "",
    location: { lat: "", lng: "" },
  });

  const { coords, isGeolocationAvailable, isGeolocationEnabled, getPosition } =
    useGeolocated({
      positionOptions: {
        enableHighAccuracy: true,
      },
      userDecisionTimeout: 5000,
      suppressLocationOnMount: true,
    });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (coords) {
      setFormData((prev) => ({
        ...prev,
        location: {
          lat: coords.latitude.toString(),
          lng: coords.longitude.toString(),
        },
      }));
      setIsGettingLocation(false);
    }
  }, [coords]);

  const handleGetLocation = () => {
    setIsGettingLocation(true);
    getPosition();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.location.lat || !formData.location.lng) {
      toast.error("Please provide your location");
      return;
    }

    try {
      const { error } = await supabase.from("emergency_sos").insert({
        name: formData.name,
        phone: formData.phone,
        affected_people: parseInt(formData.affectedPeople),
        water_level: formData.waterLevel,
        medical_assistance: formData.medicalAssistance,
        latitude: formData.location.lat,
        longitude: formData.location.lng,
      });

      if (error) throw error;

      toast.success("Emergency SOS sent successfully");
      // Close modal or reset form as needed
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to send Emergency SOS");
    }
  };

  if (!isMounted) return null;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Name
          </label>
          <input
            type="text"
            required
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter your full name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number
          </label>
          <input
            type="tel"
            required
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
            value={formData.phone}
            onChange={(e) =>
              setFormData({ ...formData, phone: e.target.value })
            }
            placeholder="Enter your phone number"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Number of Affected People
        </label>
        <input
          type="number"
          required
          min="1"
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
          value={formData.affectedPeople}
          onChange={(e) =>
            setFormData({ ...formData, affectedPeople: e.target.value })
          }
          placeholder="How many people need assistance?"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Water Level Estimation
        </label>
        <select
          required
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
          value={formData.waterLevel}
          onChange={(e) =>
            setFormData({ ...formData, waterLevel: e.target.value })
          }
        >
          <option value="" disabled>
            Select water level
          </option>
          <option value="ankle">Ankle Deep</option>
          <option value="knee">Knee Deep</option>
          <option value="waist">Waist Deep</option>
          <option value="chest">Chest Deep</option>
          <option value="above">Above Head</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Medical Assistance Required
        </label>
        <textarea
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors h-32"
          value={formData.medicalAssistance}
          onChange={(e) =>
            setFormData({ ...formData, medicalAssistance: e.target.value })
          }
          placeholder="Describe any medical requirements or conditions..."
        />
      </div>

      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Location
        </label>
        {coords ? (
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Latitude</p>
                <p className="font-medium">{coords.latitude.toFixed(6)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Longitude</p>
                <p className="font-medium">{coords.longitude.toFixed(6)}</p>
              </div>
            </div>
          </div>
        ) : (
          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGetLocation}
            disabled={
              isGettingLocation ||
              !isGeolocationAvailable ||
              !isGeolocationEnabled
            }
            className={`w-full p-3 rounded-lg flex items-center justify-center gap-2 ${
              isGettingLocation
                ? "bg-gray-100 text-gray-500"
                : "bg-blue-50 text-blue-600 hover:bg-blue-100"
            }`}
          >
            {isGettingLocation ? (
              <>
                <LoadingSpinner />
                Getting your location...
              </>
            ) : (
              <>
                <LocationIcon />
                {!isGeolocationAvailable
                  ? "Your browser doesn't support geolocation"
                  : !isGeolocationEnabled
                  ? "Please enable location services"
                  : "Get Current Location"}
              </>
            )}
          </motion.button>
        )}
      </div>

      <motion.button
        type="submit"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        <EmergencyIcon />
        Send Emergency SOS
      </motion.button>
    </form>
  );
}

function LoadingSpinner() {
  return (
    <svg
      className="animate-spin h-5 w-5"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

function LocationIcon() {
  return (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  );
}

function EmergencyIcon() {
  return (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
      />
    </svg>
  );
}
