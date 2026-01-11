// Extend the users-permissions plugin to create user profile on registration
export default (plugin) => {
  const originalRegister = plugin.controllers.auth.register;

  plugin.controllers.auth.register = async (ctx) => {
    // Call original register
    await originalRegister(ctx);

    // If registration was successful, create user profile
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

  return plugin;
};

