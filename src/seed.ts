import type { Core } from '@strapi/strapi';

const seedData = async (strapi: Core.Strapi) => {
  console.log('🌱 Starting seed...');

  // Create Categories
  console.log('Creating categories...');
  const categories = [
    { name: 'Web Development', slug: 'web-development', description: 'Learn modern web development technologies' },
    { name: 'Mobile Development', slug: 'mobile-development', description: 'Build iOS and Android applications' },
    { name: 'Data Science', slug: 'data-science', description: 'Master data analysis and machine learning' },
    { name: 'Business', slug: 'business', description: 'Business and entrepreneurship courses' },
    { name: 'Design', slug: 'design', description: 'UI/UX and graphic design courses' },
  ];

  const createdCategories: any[] = [];
  for (const cat of categories) {
    const created = await strapi.documents('api::category.category').create({
      data: cat as any,
      status: 'published',
    });
    createdCategories.push(created);
  }
  console.log('Created ' + createdCategories.length + ' categories');

  // Create Tags
  console.log('Creating tags...');
  const tags = [
    { name: 'JavaScript', slug: 'javascript' },
    { name: 'Python', slug: 'python' },
    { name: 'React', slug: 'react' },
    { name: 'Node.js', slug: 'nodejs' },
    { name: 'Machine Learning', slug: 'machine-learning' },
    { name: 'SQL', slug: 'sql' },
    { name: 'CSS', slug: 'css' },
    { name: 'TypeScript', slug: 'typescript' },
    { name: 'AWS', slug: 'aws' },
    { name: 'Docker', slug: 'docker' },
  ];

  const createdTags: any[] = [];
  for (const tag of tags) {
    const created = await strapi.documents('api::tag.tag').create({
      data: tag as any,
    });
    createdTags.push(created);
  }
  console.log('Created ' + createdTags.length + ' tags');

  // Create Users (Instructors & Students)
  console.log('Creating users...');
  const users = [
    { username: 'john_instructor', email: 'john@example.com', password: 'Password123!', isInstructor: true },
    { username: 'sarah_instructor', email: 'sarah@example.com', password: 'Password123!', isInstructor: true },
    { username: 'mike_student', email: 'mike@example.com', password: 'Password123!', isInstructor: false },
    { username: 'emma_student', email: 'emma@example.com', password: 'Password123!', isInstructor: false },
    { username: 'alex_student', email: 'alex@example.com', password: 'Password123!', isInstructor: false },
  ];

  const authenticatedRole = await strapi.db.query('plugin::users-permissions.role').findOne({
    where: { type: 'authenticated' },
  });

  const createdUsers: any[] = [];
  for (const user of users) {
    const created = await strapi.documents('plugin::users-permissions.user').create({
      data: {
        username: user.username,
        email: user.email,
        password: user.password,
        provider: 'local',
        confirmed: true,
        blocked: false,
        role: authenticatedRole.id,
      } as any,
    });
    createdUsers.push({ ...created, isInstructor: user.isInstructor });
    
    // Create user profile
    const firstName = user.username.split('_')[0];
    await strapi.documents('api::user-profile.user-profile').create({
      data: {
        user: created.documentId,
        firstName: firstName.charAt(0).toUpperCase() + firstName.slice(1),
        lastName: user.isInstructor ? 'Instructor' : 'Student',
        bio: user.isInstructor ? 'Experienced instructor with 10+ years in the industry' : 'Passionate learner',
        headline: user.isInstructor ? 'Senior Instructor' : 'Student',
        isInstructor: user.isInstructor,
        instructorVerified: user.isInstructor,
      } as any,
    });
  }
  console.log('Created ' + createdUsers.length + ' users');

  const instructors = createdUsers.filter(u => u.isInstructor);
  const students = createdUsers.filter(u => !u.isInstructor);

  // Create Courses
  console.log('Creating courses...');
  const coursesData = [
    {
      title: 'Complete JavaScript Mastery',
      slug: 'complete-javascript-mastery',
      description: '<p>Master JavaScript from basics to advanced concepts including ES6+, async programming, and more.</p>',
      shortDescription: 'Become a JavaScript expert with this comprehensive course',
      difficulty: 'beginner',
      visibility: 'public',
      status: 'published',
      allowSelfEnrollment: true,
      certificateEnabled: true,
      isFree: false,
      price: 49.99,
      duration: 2400,
      category: createdCategories[0].documentId,
      instructor: instructors[0].documentId,
    },
    {
      title: 'React & Redux Complete Guide',
      slug: 'react-redux-complete-guide',
      description: '<p>Build modern web applications with React and Redux from scratch.</p>',
      shortDescription: 'Learn React and Redux by building real projects',
      difficulty: 'intermediate',
      visibility: 'public',
      status: 'published',
      allowSelfEnrollment: true,
      certificateEnabled: true,
      isFree: false,
      price: 79.99,
      duration: 3600,
      category: createdCategories[0].documentId,
      instructor: instructors[0].documentId,
    },
    {
      title: 'Python for Data Science',
      slug: 'python-data-science',
      description: '<p>Learn Python programming with a focus on data science, pandas, numpy, and visualization.</p>',
      shortDescription: 'Master Python for data analysis and visualization',
      difficulty: 'beginner',
      visibility: 'public',
      status: 'published',
      allowSelfEnrollment: true,
      certificateEnabled: true,
      isFree: true,
      duration: 1800,
      category: createdCategories[2].documentId,
      instructor: instructors[1].documentId,
    },
    {
      title: 'Machine Learning A-Z',
      slug: 'machine-learning-az',
      description: '<p>Comprehensive machine learning course covering supervised, unsupervised learning, and deep learning.</p>',
      shortDescription: 'From zero to ML hero',
      difficulty: 'advanced',
      visibility: 'public',
      status: 'published',
      allowSelfEnrollment: true,
      certificateEnabled: true,
      isFree: false,
      price: 129.99,
      duration: 5400,
      category: createdCategories[2].documentId,
      instructor: instructors[1].documentId,
    },
    {
      title: 'Node.js Backend Development',
      slug: 'nodejs-backend-development',
      description: '<p>Build scalable backend applications with Node.js, Express, and databases.</p>',
      shortDescription: 'Become a backend developer with Node.js',
      difficulty: 'intermediate',
      visibility: 'public',
      status: 'published',
      allowSelfEnrollment: true,
      certificateEnabled: true,
      isFree: false,
      price: 69.99,
      duration: 2700,
      category: createdCategories[0].documentId,
      instructor: instructors[0].documentId,
    },
  ];

  const createdCourses: any[] = [];
  for (const course of coursesData) {
    const created = await strapi.documents('api::course.course').create({
      data: course as any,
      status: 'published',
    });
    createdCourses.push(created);
  }
  console.log('Created ' + createdCourses.length + ' courses');

  // Create Modules and Lessons for each course
  console.log('Creating modules and lessons...');
  let totalModules = 0;
  let totalLessons = 0;
  const moduleNames = ['Introduction', 'Core Concepts', 'Advanced Topics', 'Practical Applications', 'Final Project'];
  const lessonNames = ['Getting Started', 'Deep Dive', 'Hands-on Practice', 'Quiz Time', 'Summary', 'Challenge'];

  for (const course of createdCourses) {
    const moduleCount = Math.floor(Math.random() * 3) + 3;
    
    for (let m = 1; m <= moduleCount; m++) {
      const module = await strapi.documents('api::module.module').create({
        data: {
          title: 'Module ' + m + ': ' + (moduleNames[m-1] || 'Bonus Content'),
          slug: 'module-' + m + '-' + course.slug,
          description: 'This module covers essential concepts for ' + course.title,
          sortOrder: m,
          duration: Math.floor(Math.random() * 60) + 30,
          course: course.documentId,
        } as any,
        status: 'published',
      });
      totalModules++;

      const lessonCount = Math.floor(Math.random() * 4) + 3;
      for (let l = 1; l <= lessonCount; l++) {
        await strapi.documents('api::lesson.lesson').create({
          data: {
            title: 'Lesson ' + l + ': ' + (lessonNames[l-1] || 'Extra Content'),
            slug: 'lesson-' + m + '-' + l + '-' + course.slug,
            description: 'Learn important concepts in this lesson',
            content: '<p>This is the content for lesson ' + l + ' of module ' + m + '. Here you will learn key concepts and practice with examples.</p><p>Key points:</p><ul><li>Point 1</li><li>Point 2</li><li>Point 3</li></ul>',
            sortOrder: l,
            duration: Math.floor(Math.random() * 20) + 10,
            isRequired: l <= 3,
            module: module.documentId,
          } as any,
          status: 'published',
        });
        totalLessons++;
      }
    }
  }
  console.log('Created ' + totalModules + ' modules and ' + totalLessons + ' lessons');

  // Create Quizzes and Questions
  console.log('Creating quizzes and questions...');
  let totalQuizzes = 0;
  let totalQuestions = 0;

  for (const course of createdCourses) {
    const quiz = await strapi.documents('api::quiz.quiz').create({
      data: {
        title: course.title + ' - Final Assessment',
        description: 'Test your knowledge from this course',
        instructions: '<p>Answer all questions. You need 70% to pass.</p>',
        type: 'quiz',
        passingScore: 70,
        maxAttempts: 3,
        timeLimit: 30,
        isTimed: true,
        shuffleQuestions: true,
        showCorrectAnswers: true,
        isRequired: true,
        course: course.documentId,
      } as any,
      status: 'published',
    });
    totalQuizzes++;

    const questions = [
      { text: 'What is the main purpose of this course?', type: 'mcq_single', options: ['Learning', 'Entertainment', 'Both', 'None'], correctAnswer: ['Learning'] },
      { text: 'This course is suitable for beginners.', type: 'true_false', options: ['True', 'False'], correctAnswer: [true] },
      { text: 'Name one key concept from this course.', type: 'short_answer', options: null, correctAnswer: ['concept', 'learning', 'practice'] },
      { text: 'Which topics are covered?', type: 'mcq_multiple', options: ['Theory', 'Practice', 'Projects', 'Games'], correctAnswer: ['Theory', 'Practice', 'Projects'] },
      { text: 'Rate your understanding of the material.', type: 'mcq_single', options: ['Excellent', 'Good', 'Fair', 'Poor'], correctAnswer: ['Good'] },
    ];

    for (let q = 0; q < questions.length; q++) {
      await strapi.documents('api::question.question').create({
        data: {
          text: questions[q].text,
          type: questions[q].type,
          points: questions[q].type === 'mcq_multiple' ? 2 : 1,
          sortOrder: q + 1,
          options: questions[q].options,
          correctAnswer: questions[q].correctAnswer,
          explanation: 'This is the correct answer based on course content.',
          quiz: quiz.documentId,
        } as any,
      });
      totalQuestions++;
    }
  }
  console.log('Created ' + totalQuizzes + ' quizzes and ' + totalQuestions + ' questions');

  // Create Enrollments
  console.log('Creating enrollments...');
  let totalEnrollments = 0;

  for (const student of students) {
    const coursesToEnroll = createdCourses.slice(0, Math.floor(Math.random() * 2) + 2);
    
    for (const course of coursesToEnroll) {
      const progress = Math.floor(Math.random() * 100);
      const status = progress === 100 ? 'completed' : 'active';
      
      await strapi.documents('api::enrollment.enrollment').create({
        data: {
          user: student.documentId,
          course: course.documentId,
          enrollmentType: 'self',
          status,
          enrolledAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
          progress,
          lastAccessedAt: new Date().toISOString(),
          completedAt: status === 'completed' ? new Date().toISOString() : null,
        } as any,
      });
      totalEnrollments++;
    }
  }
  console.log('Created ' + totalEnrollments + ' enrollments');

  // Create some invites
  console.log('Creating invite codes...');
  for (let i = 0; i < 2; i++) {
    const course = createdCourses[i];
    const code = 'INVITE-' + course.slug.toUpperCase().slice(0, 8) + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
    await strapi.documents('api::invite.invite').create({
      data: {
        code: code,
        course: course.documentId,
        invitedBy: instructors[0].documentId,
        maxUses: 10,
        usedCount: 0,
        status: 'pending',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        message: 'You have been invited to join this course!',
      } as any,
    });
  }
  console.log('Created invite codes');

  console.log('\n🎉 Seed complete!');
};

export default seedData;

