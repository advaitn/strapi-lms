import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::question.question', ({ strapi }) => ({
  async find(ctx) {
    const { page = 1, pageSize = 25, filters, sort } = ctx.query as any;
    const requestedPopulate = ctx.query.populate;
    
    const allowedPopulates = ['quiz'];
    let populateConfig: any = {};
    
    if (requestedPopulate) {
      if (typeof requestedPopulate === 'string') {
        const populateFields = requestedPopulate.split(',').map(f => f.trim());
        for (const field of populateFields) {
          if (allowedPopulates.includes(field)) {
            populateConfig[field] = true;
          }
        }
      } else if (typeof requestedPopulate === 'object') {
        for (const key of Object.keys(requestedPopulate)) {
          if (allowedPopulates.includes(key)) {
            populateConfig[key] = requestedPopulate[key];
          }
        }
      }
    }
    
    const questions = await strapi.documents('api::question.question').findMany({
      filters: filters || {},
      populate: Object.keys(populateConfig).length > 0 ? populateConfig : undefined,
      limit: Number(pageSize),
      start: (Number(page) - 1) * Number(pageSize),
      sort: sort ? (sort as string).split(',').reduce((acc: any, s: string) => {
        const [field, order] = s.split(':');
        acc[field] = order || 'asc';
        return acc;
      }, {}) : { sortOrder: 'asc' },
      status: 'published',
    });
    
    const total = await strapi.documents('api::question.question').count({ filters: filters || {} });
    
    return {
      data: questions,
      meta: {
        pagination: {
          page: Number(page),
          pageSize: Number(pageSize),
          total,
          pageCount: Math.ceil(total / Number(pageSize)),
        },
      },
    };
  },

  async findOne(ctx) {
    const { id } = ctx.params;
    const requestedPopulate = ctx.query.populate;
    
    const allowedPopulates = ['quiz'];
    let populateConfig: any = {};
    
    if (requestedPopulate) {
      if (typeof requestedPopulate === 'string') {
        const populateFields = requestedPopulate.split(',').map(f => f.trim());
        for (const field of populateFields) {
          if (allowedPopulates.includes(field)) {
            populateConfig[field] = true;
          }
        }
      } else if (typeof requestedPopulate === 'object') {
        for (const key of Object.keys(requestedPopulate)) {
          if (allowedPopulates.includes(key)) {
            populateConfig[key] = requestedPopulate[key];
          }
        }
      }
    }
    
    const question = await strapi.documents('api::question.question').findOne({
      documentId: id,
      populate: Object.keys(populateConfig).length > 0 ? populateConfig : undefined,
      status: 'published',
    });
    
    if (!question) {
      return ctx.notFound('Question not found');
    }
    
    return { data: question };
  },
}));
