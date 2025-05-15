"use client";

import { useEffect, useRef, useState } from "react";
import { FiMaximize2, FiMinimize2, FiVideo, FiVideoOff } from "react-icons/fi";

type CameraFeedProps = {
  streamUrl: string;
  location: string;
  currentLevel?: number;
  status: "normal" | "warning" | "critical";
  feed_type: "rtsp" | "webcam" | "phone";
  config: {
    deviceId?: string;
    qrCode?: string;
    url?: string;
  };
};

export default function CameraFeed({
  streamUrl,
  location,
  currentLevel,
  status,
  feed_type,
  config,
}: CameraFeedProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleCanPlay = () => {
      setIsLoading(false);
      setHasError(false);
      video.play().catch(() => {
        // Ignore play() errors as they're expected in some cases
      });
    };

    const handleError = () => {
      setIsLoading(false);
      setHasError(true);
    };

    video.addEventListener("canplay", handleCanPlay);
    video.addEventListener("error", handleError);

    // Initialize video stream based on feed type
    try {
      switch (feed_type) {
        case "rtsp":
          video.src = `/api/stream-proxy?url=${encodeURIComponent(
            config.url || ""
          )}`;
          break;
        case "webcam":
          if (navigator.mediaDevices && config.deviceId) {
            navigator.mediaDevices
              .getUserMedia({
                video: {
                  deviceId: { exact: config.deviceId },
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
          video.src = streamUrl;
          break;
      }
    } catch (error) {
      console.error("Error initializing video:", error);
      setHasError(true);
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
  }, [feed_type, config, streamUrl]);

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

  return (
    <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white" />
        </div>
      )}

      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-white">
          <FiVideoOff className="w-12 h-12 mb-2" />
          <p className="text-sm">Failed to load video feed</p>
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

      <div className="absolute top-4 right-4 flex gap-2">
        <button
          onClick={toggleFullscreen}
          className="p-2 bg-black/50 hover:bg-black/70 text-white rounded-lg transition-colors"
        >
          {isFullscreen ? (
            <FiMinimize2 className="w-5 h-5" />
          ) : (
            <FiMaximize2 className="w-5 h-5" />
          )}
        </button>
      </div>

      {currentLevel && (
        <div className="absolute bottom-4 left-4 right-4 bg-black/50 p-3 rounded-lg">
          <div className="flex items-center justify-between text-white">
            <span>{location}</span>
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${
                status === "critical"
                  ? "bg-red-500"
                  : status === "warning"
                  ? "bg-yellow-500"
                  : "bg-green-500"
              }`}
            >
              {currentLevel} cm
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
