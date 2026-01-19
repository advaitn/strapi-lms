import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::enrollment.enrollment', ({ strapi }) => ({
  async find(ctx) {
    const { page = 1, pageSize = 25, filters, sort } = ctx.query as any;
    const requestedPopulate = ctx.query.populate;
    
    const allowedPopulates = ['course', 'user', 'invitedBy'];
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
    
    const enrollments = await strapi.documents('api::enrollment.enrollment').findMany({
      filters: filters || {},
      populate: Object.keys(populateConfig).length > 0 ? populateConfig : undefined,
      limit: Number(pageSize),
      start: (Number(page) - 1) * Number(pageSize),
      sort: sort ? (sort as string).split(',').reduce((acc: any, s: string) => {
        const [field, order] = s.split(':');
        acc[field] = order || 'asc';
        return acc;
      }, {}) : { enrolledAt: 'desc' },
      status: 'published',
    });
    
    const total = await strapi.documents('api::enrollment.enrollment').count({ filters: filters || {} });
    
    return {
      data: enrollments,
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
    
    const allowedPopulates = ['course', 'user', 'invitedBy'];
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
    
    const enrollment = await strapi.documents('api::enrollment.enrollment').findOne({
      documentId: id,
      populate: Object.keys(populateConfig).length > 0 ? populateConfig : undefined,
      status: 'published',
    });
    
    if (!enrollment) {
      return ctx.notFound('Enrollment not found');
    }
    
    return { data: enrollment };
  },
}));
