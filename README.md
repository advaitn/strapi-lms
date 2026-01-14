# 🎓 Strapi LMS - Complete Learning Management System

A production-ready, headless LMS backend built with **Strapi v5**. This project provides all the APIs needed to build a complete e-learning platform with courses, modules, lessons, quizzes, enrollments, progress tracking, and certificates.

![Strapi v5](https://img.shields.io/badge/Strapi-v5-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Node](https://img.shields.io/badge/node-%3E%3D18-brightgreen)

## ✨ Features

### 👥 User & Role Management
- **Admin** - Full system control, user management, analytics
- **Instructor** - Course creation, student management, analytics
- **Student** - Course enrollment, progress tracking, certifications
- Custom user profiles with bio, avatar, social links

### 📚 Course Management
- Categories and tags for organization
- Rich course metadata (difficulty, duration, pricing)
- Visibility controls (public/private/draft)
- Self-enrollment or invite-only courses

### 📝 Content Management
- **Modules** - Organize courses into sections
- **Lessons** - Individual learning units with rich content
- **Content Items** - Support for:
  - 🎥 Videos (with external URLs or uploads)
  - 📄 PDFs and documents
  - 🖼️ Slides and presentations
  - 🎧 Audio content
  - 🔗 External links

### 📊 Assessments & Quizzes
- Multiple question types:
  - ✅ Multiple Choice (single/multiple answer)
  - ✅ True/False
  - ✅ Short Answer
- Auto-grading with configurable passing scores
- Multiple attempts with attempt tracking
- Time limits and shuffled questions
- Detailed explanations for answers

### 🎫 Enrollment & Access
- **Self-enrollment** - Open courses
- **Invite-based** - Private courses with invite codes
- **Manual enrollment** - Admin/instructor controlled
- Enrollment status tracking (active/completed/suspended)

### 📈 Progress Tracking & Reporting
- Lesson-level completion tracking
- Course progress percentage
- Quiz scores and attempt history
- Time spent tracking
- **Certificates** with unique verification codes
- Admin analytics and reports

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18
- npm or yarn
- SQLite (default) or PostgreSQL

### Installation

```bash
# Clone the repository
git clone https://github.com/advaitnandeshwar/strapi-lms.git
cd strapi-lms

# Install dependencies
npm install

# Start development server
npm run develop
```

Visit `http://localhost:1337/admin` to create your admin account.

### Environment Variables

Create a `.env` file in the root:

```env
# Server
HOST=0.0.0.0
PORT=1337

# Secrets (generate your own!)
APP_KEYS=key1,key2,key3,key4
API_TOKEN_SALT=your-api-token-salt
ADMIN_JWT_SECRET=your-admin-jwt-secret
TRANSFER_TOKEN_SALT=your-transfer-token-salt
JWT_SECRET=your-jwt-secret

# Database (SQLite - default)
DATABASE_CLIENT=sqlite
DATABASE_FILENAME=.tmp/data.db

# Database (PostgreSQL - production)
# DATABASE_CLIENT=postgres
# DATABASE_HOST=localhost
# DATABASE_PORT=5432
# DATABASE_NAME=strapi_lms
# DATABASE_USERNAME=strapi
# DATABASE_PASSWORD=your-password
# DATABASE_SSL=false
```

Generate secrets:
```bash
openssl rand -base64 32  # Run 4 times for APP_KEYS
openssl rand -base64 32  # For each *_SALT and *_SECRET
```

## 📁 Project Structure

```
strapi-lms/
├── config/                 # Strapi configuration
│   ├── database.ts        # Database config
│   ├── server.ts          # Server config
│   └── plugins.ts         # Plugin config
├── src/
│   ├── api/               # Content types & APIs
│   │   ├── category/      # Course categories
│   │   ├── tag/           # Course tags
│   │   ├── course/        # Main course entity
│   │   ├── module/        # Course modules
│   │   ├── lesson/        # Module lessons
│   │   ├── content-item/  # Lesson content
│   │   ├── quiz/          # Course quizzes
│   │   ├── question/      # Quiz questions
│   │   ├── enrollment/    # User enrollments
│   │   ├── progress/      # Progress tracking
│   │   ├── quiz-attempt/  # Quiz attempts
│   │   ├── certificate/   # Earned certificates
│   │   ├── user-profile/  # Extended user data
│   │   ├── invite/        # Course invites
│   │   ├── admin-lms/     # Admin-specific APIs
│   │   ├── instructor/    # Instructor APIs
│   │   └── student/       # Student APIs
│   ├── extensions/        # Plugin extensions
│   ├── seed.ts           # Database seeding
│   └── index.ts          # App entry point
├── LMS_API_Collection.postman_collection.json  # Postman collection
└── LMS_API_Environment.postman_environment.json # Postman environment
```

## 🔌 API Overview

### Public Endpoints (No Auth)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/categories` | GET | List all categories |
| `/api/courses` | GET | List published courses |
| `/api/tags` | GET | List all tags |
| `/api/certificates/verify/:code` | GET | Verify a certificate |

### Authentication
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/local` | POST | Login (email/password) |
| `/api/auth/local/register` | POST | Register new user |
| `/api/users/me` | GET | Get current user |

### Student Endpoints (Auth Required)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/student/dashboard` | GET | Student dashboard |
| `/api/student/enroll` | POST | Enroll in course |
| `/api/student/progress` | POST | Update progress |
| `/api/student/quiz/submit` | POST | Submit quiz |
| `/api/student/certificates` | GET | Get certificates |

### Instructor Endpoints (Auth Required)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/instructor/dashboard` | GET | Instructor dashboard |
| `/api/instructor/courses` | GET/POST | List/create courses |
| `/api/instructor/courses/:id` | PUT | Update course |
| `/api/instructor/courses/:id/students` | GET | List enrolled students |
| `/api/instructor/courses/:id/analytics` | GET | Course analytics |
| `/api/instructor/invite` | POST | Send course invite |

### Admin Endpoints (Admin Token Required)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/admin-lms/dashboard` | GET | Admin dashboard stats |
| `/api/admin-lms/users` | GET | List all users |
| `/api/admin-lms/users/role` | PUT | Update user role |
| `/api/admin-lms/enrollments` | GET | List all enrollments |
| `/api/admin-lms/enrollments/bulk` | POST | Bulk enroll users |
| `/api/admin-lms/reports` | GET | Generate reports |

## 📮 Postman Collection

Import the included Postman files for easy API testing:

1. Import `LMS_API_Collection.postman_collection.json`
2. Import `LMS_API_Environment.postman_environment.json`
3. Update environment variables with your credentials
4. Run "User Login" to auto-populate JWT token

The collection includes 70+ pre-configured requests with examples.

## 🌱 Seeding Data

The project includes a seed script that creates sample data:
- 5 categories
- 10 tags
- 5 users (2 instructors, 3 students)
- 5 courses with modules and lessons
- Quizzes with various question types
- Sample enrollments

Seed data is automatically created on first run. To reset:

```bash
# Delete the database and restart
rm -rf .tmp/data.db
npm run develop
```

## 🚀 Production Deployment

### Using PostgreSQL

1. Update `.env` with PostgreSQL credentials
2. Install the PostgreSQL client:
   ```bash
   npm install pg
   ```
3. Build and start:
   ```bash
   NODE_OPTIONS='--max-old-space-size=1536' npm run build
   npm run start
   ```

### Using PM2 (Recommended)

```bash
# Install PM2
npm install -g pm2

# Start with PM2
pm2 start npm --name "strapi-lms" -- run start

# Auto-restart on reboot
pm2 startup
pm2 save
```

### Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:1337;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### SSL with Let's Encrypt

```bash
sudo certbot --nginx -d your-domain.com
```

## 🔒 Security Notes

- Always generate unique secrets for production
- Keep `.env` file secure and never commit it
- Configure CORS in `config/middlewares.ts` for your frontend domain
- Use HTTPS in production
- Regularly update dependencies

## 📝 Content Gating

By default, course content is gated:
- **Public**: Categories, courses (metadata), tags, certificate verification
- **Authenticated**: Modules, lessons, quizzes, questions, enrollments

Configure permissions in Strapi Admin → Settings → Roles.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - feel free to use this for your own projects!

## 📚 Resources

- [Strapi Documentation](https://docs.strapi.io)
- [Strapi v5 Migration Guide](https://docs.strapi.io/dev-docs/migration)
- [Strapi Discord](https://discord.strapi.io)

---

Built with ❤️ using [Strapi](https://strapi.io)
