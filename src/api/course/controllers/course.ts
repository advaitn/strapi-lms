import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::course.course', ({ strapi }) => ({
  // Override find to filter based on visibility and user role
  async find(ctx) {
    const user = ctx.state.user;
    
    // If no user, only show public published courses
    if (!user) {
      const existingFilters = ctx.query.filters as Record<string, any> || {};
      ctx.query.filters = {
        ...existingFilters,
        visibility: 'public',
        status: 'published',
      };
    }

    // Handle populate parameter - allow specific relations
    const requestedPopulate = ctx.query.populate;
    if (requestedPopulate) {
      // Parse the populate parameter
      const allowedPopulates = ['thumbnail', 'category', 'tags', 'instructor', 'modules', 'previewVideo'];
      
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

  // Override findOne to allow population
  async findOne(ctx) {
    const requestedPopulate = ctx.query.populate;
    if (requestedPopulate) {
      const allowedPopulates = ['thumbnail', 'category', 'tags', 'instructor', 'modules', 'previewVideo', 'quizzes'];
      
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

  // Find course by slug
  async findBySlug(ctx) {
    const { slug } = ctx.params;
    const allowedPopulates = ['thumbnail', 'category', 'tags', 'instructor', 'modules', 'previewVideo', 'quizzes'];
    
    // Build populate object from query
    let populateConfig: any = {};
    const requestedPopulate = ctx.query.populate;
    
    if (requestedPopulate) {
      if (typeof requestedPopulate === 'string') {
        const populateFields = requestedPopulate.split(',').map(f => f.trim());
        for (const field of populateFields) {
          if (allowedPopulates.includes(field)) {
            populateConfig[field] = true;
          }
        }
      } else if (typeof requestedPopulate === 'object') {
        populateConfig = requestedPopulate;
      }
    }

    const course = await strapi.documents('api::course.course').findFirst({
      filters: { 
        slug,
        visibility: 'public',
      } as any,
      populate: Object.keys(populateConfig).length > 0 ? populateConfig : undefined,
      status: 'published',
    });

    if (!course) {
      return ctx.notFound('Course not found');
    }

    return { data: course };
  },

  // Get courses for the current instructor
  async myInstructorCourses(ctx) {
    const user = ctx.state.user;
    
    if (!user) {
      return ctx.unauthorized('You must be logged in');
    }

    const courses = await strapi.documents('api::course.course').findMany({
      filters: { instructor: { documentId: user.documentId } } as any,
      populate: ['category', 'tags', 'modules', 'thumbnail'],
    });

    return { data: courses };
  },

  // Get enrolled courses for current user
  async myEnrolledCourses(ctx) {
    const user = ctx.state.user;
    
    if (!user) {
      return ctx.unauthorized('You must be logged in');
    }

    const enrollments = await strapi.documents('api::enrollment.enrollment').findMany({
      filters: { user: { documentId: user.documentId } } as any,
      populate: {
        course: {
          populate: ['category', 'thumbnail', 'instructor'],
        },
      },
    });

    return { data: enrollments };
  },

  // Get full course content (for enrolled users)
  async getCourseContent(ctx) {
    const { id } = ctx.params;
    const user = ctx.state.user;

    const course = await strapi.documents('api::course.course').findOne({
      documentId: id,
      populate: {
        modules: {
          populate: {
            lessons: {
              populate: ['contentItems', 'quiz'],
            },
          },
        },
        category: true,
        tags: true,
        instructor: true,
        quizzes: {
          populate: ['questions'],
        },
      },
    });

    if (!course) {
      return ctx.notFound('Course not found');
    }

    // Check enrollment if course is not public
    if (course.visibility !== 'public' && user) {
      const enrollment = await strapi.documents('api::enrollment.enrollment').findFirst({
        filters: {
          user: { documentId: user.documentId },
          course: { documentId: id },
          status: { $in: ['active', 'completed'] },
        } as any,
      });

      const instructor = course.instructor as any;
      if (!enrollment && instructor?.documentId !== user.documentId) {
        return ctx.forbidden('You are not enrolled in this course');
      }
    }

    return { data: course };
  },
}));
