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
  
  plugin.services.jwt.verify = async (token) => {
    // First try to verify as admin token
    try {
      const decodedAdminToken = await strapi.admin.services.token.verify(token);
      if (decodedAdminToken && decodedAdminToken.userId) {
        const adminUser = await strapi.admin.services.user.findOne(decodedAdminToken.userId);
        if (adminUser) {
          // Return a user-like object that the users-permissions plugin expects
          return {
            id: adminUser.id,
            _isAdminToken: true,
            isAdmin: true,
          };
        }
      }
    } catch (adminErr) {
      // Not an admin token, continue with normal verification
    }
    
    // Fall back to original users-permissions JWT verification
    return originalVerify(token);
  };

  // Override fetchAuthenticatedUser to handle admin tokens
  const originalFetchUser = plugin.services.user.fetchAuthenticatedUser;
  
  plugin.services.user.fetchAuthenticatedUser = async (id) => {
    // Check if this is an admin user ID from our custom verify
    if (id && typeof id === 'object' && id._isAdminToken) {
      const adminUser = await strapi.admin.services.user.findOne(id.id);
      if (adminUser) {
        return {
          id: adminUser.id,
          documentId: `admin-${adminUser.id}`,
          username: `${adminUser.firstname} ${adminUser.lastname}`.trim(),
          email: adminUser.email,
          confirmed: true,
          blocked: false,
          isAdmin: true,
          _isAdminToken: true,
          role: { name: 'Admin', type: 'admin' },
        };
      }
    }
    
    // Fall back to original user fetch
    return originalFetchUser(id);
  };

  return plugin;
};

