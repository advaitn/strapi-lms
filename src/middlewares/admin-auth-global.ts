/**
 * Global middleware placeholder.
 * Admin token authentication is handled in src/index.ts bootstrap.
 * This middleware is kept for potential future extensions.
 */

import type { Core } from '@strapi/strapi';

export default (config: any, { strapi }: { strapi: Core.Strapi }) => {
  return async (ctx: any, next: () => Promise<void>) => {
    // Admin token auth is handled via JWT service override in index.ts
    return next();
  };
};
