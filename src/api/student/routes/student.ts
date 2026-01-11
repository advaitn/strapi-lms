export default {
  routes: [
    {
      method: 'GET',
      path: '/student/dashboard',
      handler: 'student.getDashboard',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/student/courses',
      handler: 'student.browseCourses',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/student/courses/:courseId/enroll',
      handler: 'student.enrollInCourse',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/student/enroll-with-invite',
      handler: 'student.enrollWithInvite',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/student/courses/:courseId/progress',
      handler: 'student.getCourseProgress',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/student/lessons/:lessonId/complete',
      handler: 'student.completeLesson',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/student/quizzes/:quizId/start',
      handler: 'student.startQuiz',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/student/quiz-attempts/:attemptId/submit',
      handler: 'student.submitQuiz',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/student/certificates',
      handler: 'student.getMyCertificates',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/student/profile',
      handler: 'student.getProfile',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'PUT',
      path: '/student/profile',
      handler: 'student.updateProfile',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};

