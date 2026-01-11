export default {
  routes: [
    {
      method: 'GET',
      path: '/instructor/dashboard',
      handler: 'instructor.getDashboard',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/instructor/courses',
      handler: 'instructor.createCourse',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'PUT',
      path: '/instructor/courses/:id',
      handler: 'instructor.updateCourse',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/instructor/courses/:id/students',
      handler: 'instructor.getCourseStudents',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/instructor/courses/:id/analytics',
      handler: 'instructor.getCourseAnalytics',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/instructor/courses/:courseId/modules',
      handler: 'instructor.addModule',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/instructor/modules/:moduleId/lessons',
      handler: 'instructor.addLesson',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/instructor/courses/:courseId/quizzes',
      handler: 'instructor.createQuiz',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/instructor/quizzes/:quizId/questions',
      handler: 'instructor.addQuestion',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/instructor/quizzes/:quizId/results',
      handler: 'instructor.getQuizResults',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/instructor/courses/:courseId/invites',
      handler: 'instructor.createInvite',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};

