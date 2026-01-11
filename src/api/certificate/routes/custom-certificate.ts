export default {
  routes: [
    {
      method: 'GET',
      path: '/certificates/verify/:certificateNumber',
      handler: 'certificate.verify',
      config: {
        auth: false, // Public route for verification
        policies: [],
        middlewares: [],
      },
    },
  ],
};

