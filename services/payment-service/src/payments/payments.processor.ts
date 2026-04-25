import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PaymentsService } from './payments.service';

type AutoCompleteJob = {
  paymentId: string;
};

@Processor('payments')
export class PaymentsProcessor extends WorkerHost {
  private readonly logger = new Logger(PaymentsProcessor.name);

  constructor(private readonly payments: PaymentsService) {
    super();
  }

  async process(job: Job<AutoCompleteJob>): Promise<void> {
    if (job.name !== 'auto-complete') {
      this.logger.warn(`Ignoring unknown job: ${job.name}`);
      return;
    }
    await this.payments.autoCompletePayment(job.data.paymentId);
  }
}
