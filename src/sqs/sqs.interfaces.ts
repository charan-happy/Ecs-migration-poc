export interface ISqsJobMessage<T = unknown> {
  jobName: string;
  data: T;
  metadata: {
    timestamp: number;
    attemptNumber?: number;
    correlationId?: string;
  };
}
