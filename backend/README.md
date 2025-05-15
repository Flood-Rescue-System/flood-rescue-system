# Water Level Monitoring Backend

This is the backend service for the water level monitoring system, built with FastAPI and OpenCV.

## Setup Instructions

1. Create a virtual environment:

```bash
python -m venv venv
```

2. Activate the virtual environment:

- Windows:

```bash
.\venv\Scripts\activate
```

- Linux/Mac:

```bash
source venv/bin/activate
```

3. Install dependencies:

```bash
pip install -r requirements.txt
```

4. Set up environment variables:

```bash
cp .env.example .env
```

Then edit `.env` with your actual Supabase credentials.

5. Run the server:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## API Documentation

Once the server is running, visit:

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Features

- Real-time water level detection using OpenCV
- WebSocket streaming for live camera feed
- Supabase integration for data persistence
- ROI selection for water level measurement
- Automatic calibration and measurement

## Project Structure

```
backend/
├── main.py              # FastAPI application entry point
├── database.py          # Database configuration
├── requirements.txt     # Project dependencies
├── .env                 # Environment variables (create from .env.example)
├── routers/
│   └── water_level.py  # Water level endpoints
└── services/
    └── water_detection.py  # Water level detection logic
```
