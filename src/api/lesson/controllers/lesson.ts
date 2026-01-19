import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::lesson.lesson', ({ strapi }) => ({
  async find(ctx) {
    const allowedPopulates = ['module', 'contentItems', 'quiz'];
    const requestedPopulate = ctx.query.populate;
    
    if (requestedPopulate) {
      if (typeof requestedPopulate === 'string') {
        const populateFields = requestedPopulate.split(',').map(f => f.trim());
        const validPopulates: any = {};
        
        for (const field of populateFields) {
          if (allowedPopulates.includes(field)) {
            validPopulates[field] = true;
          }
        }
        
        ctx.query.populate = validPopulates;
      }
    }
    
    return await super.find(ctx);
  },

  async findOne(ctx) {
    const allowedPopulates = ['module', 'contentItems', 'quiz'];
    const requestedPopulate = ctx.query.populate;
    
    if (requestedPopulate) {
      if (typeof requestedPopulate === 'string') {
        const populateFields = requestedPopulate.split(',').map(f => f.trim());
        const validPopulates: any = {};
        
        for (const field of populateFields) {
          if (allowedPopulates.includes(field)) {
            validPopulates[field] = true;
          }
        }
        
        ctx.query.populate = validPopulates;
      }
    }
    
    return await super.findOne(ctx);
  },
}));
