import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::course.course', ({ strapi }) => ({
  // Override find to filter based on visibility and user role
  async find(ctx) {
    const user = ctx.state.user;
    const { page = 1, pageSize = 25, filters: queryFilters, sort } = ctx.query as any;
    const requestedPopulate = ctx.query.populate;
    
    // Build filters
    const filters: any = queryFilters || {};
    if (!user) {
      filters.visibility = 'public';
    }

    // Handle populate parameter - allow specific relations
    const allowedPopulates = ['thumbnail', 'bannerImage', 'gallery', 'category', 'tags', 'instructor', 'modules', 'previewVideo'];
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
    
    const courses = await strapi.documents('api::course.course').findMany({
      filters,
      populate: Object.keys(populateConfig).length > 0 ? populateConfig : undefined,
      limit: Number(pageSize),
      start: (Number(page) - 1) * Number(pageSize),
      sort: sort ? (sort as string).split(',').reduce((acc: any, s: string) => {
        const [field, order] = s.split(':');
        acc[field] = order || 'asc';
        return acc;
      }, {}) : { title: 'asc' },
      status: 'published',
    });
    
    const total = await strapi.documents('api::course.course').count({ filters, status: 'published' });
    
    return {
      data: courses,
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

  // Override findOne to allow population
  async findOne(ctx) {
    const { id } = ctx.params;
    const requestedPopulate = ctx.query.populate;
    
    const allowedPopulates = ['thumbnail', 'bannerImage', 'gallery', 'category', 'tags', 'instructor', 'modules', 'previewVideo', 'quizzes'];
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
    
    const course = await strapi.documents('api::course.course').findOne({
      documentId: id,
      populate: Object.keys(populateConfig).length > 0 ? populateConfig : undefined,
      status: 'published',
    });
    
    if (!course) {
      return ctx.notFound('Course not found');
    }
    
    return { data: course };
  },

  // Find course by slug or documentId
  async findBySlug(ctx) {
    const { slug } = ctx.params;
    
    // Since auth: false is set for this route, manually check for auth token
    let user = ctx.state.user;
    if (!user) {
      const authHeader = ctx.request.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
          // Try admin token first
          const adminDecoded = await strapi.admin.services.token.verify(token);
          if (adminDecoded && adminDecoded.userId) {
            const adminUser = await strapi.admin.services.user.findOne(adminDecoded.userId);
            if (adminUser) {
              user = {
                id: adminUser.id,
                documentId: `admin-${adminUser.id}`,
                isAdmin: true,
                _isAdminToken: true,
              };
            }
          }
        } catch (e) {
          // Try users-permissions JWT
          try {
            const jwtService = strapi.plugin('users-permissions').service('jwt');
            const decoded = await jwtService.verify(token);
            if (decoded && decoded.id) {
              const dbUser = await strapi.query('plugin::users-permissions.user').findOne({
                where: { id: decoded.id },
              });
              if (dbUser) {
                user = {
                  id: dbUser.id,
                  documentId: dbUser.documentId,
                };
              }
            }
          } catch (e2) {
            // Invalid token, continue without user
          }
        }
      }
    }
    const allowedPopulates = ['thumbnail', 'bannerImage', 'gallery', 'category', 'tags', 'instructor', 'modules', 'previewVideo', 'quizzes'];
    
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

    // Always populate instructor to check ownership
    const populateWithInstructor = { 
      ...populateConfig, 
      instructor: true 
    };

    let course: any = null;

    // Try to find by documentId first (for management)
    // documentIds are typically alphanumeric strings without dashes
    if (/^[a-z0-9]{20,}$/i.test(slug)) {
      try {
        course = await strapi.documents('api::course.course').findOne({
          documentId: slug,
          populate: populateWithInstructor,
        });
      } catch (e) {
        // Not a valid documentId, continue to slug lookup
      }
    }

    if (!course) {
      // Try by slug field
      course = await strapi.documents('api::course.course').findFirst({
        filters: { slug } as any,
        populate: populateWithInstructor,
      });
    }

    if (!course) {
      return ctx.notFound('Course not found');
    }

    // Check access permissions
    const instructor = (course as any).instructor;
    
    // Debug logging
    console.log('[findBySlug] User:', user ? { id: user.id, documentId: user.documentId, isAdmin: user.isAdmin } : 'null');
    console.log('[findBySlug] Course:', { status: course.status, visibility: course.visibility });
    console.log('[findBySlug] Instructor:', instructor ? { id: instructor.id, documentId: instructor.documentId } : 'null');
    
    // Check ownership by both id and documentId (JWT user may not have documentId populated)
    const isOwner = user && instructor && (
      instructor.documentId === user.documentId ||
      instructor.id === user.id ||
      String(instructor.id) === String(user.id)
    );
    const isAdmin = user?.isAdmin || user?._isAdminToken;
    
    console.log('[findBySlug] isOwner:', isOwner, 'isAdmin:', isAdmin);

    // If not owner/admin, only allow public published courses
    if (!isOwner && !isAdmin) {
      if ((course as any).visibility !== 'public' || (course as any).status !== 'published') {
        console.log('[findBySlug] Access denied - not owner/admin and course is not public/published');
        return ctx.notFound('Course not found');
      }
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
