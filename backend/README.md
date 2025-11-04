# Smart Irrigation Assistant - Backend

[![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-green.svg)](https://fastapi.tiangolo.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-blue.svg)](https://postgresql.org)
[![Redis](https://img.shields.io/badge/Redis-7+-red.svg)](https://redis.io)

A Python backend for Smart Irrigation Assistant that provides AI-powered irrigation guidance to African smallholder farmers through SMS, USSD, and Web interfaces.

## 🌟 Features

- **AI-Powered Recommendations**: Intelligent irrigation scheduling using OpenAI, Cohere, or Gemini APIs
- **Multi-Channel Notifications**: SMS (Africa's Talking, Twilio), Email (SMTP, SendGrid)
- **Weather Integration**: Real-time weather data from OpenWeatherMap
- **Multi-Language Support**: English, Swahili, Kinyarwanda
- **RESTful API**: Complete REST API with FastAPI and automatic documentation
- **Background Tasks**: Celery-based task queue for scheduling and notifications
- **Rate Limiting**: Protection against API abuse
- **Comprehensive Testing**: Unit and integration tests with 80%+ coverage

## 🏗️ Architecture

```
├── app/
│   ├── api/                    # API routes and endpoints
│   │   └── endpoints/          # Individual endpoint modules
│   ├── core/                   # Core configuration and utilities
│   ├── models/                 # SQLAlchemy database models
│   ├── schemas/                # Pydantic schemas for validation
│   ├── services/               # Business logic services
│   └── utils/                  # Utility functions and middleware
├── alembic/                    # Database migrations
├── tests/                      # Test suite
├── docker-compose.yml          # Docker orchestration
├── Dockerfile                  # Container definition
└── requirements.txt            # Python dependencies
```

## 🚀 Quick Start

### Prerequisites

- Python 3.11+
- PostgreSQL 15+
- Redis 7+
- Docker & Docker Compose (optional)

### 1. Automated Setup (Recommended)

```bash
# Clone the repository
git clone <your-repo-url>
cd backend

# Make setup script executable and run
chmod +x setup.sh
./setup.sh
```

### 2. Manual Setup

```bash
# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment configuration
cp .env.example .env

# Edit .env with your configurations
nano .env

# Start services (using Docker)
docker-compose up -d db redis

# Run database migrations
alembic upgrade head

# Start the application
python main.py
```

### 3. Docker Setup (Production-Ready)

```bash
# Start all services
docker-compose up -d

# Check service health
docker-compose ps

# View logs
docker-compose logs -f web
```

## ⚙️ Configuration

Edit the `.env` file with your specific configurations:

### Database
```env
DATABASE_URL=postgresql://user:password@localhost:5432/smart_irrigation_db
```

### Authentication
```env
JWT_SECRET=your_super_secret_jwt_key_here_change_in_production
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

### Weather API
```env
OPENWEATHER_API_KEY=your_openweather_api_key_here
```

### AI APIs (Choose one or more)
```env
# OpenAI
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-3.5-turbo

# Cohere (alternative)
COHERE_API_KEY=your_cohere_api_key_here

# Gemini (alternative)
GEMINI_API_KEY=your_gemini_api_key_here
```

### SMS Services
```env
# Africa's Talking (Primary)
AFRICAS_TALKING_API_KEY=your_africas_talking_api_key
AFRICAS_TALKING_USERNAME=your_africas_talking_username

# Twilio (Fallback)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number
```

### Email Services
```env
# SMTP (Primary)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password

# SendGrid (Alternative)
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
```

### Redis
```env
REDIS_URL=redis://localhost:6379/0
```

## 📖 API Documentation

Once the server is running, visit:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI Schema**: http://localhost:8000/openapi.json

### Key Endpoints

#### Authentication
- `POST /api/auth/register` - Register new farmer
- `POST /api/auth/login` - Login farmer
- `POST /api/auth/verify-phone` - Verify phone with OTP

#### Farm Management
- `GET /api/farms/` - Get all farms
- `POST /api/farms/` - Create new farm
- `GET /api/farms/{farm_id}` - Get specific farm
- `PUT /api/farms/{farm_id}` - Update farm
- `DELETE /api/farms/{farm_id}` - Delete farm

#### Irrigation
- `POST /api/irrigation/generate` - Generate AI irrigation schedule
- `GET /api/irrigation/schedule/{farm_id}` - Get irrigation schedule
- `GET /api/irrigation/history/{farm_id}` - Get irrigation history

#### Weather
- `GET /api/weather/current/{farm_id}` - Current weather for farm
- `GET /api/weather/forecast/{farm_id}` - 7-day forecast for farm

#### Notifications
- `POST /api/notifications/send-sms` - Send SMS notification
- `POST /api/notifications/send-email` - Send email notification
- `GET /api/notifications/history` - Get notification history

#### Admin
- `GET /api/admin/stats` - System usage statistics
- `GET /api/admin/farmers` - All farmers (paginated)
- `GET /api/admin/reports` - Usage reports

## 🧪 Testing

### Run Tests
```bash
# Run all tests
chmod +x run_tests.sh
./run_tests.sh

# Or manually
pytest tests/ -v --cov=app --cov-report=html
```

### Test Coverage
The test suite includes:
- Unit tests for all services
- Integration tests for API endpoints
- Mock external API calls
- Multi-language support testing

View coverage report: `open htmlcov/index.html`

## 🔄 Database Migrations

### Create Migration
```bash
alembic revision --autogenerate -m "Description of changes"
```

### Apply Migrations
```bash
alembic upgrade head
```

### Rollback Migration
```bash
alembic downgrade -1
```

## 🚀 Background Tasks

The application uses Celery for background tasks:

### Start Celery Worker
```bash
celery -A app.utils.scheduler worker --loglevel=info
```

### Start Celery Beat (Scheduler)
```bash
celery -A app.utils.scheduler beat --loglevel=info
```

### Scheduled Tasks
- **Daily Irrigation Reminders**: Sends SMS/email reminders 24 hours before scheduled irrigation
- **Data Cleanup**: Removes old notification logs and completed schedules

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt for secure password storage
- **Rate Limiting**: 100 requests/hour per IP
- **Input Validation**: Pydantic schemas for all inputs
- **CORS Protection**: Configurable CORS origins
- **Security Headers**: X-Frame-Options, X-Content-Type-Options, etc.

## 📊 Monitoring & Logging

### Health Check
```bash
curl http://localhost:8000/health
```

### Application Logs
```bash
# Docker logs
docker-compose logs -f web

# Celery logs
docker-compose logs -f celery_worker
docker-compose logs -f celery_beat
```

### System Statistics
Access `/api/admin/stats` for:
- Total farmers and farms
- Active irrigation schedules
- Notifications sent
- Registration trends

## 🌍 Deployment

### Production Checklist

1. **Environment Variables**
   - Set `DEBUG=False`
   - Use strong `JWT_SECRET`
   - Configure production database
   - Set up SSL certificates

2. **Database**
   - Use managed PostgreSQL service
   - Set up automated backups
   - Configure connection pooling

3. **Caching**
   - Use managed Redis service
   - Configure appropriate cache timeouts

4. **Security**
   - Enable HTTPS
   - Configure firewall rules
   - Set up monitoring

5. **Scaling**
   - Use multiple worker processes
   - Set up load balancer
   - Monitor resource usage

### Docker Production Deployment

```bash
# Production docker-compose
docker-compose -f docker-compose.prod.yml up -d

# With SSL
docker-compose -f docker-compose.prod.yml -f docker-compose.ssl.yml up -d
```

### Manual Deployment

```bash
# Install production dependencies
pip install gunicorn

# Run with Gunicorn
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests: `./run_tests.sh`
5. Commit changes: `git commit -m 'Add amazing feature'`
6. Push to branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the API documentation at `/docs`
- Review the test cases for usage examples

## 🙏 Acknowledgments

- **FastAPI** for the excellent web framework
- **OpenWeatherMap** for weather data
- **Africa's Talking** for SMS services in Africa
- **OpenAI** for AI-powered recommendations
- All contributors and supporters of this project

---

**Built with ❤️ for African farmers** 🌾
