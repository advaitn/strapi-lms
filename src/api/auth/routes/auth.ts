export default {
  routes: [
    {
      method: 'POST',
      path: '/auth/refresh-token',
      handler: 'auth.refreshToken',
      config: {
        auth: false, // No auth required - we validate the token in the controller
        policies: [],
        middlewares: [],
      },
    },
  ],
};
