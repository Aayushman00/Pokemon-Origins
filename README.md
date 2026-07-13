# Pokemon Origins

A full-stack Pokemon-themed application featuring a Pokedex, battle simulator, and trainer management system.

## Table of Contents
- [Project Overview](#project-overview)
- [Project Structure](#project-structure)
- [Technology Stack](#technology-stack)
- [Architecture Overview](#architecture-overview)
- [Setup Instructions](#setup-instructions)
- [API Endpoints](#api-endpoints)
- [Environment Variables](#environment-variables)
- [Contributing Guidelines](#contributing-guidelines)
- [License](#license)

## Project Overview

Pokemon Origins is a comprehensive Pokemon application built with:
- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Node.js + Express + MySQL
- **Battle Logic Service**: Python-based microservice for battle simulations

The application allows users to:
- Browse and search Pokemon in the Pokedex
- View detailed Pokemon information including stats, abilities, and evolutions
- Train and battle with Pokemon in a turn-based combat system
- Manage trainer accounts and progress

## Project Structure

```
Pokemon-Origins/
├── backend/
│   ├── config/               # Database configuration
│   ├── database/             # Database models
│   ├── routes/               # API route handlers
│   ├── utils/                # Utility functions
│   ├── .env                  # Environment variables
│   ├── index.js              # Express server entry point
│   ├── package.json          # Backend dependencies
│   └── server.js             # Alternative server entry
├── frontend/
│   ├── public/               # Static assets
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/            # Page-level components
│   │   ├── App.jsx           # Main app component
│   │   ├── index.css         # Global styles
│   │   └── main.jsx          # React entry point
│   ├── package.json          # Frontend dependencies
│   ├── vite.config.js        # Vite configuration
│   └── tailwind.config.js    # Tailwind CSS configuration
├── battle-logic-service/     # Python microservice for battles
│   ├── main.py               # Battle service entry point
│   ├── models.py             # Battle data models
│   ├── utils.py              # Utility functions
│   ├── requirements.txt      # Python dependencies
│   └── level1.py/level1.json # Battle level data
├── docker-compose.yml        # Container orchestration
├── backup_pokedex_trainer.sql # Database backup
└── README.md                 # This file
```

## Technology Stack

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: React Context API
- **Routing**: React Router v6
- **HTTP Client**: Fetch API

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MySQL 8
- **ORM**: Native MySQL2 connection pool
- **Middleware**: CORS, Cookie Parser, JSON body parser

### Battle Logic Service
- **Language**: Python 3.11
- **Framework**: Custom battle engine
- **Data Storage**: JSON files + MySQL (via backend API)
- **Dependencies**: Defined in requirements.txt

### DevOps
- **Containerization**: Docker & Docker Compose
- **Database**: MySQL (via Docker or local installation)

## Architecture Overview

```mermaid
graph TD
    A["Client Browser"] -->|"HTTP/HTTPS"| B["Load Balancer"]
    B --> C["Frontend<br/>(React/Vite)"]
    B --> D["Backend API<br/>(Node/Express)"]
    D --> E[("MySQL Database")]
    D --> F["Battle Logic Service<br/>(Python)"]
    F --> E

    style A fill:#f9f,stroke:#333
    style B fill:#ddd,stroke:#333
    style C fill:#bbf,stroke:#333
    style D fill:#bfb,stroke:#333
    style E fill:#fbb,stroke:#333
    style F fill:#ff9,stroke:#333
```

### Component Interactions
1. **Frontend** communicates with **Backend API** via RESTful endpoints
2. **Backend** handles:
   - User authentication & authorization
   - Pokemon data management (CRUD operations)
   - Trainer progression and inventory
   - Proxying battle requests to Battle Logic Service
3. **Battle Logic Service** handles:
   - Turn-based combat mechanics
   - Move effectiveness calculations
   - Status effect processing
   - Experience and reward calculation

## Setup Instructions

### Prerequisites
- Node.js (v18+)
- Python (3.11+)
- MySQL (8.0+) or Docker
- Git

### Option 1: Local Development

#### Backend Setup
```bash
cd backend
npm install
cp .env.example .env  # Edit .env with your database credentials
npm run dev           # Starts server on port 5000
```

#### Frontend Setup
```bash
cd frontend
npm install
npm run dev           # Starts Vite dev server on port 5173
```

#### Battle Logic Service Setup
```bash
cd battle-logic-service
pip install -r requirements.txt
python main.py        # Starts service on port 5001
```

### Option 2: Docker Deployment
```bash
docker-compose up --build
# Services will be available at:
# Frontend: http://localhost:5173
# Backend API: http://localhost:5000
# Battle Logic: http://localhost:5001
```

### Database Initialization
1. Create MySQL database named `pokedex`
2. Import schema: `mysql -u root -p pokedex < backup_pokedex_trainer.sql`
3. Ensure `.env` file contains correct database credentials

## API Endpoints

### Authentication
- `POST /api/register` - Register new trainer
- `POST /api/login` - Authenticate trainer
- `POST /api/validate` - Validate session token

### Pokemon Data
- `GET /api/pokemons` - Get all Pokemon with pagination
- `GET /api/pokemons/:id` - Get specific Pokemon details
- `GET /api/pokemon-types` - Get all Pokemon types
- `GET /api/pokemon-moves` - Get all moves
- `GET /api/pokemon-abilities` - Get all abilities

### Trainer Management
- `GET /api/trainer/:id` - Get trainer profile
- `PUT /api/trainer/:id` - Update trainer profile
- `GET /api/trainer/:id/pokemon` - Get trainer's Pokemon collection

### Battle System
- `POST /api/battle/start` - Initialize battle session
- `POST /api/battle/action` - Submit battle action
- `GET /api/battle/state` - Get current battle state
- `POST /api/battle/end` - Conclude battle

*Note: Battle logic service is called internally by the backend for combat calculations.*

## Environment Variables

### Backend (`.env`)
```
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=pokedex
DB_PORT=3306
CORS_ORIGIN=http://localhost:5173
JWT_SECRET=your_secret_key
```

### Frontend (`.env`)
```
VITE_API_URL=http://localhost:5000/api
VITE_BATTLE_URL=http://localhost:5001/battle
VITE_APP_NAME=Pokemon Origins
```

### Battle Logic Service (`.env` or environment)
```
HOST=0.0.0.0
PORT=5001
BACKEND_URL=http://localhost:5000/api
```

## Contributing Guidelines

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Standards
- Follow existing code style in each subsystem
- Write meaningful commit messages
- Add unit tests for new functionality
- Update documentation as needed
- Ensure linting passes before submitting PR

### Pull Request Process
1. Ensure CI passes (if applicable)
2. Request review from maintainers
3. Address review feedback
4. Maintainer merges PR

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Pokemon data sourced from [PokéAPI](https://pokeapi.co/)
- Inspired by various Pokemon fan projects
- Special thanks to the open-source community
