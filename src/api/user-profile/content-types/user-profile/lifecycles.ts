export default {
  async beforeCreate(event) {
    const { data } = event.params;
    
    // Set default preferences
    if (!data.preferences) {
      data.preferences = {
        emailNotifications: true,
        courseUpdates: true,
        promotionalEmails: false,
      };
    }
    
    if (!data.notificationSettings) {
      data.notificationSettings = {
        email: true,
        push: true,
        sms: false,
      };
    }
  },
};

