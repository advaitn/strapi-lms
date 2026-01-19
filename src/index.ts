import type { Core } from '@strapi/strapi';
import seedData from './seed';
import seedCLA from './seed-cla';
import jwt from 'jsonwebtoken';

export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   */
  register({ strapi }: { strapi: Core.Strapi }) {
    // Register a global middleware to handle admin token bypass BEFORE permission checks
    strapi.server.use(async (ctx: any, next: () => Promise<void>) => {
      // Skip if not an API route
      if (!ctx.url.startsWith('/api/')) {
        return next();
      }
      
      const authorization = ctx.request.header.authorization;
      if (!authorization) {
        return next();
      }
      
      const parts = authorization.split(' ');
      if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
        return next();
      }
      
      const token = parts[1];
      const adminJwtSecret = process.env.ADMIN_JWT_SECRET;
      
      if (adminJwtSecret) {
        try {
          const decoded = jwt.verify(token, adminJwtSecret) as any;
          
          // Check if this is an admin token (has userId from Strapi admin)
          if (decoded && decoded.userId) {
            const adminUser = await strapi.query('admin::user').findOne({
              where: { id: decoded.userId },
            });
            
            if (adminUser && adminUser.isActive) {
              // Set admin state - this bypasses users-permissions checks
              ctx.state.isAuthenticated = true;
              ctx.state.auth = {
                strategy: { name: 'admin-token' },
                credentials: adminUser,
              };
              ctx.state.user = {
                id: adminUser.id,
                documentId: `admin-${adminUser.id}`,
                username: `${adminUser.firstname || ''} ${adminUser.lastname || ''}`.trim() || adminUser.email,
                email: adminUser.email,
                confirmed: true,
                blocked: false,
                isAdmin: true,
                isInstructor: true, // Admins have instructor privileges too
                role: { id: 0, name: 'Super Admin', type: 'super_admin' },
              };
            }
          }
        } catch (e: any) {
          // Not an admin token or invalid, continue with normal auth
        }
      }
      
      return next();
    });
  },

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   */
  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    // Override the users-permissions JWT verify to also accept admin tokens
    const usersPermissions = strapi.plugin('users-permissions');
    
    if (usersPermissions) {
      const jwtService = usersPermissions.service('jwt');
      const originalVerify = jwtService.verify.bind(jwtService);
      
      // Get admin JWT secret
      const adminJwtSecret = strapi.config.get('admin.auth.secret') || process.env.ADMIN_JWT_SECRET;
      
      jwtService.verify = async function(token: string) {
        // First try admin token using jsonwebtoken directly
        if (adminJwtSecret) {
          try {
            const decoded = jwt.verify(token, adminJwtSecret as string) as any;
            
            if (decoded && decoded.userId) {
              return { id: `admin:${decoded.userId}`, isAdmin: true };
            }
          } catch (e: any) {
            // Not an admin token or invalid, fall through
          }
        }
        
        // Fall back to users-permissions token
        return originalVerify(token);
      };
      
      // Override fetchAuthenticatedUser
      const userService = usersPermissions.service('user');
      const originalFetch = userService.fetchAuthenticatedUser.bind(userService);
      
      userService.fetchAuthenticatedUser = async function(id: any) {
        // Handle admin panel tokens
        if (typeof id === 'string' && id.startsWith('admin:')) {
          const adminId = parseInt(id.replace('admin:', ''), 10);
          
          // Find admin user
          const adminUser = await strapi.query('admin::user').findOne({
            where: { id: adminId },
          });
          
          if (adminUser && adminUser.isActive) {
            return {
              id: adminUser.id,
              documentId: `admin-${adminUser.id}`,
              username: `${adminUser.firstname || ''} ${adminUser.lastname || ''}`.trim() || adminUser.email,
              email: adminUser.email,
              confirmed: true,
              blocked: false,
              isAdmin: true,
              isInstructor: true,
              role: { id: 0, name: 'Super Admin', type: 'super_admin' },
            };
          }
        }
        
        // Fetch regular user
        const user = await originalFetch(id);
        
        // Check if user has admin privileges based on their profile
        if (user) {
          // First check username for admin
          if (user.username?.toLowerCase().includes('admin')) {
            user.isAdmin = true;
            console.log(`[auth] User ${user.username} marked as admin (username contains admin)`);
          }
          
          // Try to get profile for additional flags
          try {
            const profile = await strapi.documents('api::user-profile.user-profile').findFirst({
              filters: { user: { id: user.id } } as any,
            });
            
            if (profile) {
              // Mark as admin if profile headline is 'Admin'
              if (profile.headline?.toLowerCase() === 'admin') {
                user.isAdmin = true;
                console.log(`[auth] User ${user.username} marked as admin (profile headline)`);
              }
              
              // Attach isInstructor flag
              user.isInstructor = profile.isInstructor || false;
            }
          } catch (e) {
            console.log(`[auth] Profile lookup failed for user ${user.id}:`, e);
          }
        }
        
        return user;
      };
      
      // Override the permission check to allow admin users
      const permissionsService = usersPermissions.service('permissions');
      if (permissionsService && permissionsService.canAccess) {
        const originalCanAccess = permissionsService.canAccess.bind(permissionsService);
        
        permissionsService.canAccess = async function(ctx: any, ...args: any[]) {
          // If user is admin (set by our global middleware), allow access
          if (ctx.state.user?.isAdmin === true) {
            return true;
          }
          return originalCanAccess(ctx, ...args);
        };
      }
      
      console.log('[strapi-lms] Admin token authentication enabled for API routes');
    }
    
    // Run seed if SEED_DATA env var is set
    if (process.env.SEED_DATA === 'true') {
      try {
        await seedData(strapi);
      } catch (error) {
        console.error('Seed failed:', error);
      }
    }
    
    // Run CLA seed if SEED_CLA env var is set
    if (process.env.SEED_CLA === 'true') {
      try {
        await seedCLA(strapi);
      } catch (error) {
        console.error('CLA Seed failed:', error);
      }
    }
  },
};
