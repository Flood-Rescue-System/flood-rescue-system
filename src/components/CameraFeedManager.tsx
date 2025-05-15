"use client";

import { useState } from "react";
import { FiMoreVertical, FiEdit2, FiTrash2 } from "react-icons/fi";
import { supabase } from "@/lib/supabase";
import { toast } from "react-hot-toast";

type CameraFeedManagerProps = {
  feedId: string;
  onEdit: () => void;
  onDelete: () => void;
};

export default function CameraFeedManager({
  feedId,
  onEdit,
  onDelete,
}: CameraFeedManagerProps) {
  const [showMenu, setShowMenu] = useState(false);

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from("camera_feeds")
        .delete()
        .eq("id", feedId);

      if (error) throw error;
      onDelete();
      toast.success("Camera feed removed");
    } catch (error) {
      console.error("Error deleting camera feed:", error);
      toast.error("Failed to remove camera feed");
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="p-2 hover:bg-black/10 rounded-full transition-colors"
      >
        <FiMoreVertical className="w-5 h-5 text-white" />
      </button>

      {showMenu && (
        <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg py-1 w-48">
          <button
            onClick={() => {
              onEdit();
              setShowMenu(false);
            }}
            className="w-full px-4 py-2 text-left flex items-center gap-2 hover:bg-gray-50"
          >
            <FiEdit2 className="w-4 h-4" />
            <span>Edit Feed</span>
          </button>
          <button
            onClick={() => {
              handleDelete();
              setShowMenu(false);
            }}
            className="w-full px-4 py-2 text-left flex items-center gap-2 text-red-600 hover:bg-red-50"
          >
            <FiTrash2 className="w-4 h-4" />
            <span>Remove Feed</span>
          </button>
        </div>
      )}
    </div>
  );
}
