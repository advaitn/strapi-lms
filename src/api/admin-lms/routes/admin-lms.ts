export default {
  routes: [
    {
      method: 'GET',
      path: '/admin-lms/dashboard',
      handler: 'admin-lms.getDashboardStats',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/admin-lms/users',
      handler: 'admin-lms.getAllUsers',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/admin-lms/bulk-enroll',
      handler: 'admin-lms.bulkEnroll',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'PUT',
      path: '/admin-lms/users/:id/role',
      handler: 'admin-lms.updateUserRole',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/admin-lms/enrollments',
      handler: 'admin-lms.getAllEnrollments',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/admin-lms/courses/:id/analytics',
      handler: 'admin-lms.getCourseAnalytics',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/admin-lms/certificates',
      handler: 'admin-lms.getAllCertificates',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/admin-lms/certificates/:id/revoke',
      handler: 'admin-lms.revokeCertificate',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/admin-lms/reports',
      handler: 'admin-lms.getReports',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};

