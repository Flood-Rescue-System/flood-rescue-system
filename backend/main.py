from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import water_level

app = FastAPI(
    title="Flood Rescue System API",
    description="Backend API for water level monitoring system",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(water_level.router, prefix="/api")

@app.get("/")
async def root():
    return {"message": "Water Level Monitoring System API"} 