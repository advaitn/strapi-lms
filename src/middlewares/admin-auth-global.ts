/**
 * Global middleware to accept admin tokens for all API routes.
 * Admin tokens take priority over users-permissions tokens.
 */

import type { Core } from '@strapi/strapi';

export default (config: any, { strapi }: { strapi: Core.Strapi }) => {
  return async (ctx: any, next: () => Promise<void>) => {
    const authHeader = ctx.request.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }
    
    const token = authHeader.split(' ')[1];
    
    // Skip if no token
    if (!token) {
      return next();
    }
    
    // Try to verify as admin token first
    try {
      const decodedToken = await strapi.admin.services.token.verify(token);
      
      if (decodedToken && decodedToken.userId) {
        // It's a valid admin token
        const adminUser = await strapi.admin.services.user.findOne(decodedToken.userId);
        
        if (adminUser) {
          // Set admin user in state - mark as admin for downstream use
          ctx.state.user = {
            id: adminUser.id,
            documentId: `admin-${adminUser.id}`,
            username: adminUser.firstname + ' ' + adminUser.lastname,
            email: adminUser.email,
            isAdmin: true,
            _isAdminToken: true,
          };
          ctx.state.isAdmin = true;
          
          // Continue to next middleware/controller
          return next();
        }
      }
    } catch (err) {
      // Not an admin token, let users-permissions handle it
    }
    
    // If not admin token, continue with normal flow (users-permissions will handle)
    return next();
  };
};
