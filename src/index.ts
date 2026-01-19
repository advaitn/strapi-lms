import type { Core } from '@strapi/strapi';
import seedData from './seed';

export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   */
  register(/* { strapi }: { strapi: Core.Strapi } */) {},

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   */
  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    // Add middleware to accept admin tokens for all API routes
    // This runs early in the request lifecycle
    (strapi as any).server.app.use(async (ctx: any, next: () => Promise<void>) => {
      // Only process /api routes (not /admin routes)
      if (!ctx.request.path.startsWith('/api/')) {
        return next();
      }
      
      const authHeader = ctx.request.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next();
      }
      
      const token = authHeader.split(' ')[1];
      
      if (!token) {
        return next();
      }
      
      // Check if it's an admin token
      try {
        const decodedAdminToken = await strapi.admin.services.token.verify(token);
        
        if (decodedAdminToken && decodedAdminToken.userId) {
          const adminUser = await strapi.admin.services.user.findOne(decodedAdminToken.userId);
          
          if (adminUser) {
            // Set user in state so downstream auth sees it as authenticated
            ctx.state.user = {
              id: adminUser.id,
              documentId: `admin-${adminUser.id}`,
              username: `${adminUser.firstname} ${adminUser.lastname}`.trim(),
              email: adminUser.email,
              confirmed: true,
              blocked: false,
              isAdmin: true,
              _isAdminToken: true,
              role: { id: 0, name: 'Admin', type: 'admin' },
            };
            ctx.state.auth = {
              strategy: { name: 'admin' },
              credentials: ctx.state.user,
            };
          }
        }
      } catch (err) {
        // Not an admin token, let normal auth flow continue
      }
      
      return next();
    });
    
    // Run seed if SEED_DATA env var is set
    if (process.env.SEED_DATA === 'true') {
      try {
        await seedData(strapi);
      } catch (error) {
        console.error('Seed failed:', error);
      }
    }
  },
};
