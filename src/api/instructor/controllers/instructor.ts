import type { Core } from '@strapi/strapi';

const controller = ({ strapi }: { strapi: Core.Strapi }) => ({
  // Get instructor dashboard
  async getDashboard(ctx) {
    const user = ctx.state.user;

    if (!user) {
      return ctx.unauthorized('You must be logged in');
    }

    const courses = await strapi.documents('api::course.course').findMany({
      filters: { instructor: { documentId: user.documentId } } as any,
      populate: ['category', 'thumbnail'],
    });

    const courseIds = courses.map((c: any) => c.documentId);

    let enrollments: any[] = [];
    if (courseIds.length > 0) {
      enrollments = await strapi.documents('api::enrollment.enrollment').findMany({
        filters: { course: { documentId: { $in: courseIds } } } as any,
      });
    }

    const completions = enrollments.filter((e: any) => e.status === 'completed').length;

    return {
      data: {
        totalCourses: courses.length,
        publishedCourses: courses.filter((c: any) => c.status === 'published').length,
        draftCourses: courses.filter((c: any) => c.status === 'draft').length,
        totalStudents: enrollments.length,
        totalCompletions: completions,
        completionRate: enrollments.length > 0 
          ? Math.round((completions / enrollments.length) * 100) 
          : 0,
        courses,
      },
    };
  },

  // Create a new course
  async createCourse(ctx) {
    const user = ctx.state.user;
    const data = (ctx.request.body as any).data;

    if (!user) {
      return ctx.unauthorized('You must be logged in');
    }

    const course = await strapi.documents('api::course.course').create({
      data: {
        ...data,
        instructor: user.documentId,
        status: 'draft',
      } as any,
    });

    return { data: course };
  },

  // Update own course
  async updateCourse(ctx) {
    const user = ctx.state.user;
    const { id } = ctx.params;
    const data = (ctx.request.body as any).data;

    if (!user) {
      return ctx.unauthorized('You must be logged in');
    }

    // Verify ownership
    const course = await strapi.documents('api::course.course').findOne({
      documentId: id,
      populate: ['instructor'],
    });

    if (!course) {
      return ctx.notFound('Course not found');
    }

    const instructor = (course as any).instructor;
    if (instructor?.documentId !== user.documentId) {
      return ctx.forbidden('You can only update your own courses');
    }

    const updated = await strapi.documents('api::course.course').update({
      documentId: id,
      data,
    });

    return { data: updated };
  },

  // Get course students
  async getCourseStudents(ctx) {
    const user = ctx.state.user;
    const { id } = ctx.params;
    const { page = 1, pageSize = 25 } = ctx.query as any;

    if (!user) {
      return ctx.unauthorized('You must be logged in');
    }

    // Verify ownership
    const course = await strapi.documents('api::course.course').findOne({
      documentId: id,
      populate: ['instructor'],
    });

    if (!course) {
      return ctx.notFound('Course not found');
    }

    const instructor = (course as any).instructor;
    if (instructor?.documentId !== user.documentId) {
      return ctx.forbidden('You can only view students of your own courses');
    }

    const enrollments = await strapi.documents('api::enrollment.enrollment').findMany({
      filters: { course: { documentId: id } } as any,
      populate: ['user'],
      limit: Number(pageSize),
      start: (Number(page) - 1) * Number(pageSize),
    });

    const total = await strapi.documents('api::enrollment.enrollment').count({
      filters: { course: { documentId: id } } as any,
    });

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

  // Add module to course
  async addModule(ctx) {
    const user = ctx.state.user;
    const { courseId } = ctx.params;
    const data = (ctx.request.body as any).data;

    if (!user) {
      return ctx.unauthorized('You must be logged in');
    }

    // Verify ownership
    const course = await strapi.documents('api::course.course').findOne({
      documentId: courseId,
      populate: ['instructor', 'modules'],
    });

    if (!course) {
      return ctx.notFound('Course not found');
    }

    const courseData = course as any;
    if (courseData.instructor?.documentId !== user.documentId) {
      return ctx.forbidden('You can only add modules to your own courses');
    }

    const sortOrder = (courseData.modules?.length || 0) + 1;

    const module = await strapi.documents('api::module.module').create({
      data: {
        ...data,
        course: courseId,
        sortOrder,
      } as any,
    });

    return { data: module };
  },

  // Add lesson to module
  async addLesson(ctx) {
    const user = ctx.state.user;
    const { moduleId } = ctx.params;
    const data = (ctx.request.body as any).data;

    if (!user) {
      return ctx.unauthorized('You must be logged in');
    }

    const module = await strapi.documents('api::module.module').findOne({
      documentId: moduleId,
      populate: {
        course: { populate: ['instructor'] },
        lessons: true,
      },
    });

    if (!module) {
      return ctx.notFound('Module not found');
    }

    const moduleData = module as any;
    if (moduleData.course?.instructor?.documentId !== user.documentId) {
      return ctx.forbidden('You can only add lessons to your own courses');
    }

    const sortOrder = (moduleData.lessons?.length || 0) + 1;

    const lesson = await strapi.documents('api::lesson.lesson').create({
      data: {
        ...data,
        module: moduleId,
        sortOrder,
      } as any,
    });

    return { data: lesson };
  },

  // Create quiz for course
  async createQuiz(ctx) {
    const user = ctx.state.user;
    const { courseId } = ctx.params;
    const data = (ctx.request.body as any).data;

    if (!user) {
      return ctx.unauthorized('You must be logged in');
    }

    const course = await strapi.documents('api::course.course').findOne({
      documentId: courseId,
      populate: ['instructor'],
    });

    if (!course) {
      return ctx.notFound('Course not found');
    }

    const courseData = course as any;
    if (courseData.instructor?.documentId !== user.documentId) {
      return ctx.forbidden('You can only create quizzes for your own courses');
    }

    const quiz = await strapi.documents('api::quiz.quiz').create({
      data: {
        ...data,
        course: courseId,
      } as any,
    });

    return { data: quiz };
  },

  // Add question to quiz
  async addQuestion(ctx) {
    const user = ctx.state.user;
    const { quizId } = ctx.params;
    const data = (ctx.request.body as any).data;

    if (!user) {
      return ctx.unauthorized('You must be logged in');
    }

    const quiz = await strapi.documents('api::quiz.quiz').findOne({
      documentId: quizId,
      populate: {
        course: { populate: ['instructor'] },
        questions: true,
      },
    });

    if (!quiz) {
      return ctx.notFound('Quiz not found');
    }

    const quizData = quiz as any;
    if (quizData.course?.instructor?.documentId !== user.documentId) {
      return ctx.forbidden('You can only add questions to your own quizzes');
    }

    const sortOrder = (quizData.questions?.length || 0) + 1;

    const question = await strapi.documents('api::question.question').create({
      data: {
        ...data,
        quiz: quizId,
        sortOrder,
      } as any,
    });

    return { data: question };
  },

  // Create invite code
  async createInvite(ctx) {
    const user = ctx.state.user;
    const { courseId } = ctx.params;
    const bodyData = (ctx.request.body as any).data || {};
    const { email, maxUses = 1, expiresAt, message } = bodyData;

    if (!user) {
      return ctx.unauthorized('You must be logged in');
    }

    const course = await strapi.documents('api::course.course').findOne({
      documentId: courseId,
      populate: ['instructor'],
    });

    if (!course) {
      return ctx.notFound('Course not found');
    }

    const courseData = course as any;
    if (courseData.instructor?.documentId !== user.documentId) {
      return ctx.forbidden('You can only create invites for your own courses');
    }

    // Generate unique invite code
    const code = `INV-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const invite = await strapi.documents('api::invite.invite').create({
      data: {
        code,
        email,
        course: courseId,
        invitedBy: user.documentId,
        maxUses,
        expiresAt,
        message,
        status: 'pending',
        usedCount: 0,
      } as any,
    });

    return { data: invite };
  },

  // Get course analytics
  async getCourseAnalytics(ctx) {
    const user = ctx.state.user;
    const { id } = ctx.params;

    if (!user) {
      return ctx.unauthorized('You must be logged in');
    }

    const course = await strapi.documents('api::course.course').findOne({
      documentId: id,
      populate: ['instructor'],
    });

    if (!course) {
      return ctx.notFound('Course not found');
    }

    const courseData = course as any;
    if (courseData.instructor?.documentId !== user.documentId) {
      return ctx.forbidden('You can only view analytics for your own courses');
    }

    const enrollments = await strapi.documents('api::enrollment.enrollment').findMany({
      filters: { course: { documentId: id } } as any,
    });

    const quizAttempts = await strapi.documents('api::quiz-attempt.quiz-attempt').findMany({
      filters: { quiz: { course: { documentId: id } } } as any,
    });

    const avgProgress = enrollments.length > 0
      ? Math.round(enrollments.reduce((sum: number, e: any) => sum + (e.progress || 0), 0) / enrollments.length)
      : 0;

    return {
      data: {
        totalStudents: enrollments.length,
        activeStudents: enrollments.filter((e: any) => e.status === 'active').length,
        completedStudents: enrollments.filter((e: any) => e.status === 'completed').length,
        avgProgress,
        totalQuizAttempts: quizAttempts.length,
        avgQuizScore: quizAttempts.length > 0
          ? Math.round(quizAttempts.reduce((sum: number, a: any) => sum + (a.percentageScore || 0), 0) / quizAttempts.length)
          : 0,
      },
    };
  },

  // Get quiz results
  async getQuizResults(ctx) {
    const user = ctx.state.user;
    const { quizId } = ctx.params;

    if (!user) {
      return ctx.unauthorized('You must be logged in');
    }

    const quiz = await strapi.documents('api::quiz.quiz').findOne({
      documentId: quizId,
      populate: {
        course: { populate: ['instructor'] },
      },
    });

    if (!quiz) {
      return ctx.notFound('Quiz not found');
    }

    const quizData = quiz as any;
    if (quizData.course?.instructor?.documentId !== user.documentId) {
      return ctx.forbidden('You can only view results for your own quizzes');
    }

    const attempts = await strapi.documents('api::quiz-attempt.quiz-attempt').findMany({
      filters: { quiz: { documentId: quizId } } as any,
      populate: ['user'],
      sort: { submittedAt: 'desc' } as any,
    });

    const passed = attempts.filter((a: any) => a.passed).length;

    return {
      data: {
        quiz,
        totalAttempts: attempts.length,
        passedCount: passed,
        failedCount: attempts.length - passed,
        passRate: attempts.length > 0 ? Math.round((passed / attempts.length) * 100) : 0,
        avgScore: attempts.length > 0
          ? Math.round(attempts.reduce((sum: number, a: any) => sum + (a.percentageScore || 0), 0) / attempts.length)
          : 0,
        attempts,
      },
    };
  },
});

export default controller;
