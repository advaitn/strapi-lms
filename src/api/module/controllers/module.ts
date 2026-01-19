import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::module.module', ({ strapi }) => ({
  async find(ctx) {
    const { page = 1, pageSize = 25, filters, sort } = ctx.query as any;
    const requestedPopulate = ctx.query.populate;
    
    const allowedPopulates = ['course', 'lessons', 'thumbnail'];
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
    
    const modules = await strapi.documents('api::module.module').findMany({
      filters: filters || {},
      populate: Object.keys(populateConfig).length > 0 ? populateConfig : undefined,
      limit: Number(pageSize),
      start: (Number(page) - 1) * Number(pageSize),
      sort: sort ? (sort as string).split(',').reduce((acc: any, s: string) => {
        const [field, order] = s.split(':');
        acc[field] = order || 'asc';
        return acc;
      }, {}) : { sortOrder: 'asc' },
    });
    
    const total = await strapi.documents('api::module.module').count({ filters: filters || {} });
    
    return {
      data: modules,
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
    
    const allowedPopulates = ['course', 'lessons', 'thumbnail'];
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
    
    const module = await strapi.documents('api::module.module').findOne({
      documentId: id,
      populate: Object.keys(populateConfig).length > 0 ? populateConfig : undefined,
    });
    
    if (!module) {
      return ctx.notFound('Module not found');
    }
    
    return { data: module };
  },

  // Custom update with admin/instructor ownership check
  async update(ctx) {
    const { id } = ctx.params;
    const user = ctx.state.user;
    const data = (ctx.request.body as any).data;

    if (!user) {
      return ctx.unauthorized('You must be logged in');
    }

    // Get module with course to check ownership
    const module = await strapi.documents('api::module.module').findOne({
      documentId: id,
      populate: {
        course: {
          populate: ['instructor'],
        },
      },
    });

    if (!module) {
      return ctx.notFound('Module not found');
    }

    // Check ownership - admin can update any, instructor can update their own
    const instructor = (module as any).course?.instructor;
    if (!user.isAdmin && instructor?.documentId !== user.documentId) {
      return ctx.forbidden('You can only update modules in your own courses');
    }

    const updated = await strapi.documents('api::module.module').update({
      documentId: id,
      data,
    });

    return { data: updated };
  },

  // Custom delete with admin/instructor ownership check
  async delete(ctx) {
    const { id } = ctx.params;
    const user = ctx.state.user;

    if (!user) {
      return ctx.unauthorized('You must be logged in');
    }

    // Get module with course to check ownership
    const module = await strapi.documents('api::module.module').findOne({
      documentId: id,
      populate: {
        course: {
          populate: ['instructor'],
        },
      },
    });

    if (!module) {
      return ctx.notFound('Module not found');
    }

    // Check ownership
    const instructor = (module as any).course?.instructor;
    if (!user.isAdmin && instructor?.documentId !== user.documentId) {
      return ctx.forbidden('You can only delete modules in your own courses');
    }

    await strapi.documents('api::module.module').delete({
      documentId: id,
    });

    return { data: { id } };
  },
}));
