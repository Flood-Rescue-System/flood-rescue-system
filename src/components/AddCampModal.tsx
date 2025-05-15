"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiX } from "react-icons/fi";
import { supabase } from "@/lib/supabase";
import { toast } from "react-hot-toast";
import { Camp } from "@/types/camp";

type CampFormData = {
  name: string;
  location: string;
  capacity: number;
  contact_number: string;
  address: string;
  facilities: string[];
};

type AddCampModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingCamp?: Camp;
};

export default function AddCampModal({
  isOpen,
  onClose,
  onSuccess,
  editingCamp,
}: AddCampModalProps) {
  const [formData, setFormData] = useState<CampFormData>({
    name: "",
    location: "",
    capacity: 100,
    contact_number: "",
    address: "",
    facilities: [],
  });

  useEffect(() => {
    if (isOpen && editingCamp) {
      setFormData({
        name: editingCamp.name,
        location: editingCamp.location,
        capacity: editingCamp.capacity,
        contact_number: editingCamp.contact_number,
        address: editingCamp.address,
        facilities: editingCamp.facilities,
      });
    } else if (!isOpen) {
      setFormData({
        name: "",
        location: "",
        capacity: 100,
        contact_number: "",
        address: "",
        facilities: [],
      });
    }
  }, [isOpen, editingCamp]);

  const [isSaving, setIsSaving] = useState(false);
  const [facility, setFacility] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get user's subdivision_id
      const { data: userData } = await supabase
        .from("user_accounts")
        .select("subdivision_id")
        .eq("id", user.id)
        .single();

      const campData = {
        ...formData,
        team_lead_id: user.id,
        subdivision_id: userData.subdivision_id,
      };

      if (editingCamp) {
        const { error } = await supabase
          .from("camps")
          .update(campData)
          .eq("id", editingCamp.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("camps").insert([campData]);
        if (error) throw error;
      }

      toast.success(
        editingCamp ? "Camp updated successfully" : "Camp added successfully"
      );
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error saving camp:", error);
      toast.error("Failed to save camp");
    } finally {
      setIsSaving(false);
    }
  };

  const addFacility = () => {
    if (facility.trim()) {
      setFormData({
        ...formData,
        facilities: [...formData.facilities, facility.trim()],
      });
      setFacility("");
    }
  };

  const removeFacility = (index: number) => {
    setFormData({
      ...formData,
      facilities: formData.facilities.filter((_, i) => i !== index),
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingCamp ? "Edit Camp" : "Add New Camp"}
              </h2>
              <button
                onClick={onClose}
                className="p-2 text-gray-500 hover:text-gray-700 rounded-lg"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Camp Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  required
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Capacity
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.capacity}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        capacity: parseInt(e.target.value),
                      })
                    }
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Number
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.contact_number}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        contact_number: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <textarea
                  required
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Facilities
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={facility}
                    onChange={(e) => setFacility(e.target.value)}
                    className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Add facility"
                  />
                  <button
                    type="button"
                    onClick={addFacility}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  >
                    Add
                  </button>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {formData.facilities.map((f, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center gap-1"
                    >
                      {f}
                      <button
                        type="button"
                        onClick={() => removeFacility(i)}
                        className="hover:text-blue-600"
                      >
                        <FiX className="w-4 h-4" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : editingCamp ? "Update" : "Add Camp"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
