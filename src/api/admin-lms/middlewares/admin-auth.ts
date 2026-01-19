import jwt from 'jsonwebtoken';

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

    const parts = authorization.split(' ');
    if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
      return ctx.unauthorized('Invalid authorization format');
    }

    const token = parts[1];

    try {
      // Get admin JWT secret from config
      const adminJwtSecret = strapi.config.get('admin.auth.secret') || process.env.ADMIN_JWT_SECRET;
      
      if (!adminJwtSecret) {
        console.error('Admin JWT secret not configured');
        return ctx.unauthorized('Server configuration error');
      }

      // Verify the token
      const decoded = jwt.verify(token, adminJwtSecret) as any;
      
      // Strapi v5 admin tokens have userId and sessionId
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

      // Strapi v4 style tokens have id
      if (decoded && decoded.id) {
        const admin = await strapi.query('admin::user').findOne({
          where: { id: decoded.id },
        });

        if (admin && admin.isActive) {
          ctx.state.admin = admin;
          ctx.state.isAdmin = true;
          return next();
        }
      }

      return ctx.unauthorized('Invalid admin token');
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        return ctx.unauthorized('Token expired');
      }
      console.error('Admin auth error:', error.message);
      return ctx.unauthorized('Invalid or expired token');
    }
  };
};
