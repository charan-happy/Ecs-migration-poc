export interface IEmailJob {
  email: string;
  customerName?: string;
}

export interface IOtpEmailJob extends IEmailJob {
  otp: number;
  passwordResetLink?: string;
  passwordSetLink?: string;
}

export interface IAuditLogJob {
  action: string;
  userId?: string;
  resource?: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  timestamp?: number;
}
