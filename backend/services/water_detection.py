import cv2
import numpy as np
from typing import Tuple, Optional, Dict, Any
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class WaterLevelDetector:
    def __init__(self, roi_coords: dict, min_value: int, max_value: int):
        """Initialize the water level detector with ROI coordinates and calibration values."""
        # Store ROI coordinates
        self.roi_coords = {
            'x1': float(roi_coords.get('x1', 0)),
            'y1': float(roi_coords.get('y1', 0)),
            'x2': float(roi_coords.get('x2', 640)),
            'y2': float(roi_coords.get('y2', 480))
        }
        self.min_value = min_value
        self.max_value = max_value
        self.water_level_y = None
        print(f"Initialized WaterLevelDetector with ROI: {self.roi_coords}")

    def get_absolute_coordinates(self, frame_shape):
        """Convert coordinates to absolute pixel coordinates."""
        height, width = frame_shape[:2]
        
        # If any coordinate is greater than 100, treat all as pixel values
        if any(v > 100 for v in self.roi_coords.values()):
            x1 = max(0, min(width - 1, int(self.roi_coords['x1'])))
            y1 = max(0, min(height - 1, int(self.roi_coords['y1'])))
            x2 = max(x1 + 1, min(width, int(self.roi_coords['x2'])))
            y2 = max(y1 + 1, min(height, int(self.roi_coords['y2'])))
        else:
            # Convert percentages to pixels
            x1 = max(0, min(width - 1, int((self.roi_coords['x1'] * width) / 100)))
            y1 = max(0, min(height - 1, int((self.roi_coords['y1'] * height) / 100)))
            x2 = max(x1 + 1, min(width, int((self.roi_coords['x2'] * width) / 100)))
            y2 = max(y1 + 1, min(height, int((self.roi_coords['y2'] * height) / 100)))
        
        # Ensure minimum ROI size
        if (x2 - x1) < 10:
            x2 = min(x1 + 10, width)
        if (y2 - y1) < 10:
            y2 = min(y1 + 10, height)
            
        print(f"Converted ROI coordinates: ({x1},{y1}) to ({x2},{y2})")
        return (x1, y1), (x2, y2)

    def process_frame(self, frame):
        """Process a frame to detect water level."""
        try:
            # Get absolute coordinates for the frame
            (x1, y1), (x2, y2) = self.get_absolute_coordinates(frame.shape)
            
            # Ensure ROI has minimum size
            if (x2 - x1) < 10 or (y2 - y1) < 10:
                print(f"ROI too small: {x1},{y1} to {x2},{y2}")
                return None, frame
            
            # Draw ROI rectangle
            roi_frame = frame.copy()
            cv2.rectangle(roi_frame, (x1, y1), (x2, y2), (0, 255, 0), 2)

            # Extract ROI
            roi = frame[y1:y2, x1:x2]
            
            # Convert to grayscale
            gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
            
            # Apply Gaussian blur
            blurred = cv2.GaussianBlur(gray, (5, 5), 0)
            
            # Apply Otsu's thresholding
            _, thresh = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
            
            # Find water level (highest white pixel)
            white_pixels = np.where(thresh == 255)
            if len(white_pixels[0]) > 0:
                water_level_local_y = int(np.min(white_pixels[0]))  # Convert to int
                self.water_level_y = int(y1 + water_level_local_y)  # Convert to int
                
                # Draw water level line
                cv2.line(roi_frame, (x1, self.water_level_y), (x2, self.water_level_y), (0, 0, 255), 2)
                
                # Calculate water level in mm
                total_height = y2 - y1
                water_height = total_height - water_level_local_y
                water_level = float(self.min_value + (water_height / total_height) * (self.max_value - self.min_value))  # Convert to float
                
                # Add text
                cv2.putText(roi_frame, f"{water_level:.1f}mm", (x1 + 10, self.water_level_y - 10),
                           cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 255), 2)
                
                return water_level, roi_frame
            
            return None, roi_frame

        except Exception as e:
            print(f"Error in process_frame: {str(e)}")
            return None, frame

    def get_water_level_y(self):
        """Get the Y coordinate of the detected water level."""
        return self.water_level_y 