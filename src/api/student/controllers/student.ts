import type { Core } from '@strapi/strapi';

const controller = ({ strapi }: { strapi: Core.Strapi }) => ({
  // Get student dashboard
  async getDashboard(ctx) {
    const user = ctx.state.user;

    if (!user) {
      return ctx.unauthorized('You must be logged in');
    }

    const enrollments = await strapi.documents('api::enrollment.enrollment').findMany({
      filters: { user: { documentId: user.documentId } } as any,
      populate: {
        course: {
          populate: ['thumbnail', 'instructor', 'category'],
        },
      },
    });

    const inProgress = enrollments.filter((e: any) => e.status === 'active');
    const completed = enrollments.filter((e: any) => e.status === 'completed');

    const certificates = await strapi.documents('api::certificate.certificate').findMany({
      filters: { user: { documentId: user.documentId } } as any,
      populate: ['course'],
    });

    return {
      data: {
        totalEnrollments: enrollments.length,
        inProgressCount: inProgress.length,
        completedCount: completed.length,
        certificates: certificates.length,
        enrollments,
        recentCertificates: certificates.slice(0, 5),
      },
    };
  },

  // Enroll in course (self-enrollment)
  async enrollInCourse(ctx) {
    const user = ctx.state.user;
    const { courseId } = ctx.params;

    if (!user) {
      return ctx.unauthorized('You must be logged in');
    }

    const course = await strapi.documents('api::course.course').findOne({
      documentId: courseId,
    });

    if (!course) {
      return ctx.notFound('Course not found');
    }

    if (!course.allowSelfEnrollment) {
      return ctx.forbidden('Self-enrollment is not allowed for this course');
    }

    if (course.visibility === 'private' || course.visibility === 'invite_only') {
      return ctx.forbidden('This course requires an invitation');
    }

    // Check enrollment dates
    const now = new Date();
    if (course.enrollmentStartDate && new Date(course.enrollmentStartDate) > now) {
      return ctx.badRequest('Enrollment has not started yet');
    }
    if (course.enrollmentEndDate && new Date(course.enrollmentEndDate) < now) {
      return ctx.badRequest('Enrollment period has ended');
    }

    // Check max enrollments
    if (course.maxEnrollments) {
      const currentCount = await strapi.documents('api::enrollment.enrollment').count({
        filters: { course: { documentId: courseId } } as any,
      });
      if (currentCount >= course.maxEnrollments) {
        return ctx.badRequest('Course has reached maximum enrollment capacity');
      }
    }

    // Check if already enrolled
    const existing = await strapi.documents('api::enrollment.enrollment').findFirst({
      filters: { 
        user: { documentId: user.documentId }, 
        course: { documentId: courseId } 
      } as any,
    });

    if (existing) {
      return ctx.badRequest('You are already enrolled in this course');
    }

    const enrollment = await strapi.documents('api::enrollment.enrollment').create({
      data: {
        user: user.documentId,
        course: courseId,
        enrollmentType: 'self',
        status: 'active',
        enrolledAt: new Date().toISOString(),
        progress: 0,
      } as any,
    });

    return { data: enrollment };
  },

  // Enroll using invite code
  async enrollWithInvite(ctx) {
    const user = ctx.state.user;
    const { code } = ctx.request.body as any;

    if (!user) {
      return ctx.unauthorized('You must be logged in');
    }

    if (!code) {
      return ctx.badRequest('Invite code is required');
    }

    const invite = await strapi.documents('api::invite.invite').findFirst({
      filters: { code } as any,
      populate: ['course', 'invitedBy'],
    });

    if (!invite) {
      return ctx.notFound('Invalid invite code');
    }

    const inviteData = invite as any;

    if (inviteData.status !== 'pending') {
      return ctx.badRequest('This invite code is no longer valid');
    }

    if (inviteData.expiresAt && new Date(inviteData.expiresAt) < new Date()) {
      return ctx.badRequest('This invite code has expired');
    }

    if (inviteData.usedCount >= inviteData.maxUses) {
      return ctx.badRequest('This invite code has reached its usage limit');
    }

    if (inviteData.email && inviteData.email !== user.email) {
      return ctx.forbidden('This invite code is for a different email address');
    }

    // Check if already enrolled
    const existing = await strapi.documents('api::enrollment.enrollment').findFirst({
      filters: { 
        user: { documentId: user.documentId }, 
        course: { documentId: inviteData.course.documentId } 
      } as any,
    });

    if (existing) {
      return ctx.badRequest('You are already enrolled in this course');
    }

    // Create enrollment
    const enrollment = await strapi.documents('api::enrollment.enrollment').create({
      data: {
        user: user.documentId,
        course: inviteData.course.documentId,
        enrollmentType: 'invite',
        status: 'active',
        enrolledAt: new Date().toISOString(),
        inviteCode: code,
        invitedBy: inviteData.invitedBy?.documentId,
        progress: 0,
      } as any,
    });

    // Update invite
    await strapi.documents('api::invite.invite').update({
      documentId: invite.documentId,
      data: {
        usedCount: inviteData.usedCount + 1,
        usedBy: user.documentId,
        acceptedAt: new Date().toISOString(),
        status: inviteData.usedCount + 1 >= inviteData.maxUses ? 'accepted' : 'pending',
      } as any,
    });

    return { data: enrollment };
  },

  // Mark lesson as complete
  async completeLesson(ctx) {
    const user = ctx.state.user;
    const { lessonId } = ctx.params;

    if (!user) {
      return ctx.unauthorized('You must be logged in');
    }

    const lesson = await strapi.documents('api::lesson.lesson').findOne({
      documentId: lessonId,
      populate: {
        module: {
          populate: ['course'],
        },
      },
    });

    if (!lesson) {
      return ctx.notFound('Lesson not found');
    }

    const lessonData = lesson as any;
    const courseId = lessonData.module?.course?.documentId;

    // Check enrollment
    const enrollment = await strapi.documents('api::enrollment.enrollment').findFirst({
      filters: { 
        user: { documentId: user.documentId }, 
        course: { documentId: courseId }, 
        status: 'active' 
      } as any,
    });

    if (!enrollment) {
      return ctx.forbidden('You are not enrolled in this course');
    }

    // Create or update progress
    let progress = await strapi.documents('api::progress.progress').findFirst({
      filters: { 
        user: { documentId: user.documentId }, 
        lesson: { documentId: lessonId } 
      } as any,
    });

    if (progress) {
      progress = await strapi.documents('api::progress.progress').update({
        documentId: progress.documentId,
        data: {
          status: 'completed',
          progressPercent: 100,
          completedAt: new Date().toISOString(),
          lastAccessedAt: new Date().toISOString(),
        } as any,
      });
    } else {
      progress = await strapi.documents('api::progress.progress').create({
        data: {
          user: user.documentId,
          course: courseId,
          module: lessonData.module?.documentId,
          lesson: lessonId,
          status: 'completed',
          progressPercent: 100,
          startedAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
          lastAccessedAt: new Date().toISOString(),
        } as any,
      });
    }

    // Update course progress
    await this.updateCourseProgress(ctx, courseId, user.documentId);

    return { data: progress };
  },

  // Update course progress helper
  async updateCourseProgress(ctx, courseId: string, userId: string) {
    const course = await strapi.documents('api::course.course').findOne({
      documentId: courseId,
      populate: {
        modules: {
          populate: ['lessons'],
        },
      },
    });

    if (!course) return;

    // Count total lessons
    let totalLessons = 0;
    const modules = (course as any).modules || [];
    for (const module of modules) {
      totalLessons += module.lessons?.length || 0;
    }

    if (totalLessons === 0) return;

    // Count completed lessons
    const completedProgress = await strapi.documents('api::progress.progress').findMany({
      filters: {
        user: { documentId: userId },
        course: { documentId: courseId },
        status: 'completed',
      } as any,
    });

    const completedLessons = completedProgress.filter((p: any) => p.lesson).length;
    const progressPercent = Math.round((completedLessons / totalLessons) * 100);

    // Update enrollment
    const enrollment = await strapi.documents('api::enrollment.enrollment').findFirst({
      filters: { 
        user: { documentId: userId }, 
        course: { documentId: courseId } 
      } as any,
    });

    if (enrollment) {
      const courseData = course as any;
      const isCompleted = progressPercent >= (courseData.completionPercentage || 100);
      
      await strapi.documents('api::enrollment.enrollment').update({
        documentId: enrollment.documentId,
        data: {
          progress: progressPercent,
          lastAccessedAt: new Date().toISOString(),
          status: isCompleted ? 'completed' : 'active',
          completedAt: isCompleted ? new Date().toISOString() : null,
        } as any,
      });

      // Issue certificate if completed and enabled
      if (isCompleted && courseData.certificateEnabled) {
        await this.issueCertificate(ctx, courseId, userId, enrollment.documentId);
      }
    }
  },

  // Issue certificate helper
  async issueCertificate(ctx, courseId: string, userId: string, enrollmentId: string) {
    // Check if certificate already exists
    const existing = await strapi.documents('api::certificate.certificate').findFirst({
      filters: { 
        user: { documentId: userId }, 
        course: { documentId: courseId } 
      } as any,
    });

    if (existing) return existing;

    const course = await strapi.documents('api::course.course').findOne({
      documentId: courseId,
    });

    const user = await strapi.documents('plugin::users-permissions.user').findOne({
      documentId: userId,
    });

    if (!course || !user) return null;

    const certificateNumber = `CERT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const certificate = await strapi.documents('api::certificate.certificate').create({
      data: {
        certificateNumber,
        user: userId,
        course: courseId,
        enrollment: enrollmentId,
        issuedAt: new Date().toISOString(),
        recipientName: (user as any).username,
        courseTitle: (course as any).title,
        completionDate: new Date().toISOString().split('T')[0],
        status: 'issued',
        verificationUrl: `/api/certificates/verify/${certificateNumber}`,
      } as any,
    });

    return certificate;
  },

  // Start quiz attempt
  async startQuiz(ctx) {
    const user = ctx.state.user;
    const { quizId } = ctx.params;

    if (!user) {
      return ctx.unauthorized('You must be logged in');
    }

    const quiz = await strapi.documents('api::quiz.quiz').findOne({
      documentId: quizId,
      populate: {
        course: true,
        questions: true,
      },
    });

    if (!quiz) {
      return ctx.notFound('Quiz not found');
    }

    const quizData = quiz as any;

    // Check enrollment
    const enrollment = await strapi.documents('api::enrollment.enrollment').findFirst({
      filters: { 
        user: { documentId: user.documentId }, 
        course: { documentId: quizData.course?.documentId }, 
        status: 'active' 
      } as any,
    });

    if (!enrollment) {
      return ctx.forbidden('You are not enrolled in this course');
    }

    // Check attempt limit
    const previousAttempts = await strapi.documents('api::quiz-attempt.quiz-attempt').findMany({
      filters: { 
        user: { documentId: user.documentId }, 
        quiz: { documentId: quizId } 
      } as any,
    });

    if (quizData.maxAttempts && previousAttempts.length >= quizData.maxAttempts) {
      return ctx.badRequest('You have reached the maximum number of attempts');
    }

    // Check for in-progress attempt
    const inProgress = previousAttempts.find((a: any) => a.status === 'in_progress');
    if (inProgress) {
      return {
        data: {
          attempt: inProgress,
          quiz: {
            ...quizData,
            questions: quizData.questions?.map((q: any) => ({
              ...q,
              correctAnswer: undefined, // Hide correct answers
            })),
          },
        },
      };
    }

    // Create new attempt
    const attempt = await strapi.documents('api::quiz-attempt.quiz-attempt').create({
      data: {
        user: user.documentId,
        quiz: quizId,
        attemptNumber: previousAttempts.length + 1,
        status: 'in_progress',
        startedAt: new Date().toISOString(),
        answers: {},
      } as any,
    });

    return {
      data: {
        attempt,
        quiz: {
          ...quizData,
          questions: quizData.questions?.map((q: any) => ({
            ...q,
            correctAnswer: undefined,
          })),
        },
      },
    };
  },

  // Submit quiz
  async submitQuiz(ctx) {
    const user = ctx.state.user;
    const { attemptId } = ctx.params;
    const { answers } = ctx.request.body as any;

    if (!user) {
      return ctx.unauthorized('You must be logged in');
    }

    const attempt = await strapi.documents('api::quiz-attempt.quiz-attempt').findOne({
      documentId: attemptId,
      populate: {
        quiz: {
          populate: ['questions'],
        },
        user: true,
      },
    });

    if (!attempt) {
      return ctx.notFound('Quiz attempt not found');
    }

    const attemptData = attempt as any;

    if (attemptData.user?.documentId !== user.documentId) {
      return ctx.forbidden('This is not your quiz attempt');
    }

    if (attemptData.status !== 'in_progress') {
      return ctx.badRequest('This quiz attempt has already been submitted');
    }

    // Grade the quiz
    let score = 0;
    let maxScore = 0;
    const gradedAnswers: any = {};

    for (const question of attemptData.quiz?.questions || []) {
      const questionId = question.documentId;
      const userAnswer = answers?.[questionId];
      const points = question.points || 1;
      maxScore += points;

      let isCorrect = false;

      switch (question.type) {
        case 'mcq_single':
        case 'true_false':
          isCorrect = userAnswer === question.correctAnswer;
          break;
        case 'mcq_multiple':
          const correctArr = Array.isArray(question.correctAnswer) ? question.correctAnswer : [];
          const userArr = Array.isArray(userAnswer) ? userAnswer : [];
          const correctSet = new Set(correctArr);
          const userSet = new Set(userArr);
          isCorrect = correctSet.size === userSet.size && 
            [...correctSet].every(v => userSet.has(v));
          break;
        case 'short_answer':
          const correctAnswers = Array.isArray(question.correctAnswer) 
            ? question.correctAnswer 
            : [question.correctAnswer];
          isCorrect = correctAnswers.some((ca: string) => 
            question.caseSensitive 
              ? userAnswer === ca 
              : userAnswer?.toLowerCase() === ca?.toLowerCase()
          );
          break;
      }

      if (isCorrect) {
        score += points;
      }

      gradedAnswers[questionId] = {
        userAnswer,
        isCorrect,
        points: isCorrect ? points : 0,
        explanation: question.explanation,
      };
    }

    const percentageScore = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
    const passed = percentageScore >= (attemptData.quiz?.passingScore || 70);

    const timeSpent = Math.round((Date.now() - new Date(attemptData.startedAt).getTime()) / 1000);

    const updated = await strapi.documents('api::quiz-attempt.quiz-attempt').update({
      documentId: attemptId,
      data: {
        status: 'graded',
        submittedAt: new Date().toISOString(),
        timeSpent,
        score,
        maxScore,
        percentageScore,
        passed,
        answers: gradedAnswers,
      } as any,
    });

    return {
      data: {
        attempt: updated,
        results: {
          score,
          maxScore,
          percentageScore,
          passed,
          answers: attemptData.quiz?.showCorrectAnswers ? gradedAnswers : undefined,
        },
      },
    };
  },

  // Get my progress for a course
  async getCourseProgress(ctx) {
    const user = ctx.state.user;
    const { courseId } = ctx.params;

    if (!user) {
      return ctx.unauthorized('You must be logged in');
    }

    const enrollment = await strapi.documents('api::enrollment.enrollment').findFirst({
      filters: { 
        user: { documentId: user.documentId }, 
        course: { documentId: courseId } 
      } as any,
    });

    if (!enrollment) {
      return ctx.notFound('You are not enrolled in this course');
    }

    const progress = await strapi.documents('api::progress.progress').findMany({
      filters: { 
        user: { documentId: user.documentId }, 
        course: { documentId: courseId } 
      } as any,
      populate: ['lesson', 'module'],
    });

    const quizAttempts = await strapi.documents('api::quiz-attempt.quiz-attempt').findMany({
      filters: { 
        user: { documentId: user.documentId }, 
        quiz: { course: { documentId: courseId } } 
      } as any,
      populate: ['quiz'],
    });

    return {
      data: {
        enrollment,
        lessonProgress: progress,
        quizAttempts,
      },
    };
  },

  // Get my certificates
  async getMyCertificates(ctx) {
    const user = ctx.state.user;

    if (!user) {
      return ctx.unauthorized('You must be logged in');
    }

    const certificates = await strapi.documents('api::certificate.certificate').findMany({
      filters: { user: { documentId: user.documentId } } as any,
      populate: ['course'],
    });

    return { data: certificates };
  },

  // Get/Update my profile
  async getProfile(ctx) {
    const user = ctx.state.user;

    if (!user) {
      return ctx.unauthorized('You must be logged in');
    }

    let profile = await strapi.documents('api::user-profile.user-profile').findFirst({
      filters: { user: { documentId: user.documentId } } as any,
      populate: ['avatar'],
    });

    if (!profile) {
      profile = await strapi.documents('api::user-profile.user-profile').create({
        data: {
          user: user.documentId,
        } as any,
      });
    }

    // Sanitize user - remove sensitive fields
    const { password, resetPasswordToken, confirmationToken, ...safeUser } = user as any;
    
    return { data: { user: safeUser, profile } };
  },

  async updateProfile(ctx) {
    const user = ctx.state.user;
    const data = (ctx.request.body as any).data;

    if (!user) {
      return ctx.unauthorized('You must be logged in');
    }

    let profile = await strapi.documents('api::user-profile.user-profile').findFirst({
      filters: { user: { documentId: user.documentId } } as any,
    });

    if (profile) {
      profile = await strapi.documents('api::user-profile.user-profile').update({
        documentId: profile.documentId,
        data,
      });
    } else {
      profile = await strapi.documents('api::user-profile.user-profile').create({
        data: {
          ...data,
          user: user.documentId,
        } as any,
      });
    }

    return { data: profile };
  },

  // Browse available courses
  async browseCourses(ctx) {
    const { 
      page = 1, 
      pageSize = 12, 
      category, 
      search, 
      difficulty,
      sort = 'createdAt:desc' 
    } = ctx.query as any;

    const filters: any = {
      visibility: 'public',
      status: 'published',
    };

    if (category) filters.category = { documentId: category };
    if (difficulty) filters.difficulty = difficulty;
    if (search) {
      filters.$or = [
        { title: { $containsi: search } },
        { shortDescription: { $containsi: search } },
      ];
    }

    const [sortField, sortOrder] = (sort as string).split(':');

    const courses = await strapi.documents('api::course.course').findMany({
      filters,
      populate: ['thumbnail', 'category', 'instructor', 'tags'],
      limit: Number(pageSize),
      start: (Number(page) - 1) * Number(pageSize),
      sort: { [sortField]: sortOrder || 'desc' } as any,
    });

    const total = await strapi.documents('api::course.course').count({ filters });

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
});

export default controller;
