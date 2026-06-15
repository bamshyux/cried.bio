export { EMAIL_FROM } from "@/lib/email/constants";
export {
  sendWelcomeEmail,
  sendNotificationEmail,
  sendGuestbookNotificationEmail,
  sendBadgeNotificationEmail,
  sendPasswordResetEmail,
  type EmailSendResult,
} from "@/lib/email/send";
