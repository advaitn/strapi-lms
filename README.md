# 🎓 Strapi LMS - Complete Learning Management System

A production-ready, headless LMS backend built with **Strapi v5**. Provides all APIs for building a complete e-learning platform.

**Live Server**: `https://backend.cliniclaunchacademy.com`

![Strapi v5](https://img.shields.io/badge/Strapi-v5-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Node](https://img.shields.io/badge/node-%3E%3D18-brightgreen)

---

## 🔐 Authentication

### Two Token Types

| Type | Obtain From | Use For |
|------|-------------|---------|
| **Admin Token** | `POST /admin/login` | Admin panel operations, instructor/admin APIs |
| **User JWT** | `POST /api/auth/local` | Student APIs, user profile |

### Get Admin Token
```bash
curl -X POST https://backend.cliniclaunchacademy.com/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"YourPassword"}'
```
Response:
```json
{
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": { "id": 1, "email": "admin@example.com", ... }
  }
}
```

### Get User Token
```bash
curl -X POST https://backend.cliniclaunchacademy.com/api/auth/local \
  -H "Content-Type: application/json" \
  -d '{"identifier":"user@example.com","password":"Password123!"}'
```
Response:
```json
{
  "jwt": "eyJhbGciOiJIUzI1NiIs...",
  "user": { "id": 1, "username": "user", "email": "user@example.com", ... }
}
```

### Register New User
```bash
curl -X POST https://backend.cliniclaunchacademy.com/api/auth/local/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newuser",
    "email": "newuser@example.com",
    "password": "Password123!"
  }'
```

---

## 📚 API Reference

### Public Endpoints (No Auth Required)

#### Get Courses
```bash
GET /api/courses
GET /api/courses?populate=thumbnail,category,instructor
GET /api/courses?pagination[pageSize]=10&pagination[page]=1
GET /api/courses?filters[difficulty]=beginner
GET /api/courses?sort=title:asc
```
Response:
```json
{
  "data": [
    {
      "id": 1,
      "documentId": "abc123",
      "title": "Complete JavaScript Mastery",
      "slug": "complete-javascript-mastery",
      "description": "<p>Master JavaScript...</p>",
      "shortDescription": "Become a JS expert",
      "difficulty": "beginner",
      "duration": 2400,
      "visibility": "public",
      "status": "published",
      "price": 49.99,
      "isFree": false,
      "thumbnail": { "url": "/uploads/thumb.jpg" },
      "category": { "id": 1, "name": "Web Development" },
      "instructor": { "id": 1, "username": "john_instructor" }
    }
  ],
  "meta": {
    "pagination": { "page": 1, "pageSize": 25, "total": 5, "pageCount": 1 }
  }
}
```

#### Get Course by Slug
```bash
GET /api/courses/slug/complete-javascript-mastery?populate=category,modules,instructor
```

#### Get Categories
```bash
GET /api/categories
GET /api/categories?populate=icon,courses
```

#### Verify Certificate
```bash
GET /api/certificates/verify/CERT-ABC123
```

---

### Authenticated Endpoints (User Token Required)

#### Get Modules
```bash
GET /api/modules?populate=thumbnail,course,lessons
GET /api/modules?filters[course][documentId]=abc123&sort=sortOrder:asc
```
Response:
```json
{
  "data": [
    {
      "id": 1,
      "documentId": "mod123",
      "title": "Getting Started",
      "description": "Introduction to the course",
      "sortOrder": 1,
      "duration": 600,
      "thumbnail": { "url": "/uploads/module1.jpg" },
      "lessons": [...]
    }
  ]
}
```

#### Get Lessons
```bash
GET /api/lessons?populate=featuredImage,module,contentItems,quiz
GET /api/lessons?filters[module][documentId]=mod123&sort=sortOrder:asc
```

#### Get Quizzes
```bash
GET /api/quizzes?populate=coverImage,course,questions
```

#### Get Enrollments
```bash
GET /api/enrollments?populate=user,course
```

---

### Student APIs (User Token Required)

#### Student Dashboard
```bash
GET /api/student/dashboard
Authorization: Bearer USER_JWT
```
Response:
```json
{
  "data": {
    "totalEnrollments": 3,
    "inProgressCount": 2,
    "completedCount": 1,
    "certificates": 1,
    "enrollments": [...],
    "recentCertificates": [...]
  }
}
```

#### Enroll in Course
```bash
POST /api/student/enroll
Authorization: Bearer USER_JWT
Content-Type: application/json

{
  "data": { "courseId": "abc123" }
}
```

#### Enroll with Invite Code
```bash
POST /api/student/enroll-with-invite
Authorization: Bearer USER_JWT
Content-Type: application/json

{
  "data": { "code": "INV-ABC123" }
}
```

#### Complete Lesson
```bash
POST /api/student/complete-lesson
Authorization: Bearer USER_JWT
Content-Type: application/json

{
  "data": {
    "lessonId": "lesson123",
    "enrollmentId": "enroll123"
  }
}
```

#### Submit Quiz
```bash
POST /api/student/quiz/submit
Authorization: Bearer USER_JWT
Content-Type: application/json

{
  "data": {
    "quizId": "quiz123",
    "answers": [
      { "questionId": "q1", "answer": "A" },
      { "questionId": "q2", "answer": ["B", "C"] },
      { "questionId": "q3", "answer": "Paris" }
    ]
  }
}
```
Response:
```json
{
  "data": {
    "score": 80,
    "totalPoints": 100,
    "percentageScore": 80,
    "passed": true,
    "passingScore": 70,
    "results": [...]
  }
}
```

#### Get My Certificates
```bash
GET /api/student/certificates
Authorization: Bearer USER_JWT
```

#### Get/Update Profile
```bash
GET /api/student/profile
PUT /api/student/profile
Authorization: Bearer USER_JWT
Content-Type: application/json

{
  "data": {
    "firstName": "John",
    "lastName": "Doe",
    "bio": "Software developer"
  }
}
```

---

### Instructor APIs (Admin Token Required)

#### Instructor Dashboard
```bash
GET /api/instructor/dashboard
Authorization: Bearer ADMIN_TOKEN
```
Response:
```json
{
  "data": {
    "totalCourses": 5,
    "publishedCourses": 3,
    "draftCourses": 2,
    "totalStudents": 150,
    "totalCompletions": 45,
    "completionRate": 30,
    "courses": [...]
  }
}
```

#### Create Course
```bash
POST /api/instructor/courses
Authorization: Bearer ADMIN_TOKEN
Content-Type: application/json

{
  "data": {
    "title": "New Course",
    "slug": "new-course",
    "description": "<p>Course description</p>",
    "shortDescription": "Short desc",
    "difficulty": "beginner",
    "visibility": "public",
    "status": "draft",
    "isFree": true,
    "price": 0,
    "duration": 3600,
    "category": "cat-documentId",
    "thumbnail": 1,
    "bannerImage": 2,
    "gallery": [3, 4, 5]
  }
}
```

#### Update Course
```bash
PUT /api/instructor/courses/:documentId
Authorization: Bearer ADMIN_TOKEN
Content-Type: application/json

{
  "data": {
    "title": "Updated Title",
    "status": "published"
  }
}
```

#### Add Module to Course
```bash
POST /api/instructor/courses/:courseId/modules
Authorization: Bearer ADMIN_TOKEN
Content-Type: application/json

{
  "data": {
    "title": "Module 1: Introduction",
    "description": "Getting started",
    "thumbnail": 6
  }
}
```

#### Add Lesson to Module
```bash
POST /api/instructor/modules/:moduleId/lessons
Authorization: Bearer ADMIN_TOKEN
Content-Type: application/json

{
  "data": {
    "title": "Lesson 1: Welcome",
    "description": "Welcome to the course",
    "content": "<p>Rich text content...</p>",
    "featuredImage": 7,
    "duration": 300,
    "isPreview": true
  }
}
```

#### Create Quiz
```bash
POST /api/instructor/courses/:courseId/quizzes
Authorization: Bearer ADMIN_TOKEN
Content-Type: application/json

{
  "data": {
    "title": "Module 1 Quiz",
    "description": "Test your knowledge",
    "passingScore": 70,
    "maxAttempts": 3,
    "timeLimit": 1800,
    "isTimed": true,
    "shuffleQuestions": true,
    "coverImage": 8
  }
}
```

#### Add Question to Quiz
```bash
POST /api/instructor/quizzes/:quizId/questions
Authorization: Bearer ADMIN_TOKEN
Content-Type: application/json

{
  "data": {
    "type": "multiple_choice",
    "text": "What is JavaScript?",
    "options": ["A programming language", "A coffee brand", "An island"],
    "correctAnswer": "A programming language",
    "points": 10,
    "explanation": "JavaScript is a programming language..."
  }
}
```

#### Create Invite Code
```bash
POST /api/instructor/courses/:courseId/invite
Authorization: Bearer ADMIN_TOKEN
Content-Type: application/json

{
  "data": {
    "email": "student@example.com",
    "maxUses": 1,
    "expiresAt": "2026-12-31T23:59:59Z",
    "message": "You're invited to join this course!"
  }
}
```

#### Get Course Students
```bash
GET /api/instructor/courses/:documentId/students
Authorization: Bearer ADMIN_TOKEN
```

#### Get Course Analytics
```bash
GET /api/instructor/courses/:documentId/analytics
Authorization: Bearer ADMIN_TOKEN
```
Response:
```json
{
  "data": {
    "totalStudents": 50,
    "activeStudents": 35,
    "completedStudents": 15,
    "avgProgress": 65,
    "totalQuizAttempts": 120,
    "avgQuizScore": 78
  }
}
```

---

### Admin APIs (Admin Token Required)

#### Admin Dashboard
```bash
GET /api/admin-lms/dashboard
Authorization: Bearer ADMIN_TOKEN
```
Response:
```json
{
  "data": {
    "totalUsers": 100,
    "totalCourses": 10,
    "totalEnrollments": 250,
    "totalCompletions": 75,
    "completionRate": 30,
    "recentEnrollments": [...]
  }
}
```

#### List All Users
```bash
GET /api/admin-lms/users
GET /api/admin-lms/users?userType=instructor
GET /api/admin-lms/users?userType=student
Authorization: Bearer ADMIN_TOKEN
```
Response:
```json
{
  "data": [
    {
      "id": 1,
      "documentId": "user123",
      "username": "john_instructor",
      "email": "john@example.com",
      "isInstructor": true,
      "isAdmin": false,
      "userType": "instructor",
      "profile": {
        "firstName": "John",
        "lastName": "Doe",
        "isInstructor": true
      }
    }
  ],
  "meta": {
    "pagination": {...},
    "summary": {
      "totalUsers": 100,
      "instructors": 5,
      "students": 95
    }
  }
}
```

#### List All Enrollments
```bash
GET /api/admin-lms/enrollments
GET /api/admin-lms/enrollments?status=active
GET /api/admin-lms/enrollments?courseId=abc123
Authorization: Bearer ADMIN_TOKEN
```

#### List All Certificates
```bash
GET /api/admin-lms/certificates
Authorization: Bearer ADMIN_TOKEN
```

---

## 📤 Image Upload

### Step 1: Upload Image
```bash
POST /api/upload
Authorization: Bearer TOKEN
Content-Type: multipart/form-data

files: @image.jpg
```
Response:
```json
[
  {
    "id": 1,
    "name": "image.jpg",
    "url": "/uploads/image_abc123.jpg",
    "mime": "image/jpeg",
    "size": 102400
  }
]
```

### Step 2: Use Image ID
```bash
POST /api/instructor/courses
Authorization: Bearer ADMIN_TOKEN
Content-Type: application/json

{
  "data": {
    "title": "My Course",
    "thumbnail": 1,
    "bannerImage": 2,
    "gallery": [3, 4, 5]
  }
}
```

### Image Fields by Content Type

| Content Type | Fields | Type |
|-------------|--------|------|
| **Course** | `thumbnail`, `bannerImage`, `previewVideo` | Single |
| **Course** | `gallery` | Multiple |
| **Module** | `thumbnail` | Single |
| **Lesson** | `featuredImage` | Single |
| **Quiz** | `coverImage` | Single |
| **Certificate** | `badgeImage`, `pdfFile` | Single |
| **Category** | `icon` | Single |
| **User Profile** | `avatar` | Single |

---

## 🔧 Query Parameters

### Pagination
```
?pagination[page]=1&pagination[pageSize]=25
```

### Filtering
```
?filters[difficulty]=beginner
?filters[price][$gte]=10
?filters[title][$contains]=JavaScript
?filters[category][slug]=web-development
```

### Sorting
```
?sort=title:asc
?sort=createdAt:desc
?sort=price:asc,title:desc
```

### Population
```
?populate=thumbnail,category
?populate=thumbnail,category,instructor,modules
```

---

## 🚀 Quick Start

```bash
# Clone
git clone https://github.com/advaitn/strapi-lms.git
cd strapi-lms

# Install
npm install

# Run (with seed data)
SEED_DATA=true npm run develop

# Access admin panel
open http://localhost:1337/admin
```

### Test Credentials (after seeding)
- **Instructors**: `john@example.com` / `Password123!`
- **Students**: `mike@example.com` / `Password123!`

---

## 📦 Postman Collection

Import the included files:
1. `LMS_API_Collection.postman_collection.json`
2. `LMS_API_Environment.postman_environment.json`

Set your `baseUrl` and tokens in the environment.

---

## 🔒 Permissions Summary

| Role | Can Access |
|------|------------|
| **Public** | Courses, categories, certificate verification |
| **Authenticated** | Modules, lessons, quizzes, questions, enrollments, upload |
| **Admin Token** | All instructor & admin APIs |

---

## 📄 License

MIT License - feel free to use for your projects!

Built with ❤️ using [Strapi](https://strapi.io)
