# Flood Rescue System

A comprehensive web-based platform designed to enhance flood disaster management and rescue operations. This system integrates real-time water level monitoring, rescue team coordination, and public emergency response capabilities.

## 🌊 Key Features

- **Real-time Water Level Monitoring**

  - AI-powered camera feeds for water level detection
  - Automated alerts and notifications
  - Historical water level data analysis

- **Rescue Team Management**

  - Team assignment and coordination
  - Real-time location tracking
  - Emergency response prioritization
  - Resource allocation management

- **Public Interface**

  - Emergency SOS system
  - Real-time flood updates
  - Evacuation route guidance
  - Relief camp information

- **Administrative Dashboard**
  - Centralized monitoring system
  - Resource management
  - Team deployment coordination
  - Analytics and reporting

## 🛠️ Technology Stack

- **Frontend**

  - Next.js 14 (React)
  - TypeScript
  - Tailwind CSS
  - Leaflet Maps

- **Backend**

  - FastAPI (Python)
  - OpenCV for image processing
  - Machine Learning models for water detection

- **Database & Authentication**
  - Supabase (PostgreSQL)
  - Row Level Security
  - Real-time subscriptions

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Python 3.9+
- Supabase account

### Installation

1. Clone the repository

```bash
git clone https://github.com/Flood-Rescue-System/flood-rescue-system.git
cd flood-rescue-system
```

2. Install frontend dependencies

```bash
npm install
```

3. Set up backend

```bash
cd backend
pip install -r requirements.txt
```

4. Configure environment variables

```bash
# Create .env file in root directory
cp .env.example .env
# Add your Supabase and other API keys
```

5. Run the development servers

```bash
# Frontend (in root directory)
npm run dev

# Backend (in backend directory)
uvicorn main:app --reload
```

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Feel free to submit a Pull Request.

## 👥 Team

- **S Sreeram** - Project Lead & Full Stack Developer
  - LinkedIn: [Sreeram S](https://www.linkedin.com/in/sreeram-s/)
- AI/ML Engineer
- UI/UX Designer
- Backend Developer

## 📞 Contact

For any queries regarding this project, please open an issue or contact us at floodrescuesystem@gmail.com
