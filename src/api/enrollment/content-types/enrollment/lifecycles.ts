export default {
  async beforeCreate(event) {
    const { data } = event.params;
    
    // Set default enrolled date if not provided
    if (!data.enrolledAt) {
      data.enrolledAt = new Date().toISOString();
    }
  },

  async afterCreate(event) {
    const { result } = event;
    
    // You could send welcome email here
    // strapi.plugins['email'].services.email.send({...})
  },

  async beforeUpdate(event) {
    const { data } = event.params;
    
    // Update lastAccessedAt
    data.lastAccessedAt = new Date().toISOString();
    
    // Set completedAt when status changes to completed
    if (data.status === 'completed' && !data.completedAt) {
      data.completedAt = new Date().toISOString();
    }
  },
};

