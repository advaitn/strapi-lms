import type { Core } from '@strapi/strapi';

const controller = ({ strapi }: { strapi: Core.Strapi }) => ({
  // Dashboard statistics
  async getDashboardStats(ctx) {
    const [
      totalUsers,
      totalCourses,
      totalEnrollments,
      totalCompletions,
    ] = await Promise.all([
      strapi.documents('plugin::users-permissions.user').count({}),
      strapi.documents('api::course.course').count({}),
      strapi.documents('api::enrollment.enrollment').count({}),
      strapi.documents('api::enrollment.enrollment').count({
        filters: { status: 'completed' } as any,
      }),
    ]);

    const recentEnrollments = await strapi.documents('api::enrollment.enrollment').findMany({
      limit: 10,
      sort: { createdAt: 'desc' } as any,
      populate: ['user', 'course'],
    });

    return {
      data: {
        totalUsers,
        totalCourses,
        totalEnrollments,
        totalCompletions,
        completionRate: totalEnrollments > 0 
          ? Math.round((totalCompletions / totalEnrollments) * 100) 
          : 0,
        recentEnrollments,
      },
    };
  },

  // Manage all users
  async getAllUsers(ctx) {
    const { page = 1, pageSize = 25, search, role } = ctx.query as any;

    const filters: any = {};
    if (search) {
      filters.$or = [
        { username: { $containsi: search } },
        { email: { $containsi: search } },
      ];
    }
    if (role) {
      filters.role = { name: role };
    }

    const users = await strapi.documents('plugin::users-permissions.user').findMany({
      filters,
      populate: ['role'],
      limit: Number(pageSize),
      start: (Number(page) - 1) * Number(pageSize),
    });

    const total = await strapi.documents('plugin::users-permissions.user').count({ filters });

    return {
      data: users,
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

  // Bulk enroll users
  async bulkEnroll(ctx) {
    const { userIds, courseId, enrollmentType = 'admin' } = ctx.request.body as any;

    if (!userIds || !Array.isArray(userIds) || !courseId) {
      return ctx.badRequest('userIds (array) and courseId are required');
    }

    const results = [];
    for (const userId of userIds) {
      // Check if already enrolled
      const existing = await strapi.documents('api::enrollment.enrollment').findFirst({
        filters: { 
          user: { documentId: userId }, 
          course: { documentId: courseId } 
        } as any,
      });

      if (existing) {
        results.push({ userId, status: 'already_enrolled' });
        continue;
      }

      const enrollment = await strapi.documents('api::enrollment.enrollment').create({
        data: {
          user: userId,
          course: courseId,
          enrollmentType,
          status: 'active',
          enrolledAt: new Date().toISOString(),
          progress: 0,
        } as any,
      });

      results.push({ userId, status: 'enrolled', enrollmentId: enrollment.documentId });
    }

    return { data: results };
  },

  // Update user role
  async updateUserRole(ctx) {
    const { id } = ctx.params;
    const { roleId } = ctx.request.body as any;

    if (!roleId) {
      return ctx.badRequest('roleId is required');
    }

    const user = await strapi.documents('plugin::users-permissions.user').update({
      documentId: id,
      data: { role: roleId } as any,
    });

    return { data: user };
  },

  // Get all enrollments with filters
  async getAllEnrollments(ctx) {
    const { page = 1, pageSize = 25, status, courseId, userId } = ctx.query as any;

    const filters: any = {};
    if (status) filters.status = status;
    if (courseId) filters.course = { documentId: courseId };
    if (userId) filters.user = { documentId: userId };

    const enrollments = await strapi.documents('api::enrollment.enrollment').findMany({
      filters,
      populate: ['user', 'course'],
      limit: Number(pageSize),
      start: (Number(page) - 1) * Number(pageSize),
      sort: { createdAt: 'desc' } as any,
    });

    const total = await strapi.documents('api::enrollment.enrollment').count({ filters });

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

  // Course analytics
  async getCourseAnalytics(ctx) {
    const { id } = ctx.params;

    const course = await strapi.documents('api::course.course').findOne({
      documentId: id,
      populate: ['instructor', 'modules'],
    });

    if (!course) {
      return ctx.notFound('Course not found');
    }

    const enrollments = await strapi.documents('api::enrollment.enrollment').findMany({
      filters: { course: { documentId: id } } as any,
    });

    const quizAttempts = await strapi.documents('api::quiz-attempt.quiz-attempt').findMany({
      filters: { quiz: { course: { documentId: id } } } as any,
    });

    const statusBreakdown = {
      active: enrollments.filter((e: any) => e.status === 'active').length,
      completed: enrollments.filter((e: any) => e.status === 'completed').length,
      expired: enrollments.filter((e: any) => e.status === 'expired').length,
      cancelled: enrollments.filter((e: any) => e.status === 'cancelled').length,
    };

    const avgProgress = enrollments.length > 0
      ? Math.round(enrollments.reduce((sum: number, e: any) => sum + (e.progress || 0), 0) / enrollments.length)
      : 0;

    const passedQuizzes = quizAttempts.filter((a: any) => a.passed).length;
    const avgQuizScore = quizAttempts.length > 0
      ? Math.round(quizAttempts.reduce((sum: number, a: any) => sum + (a.percentageScore || 0), 0) / quizAttempts.length)
      : 0;

    return {
      data: {
        course,
        totalEnrollments: enrollments.length,
        statusBreakdown,
        avgProgress,
        totalQuizAttempts: quizAttempts.length,
        passedQuizzes,
        quizPassRate: quizAttempts.length > 0 
          ? Math.round((passedQuizzes / quizAttempts.length) * 100) 
          : 0,
        avgQuizScore,
      },
    };
  },

  // Get all certificates
  async getAllCertificates(ctx) {
    const { page = 1, pageSize = 25, status, courseId, userId } = ctx.query as any;

    const filters: any = {};
    if (status) filters.status = status;
    if (courseId) filters.course = { documentId: courseId };
    if (userId) filters.user = { documentId: userId };

    const certificates = await strapi.documents('api::certificate.certificate').findMany({
      filters,
      populate: ['user', 'course'],
      limit: Number(pageSize),
      start: (Number(page) - 1) * Number(pageSize),
      sort: { issuedAt: 'desc' } as any,
    });

    const total = await strapi.documents('api::certificate.certificate').count({ filters });

    return {
      data: certificates,
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

  // Revoke certificate
  async revokeCertificate(ctx) {
    const { id } = ctx.params;

    const certificate = await strapi.documents('api::certificate.certificate').update({
      documentId: id,
      data: { status: 'revoked' } as any,
    });

    return { data: certificate };
  },

  // Get reports
  async getReports(ctx) {
    const { type, startDate, endDate } = ctx.query as any;

    const dateFilters: any = {};
    if (startDate) dateFilters.createdAt = { $gte: startDate };
    if (endDate) dateFilters.createdAt = { ...dateFilters.createdAt, $lte: endDate };

    let report: any = {};

    switch (type) {
      case 'enrollments':
        const enrollments = await strapi.documents('api::enrollment.enrollment').findMany({
          filters: dateFilters,
          populate: ['course', 'user'],
        });
        report = {
          total: enrollments.length,
          byStatus: {
            active: enrollments.filter((e: any) => e.status === 'active').length,
            completed: enrollments.filter((e: any) => e.status === 'completed').length,
          },
          data: enrollments,
        };
        break;

      case 'completions':
        const completions = await strapi.documents('api::enrollment.enrollment').findMany({
          filters: { ...dateFilters, status: 'completed' } as any,
          populate: ['course', 'user'],
        });
        report = {
          total: completions.length,
          data: completions,
        };
        break;

      case 'certificates':
        const certificates = await strapi.documents('api::certificate.certificate').findMany({
          filters: dateFilters,
          populate: ['course', 'user'],
        });
        report = {
          total: certificates.length,
          byStatus: {
            issued: certificates.filter((c: any) => c.status === 'issued').length,
            revoked: certificates.filter((c: any) => c.status === 'revoked').length,
          },
          data: certificates,
        };
        break;

      default:
        return ctx.badRequest('Invalid report type. Use: enrollments, completions, certificates');
    }

    return { data: report };
  },
});

export default controller;
