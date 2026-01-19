import type { Core } from '@strapi/strapi';
import jwt from 'jsonwebtoken';

const controller = ({ strapi }: { strapi: Core.Strapi }) => ({
  /**
   * Refresh an expired or valid JWT token
   */
  async refreshToken(ctx) {
    const { token } = ctx.request.body;

    if (!token) {
      return ctx.badRequest('Token is required');
    }

    try {
      const jwtService = strapi.plugin('users-permissions').service('jwt');
      const jwtSecret = strapi.config.get('plugin::users-permissions.jwtSecret');
      
      let decoded: any;
      
      // Try to verify normally first
      try {
        decoded = await jwtService.verify(token);
      } catch (error: any) {
        // If expired, decode without verification to get user ID
        if (error.name === 'TokenExpiredError') {
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

      if (!user) {
        return ctx.unauthorized('User not found');
      }

      if (user.blocked) {
        return ctx.unauthorized('User is blocked');
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
          role: user.role ? {
            id: user.role.id,
            name: user.role.name,
            type: user.role.type,
          } : null,
        },
      };
    } catch (error) {
      strapi.log.error('Token refresh failed:', error);
      return ctx.unauthorized('Token refresh failed');
    }
  },
});

export default controller;
