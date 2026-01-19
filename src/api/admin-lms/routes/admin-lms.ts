const adminAuthConfig = {
  auth: false, // Disable default users-permissions auth
  policies: [],
  middlewares: ['api::admin-lms.admin-auth'],
};

export default {
  routes: [
    {
      method: 'GET',
      path: '/admin-lms/dashboard',
      handler: 'admin-lms.getDashboardStats',
      config: adminAuthConfig,
    },
    {
      method: 'GET',
      path: '/admin-lms/users',
      handler: 'admin-lms.getAllUsers',
      config: adminAuthConfig,
    },
    {
      method: 'POST',
      path: '/admin-lms/bulk-enroll',
      handler: 'admin-lms.bulkEnroll',
      config: adminAuthConfig,
    },
    {
      method: 'PUT',
      path: '/admin-lms/users/:id/role',
      handler: 'admin-lms.updateUserRole',
      config: adminAuthConfig,
    },
    {
      method: 'GET',
      path: '/admin-lms/enrollments',
      handler: 'admin-lms.getAllEnrollments',
      config: adminAuthConfig,
    },
    {
      method: 'GET',
      path: '/admin-lms/courses/:id/analytics',
      handler: 'admin-lms.getCourseAnalytics',
      config: adminAuthConfig,
    },
    {
      method: 'GET',
      path: '/admin-lms/certificates',
      handler: 'admin-lms.getAllCertificates',
      config: adminAuthConfig,
    },
    {
      method: 'POST',
      path: '/admin-lms/certificates/:id/revoke',
      handler: 'admin-lms.revokeCertificate',
      config: adminAuthConfig,
    },
    {
      method: 'GET',
      path: '/admin-lms/reports',
      handler: 'admin-lms.getReports',
      config: adminAuthConfig,
    },
  ],
};
