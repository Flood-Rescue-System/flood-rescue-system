"use client";

import { useState } from "react";
import { FiAlertTriangle } from "react-icons/fi";
import EmergencySOSModal from "./EmergencySOSModal";

type EmergencySOSButtonProps = {
  userId: string;
  onRequestCreated?: () => void;
};

export default function EmergencySOSButton({
  userId,
  onRequestCreated,
}: EmergencySOSButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-6 right-6 bg-red-600 text-white p-4 rounded-full shadow-lg hover:bg-red-700 transition-colors"
      >
        <FiAlertTriangle className="w-6 h-6" />
      </button>

      <EmergencySOSModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
