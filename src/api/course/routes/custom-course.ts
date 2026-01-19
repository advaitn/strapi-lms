export default {
  routes: [
    {
      method: 'GET',
      path: '/courses/slug/:slug',
      handler: 'course.findBySlug',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/courses/me/instructor',
      handler: 'course.myInstructorCourses',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/courses/me/enrolled',
      handler: 'course.myEnrolledCourses',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/courses/:id/content',
      handler: 'course.getCourseContent',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};

