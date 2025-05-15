"use client";

import { useState } from "react";
import { FiUser, FiUsers, FiX } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";

type TeamLoginModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (session: {
    type: "lead" | "member";
    memberId?: string;
  }) => Promise<void>;
  teamMembers: Array<{
    id: string;
    full_name: string;
    pin: string;
  }>;
};

export default function TeamLoginModal({
  isOpen,
  onClose,
  onLogin,
  teamMembers,
}: TeamLoginModalProps) {
  const [selectedType, setSelectedType] = useState<"lead" | "member" | null>(
    null
  );
  const [selectedMember, setSelectedMember] = useState<string>("");
  const [pin, setPin] = useState("");

  const handleSubmit = async () => {
    if (selectedType === "lead") {
      await onLogin({ type: "lead" });
    } else if (selectedType === "member" && selectedMember && pin) {
      const member = teamMembers.find((m) => m.id === selectedMember);
      if (member?.pin === pin) {
        await onLogin({ type: "member", memberId: selectedMember });
      } else {
        toast.error("Invalid PIN");
      }
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
              <h2 className="text-xl font-semibold text-gray-900">Login As</h2>
              <button
                onClick={onClose}
                className="p-2 text-gray-500 hover:text-gray-700 rounded-lg"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <button
                onClick={() => setSelectedType("lead")}
                className={`w-full p-4 flex items-center gap-3 rounded-lg border transition-colors ${
                  selectedType === "lead"
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-blue-500"
                }`}
              >
                <FiUser className="w-5 h-5" />
                <span>Team Lead</span>
              </button>

              <button
                onClick={() => setSelectedType("member")}
                className={`w-full p-4 flex items-center gap-3 rounded-lg border transition-colors ${
                  selectedType === "member"
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-blue-500"
                }`}
              >
                <FiUsers className="w-5 h-5" />
                <span>Team Member</span>
              </button>

              {selectedType === "member" && (
                <div className="space-y-4 mt-4">
                  <select
                    value={selectedMember}
                    onChange={(e) => setSelectedMember(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="">Select Team Member</option>
                    {teamMembers.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.full_name}
                      </option>
                    ))}
                  </select>

                  <input
                    type="password"
                    maxLength={4}
                    placeholder="Enter 4-digit PIN"
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={
                  !selectedType ||
                  (selectedType === "member" && (!selectedMember || !pin))
                }
                className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Continue
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
