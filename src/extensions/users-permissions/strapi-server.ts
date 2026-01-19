// Extend the users-permissions plugin to:
// 1. Create user profile on registration
// 2. Add refresh token endpoint

export default (plugin) => {
  // Extend register controller to create user profile
  const originalRegister = plugin.controllers.auth.register;

  plugin.controllers.auth.register = async (ctx) => {
    await originalRegister(ctx);

    if (ctx.response.status === 200 && ctx.response.body?.user?.id) {
      const userId = ctx.response.body.user.id;

      try {
        await strapi.documents('api::user-profile.user-profile').create({
          data: {
            user: userId,
            firstName: ctx.request.body.firstName || '',
            lastName: ctx.request.body.lastName || '',
            displayName: ctx.request.body.username,
          },
        });
      } catch (error) {
        strapi.log.error('Failed to create user profile:', error);
      }
    }
  };

  // Add refresh token endpoint
  plugin.controllers.auth.refreshToken = async (ctx) => {
    const { token } = ctx.request.body;

    if (!token) {
      return ctx.badRequest('Token is required');
    }

    try {
      // Verify the current token (even if expired, we can still decode it)
      const jwtService = strapi.plugin('users-permissions').service('jwt');
      let decoded;
      
      try {
        decoded = await jwtService.verify(token);
      } catch (error: any) {
        // If token is expired, try to decode without verification
        if (error.name === 'TokenExpiredError') {
          const jwt = require('jsonwebtoken');
          decoded = jwt.decode(token);
        } else {
          return ctx.unauthorized('Invalid token');
        }
      }

      if (!decoded || !decoded.id) {
        return ctx.unauthorized('Invalid token payload');
      }

      // Find the user
      const user = await strapi.query('plugin::users-permissions.user').findOne({
        where: { id: decoded.id },
        populate: ['role'],
      });

      if (!user || user.blocked) {
        return ctx.unauthorized('User not found or blocked');
      }

      // Issue new token
      const newToken = jwtService.issue({ id: user.id });

      return {
        jwt: newToken,
        user: {
          id: user.id,
          documentId: user.documentId,
          username: user.username,
          email: user.email,
          confirmed: user.confirmed,
          role: user.role,
        },
      };
    } catch (error) {
      strapi.log.error('Token refresh failed:', error);
      return ctx.unauthorized('Token refresh failed');
    }
  };

  // Add route for refresh token
  plugin.routes['content-api'].routes.push({
    method: 'POST',
    path: '/auth/refresh-token',
    handler: 'auth.refreshToken',
    config: {
      prefix: '',
      policies: [],
    },
  });

  return plugin;
};
