import { factories } from '@strapi/strapi';

export default factories.createCoreService('api::course.course', ({ strapi }) => ({
  // Calculate course duration based on modules and lessons
  async calculateDuration(courseId: string) {
    const course = await strapi.documents('api::course.course').findOne({
      documentId: courseId,
      populate: {
        modules: {
          populate: ['lessons'],
        },
      },
    });

    if (!course) return 0;

    let totalDuration = 0;
    const modules = course.modules as any[] || [];
    for (const module of modules) {
      const lessons = module.lessons as any[] || [];
      for (const lesson of lessons) {
        totalDuration += lesson.duration || 0;
      }
    }

    return totalDuration;
  },

  // Get course statistics
  async getStatistics(courseId: string) {
    const enrollments = await strapi.documents('api::enrollment.enrollment').findMany({
      filters: { course: { documentId: courseId } } as any,
    });

    const completedCount = enrollments.filter((e: any) => e.status === 'completed').length;
    const activeCount = enrollments.filter((e: any) => e.status === 'active').length;

    return {
      totalEnrollments: enrollments.length,
      completedCount,
      activeCount,
      completionRate: enrollments.length > 0 
        ? Math.round((completedCount / enrollments.length) * 100) 
        : 0,
    };
  },

  // Check if user can access course
  async canUserAccess(courseId: string, userId: string) {
    const course = await strapi.documents('api::course.course').findOne({
      documentId: courseId,
      populate: ['instructor'],
    });

    if (!course) return false;
    if (course.visibility === 'public') return true;
    
    const instructor = course.instructor as any;
    if (instructor?.documentId === userId) return true;

    const enrollment = await strapi.documents('api::enrollment.enrollment').findFirst({
      filters: {
        user: { documentId: userId },
        course: { documentId: courseId },
        status: { $in: ['active', 'completed'] },
      } as any,
    });

    return !!enrollment;
  },
}));
