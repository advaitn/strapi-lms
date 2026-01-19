/**
 * Clinic Launch Academy - Seed Data
 * Creates instructors, categories, courses, modules, lessons, and quizzes
 */

// Helper to create blocks content from plain text
function textToBlocks(text: string) {
  return [
    {
      type: 'paragraph',
      children: [{ type: 'text', text }],
    },
  ];
}

export default async function seedCLA(strapi: any) {
  console.log('🚀 Starting Clinic Launch Academy seed...');

  // Clear existing data
  console.log('🗑️ Clearing existing data...');
  
  const tablesToClear = [
    'api::quiz-attempt.quiz-attempt',
    'api::progress.progress',
    'api::certificate.certificate',
    'api::enrollment.enrollment',
    'api::question.question',
    'api::quiz.quiz',
    'api::content-item.content-item',
    'api::lesson.lesson',
    'api::module.module',
    'api::invite.invite',
    'api::course.course',
    'api::category.category',
    'api::tag.tag',
    'api::user-profile.user-profile',
  ];

  for (const table of tablesToClear) {
    try {
      const items = await strapi.documents(table).findMany({ limit: 1000 });
      for (const item of items) {
        await strapi.documents(table).delete({ documentId: item.documentId });
      }
      console.log(`  Cleared ${table}`);
    } catch (e) {
      console.log(`  Skipped ${table}`);
    }
  }

  // Clear users except admin
  const users = await strapi.documents('plugin::users-permissions.user').findMany({ limit: 1000 });
  for (const user of users) {
    if (!user.email?.includes('advait')) {
      try {
        await strapi.documents('plugin::users-permissions.user').delete({ documentId: user.documentId });
      } catch (e) {}
    }
  }

  console.log('✅ Data cleared');

  // Create instructors
  console.log('👥 Creating instructors...');
  
  const instructorsData = [
    { username: 'mark_suh', email: 'mark@cliniclaunch.com', firstName: 'Mark', lastName: 'Suh', bio: 'Founder & Lead Instructor at Clinic Launch Academy. Expert in business mindset, operations, and scaling strategies.' },
    { username: 'oliver_ibrahim', email: 'oliver@cliniclaunch.com', firstName: 'Oliver', lastName: 'Ibrahim', bio: 'Paid advertising specialist with expertise in Facebook, Google, and YouTube ads for medical practices.' },
    { username: 'ash_rahman', email: 'ash@cliniclaunch.com', firstName: 'Ash', lastName: 'Rahman', bio: 'Cold outreach and lead generation expert. Master of LinkedIn and email strategies for B2B sales.' },
    { username: 'jimmy_sales', email: 'jimmy@cliniclaunch.com', firstName: 'Jimmy', lastName: '', bio: 'Sales closing expert specializing in high-ticket B2B deals and the psychology of connection.' },
    { username: 'rami_copy', email: 'rami@cliniclaunch.com', firstName: 'Rami', lastName: '', bio: 'Copywriting specialist focused on persuasive messaging for medical professionals.' },
  ];

  const instructors: any = {};
  
  for (const inst of instructorsData) {
    const user = await strapi.documents('plugin::users-permissions.user').create({
      data: {
        username: inst.username,
        email: inst.email,
        password: 'Instructor@123',
        confirmed: true,
        blocked: false,
        provider: 'local',
        role: 1, // Authenticated role
      },
    });

    // Create user profile
    await strapi.documents('api::user-profile.user-profile').create({
      data: {
        user: user.documentId,
        firstName: inst.firstName,
        lastName: inst.lastName,
        displayName: `${inst.firstName} ${inst.lastName}`.trim(),
        bio: inst.bio,
        headline: 'Instructor',
        isInstructor: true,
        instructorVerified: true,
      },
      status: 'published',
    });

    instructors[inst.username] = user;
    console.log(`  Created instructor: ${inst.username}`);
  }

  // Create categories
  console.log('📁 Creating categories...');
  
  const categoriesData = [
    { name: 'Mindset', slug: 'mindset', description: 'Mental frameworks and discipline for success', sortOrder: 1 },
    { name: 'Branding', slug: 'branding', description: 'Personal brand and authority positioning', sortOrder: 2 },
    { name: 'Paid Advertising', slug: 'paid-advertising', description: 'Paid ads strategies for clinic acquisition', sortOrder: 3 },
    { name: 'Lead Generation', slug: 'lead-generation', description: 'Cold outreach and prospecting techniques', sortOrder: 4 },
    { name: 'Sales', slug: 'sales', description: 'Sales techniques and closing mastery', sortOrder: 5 },
    { name: 'Implementation', slug: 'implementation', description: 'Step-by-step execution playbooks', sortOrder: 6 },
    { name: 'Operations', slug: 'operations', description: 'Business operations and logistics', sortOrder: 7 },
    { name: 'Scaling', slug: 'scaling', description: 'Advanced growth and scaling strategies', sortOrder: 8 },
    { name: 'Communication', slug: 'communication', description: 'Copywriting and messaging skills', sortOrder: 9 },
  ];

  const categories: any = {};
  
  for (const cat of categoriesData) {
    const category = await strapi.documents('api::category.category').create({
      data: cat,
      status: 'published',
    });
    categories[cat.slug] = category;
    console.log(`  Created category: ${cat.name}`);
  }

  // Course definitions
  const coursesData = [
    {
      title: 'CEO Mindset & Discipline Protocol',
      slug: 'ceo-mindset-discipline-protocol',
      shortDescription: 'Before you can earn like a top 1%er, you have to think like one. Rewire your mindset for wealth and build unstoppable daily habits.',
      description: '<p>Before you can earn like a top 1%er, you have to think like one. This comprehensive course will completely rewire your mindset for wealth and help you build unstoppable daily habits that separate high performers from everyone else.</p>',
      category: 'mindset',
      instructor: 'mark_suh',
      sortOrder: 1,
      modules: [
        {
          title: 'Rewiring Your Mindset for Wealth',
          lessons: [
            { title: 'The Psychology of High-Income Earners', description: 'Understand how top earners think differently' },
            { title: 'Identifying and Eliminating Limiting Beliefs', description: 'Break free from self-imposed barriers' },
            { title: 'The Wealth Identity Shift', description: 'Becoming the person who deserves success' },
          ]
        },
        {
          title: '75 Hard Facilitator Mode',
          lessons: [
            { title: 'Introduction to 75 Hard', description: 'The discipline system that transforms lives' },
            { title: 'Building Unstoppable Daily Habits', description: 'Create routines that guarantee success' },
            { title: 'Mental Toughness Training', description: 'Develop resilience that lasts' },
          ]
        },
        {
          title: 'Eliminating Self-Doubt',
          lessons: [
            { title: 'The Science of Confidence', description: 'Understand where confidence comes from' },
            { title: 'Overcoming Imposter Syndrome', description: 'Silence your inner critic' },
            { title: 'Taking Massive Action Despite Fear', description: 'Move forward even when afraid' },
          ]
        },
      ],
      quiz: {
        title: 'CEO Mindset Assessment',
        questions: [
          { text: 'What is the primary difference between wealthy and average mindsets?', type: 'mcq_single', options: ['Luck', 'Education', 'Belief systems and habits', 'Family background'], correctAnswer: 'Belief systems and habits' },
          { text: 'The 75 Hard program focuses primarily on physical fitness only.', type: 'true_false', correctAnswer: 'false' },
          { text: 'What is the first step to eliminating limiting beliefs?', type: 'mcq_single', options: ['Ignore them', 'Identify them', 'Accept them', 'Share them'], correctAnswer: 'Identify them' },
        ]
      }
    },
    {
      title: 'Trusted Facilitator Positioning System',
      slug: 'trusted-facilitator-positioning-system',
      shortDescription: 'Build an irresistible professional brand that positions you as a leading authority in healthcare facilitation.',
      description: '<p>Build an irresistible professional brand that positions you as a leading authority in healthcare facilitation. Learn to attract high-value partners instead of chasing them.</p>',
      category: 'branding',
      instructor: 'mark_suh',
      sortOrder: 2,
      modules: [
        {
          title: 'Creating Your Authority Positioning',
          lessons: [
            { title: 'Defining Your Unique Value Proposition', description: 'What makes you different and valuable' },
            { title: 'Building Your Expert Persona', description: 'Craft an irresistible professional identity' },
            { title: 'The Trust Triangle Framework', description: 'Three pillars of professional credibility' },
          ]
        },
        {
          title: 'LinkedIn & Social Media Mastery',
          lessons: [
            { title: 'Optimizing Your LinkedIn Profile', description: 'Turn your profile into a lead magnet' },
            { title: 'Content Strategy for Authority', description: 'What to post and when' },
            { title: 'Building a Network of Decision Makers', description: 'Connect with the right people' },
          ]
        },
        {
          title: 'B2B Personal Branding',
          lessons: [
            { title: 'Building Trust with Medical Professionals', description: 'Speak their language and earn respect' },
            { title: 'Attracting vs Chasing High-Value Partners', description: 'Become the hunted, not the hunter' },
            { title: 'Your 90-Day Brand Launch Plan', description: 'Step-by-step execution roadmap' },
          ]
        },
      ],
      quiz: {
        title: 'Personal Branding Assessment',
        questions: [
          { text: 'What is the most important element of a LinkedIn profile for B2B?', type: 'mcq_single', options: ['Profile picture', 'Headline and summary', 'Number of connections', 'Endorsements'], correctAnswer: 'Headline and summary' },
          { text: 'Authority positioning requires years of experience before starting.', type: 'true_false', correctAnswer: 'false' },
        ]
      }
    },
    {
      title: 'Clinic Magnet Paid Ads Engine',
      slug: 'clinic-magnet-paid-ads-engine',
      shortDescription: 'Build a predictable, scalable client acquisition machine using paid advertising to target high-value medical practices.',
      description: '<p>Build a predictable, scalable client acquisition machine using paid advertising to target high-value medical practices. Master Facebook, Google, and YouTube ads specifically for clinic targeting.</p>',
      category: 'paid-advertising',
      instructor: 'oliver_ibrahim',
      sortOrder: 3,
      modules: [
        {
          title: 'Facebook Ads for Clinic Targeting',
          lessons: [
            { title: 'Facebook Ads Fundamentals', description: 'Understanding the platform for B2B' },
            { title: 'Targeting Medical Practice Owners', description: 'Find decision-makers on Facebook' },
            { title: 'Creating High-Converting Ad Creatives', description: 'Ads that stop the scroll' },
          ]
        },
        {
          title: 'Google Ads Strategy',
          lessons: [
            { title: 'Google Ads for Medical Practices', description: 'Search and display strategies' },
            { title: 'Keyword Research for Clinics', description: 'Find what your prospects search for' },
            { title: 'Landing Page Optimization', description: 'Convert clicks into leads' },
          ]
        },
        {
          title: 'YouTube Ads & Scaling',
          lessons: [
            { title: 'YouTube Ads Funnel Optimization', description: 'Video advertising that converts' },
            { title: 'Retargeting Strategies', description: 'Stay top of mind with prospects' },
            { title: 'Scaling Profitable Campaigns', description: 'Multiply what works' },
          ]
        },
      ],
      quiz: {
        title: 'Paid Advertising Assessment',
        questions: [
          { text: 'Which platform is best for targeting clinic owners by job title?', type: 'mcq_single', options: ['Google Ads', 'Facebook/LinkedIn', 'YouTube', 'TikTok'], correctAnswer: 'Facebook/LinkedIn' },
          { text: 'You should scale a campaign before testing its profitability.', type: 'true_false', correctAnswer: 'false' },
        ]
      }
    },
    {
      title: 'Cold Outreach Mastery',
      slug: 'cold-outreach-mastery',
      shortDescription: 'Master the art of cold outreach to clinics and medical practices. Learn how to craft irresistible messages that get responses.',
      description: '<p>Master the art of cold outreach to clinics and medical practices. Learn how to craft irresistible messages that get responses and build rapport from scratch.</p>',
      category: 'lead-generation',
      instructor: 'ash_rahman',
      sortOrder: 4,
      modules: [
        {
          title: 'Cold Email Strategies',
          lessons: [
            { title: 'Cold Email Fundamentals', description: 'The anatomy of emails that get opened' },
            { title: 'Subject Lines That Convert', description: 'Get past the inbox gatekeeper' },
            { title: 'The Perfect Cold Email Template', description: 'Proven frameworks that work' },
          ]
        },
        {
          title: 'LinkedIn Outreach',
          lessons: [
            { title: 'LinkedIn Outreach for Medical Professionals', description: 'Connect with doctors and practice managers' },
            { title: 'Connection Request Strategies', description: 'Get accepted, not ignored' },
            { title: 'Direct Message Frameworks', description: 'Start conversations that lead to calls' },
          ]
        },
        {
          title: 'Follow-Up & Rapport Building',
          lessons: [
            { title: 'Follow-Up Sequences That Convert', description: 'The fortune is in the follow-up' },
            { title: 'Building Rapport from Scratch', description: 'Create genuine connections quickly' },
            { title: 'Multi-Channel Outreach Strategy', description: 'Combine email, LinkedIn, and phone' },
          ]
        },
      ],
      quiz: {
        title: 'Cold Outreach Assessment',
        questions: [
          { text: 'What is the ideal length for a cold email?', type: 'mcq_single', options: ['As long as needed', '50-125 words', '500+ words', 'One sentence'], correctAnswer: '50-125 words' },
          { text: 'Most sales are made on the first outreach attempt.', type: 'true_false', correctAnswer: 'false' },
        ]
      }
    },
    {
      title: 'Sales, Setting & Closing Mastery',
      slug: 'sales-setting-closing-mastery',
      shortDescription: 'Learn the art and science of high-value B2B sales. Navigate any conversation with confidence and close deals like a pro.',
      description: '<p>Learn the art and science of high-value B2B sales. Navigate any conversation with confidence and close deals like a pro. This is a skill that will pay you for life.</p>',
      category: 'sales',
      instructor: 'jimmy_sales',
      sortOrder: 5,
      modules: [
        {
          title: 'The Psychology of Connection',
          lessons: [
            { title: 'Understanding Buyer Psychology', description: 'Why people really buy' },
            { title: 'Building Instant Rapport', description: 'Connect deeply in minutes' },
            { title: 'The Art of Active Listening', description: 'Hear what they really mean' },
          ]
        },
        {
          title: 'Navigating Sales Conversations',
          lessons: [
            { title: 'Discovery Call Framework', description: 'Ask questions that reveal needs' },
            { title: 'Presenting Your Solution', description: 'Position your offer perfectly' },
            { title: 'Handling Objections with Ease', description: 'Turn "no" into "yes"' },
          ]
        },
        {
          title: 'High-Ticket Closing',
          lessons: [
            { title: 'Guiding Clinics to a "Yes"', description: 'Lead them to the right decision' },
            { title: 'High-Ticket Closing Techniques', description: 'Close deals worth $10k+' },
            { title: 'Post-Close Relationship Building', description: 'Turn clients into referral sources' },
          ]
        },
      ],
      quiz: {
        title: 'Sales Mastery Assessment',
        questions: [
          { text: 'What should you do FIRST in a sales conversation?', type: 'mcq_single', options: ['Pitch your product', 'Build rapport and listen', 'Discuss pricing', 'Share testimonials'], correctAnswer: 'Build rapport and listen' },
          { text: 'Objections are a sign the prospect is not interested.', type: 'true_false', correctAnswer: 'false' },
        ]
      }
    },
    {
      title: "The Connector's Playbook",
      slug: 'the-connectors-playbook',
      shortDescription: 'Your complete step-by-step guide to connecting clinics with peptide suppliers and earning recurring commissions.',
      description: '<p>Your complete step-by-step guide to connecting clinics with peptide suppliers and earning recurring commissions. Everything you need to execute the connector model.</p>',
      category: 'implementation',
      instructor: 'mark_suh',
      sortOrder: 6,
      modules: [
        {
          title: 'Finding & Qualifying Prospects',
          lessons: [
            { title: 'Finding Qualified Clinic Prospects', description: 'Where to find the right clinics' },
            { title: 'Qualifying Decision-Makers', description: 'Talk to people who can say yes' },
            { title: 'Building Your Prospect List', description: 'Create a pipeline of opportunities' },
          ]
        },
        {
          title: 'Outreach & Positioning',
          lessons: [
            { title: 'Initial Outreach and Positioning', description: 'First impressions that open doors' },
            { title: 'The Connector Value Proposition', description: 'Why clinics need you' },
            { title: 'Scheduling the Introduction Call', description: 'Get them on the phone' },
          ]
        },
        {
          title: 'Introduction & Follow-Up',
          lessons: [
            { title: 'The Introduction and Handoff Process', description: 'Seamlessly connect clinic and supplier' },
            { title: 'Following Up for Maximum Conversions', description: 'Stay engaged until close' },
            { title: 'Building Long-Term Relationships', description: 'Create recurring revenue streams' },
          ]
        },
      ],
      quiz: {
        title: "Connector's Playbook Assessment",
        questions: [
          { text: 'What is the primary role of a connector?', type: 'mcq_single', options: ['Selling products', 'Building relationships between clinics and suppliers', 'Running ads', 'Writing copy'], correctAnswer: 'Building relationships between clinics and suppliers' },
          { text: 'You should stop following up after the first introduction.', type: 'true_false', correctAnswer: 'false' },
        ]
      }
    },
    {
      title: 'Plug & Play Logistics Network',
      slug: 'plug-play-logistics-network',
      shortDescription: 'Immediate access to our exclusive multi-million dollar supply chain and fulfillment partners. Everything done for you.',
      description: '<p>Immediate access to our exclusive multi-million dollar supply chain and fulfillment partners. Everything done for you with white-glove service.</p>',
      category: 'operations',
      instructor: 'mark_suh',
      sortOrder: 7,
      modules: [
        {
          title: 'Supplier Network Access',
          lessons: [
            { title: 'Vetted Network of Peptide Suppliers', description: 'Access our exclusive supplier list' },
            { title: 'Licensed Pharmacy Partnerships', description: 'Work with compliant partners' },
            { title: 'Pre-Negotiated Off-Market Pricing', description: 'Leverage our volume discounts' },
          ]
        },
        {
          title: 'Quality & Compliance',
          lessons: [
            { title: 'Quality Control and Compliance', description: 'Ensure everything is above board' },
            { title: 'Documentation and Paperwork', description: 'Handle the administrative side' },
            { title: 'Regulatory Considerations', description: 'Stay compliant in every state' },
          ]
        },
        {
          title: 'Fulfillment Process',
          lessons: [
            { title: 'White-Glove Fulfillment Process', description: 'End-to-end delivery handled' },
            { title: 'Order Management System', description: 'Track every order seamlessly' },
            { title: 'Troubleshooting Common Issues', description: 'Handle problems before they escalate' },
          ]
        },
      ],
      quiz: {
        title: 'Operations Assessment',
        questions: [
          { text: 'What is the main benefit of using the pre-vetted supplier network?', type: 'mcq_single', options: ['Cheaper prices only', 'Compliance, quality, and pre-negotiated pricing', 'Faster shipping', 'More product variety'], correctAnswer: 'Compliance, quality, and pre-negotiated pricing' },
          { text: 'Compliance is optional when working with peptide suppliers.', type: 'true_false', correctAnswer: 'false' },
        ]
      }
    },
    {
      title: 'Elite Operator Protocol',
      slug: 'elite-operator-protocol',
      shortDescription: 'Advanced strategies for scaling to $100k+ per month and building a sustainable business empire.',
      description: '<p>Advanced strategies for scaling to $100k+ per month and building a sustainable business empire. Learn to build teams, automate, and create multiple revenue streams.</p>',
      category: 'scaling',
      instructor: 'mark_suh',
      sortOrder: 8,
      modules: [
        {
          title: 'Scaling Your Business',
          lessons: [
            { title: 'Scaling Your Connector Business', description: 'Go from 5 to 6 figures monthly' },
            { title: 'Identifying Scaling Bottlenecks', description: 'Find and fix what holds you back' },
            { title: 'Revenue Multiplication Strategies', description: 'Multiple ways to increase income' },
          ]
        },
        {
          title: 'Team Building & Automation',
          lessons: [
            { title: 'Building a Team of Connectors', description: 'Hire and train your own team' },
            { title: 'Automation and Systems', description: 'Work smarter, not harder' },
            { title: 'Delegation Frameworks', description: 'What to delegate and when' },
          ]
        },
        {
          title: 'Long-Term Wealth Building',
          lessons: [
            { title: 'Multiple Revenue Streams', description: 'Diversify your income sources' },
            { title: 'Investment Strategies for Entrepreneurs', description: 'Make your money work for you' },
            { title: 'Building Generational Wealth', description: 'Create a lasting legacy' },
          ]
        },
      ],
      quiz: {
        title: 'Elite Operator Assessment',
        questions: [
          { text: 'What is the first step to scaling past $100k/month?', type: 'mcq_single', options: ['Hire immediately', 'Identify and remove bottlenecks', 'Raise prices', 'Work more hours'], correctAnswer: 'Identify and remove bottlenecks' },
          { text: 'You should try to do everything yourself to save money when scaling.', type: 'true_false', correctAnswer: 'false' },
        ]
      }
    },
    {
      title: 'Copywriting & Messaging',
      slug: 'copywriting-messaging',
      shortDescription: 'Master the art of persuasive writing. Create compelling messages that resonate with clinic owners and drive action.',
      description: '<p>Master the art of persuasive writing. Create compelling messages that resonate with clinic owners and drive action. Communication is the foundation of all business success.</p>',
      category: 'communication',
      instructor: 'rami_copy',
      sortOrder: 9,
      modules: [
        {
          title: 'Copywriting Fundamentals',
          lessons: [
            { title: 'Persuasion Psychology Fundamentals', description: 'The science behind compelling copy' },
            { title: 'Writing for Medical Professionals', description: 'Speak their language' },
            { title: 'The AIDA Framework', description: 'Attention, Interest, Desire, Action' },
          ]
        },
        {
          title: 'Email & Message Templates',
          lessons: [
            { title: 'High-Converting Email Templates', description: 'Proven templates you can use today' },
            { title: 'Crafting Irresistible Offers', description: 'Make saying no impossible' },
            { title: 'Follow-Up Message Frameworks', description: 'Stay top of mind without being annoying' },
          ]
        },
        {
          title: 'Advanced Copywriting',
          lessons: [
            { title: 'Storytelling for Sales', description: 'Use narrative to persuade' },
            { title: 'Social Proof and Testimonials', description: 'Let others sell for you' },
            { title: 'Call-to-Action Optimization', description: 'Get them to take the next step' },
          ]
        },
      ],
      quiz: {
        title: 'Copywriting Assessment',
        questions: [
          { text: 'What does AIDA stand for?', type: 'mcq_single', options: ['Always Include Direct Action', 'Attention, Interest, Desire, Action', 'Aim, Inform, Deliver, Ask', 'Analyze, Identify, Design, Apply'], correctAnswer: 'Attention, Interest, Desire, Action' },
          { text: 'Long copy always performs worse than short copy.', type: 'true_false', correctAnswer: 'false' },
        ]
      }
    },
  ];

  // Create courses, modules, lessons, and quizzes
  console.log('📚 Creating courses...');
  
  for (const courseData of coursesData) {
    console.log(`\n  Creating course: ${courseData.title}`);
    
    // Strip HTML from description for blocks format
    const plainDescription = courseData.description.replace(/<[^>]*>/g, '');
    
    const course = await strapi.documents('api::course.course').create({
      data: {
        title: courseData.title,
        slug: courseData.slug,
        shortDescription: courseData.shortDescription,
        description: textToBlocks(plainDescription),
        category: categories[courseData.category].documentId,
        instructor: instructors[courseData.instructor].documentId,
        difficulty: 'intermediate',
        visibility: 'public',
        status: 'published',
        allowSelfEnrollment: true,
        certificateEnabled: true,
        completionCriteria: 'all_lessons',
        completionPercentage: 100,
        isFree: false,
        price: 997,
      },
      status: 'published',
    });

    // Create modules and lessons
    let moduleOrder = 1;
    for (const moduleData of courseData.modules) {
      console.log(`    Creating module: ${moduleData.title}`);
      
      const module = await strapi.documents('api::module.module').create({
        data: {
          title: moduleData.title,
          description: textToBlocks(`Module ${moduleOrder}: ${moduleData.title}`),
          course: course.documentId,
          sortOrder: moduleOrder,
        },
        status: 'published',
      });

      // Create lessons
      let lessonOrder = 1;
      for (const lessonData of moduleData.lessons) {
        await strapi.documents('api::lesson.lesson').create({
          data: {
            title: lessonData.title,
            description: lessonData.description,
            content: textToBlocks(lessonData.description),
            module: module.documentId,
            sortOrder: lessonOrder,
            duration: 15 + Math.floor(Math.random() * 30), // 15-45 minutes
            isPreview: lessonOrder === 1, // First lesson of each module is preview
            isRequired: true,
          },
          status: 'published',
        });
        lessonOrder++;
      }
      moduleOrder++;
    }

    // Create quiz
    if (courseData.quiz) {
      console.log(`    Creating quiz: ${courseData.quiz.title}`);
      
      const quiz = await strapi.documents('api::quiz.quiz').create({
        data: {
          title: courseData.quiz.title,
          description: `Assessment for ${courseData.title}`,
          course: course.documentId,
          passingScore: 70,
          maxAttempts: 3,
          timeLimit: 30,
          shuffleQuestions: true,
          showCorrectAnswers: true,
          isRequired: true,
        },
        status: 'published',
      });

      // Create questions
      let questionOrder = 1;
      for (const q of courseData.quiz.questions) {
        await strapi.documents('api::question.question').create({
          data: {
            text: textToBlocks(q.text),
            type: q.type,
            options: q.options ? JSON.stringify(q.options) : null,
            correctAnswer: JSON.stringify(q.correctAnswer),
            points: 10,
            sortOrder: questionOrder,
            quiz: quiz.documentId,
          },
          status: 'published',
        });
        questionOrder++;
      }
    }
  }

  // Create admin user profile if not exists
  const adminUser = await strapi.documents('plugin::users-permissions.user').findFirst({
    filters: { email: 'advait.nandeshwar@gmail.com' } as any,
  });

  if (adminUser) {
    const existingProfile = await strapi.documents('api::user-profile.user-profile').findFirst({
      filters: { user: { documentId: adminUser.documentId } } as any,
    });
    
    if (!existingProfile) {
      await strapi.documents('api::user-profile.user-profile').create({
        data: {
          user: adminUser.documentId,
          firstName: 'Advait',
          lastName: 'Admin',
          displayName: 'Advait Admin',
          headline: 'Admin',
          isInstructor: true,
          instructorVerified: true,
        },
        status: 'published',
      });
    }
  }

  console.log('\n✅ Clinic Launch Academy seed completed!');
  console.log('\n📊 Summary:');
  console.log(`   - 5 Instructors created`);
  console.log(`   - 9 Categories created`);
  console.log(`   - 9 Courses created`);
  console.log(`   - 27 Modules created`);
  console.log(`   - 81 Lessons created`);
  console.log(`   - 9 Quizzes with questions created`);
}
