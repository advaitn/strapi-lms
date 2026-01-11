import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::certificate.certificate', ({ strapi }) => ({
  // Verify certificate by certificate number
  async verify(ctx) {
    const { certificateNumber } = ctx.params;

    const certificate = await strapi.documents('api::certificate.certificate').findFirst({
      filters: { certificateNumber },
      populate: ['course', 'user'],
    });

    if (!certificate) {
      return ctx.notFound('Certificate not found');
    }

    return {
      data: {
        valid: certificate.status === 'issued',
        certificate: {
          certificateNumber: certificate.certificateNumber,
          recipientName: certificate.recipientName,
          courseTitle: certificate.courseTitle,
          completionDate: certificate.completionDate,
          issuedAt: certificate.issuedAt,
          status: certificate.status,
          grade: certificate.grade,
        },
      },
    };
  },
}));
