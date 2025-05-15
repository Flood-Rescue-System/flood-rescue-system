"use client";

import { useState, useRef } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import { FiCamera, FiX } from "react-icons/fi";
import { supabase } from "@/lib/supabase";
import { toast } from "react-hot-toast";
import WaterLevelRoiSelector from "./WaterLevelRoiSelector";

type Unit = "m" | "cm" | "mm";

interface WaterLevelCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function WaterLevelCameraModal({
  isOpen,
  onClose,
  onSuccess,
}: WaterLevelCameraModalProps) {
  const [step, setStep] = useState<"initial" | "roi" | "config">("initial");
  const [name, setName] = useState("");
  const [maxValue, setMaxValue] = useState("");
  const [minValue, setMinValue] = useState("");
  const [threshold, setThreshold] = useState("");
  const [unit, setUnit] = useState<Unit>("mm");
  const [roiCoords, setRoiCoords] = useState<{
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  } | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const cleanup = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    setStep("initial");
    setName("");
    setMaxValue("");
    setMinValue("");
    setThreshold("");
    setUnit("mm");
    setRoiCoords(null);
    setStream(null);
    onClose();
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setStep("roi");
    } catch (error) {
      console.error("Error accessing camera:", error);
      toast.error(
        "Failed to access camera. Please make sure you have a camera connected and have granted permission to use it."
      );
    }
  };

  const handleRoiSelect = (coords: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  }) => {
    setRoiCoords(coords);
    setStep("config");
  };

  const handleSubmit = async () => {
    if (!roiCoords) return;

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const waterLevelConfig = {
        name,
        admin_id: user.id,
        roi_coords: roiCoords,
        max_value: convertToMm(parseFloat(maxValue), unit),
        min_value: convertToMm(parseFloat(minValue), unit),
        threshold: convertToMm(parseFloat(threshold), unit),
        status: "active",
      };

      const { error } = await supabase
        .from("water_level_cameras")
        .insert(waterLevelConfig);

      if (error) throw error;

      toast.success("Water level camera configured successfully");
      cleanup();
      onSuccess();
    } catch (error: any) {
      console.error("Error setting up water level camera:", error);
      toast.error(
        error.message ||
          "Failed to set up water level camera. Please try again."
      );
    }
  };

  const convertToMm = (value: number, fromUnit: Unit): number => {
    switch (fromUnit) {
      case "m":
        return value * 1000;
      case "cm":
        return value * 10;
      case "mm":
        return value;
      default:
        return value;
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        className="fixed inset-0 z-50 overflow-y-auto"
        onClose={cleanup}
      >
        <div className="flex items-center justify-center min-h-screen">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-30" />
          </Transition.Child>

          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
              <div className="flex justify-between items-center p-4 border-b">
                <Dialog.Title className="text-lg font-semibold">
                  Add Water Level Camera
                </Dialog.Title>
                <button
                  onClick={cleanup}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4">
                {step === "initial" && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Camera Name
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        placeholder="Enter camera name"
                      />
                    </div>
                    <button
                      onClick={startCamera}
                      disabled={!name}
                      className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      <FiCamera className="w-5 h-5 mr-2" />
                      Start Camera
                    </button>
                  </div>
                )}

                {step === "roi" && stream && (
                  <WaterLevelRoiSelector
                    stream={stream}
                    onSelect={handleRoiSelect}
                    onSkip={() => setStep("config")}
                  />
                )}

                {step === "config" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Maximum Value
                        </label>
                        <div className="mt-1 flex rounded-md shadow-sm">
                          <input
                            type="number"
                            value={maxValue}
                            onChange={(e) => setMaxValue(e.target.value)}
                            className="flex-1 rounded-l-md border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                          />
                          <select
                            value={unit}
                            onChange={(e) => setUnit(e.target.value as Unit)}
                            className="rounded-r-md border-l-0 border-gray-300 bg-gray-50"
                          >
                            <option value="mm">mm</option>
                            <option value="cm">cm</option>
                            <option value="m">m</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Minimum Value
                        </label>
                        <div className="mt-1 flex rounded-md shadow-sm">
                          <input
                            type="number"
                            value={minValue}
                            onChange={(e) => setMinValue(e.target.value)}
                            className="flex-1 rounded-l-md border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                          />
                          <select
                            value={unit}
                            onChange={(e) => setUnit(e.target.value as Unit)}
                            className="rounded-r-md border-l-0 border-gray-300 bg-gray-50"
                          >
                            <option value="mm">mm</option>
                            <option value="cm">cm</option>
                            <option value="m">m</option>
                          </select>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Alert Threshold
                      </label>
                      <div className="mt-1 flex rounded-md shadow-sm">
                        <input
                          type="number"
                          value={threshold}
                          onChange={(e) => setThreshold(e.target.value)}
                          className="flex-1 rounded-l-md border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        />
                        <select
                          value={unit}
                          onChange={(e) => setUnit(e.target.value as Unit)}
                          className="rounded-r-md border-l-0 border-gray-300 bg-gray-50"
                        >
                          <option value="mm">mm</option>
                          <option value="cm">cm</option>
                          <option value="m">m</option>
                        </select>
                      </div>
                      <p className="mt-1 text-sm text-gray-500">
                        You will receive alerts when the water level exceeds
                        this value
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 p-4 border-t">
                <button
                  onClick={cleanup}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                {step === "config" && (
                  <button
                    onClick={handleSubmit}
                    disabled={!maxValue || !minValue || !threshold}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    Save
                  </button>
                )}
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}
