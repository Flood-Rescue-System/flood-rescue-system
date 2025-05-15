"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiCamera, FiVideo, FiSmartphone } from "react-icons/fi";
import { supabase } from "@/lib/supabase";
import { toast } from "react-hot-toast";
import { RescueCamera } from "@/types/camera";

type AddRescueCameraModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingCamera?: RescueCamera;
};

export default function AddRescueCameraModal({
  isOpen,
  onClose,
  onSuccess,
  editingCamera,
}: AddRescueCameraModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    location_name: "",
    feed_type: "webcam" as RescueCamera["feed_type"],
    config: {} as RescueCamera["config"],
  });
  const [availableDevices, setAvailableDevices] = useState<MediaDeviceInfo[]>(
    []
  );

  useEffect(() => {
    if (isOpen && editingCamera) {
      setFormData({
        location_name: editingCamera.location_name,
        feed_type: editingCamera.feed_type,
        config: editingCamera.config,
      });
    } else if (!isOpen) {
      setFormData({
        location_name: "",
        feed_type: "webcam",
        config: {},
      });
    }
  }, [isOpen, editingCamera]);

  const getAvailableDevices = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ video: true });
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(
        (device) => device.kind === "videoinput"
      );
      setAvailableDevices(videoDevices);
    } catch (error) {
      console.error("Error accessing webcam:", error);
      toast.error("Unable to access webcam");
    }
  };

  useEffect(() => {
    if (isOpen && formData.feed_type === "webcam") {
      getAvailableDevices();
    }
  }, [isOpen, formData.feed_type]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get user's subdivision_id
      const { data: userData, error: userError } = await supabase
        .from("user_accounts")
        .select("subdivision_id")
        .eq("id", user.id)
        .single();

      if (userError || !userData?.subdivision_id) {
        throw new Error("Failed to get user data");
      }

      const cameraData = {
        team_lead_id: user.id,
        subdivision_id: userData.subdivision_id,
        location_name: formData.location_name,
        feed_type: formData.feed_type,
        config: formData.config,
      };

      if (editingCamera) {
        const { error } = await supabase
          .from("rescue_cameras")
          .update(cameraData)
          .eq("id", editingCamera.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("rescue_cameras")
          .insert([cameraData]);
        if (error) throw error;
      }

      toast.success(
        editingCamera
          ? "Camera updated successfully"
          : "Camera added successfully"
      );
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error saving camera:", error);
      toast.error(error.message || "Failed to save camera");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderFeedTypeContent = () => {
    switch (formData.feed_type) {
      case "webcam":
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Webcam
            </label>
            {availableDevices.length > 0 ? (
              <select
                value={formData.config.deviceId || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    config: { deviceId: e.target.value },
                  })
                }
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Select a webcam...</option>
                {availableDevices.map((device) => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label || `Camera ${device.deviceId.slice(0, 8)}`}
                  </option>
                ))}
              </select>
            ) : (
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-600">No webcams detected</p>
                <button
                  type="button"
                  onClick={getAvailableDevices}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-700"
                >
                  Retry Detection
                </button>
              </div>
            )}
          </div>
        );

      case "rtsp":
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              RTSP Stream URL
            </label>
            <input
              type="text"
              value={formData.config.url || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  config: { url: e.target.value },
                })
              }
              placeholder="rtsp://example.com/stream"
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        );

      case "phone":
        return (
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-gray-600 mb-2">
              Use your phone camera as a video source
            </p>
            <p className="text-sm text-gray-500">
              QR code will be generated after setup
            </p>
          </div>
        );
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50"
              onClick={onClose}
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-lg bg-white rounded-lg p-6 shadow-xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingCamera ? "Edit Camera" : "Add New Camera"}
                </h2>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.location_name}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        location_name: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Camera Type
                  </label>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { type: "webcam", icon: FiCamera, label: "Webcam" },
                      { type: "rtsp", icon: FiVideo, label: "RTSP Stream" },
                      {
                        type: "phone",
                        icon: FiSmartphone,
                        label: "Phone Camera",
                      },
                    ].map(({ type, icon: Icon, label }) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            feed_type: type as RescueCamera["feed_type"],
                            config: {},
                          })
                        }
                        className={`flex flex-col items-center justify-center p-4 rounded-lg border ${
                          formData.feed_type === type
                            ? "border-blue-500 bg-blue-50 text-blue-700"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <Icon className="w-6 h-6 mb-2" />
                        <span className="text-sm">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {renderFeedTypeContent()}

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isSubmitting
                      ? "Saving..."
                      : editingCamera
                      ? "Update Camera"
                      : "Add Camera"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
