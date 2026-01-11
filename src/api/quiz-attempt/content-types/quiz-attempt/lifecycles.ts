export default {
  async beforeCreate(event) {
    const { data } = event.params;
    
    // Set default start time
    if (!data.startedAt) {
      data.startedAt = new Date().toISOString();
    }
  },

  async afterUpdate(event) {
    const { result } = event;
    
    // If quiz is graded and passed, could trigger certificate generation
    // This is handled in the student controller for more control
  },
};

