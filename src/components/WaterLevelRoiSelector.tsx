"use client";

import { useEffect, useRef, useState } from "react";

interface WaterLevelRoiSelectorProps {
  stream: MediaStream;
  onSelect: (coords: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  }) => void;
  onSkip: () => void;
}

export default function WaterLevelRoiSelector({
  stream,
  onSelect,
  onSkip,
}: WaterLevelRoiSelectorProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(
    null
  );
  const [videoSize, setVideoSize] = useState<{
    width: number;
    height: number;
  } | null>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setVideoSize({
        width: video.videoWidth,
        height: video.videoHeight,
      });

      // Set canvas size to match video
      if (canvasRef.current) {
        canvasRef.current.width = video.videoWidth;
        canvasRef.current.height = video.videoHeight;
      }
    };

    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    return () =>
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
  }, []);

  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoordinates(e);
    setIsDrawing(true);
    setStartPos(coords);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !startPos || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const coords = getCanvasCoordinates(e);

    // Clear previous drawing
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw new rectangle
    ctx.strokeStyle = "#00ff00";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.rect(
      startPos.x,
      startPos.y,
      coords.x - startPos.x,
      coords.y - startPos.y
    );
    ctx.stroke();

    // Draw guidelines
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = "#ffffff";
    ctx.beginPath();
    ctx.moveTo(startPos.x, 0);
    ctx.lineTo(startPos.x, canvas.height);
    ctx.moveTo(coords.x, 0);
    ctx.lineTo(coords.x, canvas.height);
    ctx.moveTo(0, startPos.y);
    ctx.lineTo(canvas.width, startPos.y);
    ctx.moveTo(0, coords.y);
    ctx.lineTo(canvas.width, coords.y);
    ctx.stroke();
    ctx.setLineDash([]);
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !startPos) return;

    const coords = getCanvasCoordinates(e);
    setIsDrawing(false);

    // Calculate final coordinates
    const x1 = Math.min(startPos.x, coords.x);
    const y1 = Math.min(startPos.y, coords.y);
    const x2 = Math.max(startPos.x, coords.x);
    const y2 = Math.max(startPos.y, coords.y);

    // Only select if the area is large enough
    if (Math.abs(x2 - x1) > 10 && Math.abs(y2 - y1) > 10) {
      onSelect({ x1, y1, x2, y2 });
    }
  };

  return (
    <div className="relative">
      <div className="aspect-video bg-black rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-contain"
        />
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          className="absolute inset-0 w-full h-full cursor-crosshair"
          style={{ touchAction: "none" }}
        />
      </div>

      <div className="absolute bottom-4 right-4 flex gap-2">
        <button
          type="button"
          onClick={onSkip}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
        >
          Skip Selection
        </button>
      </div>

      <div className="mt-4 text-sm text-gray-600">
        <p>
          Click and drag to select the region containing the water level scale.
        </p>
        <p>Make sure to include the entire scale in your selection.</p>
      </div>
    </div>
  );
}
