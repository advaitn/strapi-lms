import { factories } from '@strapi/strapi';

export default factories.createCoreRouter('api::course.course', {
  config: {
    find: {
      middlewares: [],
      policies: [],
    },
    findOne: {
      middlewares: [],
      policies: [],
    },
  },
});
