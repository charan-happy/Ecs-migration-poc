export enum SqsQueueName {
  EMAIL = 'email',
  AUDIT_LOG = 'audit-log',
  // DLQ queues (auto-created, messages routed by RedrivePolicy)
  EMAIL_DLQ = 'email-dlq',
  AUDIT_LOG_DLQ = 'audit-log-dlq',
}

export const DEFAULT_SQS_CONFIG = {
  maxRetries: 3,
  visibilityTimeout: 300, // 5 min
  waitTimeSeconds: 20, // Long polling
  maxNumberOfMessages: 10, // Batch size per poll
  messageRetentionPeriod: 604800, // 7 days
};
