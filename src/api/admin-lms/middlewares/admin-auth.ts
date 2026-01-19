/**
 * Middleware to authenticate admin panel tokens for API routes
 * Supports Strapi v5 admin session tokens
 */
export default (config, { strapi }) => {
  return async (ctx, next) => {
    const authorization = ctx.request.header.authorization;

    if (!authorization) {
      return ctx.unauthorized('Missing authorization header');
    }

    const [scheme, token] = authorization.split(' ');

    if (scheme.toLowerCase() !== 'bearer' || !token) {
      return ctx.unauthorized('Invalid authorization format');
    }

    try {
      // Get the admin auth service
      const adminAuthService = strapi.service('admin::auth');
      
      // Verify the token and get the user
      const { authenticated, credentials } = await adminAuthService.verify(ctx, {
        token,
      });

      if (authenticated && credentials) {
        ctx.state.admin = credentials;
        ctx.state.isAdmin = true;
        return next();
      }

      // Fallback: try to decode and verify manually
      const jwt = require('jsonwebtoken');
      const { ADMIN_JWT_SECRET } = process.env;
      
      if (ADMIN_JWT_SECRET) {
        const decoded = jwt.verify(token, ADMIN_JWT_SECRET) as any;
        
        if (decoded && decoded.userId) {
          const admin = await strapi.query('admin::user').findOne({
            where: { id: decoded.userId },
          });

          if (admin && admin.isActive) {
            ctx.state.admin = admin;
            ctx.state.isAdmin = true;
            return next();
          }
        }
      }

      return ctx.unauthorized('Invalid admin token');
    } catch (error) {
      console.error('Admin auth error:', error.message);
      return ctx.unauthorized('Invalid or expired token');
    }
  };
};
