"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";

export default function AdminRegistrationForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [districts, setDistricts] = useState<any[]>([]);
  const [subdivisions, setSubdivisions] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    masterKey: "",
    districtId: "",
    subdivisionId: "",
  });

  // Fetch districts on mount
  useEffect(() => {
    fetchDistricts();
  }, []);

  // Fetch subdivisions when district changes
  useEffect(() => {
    if (formData.districtId) {
      fetchSubdivisions(formData.districtId);
    }
  }, [formData.districtId]);

  const fetchDistricts = async () => {
    const { data, error } = await supabase.from("districts").select("*");
    if (error) {
      toast.error("Failed to load districts");
      return;
    }
    setDistricts(data);
  };

  const fetchSubdivisions = async (districtId: string) => {
    const { data, error } = await supabase
      .from("subdivisions")
      .select("*")
      .eq("district_id", districtId);
    if (error) {
      toast.error("Failed to load subdivisions");
      return;
    }
    setSubdivisions(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate master key
      if (formData.masterKey !== process.env.NEXT_PUBLIC_ADMIN_MASTER_KEY) {
        throw new Error("Invalid master key");
      }

      // Validate password match
      if (formData.password !== formData.confirmPassword) {
        throw new Error("Passwords do not match");
      }

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (authError) throw authError;

      // Create user account
      const { error: accountError } = await supabase
        .from("user_accounts")
        .insert({
          id: authData.user?.id,
          email: formData.email,
          phone_number: formData.phone,
          role: "admin",
          district_id: formData.districtId,
          subdivision_id: formData.subdivisionId,
        });

      if (accountError) throw accountError;

      toast.success(
        "Registration successful! Please check your email to verify your account."
      );
      router.push("/auth/login");
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900">
          Administrator Registration
        </h2>
        <p className="text-gray-600 mt-2">Create your administrator account</p>
      </div>

      {/* Form fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Email field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Address
          </label>
          <input
            type="email"
            required
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter your email"
          />
        </div>

        {/* Phone field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number
          </label>
          <input
            type="tel"
            required
            value={formData.phone}
            onChange={(e) =>
              setFormData({ ...formData, phone: e.target.value })
            }
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter your phone number"
          />
        </div>

        {/* Password fields */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Password
          </label>
          <input
            type="password"
            required
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Create a password"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Confirm Password
          </label>
          <input
            type="password"
            required
            value={formData.confirmPassword}
            onChange={(e) =>
              setFormData({ ...formData, confirmPassword: e.target.value })
            }
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Confirm your password"
          />
        </div>

        {/* Master Key field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Master Key
          </label>
          <input
            type="password"
            required
            value={formData.masterKey}
            onChange={(e) =>
              setFormData({ ...formData, masterKey: e.target.value })
            }
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter master key"
          />
        </div>

        {/* Location fields */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            District
          </label>
          <select
            required
            value={formData.districtId}
            onChange={(e) =>
              setFormData({ ...formData, districtId: e.target.value })
            }
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select District</option>
            {districts.map((district) => (
              <option key={district.id} value={district.id}>
                {district.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sub-division
          </label>
          <select
            required
            value={formData.subdivisionId}
            onChange={(e) =>
              setFormData({ ...formData, subdivisionId: e.target.value })
            }
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={!formData.districtId}
          >
            <option value="">Select Sub-division</option>
            {subdivisions.map((subdivision) => (
              <option key={subdivision.id} value={subdivision.id}>
                {subdivision.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <motion.button
        type="submit"
        disabled={isLoading}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className={`w-full py-3 px-4 rounded-lg font-medium text-white ${
          isLoading
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-blue-600 hover:bg-blue-700"
        } transition-colors flex items-center justify-center gap-2`}
      >
        {isLoading ? (
          <>
            <LoadingSpinner />
            Registering...
          </>
        ) : (
          "Register"
        )}
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
