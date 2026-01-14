import type { Core } from '@strapi/strapi';
import seedData from './seed';

export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/* { strapi }: { strapi: Core.Strapi } */) {},

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    // Run seed if SEED_DATA env var is set
    if (process.env.SEED_DATA === 'true') {
      try {
        await seedData(strapi);
      } catch (error) {
        console.error('Seed failed:', error);
      }
    }
  },
};
