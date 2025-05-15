"use client";

import { useEffect, useRef } from "react";
import * as tf from "@tensorflow/tfjs";
import * as cocoSsd from "@tensorflow-models/coco-ssd";

interface PersonDetectionProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  onPersonDetected?: (detections: cocoSsd.DetectedObject[]) => void;
}

export default function PersonDetection({
  videoRef,
  onPersonDetected,
}: PersonDetectionProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const detectInterval = useRef<NodeJS.Timeout>();

  useEffect(() => {
    let model: cocoSsd.ObjectDetection;

    const loadModel = async () => {
      try {
        // Initialize TensorFlow.js with WebGL backend
        await tf.setBackend("webgl");
        await tf.ready();

        // Load the COCO-SSD model
        model = await cocoSsd.load({
          base: "lite_mobilenet_v2", // Use a lighter model for better performance
        });

        console.log("Model loaded successfully");
        startDetection();
      } catch (error) {
        console.error("Error loading model:", error);
      }
    };

    const startDetection = () => {
      if (!videoRef.current || !canvasRef.current || !model) return;

      detectInterval.current = setInterval(async () => {
        if (videoRef.current?.readyState === 4) {
          const predictions = await model.detect(videoRef.current);
          const personDetections = predictions.filter(
            (pred) => pred.class === "person"
          );

          if (onPersonDetected) {
            onPersonDetected(personDetections);
          }

          drawDetections(personDetections);
        }
      }, 100); // Detect every 100ms
    };

    const drawDetections = (detections: cocoSsd.DetectedObject[]) => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx || !videoRef.current) return;

      // Match canvas size to video
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;

      // Clear previous drawings
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw detections
      detections.forEach((detection) => {
        const [x, y, width, height] = detection.bbox;

        // Draw bounding box
        ctx.strokeStyle = "#00ff00";
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);

        // Draw label
        ctx.fillStyle = "#00ff00";
        ctx.font = "16px Arial";
        ctx.fillText(
          `Person ${Math.round(detection.score * 100)}%`,
          x,
          y > 10 ? y - 5 : 10
        );
      });
    };

    loadModel();

    return () => {
      if (detectInterval.current) {
        clearInterval(detectInterval.current);
      }
    };
  }, [videoRef, onPersonDetected]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{
        width: "100%",
        height: "100%",
      }}
    />
  );
}
