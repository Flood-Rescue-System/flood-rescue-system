"use client";

import { useEffect, useRef, useState } from "react";
import { WaterLevelCamera } from "@/types/water-level";
import { FiTrash2, FiCamera, FiAlertCircle } from "react-icons/fi";

interface WaterLevelFeedProps {
  camera: WaterLevelCamera;
  onDelete: (id: string) => void;
}

const WaterLevelFeed = ({ camera, onDelete }: WaterLevelFeedProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null);
  const [status, setStatus] = useState<"connecting" | "connected" | "error">(
    "connecting"
  );

  useEffect(() => {
    const connectWebSocket = () => {
      // Don't connect if camera is not active or invalid
      if (!camera || !camera.id || camera.status !== "active") {
        console.log(
          `Camera ${camera?.id} is not ready for connection (status: ${camera?.status})`
        );
        setStatus("error");
        setError("Camera is not active");
        return;
      }

      // Validate required camera properties
      if (
        !camera.name ||
        !camera.roi_coords ||
        typeof camera.min_value !== "number" ||
        typeof camera.max_value !== "number" ||
        typeof camera.threshold !== "number"
      ) {
        console.log(`Camera ${camera.id} has invalid configuration`);
        setStatus("error");
        setError("Invalid camera configuration");
        return;
      }

      console.log(`Connecting WebSocket for camera ${camera.id}...`);
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        console.log("Closing existing connection...");
        wsRef.current.close();
      }

      const ws = new WebSocket(
        `ws://localhost:8000/api/ws/water-level/${camera.id}`
      );
      wsRef.current = ws;

      ws.onopen = () => {
        console.log(`WebSocket connected for camera ${camera.id}`);
        setIsConnected(true);
        setError(null);
        // Send start signal to backend
        const startMessage = JSON.stringify({ action: "start_camera" });
        console.log(`Sending start signal: ${startMessage}`);
        ws.send(startMessage);
      };

      ws.onclose = (event) => {
        console.log(`WebSocket closed for camera ${camera.id}:`, event.reason);
        setIsConnected(false);

        // Only try to reconnect if the camera is still active and we haven't encountered an error
        if (camera.status === "active" && !error) {
          console.log("Scheduling reconnect...");
          reconnectTimeoutRef.current = setTimeout(connectWebSocket, 5000);
        } else {
          console.log(
            `Not reconnecting - camera status is ${camera.status}, error: ${error}`
          );
          setStatus("error");
          if (!error) setError("Connection closed");
        }
      };

      ws.onerror = (error) => {
        console.error(`WebSocket error for camera ${camera.id}:`, error);
        setError("Failed to connect to camera feed");
        setStatus("error");
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log(`Received message for camera ${camera.id}:`, data);

          // Handle different message types
          switch (data.type) {
            case "error":
              console.error(
                `Error from backend for camera ${camera.id}:`,
                data.message
              );
              setError(data.message);
              setStatus("error");
              break;

            case "camera_status":
              console.log(`Camera ${camera.id} status update:`, data.status);
              setStatus(data.status === "connected" ? "connected" : "error");
              if (data.status === "error") {
                setError(data.message);
              }
              break;

            case "frame":
              if (!canvasRef.current) return;

              const ctx = canvasRef.current.getContext("2d");
              if (!ctx) return;

              // Draw the frame
              const img = new Image();
              img.onload = () => {
                ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
                ctx.drawImage(img, 0, 0, ctx.canvas.width, ctx.canvas.height);

                // Draw water level line
                if (data.water_level_y !== null) {
                  ctx.beginPath();
                  ctx.strokeStyle = "blue";
                  ctx.lineWidth = 2;
                  ctx.moveTo(0, data.water_level_y);
                  ctx.lineTo(ctx.canvas.width, data.water_level_y);
                  ctx.stroke();

                  // Add water level text
                  ctx.font = "16px Arial";
                  ctx.fillStyle = "white";
                  ctx.fillRect(10, data.water_level_y - 25, 100, 20);
                  ctx.fillStyle = "black";
                  ctx.fillText(
                    `${data.water_level}mm`,
                    15,
                    data.water_level_y - 10
                  );
                }

                // Add camera info overlay
                ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
                ctx.fillRect(10, 10, 200, 90);
                ctx.font = "14px Arial";
                ctx.fillStyle = "white";
                ctx.fillText(`Min: ${camera.min_value}mm`, 20, 30);
                ctx.fillText(`Max: ${camera.max_value}mm`, 20, 50);
                ctx.fillText(`Threshold: ${camera.threshold}mm`, 20, 70);
                ctx.fillText(`Status: ${camera.status}`, 20, 90);
              };
              img.src = `data:image/jpeg;base64,${data.frame}`;
              break;
          }
        } catch (error) {
          console.error(
            `Error processing message for camera ${camera.id}:`,
            error
          );
        }
      };
    };

    console.log(
      `Setting up WebSocket for camera ${camera.id} (status: ${camera.status})`
    );
    connectWebSocket();

    return () => {
      console.log(`Cleaning up WebSocket for camera ${camera.id}`);
      // Send stop signal before closing
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        const stopMessage = JSON.stringify({ action: "stop_camera" });
        console.log(`Sending stop signal: ${stopMessage}`);
        wsRef.current.send(stopMessage);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [
    camera.id,
    camera.status,
    camera.name,
    camera.roi_coords,
    camera.min_value,
    camera.max_value,
    camera.threshold,
  ]);

  const renderCameraStatus = () => {
    if (camera.status === "inactive") {
      return (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 bg-opacity-90 text-white">
          <FiCamera className="w-12 h-12 mb-2 text-gray-400" />
          <p className="text-sm text-gray-300">Camera Inactive</p>
        </div>
      );
    }

    if (camera.status === "error" || error) {
      return (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-900 bg-opacity-90 text-white">
          <FiAlertCircle className="w-12 h-12 mb-2 text-red-400" />
          <p className="text-sm text-red-300">Camera Error</p>
        </div>
      );
    }

    if (!isConnected) {
      return (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-50">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-2" />
          <p className="text-sm text-gray-300">Connecting...</p>
        </div>
      );
    }

    return null;
  };

  if (error) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white">
        <div className="text-center p-4">
          <p className="text-red-400 mb-2">{error}</p>
          <button
            onClick={() => onDelete(camera.id)}
            className="inline-flex items-center px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            <FiTrash2 className="w-4 h-4 mr-2" />
            Remove Camera
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-4 border-b flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">{camera.name}</h3>
          <span
            className={`px-2 py-1 text-xs rounded-full ${
              camera.status === "active"
                ? "bg-green-100 text-green-800"
                : camera.status === "error"
                ? "bg-red-100 text-red-800"
                : "bg-gray-100 text-gray-800"
            }`}
          >
            {camera.status}
          </span>
        </div>
        <button
          onClick={() => onDelete(camera.id)}
          className="text-red-500 hover:text-red-700"
        >
          <FiTrash2 className="w-5 h-5" />
        </button>
      </div>
      <div className="relative aspect-video bg-gray-900">
        <canvas ref={canvasRef} className="w-full h-full object-contain" />
        {renderCameraStatus()}
      </div>
      <div className="p-4 bg-gray-50">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Min Level:</span>
            <span className="ml-2 font-medium">{camera.min_value}mm</span>
          </div>
          <div>
            <span className="text-gray-500">Max Level:</span>
            <span className="ml-2 font-medium">{camera.max_value}mm</span>
          </div>
          <div>
            <span className="text-gray-500">Threshold:</span>
            <span className="ml-2 font-medium">{camera.threshold}mm</span>
          </div>
          <div>
            <span className="text-gray-500">Current Level:</span>
            <span
              className={`ml-2 font-medium ${
                (camera.current_level ?? 0) > camera.threshold
                  ? "text-red-500"
                  : "text-green-500"
              }`}
            >
              {camera.current_level ?? "N/A"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WaterLevelFeed;
