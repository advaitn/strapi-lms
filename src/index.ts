import type { Core } from '@strapi/strapi';
import seedData from './seed';
import seedCLA from './seed-cla';
import jwt from 'jsonwebtoken';

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
            // Get the Authenticated role for permission checks
            const authenticatedRole = await strapi.query('plugin::users-permissions.role').findOne({
              where: { type: 'authenticated' },
            });
            
            return {
              id: adminUser.id,
              documentId: `admin-${adminUser.id}`,
              username: `${adminUser.firstname || ''} ${adminUser.lastname || ''}`.trim() || adminUser.email,
              email: adminUser.email,
              confirmed: true,
              blocked: false,
              isAdmin: true,
              role: authenticatedRole || { id: 1, name: 'Authenticated', type: 'authenticated' },
            };
          }
        }
        
        // Fetch regular user
        const user = await originalFetch(id);
        
        // Check if user has admin privileges based on their profile
        if (user && user.documentId) {
          try {
            const profile = await strapi.documents('api::user-profile.user-profile').findFirst({
              filters: { user: { documentId: user.documentId } } as any,
            });
            
            // Mark as admin if profile headline is 'Admin' or username contains 'admin'
            if (profile?.headline?.toLowerCase() === 'admin' || 
                user.username?.toLowerCase().includes('admin')) {
              user.isAdmin = true;
            }
            
            // Also attach isInstructor flag
            user.isInstructor = profile?.isInstructor || false;
          } catch (e) {
            // Profile lookup failed, continue without admin flag
          }
        }
        
        return user;
      };
      
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
