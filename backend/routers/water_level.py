from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException, Body
from typing import Dict, Optional, List
from pydantic import BaseModel
import cv2
import numpy as np
import base64
import json
import asyncio
from services.water_detection import WaterLevelDetector
from database import supabase

router = APIRouter()

# Store active WebSocket connections and their detectors
connections: Dict[str, WebSocket] = {}
detectors: Dict[str, WaterLevelDetector] = {}

# Pydantic models for request/response validation
class CameraConfig(BaseModel):
    name: str
    roi_coords: dict
    max_value: int
    min_value: int
    threshold: int

class CameraResponse(BaseModel):
    id: str
    name: str
    roi_coords: dict
    max_value: int
    min_value: int
    threshold: int
    current_level: Optional[int]
    status: str
    created_at: str
    updated_at: str

@router.post("/cameras", response_model=CameraResponse)
async def create_camera(config: CameraConfig):
    """Create a new water level camera configuration."""
    try:
        response = await supabase.table('water_level_cameras').insert({
            'name': config.name,
            'roi_coords': config.roi_coords,
            'max_value': config.max_value,
            'min_value': config.min_value,
            'threshold': config.threshold,
            'status': 'active'
        }).execute()
        
        if not response.data:
            raise HTTPException(status_code=400, detail="Failed to create camera configuration")
        
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/cameras", response_model=List[CameraResponse])
async def list_cameras():
    """List all water level cameras."""
    try:
        response = await supabase.table('water_level_cameras').select('*').execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/cameras/{camera_id}")
async def delete_camera(camera_id: str):
    """Delete a water level camera configuration."""
    try:
        response = await supabase.table('water_level_cameras').delete().eq('id', camera_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Camera not found")
        return {"message": "Camera deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Existing WebSocket related functions
async def get_camera_config(camera_id: str) -> Optional[dict]:
    """Fetch camera configuration from the database."""
    try:
        response = supabase.table('water_level_cameras').select('*').eq('id', camera_id).execute()
        if response.data and len(response.data) > 0:
            return response.data[0]
        return None
    except Exception as e:
        print(f"Error fetching camera config: {str(e)}")
        return None

async def update_water_level(camera_id: str, current_level: float):
    """Update the current water level in the database."""
    try:
        supabase.table('water_level_cameras').update({
            'current_level': current_level,
            'updated_at': 'now()'
        }).eq('id', camera_id).execute()
    except Exception as e:
        print(f"Error updating water level: {str(e)}")

async def try_connect_camera(camera_id: str, websocket: WebSocket) -> Optional[cv2.VideoCapture]:
    """Try to connect to available cameras and return the first working one."""
    print(f"Attempting to connect to cameras for camera_id: {camera_id}")
    
    # Try external cameras first (indices 1-3), then built-in webcam (0)
    camera_indices = [1, 2, 3, 0]
    
    for i in camera_indices:
        print(f"Trying camera index {i}...")
        cap = None
        
        try:
            # Try with DirectShow first (Windows)
            cap = cv2.VideoCapture(i + cv2.CAP_DSHOW)
            if not cap.isOpened():
                cap.release()
                # Try without backend specification
                cap = cv2.VideoCapture(i)
                
            if cap.isOpened():
                # Test if we can read multiple frames
                success_count = 0
                for _ in range(3):  # Try reading 3 frames
                    ret, test_frame = cap.read()
                    if ret and test_frame is not None:
                        success_count += 1
                
                if success_count >= 2:  # At least 2 successful reads
                    print(f"Successfully connected to camera {i}")
                    print(f"Frame shape: {test_frame.shape}")
                    # Send success message to frontend
                    await websocket.send_json({
                        "type": "camera_status",
                        "status": "connected",
                        "message": f"Connected to camera {i}"
                    })
                    return cap
                else:
                    print(f"Camera {i} connected but not reading frames reliably")
                    cap.release()
            else:
                print(f"Could not open camera {i}")
                if cap:
                    cap.release()
                    
        except Exception as e:
            print(f"Error accessing camera {i}: {str(e)}")
            if cap:
                cap.release()
    
    # If we get here, no camera worked
    error_msg = "Failed to connect to any camera. Please check your camera connections and permissions."
    print(error_msg)
    await websocket.send_json({
        "type": "camera_status",
        "status": "error",
        "message": error_msg
    })
    return None

@router.websocket("/ws/water-level/{camera_id}")
async def water_level_websocket(websocket: WebSocket, camera_id: str):
    print(f"New WebSocket connection request for camera {camera_id}")
    await websocket.accept()
    print(f"WebSocket connection accepted for camera {camera_id}")
    connections[camera_id] = websocket
    cap = None
    is_running = True
    
    try:
        # Get camera configuration
        print(f"Fetching camera configuration for {camera_id}")
        camera_config = await get_camera_config(camera_id)
        if not camera_config:
            print(f"No camera configuration found for {camera_id}")
            await websocket.send_json({
                "type": "error",
                "message": "Camera configuration not found"
            })
            await websocket.close(code=1000, reason="Camera configuration not found")
            return
        print(f"Camera configuration found for {camera_id}")
        
        # Initialize detector
        try:
            detector = WaterLevelDetector(
                roi_coords=camera_config['roi_coords'],
                min_value=camera_config['min_value'],
                max_value=camera_config['max_value']
            )
            detectors[camera_id] = detector
            print(f"Water level detector initialized for camera {camera_id}")
        except Exception as e:
            error_msg = f"Failed to initialize detector: {str(e)}"
            print(error_msg)
            await websocket.send_json({
                "type": "error",
                "message": error_msg
            })
            await websocket.close(code=1000, reason=error_msg)
            return

        # Wait for start signal from frontend
        print(f"Waiting for start_camera signal from frontend for camera {camera_id}")
        while is_running:
            try:
                message = await websocket.receive_json()
                print(f"Received message from frontend for camera {camera_id}: {message}")
                
                if message.get('action') == 'start_camera':
                    print(f"Received start_camera signal for camera {camera_id}")
                    break
                elif message.get('action') == 'stop_camera':
                    print(f"Received stop signal for camera {camera_id}")
                    is_running = False
                    return
                    
                await asyncio.sleep(0.1)
            except WebSocketDisconnect:
                print(f"WebSocket disconnected while waiting for start signal - camera {camera_id}")
                is_running = False
                return
            except Exception as e:
                print(f"Error waiting for start signal for camera {camera_id}: {str(e)}")
                continue

        if not is_running:
            return

        # Try to connect to a camera
        cap = await try_connect_camera(camera_id, websocket)
        if not cap:
            error_msg = "Failed to connect to any camera"
            print(error_msg)
            await websocket.send_json({
                "type": "error",
                "message": error_msg
            })
            # Update camera status to error
            supabase.table('water_level_cameras').update({
                'status': 'error',
                'updated_at': 'now()'
            }).eq('id', camera_id).execute()
            await websocket.close(code=1000, reason=error_msg)
            return
            
        # Update camera status to active
        supabase.table('water_level_cameras').update({
            'status': 'active',
            'updated_at': 'now()'
        }).eq('id', camera_id).execute()
            
        while is_running:
            try:
                # Check for stop signal from frontend
                try:
                    message = await websocket.receive_json()
                    if message.get('action') == 'stop_camera':
                        print(f"Received stop signal for camera {camera_id}")
                        is_running = False
                        break
                except Exception:
                    pass  # No message received, continue processing frames
                
                # Read frame
                ret, frame = cap.read()
                if not ret or frame is None:
                    print(f"Failed to read frame from camera {camera_id}")
                    await websocket.send_json({
                        "type": "error",
                        "message": "Failed to read frame from camera"
                    })
                    is_running = False
                    break
                    
                # Process frame
                water_level, processed_frame = detector.process_frame(frame)
                if water_level is None or processed_frame is None:
                    print(f"Failed to process frame for camera {camera_id}")
                    continue
                
                # Convert frame to base64
                try:
                    _, buffer = cv2.imencode('.jpg', processed_frame)
                    frame_base64 = base64.b64encode(buffer).decode('utf-8')
                except Exception as e:
                    print(f"Error encoding frame: {str(e)}")
                    continue
                
                # Send results
                try:
                    await websocket.send_json({
                        "type": "frame",
                        "frame": frame_base64,
                        "water_level": water_level,
                        "water_level_y": detector.get_water_level_y()
                    })
                except Exception as e:
                    print(f"Error sending frame: {str(e)}")
                    is_running = False
                    break
                
                # Update database every 5 seconds
                if water_level is not None:
                    await update_water_level(camera_id, water_level)
                
                # Add a small delay to control frame rate
                await asyncio.sleep(0.1)  # 10 FPS
                
            except WebSocketDisconnect:
                print(f"WebSocket disconnected for camera {camera_id}")
                is_running = False
                break
            except Exception as frame_error:
                print(f"Error processing frame for camera {camera_id}: {str(frame_error)}")
                await websocket.send_json({
                    "type": "error",
                    "message": str(frame_error)
                })
                is_running = False
                break
            
    except WebSocketDisconnect:
        print(f"Client disconnected: {camera_id}")
    except Exception as e:
        print(f"Error in WebSocket connection: {str(e)}")
        try:
            await websocket.send_json({
                "type": "error",
                "message": str(e)
            })
        except:
            pass
    finally:
        # Cleanup
        print(f"Starting cleanup for camera {camera_id}")
        if camera_id in connections:
            del connections[camera_id]
        if camera_id in detectors:
            del detectors[camera_id]
        if cap:
            cap.release()
        # Update camera status to inactive
        try:
            supabase.table('water_level_cameras').update({
                'status': 'inactive',
                'updated_at': 'now()'
            }).eq('id', camera_id).execute()
        except Exception as e:
            print(f"Error updating camera status: {str(e)}")
        print(f"Cleaned up resources for camera {camera_id}") 