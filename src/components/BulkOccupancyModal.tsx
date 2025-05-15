"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiAlertCircle } from "react-icons/fi";
import { supabase } from "@/lib/supabase";
import { toast } from "react-hot-toast";
import { Camp } from "@/types/camp";

type BulkOccupancyModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  camp: Camp;
};

export default function BulkOccupancyModal({
  isOpen,
  onClose,
  onSuccess,
  camp,
}: BulkOccupancyModalProps) {
  const [newOccupancy, setNewOccupancy] = useState<number>(0);

  useEffect(() => {
    if (camp) {
      setNewOccupancy(camp.current_occupancy);
    }
  }, [camp]);

  const [isSaving, setIsSaving] = useState(false);

  if (!camp) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      if (newOccupancy > camp.capacity) {
        toast.error("Cannot exceed maximum capacity");
        return;
      }

      if (newOccupancy < 0) {
        toast.error("Occupancy cannot be negative");
        return;
      }

      // Automatically update status based on occupancy
      let status = camp.status;
      if (camp.status !== "closed") {
        if (newOccupancy === 0) status = "active";
        else if (newOccupancy === camp.capacity) status = "full";
        else if (newOccupancy < camp.capacity) status = "active";
      }

      const { error } = await supabase
        .from("camps")
        .update({
          current_occupancy: newOccupancy,
          status,
        })
        .eq("id", camp.id);

      if (error) throw error;

      toast.success("Occupancy updated successfully");
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error updating occupancy:", error);
      toast.error("Failed to update occupancy");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-lg shadow-xl w-full max-w-md p-6"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Update Camp Occupancy
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
                <p className="text-gray-900">{camp.name}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Occupancy
                </label>
                <p className="text-gray-900">{camp.current_occupancy}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Maximum Capacity
                </label>
                <p className="text-gray-900">{camp.capacity}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Occupancy
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  max={camp.capacity}
                  value={newOccupancy}
                  onChange={(e) => setNewOccupancy(parseInt(e.target.value))}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              {newOccupancy !== camp.current_occupancy && (
                <div className="bg-yellow-50 p-3 rounded-lg flex items-start gap-2">
                  <FiAlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <p className="text-sm text-yellow-800">
                    This will{" "}
                    {newOccupancy > camp.current_occupancy ? "add" : "remove"}{" "}
                    {Math.abs(newOccupancy - camp.current_occupancy)} people{" "}
                    {newOccupancy > camp.current_occupancy ? "to" : "from"} the
                    camp.
                  </p>
                </div>
              )}

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
                  disabled={isSaving || newOccupancy === camp.current_occupancy}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSaving ? "Updating..." : "Update Occupancy"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
