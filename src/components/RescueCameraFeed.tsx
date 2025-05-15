"use client";

import { useEffect, useRef, useState } from "react";
import { FiMaximize2, FiMinimize2, FiVideo, FiVideoOff } from "react-icons/fi";
import { RescueCamera } from "@/types/camera";
import PersonDetection from "./PersonDetection";

type RescueCameraFeedProps = {
  camera: RescueCamera;
  onStatusChange?: (status: "online" | "offline") => void;
};

export default function RescueCameraFeed({
  camera,
  onStatusChange,
}: RescueCameraFeedProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [personCount, setPersonCount] = useState(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleCanPlay = () => {
      setIsLoading(false);
      setHasError(false);
      onStatusChange?.("online");
      video.play().catch(() => {
        // Ignore play() errors as they're expected in some cases
      });
    };

    const handleError = () => {
      setIsLoading(false);
      setHasError(true);
      onStatusChange?.("offline");
    };

    video.addEventListener("canplay", handleCanPlay);
    video.addEventListener("error", handleError);

    // Initialize video stream based on feed type
    try {
      switch (camera.feed_type) {
        case "rtsp":
          if (camera.config.url) {
            // Use a proxy endpoint to handle RTSP streams
            video.src = `/api/stream-proxy?url=${encodeURIComponent(
              camera.config.url
            )}`;
          }
          break;

        case "webcam":
          if (navigator.mediaDevices && camera.config.deviceId) {
            navigator.mediaDevices
              .getUserMedia({
                video: {
                  deviceId: { exact: camera.config.deviceId },
                },
              })
              .then((stream) => {
                video.srcObject = stream;
              })
              .catch(handleError);
          }
          break;

        case "phone":
          // Phone camera handling will be implemented later
          // Could use WebRTC or similar for phone streaming
          break;
      }
    } catch (error) {
      console.error("Error initializing video:", error);
      setHasError(true);
      onStatusChange?.("offline");
    }

    return () => {
      video.removeEventListener("canplay", handleCanPlay);
      video.removeEventListener("error", handleError);

      // Cleanup streams
      if (video.srcObject) {
        const stream = video.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
      video.pause();
      video.src = "";
    };
  }, [camera, onStatusChange]);

  const toggleFullscreen = () => {
    const video = videoRef.current;
    if (!video) return;

    if (!isFullscreen) {
      if (video.requestFullscreen) {
        video.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };

  const handlePersonDetected = (detections: any[]) => {
    setPersonCount(detections.length);
  };

  return (
    <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden group">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white" />
        </div>
      )}

      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-white">
          <FiVideoOff className="w-12 h-12 mb-2" />
          <p className="text-sm">Failed to load camera feed</p>
        </div>
      )}

      <video
        ref={videoRef}
        className={`w-full h-full object-cover ${
          isLoading || hasError ? "hidden" : "block"
        }`}
        autoPlay
        playsInline
        muted
      />

      <PersonDetection
        videoRef={videoRef}
        onPersonDetected={handlePersonDetected}
      />

      <div className="absolute top-0 inset-x-0 p-4 bg-gradient-to-b from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex items-center justify-between text-white">
          <span className="text-sm font-medium">{camera.location_name}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleFullscreen}
              className="p-2 hover:bg-black/20 rounded-lg transition-colors"
              title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              {isFullscreen ? (
                <FiMinimize2 className="w-5 h-5" />
              ) : (
                <FiMaximize2 className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex items-center justify-between text-white">
          <span className="text-sm">
            {camera.feed_type.toUpperCase()} Camera
          </span>
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 text-xs bg-blue-500/50 rounded-full">
              {personCount} {personCount === 1 ? "person" : "people"} detected
            </span>
            <span
              className={`px-2 py-1 text-xs font-medium rounded-full ${
                hasError ? "bg-red-500" : "bg-green-500"
              }`}
            >
              {hasError ? "Offline" : "Online"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
