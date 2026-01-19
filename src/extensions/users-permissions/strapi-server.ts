// Extend the users-permissions plugin to:
// 1. Create user profile on registration
// 2. Accept admin tokens for all API routes

export default (plugin) => {
  // Extend register controller
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

  // Override the JWT service to also accept admin tokens
  const originalVerify = plugin.services.jwt.verify;
  
  plugin.services.jwt.verify = async function(token) {
    console.log('[Admin Auth] JWT verify called');
    
    // First try to verify as admin token
    try {
      const decodedAdminToken = await strapi.admin.services.token.verify(token);
      console.log('[Admin Auth] Admin token decoded:', decodedAdminToken?.userId ? 'success' : 'no userId');
      
      if (decodedAdminToken && decodedAdminToken.userId) {
        const adminUser = await strapi.admin.services.user.findOne(decodedAdminToken.userId);
        console.log('[Admin Auth] Admin user found:', adminUser?.email);
        
        if (adminUser) {
          // Return the admin user ID - we'll handle it in fetchAuthenticatedUser
          return {
            id: `admin:${adminUser.id}`,
          };
        }
      }
    } catch (adminErr) {
      console.log('[Admin Auth] Not an admin token, trying user token');
    }
    
    // Fall back to original users-permissions JWT verification
    return originalVerify.call(this, token);
  };

  // Override fetchAuthenticatedUser to handle admin tokens
  const originalFetchUser = plugin.services.user.fetchAuthenticatedUser;
  
  plugin.services.user.fetchAuthenticatedUser = async function(id) {
    console.log('[Admin Auth] fetchAuthenticatedUser called with:', id);
    
    // Check if this is an admin user ID (prefixed with "admin:")
    if (id && typeof id === 'string' && id.startsWith('admin:')) {
      const adminId = id.replace('admin:', '');
      console.log('[Admin Auth] Fetching admin user:', adminId);
      
      const adminUser = await strapi.admin.services.user.findOne(adminId);
      if (adminUser) {
        console.log('[Admin Auth] Returning admin user as authenticated user');
        return {
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
      }
    }
    
    // Fall back to original user fetch
    return originalFetchUser.call(this, id);
  };

  return plugin;
};

