"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiCamera, FiVideo, FiSmartphone } from "react-icons/fi";
import { supabase } from "@/lib/supabase";
import { toast } from "react-hot-toast";

type FeedType = "rtsp" | "webcam" | "phone";

type FeedConfig = {
  deviceId?: string;
  qrCode?: string;
  url?: string;
};

type AddCameraModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export default function AddCameraModal({
  isOpen,
  onClose,
  onSuccess,
}: AddCameraModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    location_name: "",
    feed_type: "webcam" as "rtsp" | "webcam" | "phone",
    config: {} as FeedConfig,
    critical_level: "",
    warning_level: "",
  });
  const [availableDevices, setAvailableDevices] = useState<MediaDeviceInfo[]>(
    []
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const cameraFeedData = {
        admin_id: user.id,
        location_name: formData.location_name,
        feed_type: formData.feed_type,
        config: formData.config,
        critical_level: parseInt(formData.critical_level) || null,
        warning_level: parseInt(formData.warning_level) || null,
      };

      const { error } = await supabase
        .from("camera_feeds")
        .insert(cameraFeedData);

      if (error) throw error;

      toast.success("Camera feed added successfully");
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error details:", error);
      toast.error(error.message || "Failed to add camera feed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getAvailableDevices = async () => {
    try {
      // Request permission to access media devices
      await navigator.mediaDevices.getUserMedia({ video: true });

      // Get list of video input devices
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

  const renderFeedTypeContent = () => {
    switch (formData.feed_type) {
      case "webcam":
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Webcam Device
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
                <option value="">Select webcam...</option>
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
                  className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                >
                  Retry Detection
                </button>
              </div>
            )}
          </div>
        );
      case "phone":
        return (
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-gray-600 mb-2">
              Use our mobile app to stream from your phone camera
            </p>
            <p className="text-sm text-gray-500">
              QR code will be generated after setup
            </p>
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
              required
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
              className="relative w-full max-w-lg rounded-lg bg-white p-6 shadow-lg"
            >
              <button
                onClick={onClose}
                className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
              >
                <FiX className="h-6 w-6" />
              </button>

              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Add Camera Feed
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Feed Type
                  </label>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { value: "webcam", icon: FiCamera, label: "Webcam" },
                      { value: "rtsp", icon: FiVideo, label: "RTSP Stream" },
                      {
                        value: "phone",
                        icon: FiSmartphone,
                        label: "Phone Camera",
                      },
                    ].map(({ value, icon: Icon, label }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            feed_type: value as any,
                          })
                        }
                        className={`flex flex-col items-center justify-center p-4 rounded-lg border ${
                          formData.feed_type === value
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Warning Level (cm)
                    </label>
                    <input
                      type="number"
                      value={formData.warning_level}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          warning_level: e.target.value,
                        })
                      }
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Critical Level (cm)
                    </label>
                    <input
                      type="number"
                      value={formData.critical_level}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          critical_level: e.target.value,
                        })
                      }
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-4 mt-6">
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
                    {isSubmitting ? "Adding..." : "Add Camera Feed"}
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
