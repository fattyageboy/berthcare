/**
 * Email Service Module
 * Email notification service with Amazon SES
 */

export { createEmailRoutes } from './routes';
export { EmailService } from './service';
export { EmailController } from './controller';
export { EmailRepository } from './repository';
export { SESService } from './ses.service';
export * from './types';
export * from './templates';
