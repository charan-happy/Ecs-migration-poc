import { RouteNames } from '@common/route-names';
import { Controller, Get, Res } from '@nestjs/common';
import { ApiExcludeController, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { QueuesService } from './queues.service';

@Controller({ path: RouteNames.QUEUES_UI, version: '1' })
@ApiTags('Queues')
@ApiExcludeController()
export class QueuesController {
  constructor(private readonly queuesService: QueuesService) {}

  @Get()
  async getQueuesJson() {
    const stats = await this.queuesService.getQueueStats();
    const dlqMessages = await this.queuesService.getAllDlqMessages();

    return {
      statusCode: 200,
      status: 'Success',
      message: 'Queue stats retrieved',
      data: { stats, dlqMessages },
    };
  }

  @Get('dashboard')
  async showDashboard(@Res() res: Response) {
    const stats = await this.queuesService.getQueueStats();
    const dlqMessages = await this.queuesService.getAllDlqMessages();

    const mainQueues = stats.filter(s => !s.isDlq);
    const dlqQueues = stats.filter(s => s.isDlq);
    const totalDlqMessages = dlqQueues.reduce((sum, q) => sum + Math.max(q.messagesAvailable, 0), 0);

    res.render('queues', {
      title: 'Queue Dashboard',
      user: 'Developer',
      mainQueues,
      dlqQueues,
      dlqMessages,
      totalDlqMessages,
    });
  }
}
