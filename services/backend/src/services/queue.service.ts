import PgBoss from 'pg-boss';

class QueueService {
  private boss: PgBoss;
  private readonly QUEUE_NAME = 'monitor-wallet';

  constructor() {
    // Initialize pg-boss with the same database connection
    this.boss = new PgBoss({
      connectionString: process.env.DATABASE_URL,
      // Optional: Configure additional options
      max: 10, // Maximum number of concurrent jobs
      monitorStateIntervalSeconds: 60, // How often to check job states
    });

    // Add error handler
    this.boss.on('error', (error) => {
      console.error('Queue service error:', error);
    });
  }

  async initialize() {
    try {
      await this.boss.start();
      // Create the queue if it doesn't exist
      await this.boss.createQueue(this.QUEUE_NAME);
      console.log('Queue service initialized and queue created');
    } catch (error) {
      console.error('Failed to initialize queue service:', error);
      throw error;
    }
  }

  // Add method to create a queue
  async createQueue(queueName: string) {
    try {
      await this.boss.createQueue(queueName);
      console.log(`Queue ${queueName} created successfully`);
    } catch (error) {
      console.error(`Failed to create queue ${queueName}:`, error);
      throw error;
    }
  }

  async shutdown() {
    await this.boss.stop();
    console.log('Queue service shut down');
  }

  // Generic method to send a job to the queue
  async sendJob<T extends object>(queueName: string, data: T, options?: PgBoss.SendOptions) {
    try {
      console.log(`Sending job to queue ${queueName} with data:`, data);
      const jobId = await this.boss.send(queueName, data, options);
      return jobId;
    } catch (error) {
      console.error('Error sending job:', error);
      throw error;
    }
  }

  // Generic method to process jobs
  async processJobs<T extends object>(
    queueName: string,
    handler: (job: PgBoss.Job<T>) => Promise<void>
  ) {
    try {
      return this.boss.work(queueName, async (jobs) => {
        if (Array.isArray(jobs)) {
          for (const job of jobs) {
            try {
              await handler(job as unknown as PgBoss.Job<T>);
            } catch (error) {
              console.error(`Error processing job ${job.id}:`, error);
            }
          }
        } else {
          try {
            await handler(jobs as unknown as PgBoss.Job<T>);
          } catch (error) {
            console.error(`Error processing job ${jobs}:`, error);
          }
        }
      });
    } catch (error) {
      console.error(`Error starting job processor for queue ${queueName}:`, error);
      throw error;
    }
  }

  // Helper method to schedule a job for later
  async scheduleJob<T extends object>(
    queueName: string,
    data: T,
    options: { startAfter: Date | string | number }
  ) {
    try {
      // Convert to Date object
      const startDate = options.startAfter instanceof Date 
        ? options.startAfter
        : typeof options.startAfter === 'number'
          ? new Date(options.startAfter)
          : new Date(options.startAfter);
      
      // Create a cron expression for the specific date
      const cronExpression = `${startDate.getSeconds()} ${startDate.getMinutes()} ${startDate.getHours()} ${startDate.getDate()} ${startDate.getMonth() + 1} *`;
      
      console.log(`Scheduling job for queue ${queueName} to start at ${startDate.toISOString()} using cron: ${cronExpression}`);
      return this.boss.schedule(queueName, cronExpression, data);
    } catch (error) {
      console.error('Error scheduling job:', error);
      throw error;
    }
  }

  // Get active jobs for a specific queue
  async getActiveJobs(queueName: string) {
    return this.boss.fetch(queueName);
  }

  // Complete a job
  async completeJob(jobId: string) {
    return this.boss.complete(this.QUEUE_NAME, jobId);
  }
}

// Create a singleton instance
export const queueService = new QueueService();

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  await queueService.shutdown();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await queueService.shutdown();
  process.exit(0);
}); 