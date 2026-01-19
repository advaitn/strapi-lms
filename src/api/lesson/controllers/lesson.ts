import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::lesson.lesson', ({ strapi }) => ({
  async find(ctx) {
    const { page = 1, pageSize = 25, filters, sort } = ctx.query as any;
    const requestedPopulate = ctx.query.populate;
    
    const allowedPopulates = ['module', 'contentItems', 'quiz', 'featuredImage'];
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
    
    const lessons = await strapi.documents('api::lesson.lesson').findMany({
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
    
    const total = await strapi.documents('api::lesson.lesson').count({ filters: filters || {} });
    
    return {
      data: lessons,
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
    
    const allowedPopulates = ['module', 'contentItems', 'quiz', 'featuredImage'];
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
    
    const lesson = await strapi.documents('api::lesson.lesson').findOne({
      documentId: id,
      populate: Object.keys(populateConfig).length > 0 ? populateConfig : undefined,
    });
    
    if (!lesson) {
      return ctx.notFound('Lesson not found');
    }
    
    return { data: lesson };
  },

  // Custom update with admin/instructor ownership check
  async update(ctx) {
    const { id } = ctx.params;
    const user = ctx.state.user;
    const data = (ctx.request.body as any).data;

    if (!user) {
      return ctx.unauthorized('You must be logged in');
    }

    // Get lesson with module and course to check ownership
    const lesson = await strapi.documents('api::lesson.lesson').findOne({
      documentId: id,
      populate: {
        module: {
          populate: {
            course: {
              populate: ['instructor'],
            },
          },
        },
      },
    });

    if (!lesson) {
      return ctx.notFound('Lesson not found');
    }

    // Check ownership - admin can update any, instructor can update their own
    const instructor = (lesson as any).module?.course?.instructor;
    if (!user.isAdmin && instructor?.documentId !== user.documentId) {
      return ctx.forbidden('You can only update lessons in your own courses');
    }

    const updated = await strapi.documents('api::lesson.lesson').update({
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

    // Get lesson with module and course to check ownership
    const lesson = await strapi.documents('api::lesson.lesson').findOne({
      documentId: id,
      populate: {
        module: {
          populate: {
            course: {
              populate: ['instructor'],
            },
          },
        },
      },
    });

    if (!lesson) {
      return ctx.notFound('Lesson not found');
    }

    // Check ownership
    const instructor = (lesson as any).module?.course?.instructor;
    if (!user.isAdmin && instructor?.documentId !== user.documentId) {
      return ctx.forbidden('You can only delete lessons in your own courses');
    }

    await strapi.documents('api::lesson.lesson').delete({
      documentId: id,
    });

    return { data: { id } };
  },
}));
