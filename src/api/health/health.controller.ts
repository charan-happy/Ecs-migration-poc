import { RouteNames } from '@common/route-names';
import { HealthService } from '@health/health.service';
import { Controller, Get, Render, Res } from '@nestjs/common';
import { ApiExcludeEndpoint, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';

@Controller({path: RouteNames.HEALTH, version: '1'})
@ApiTags('Health')
// @ApiExcludeController()
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({
    summary: 'Check the health of the service',
    description: 'Health check endpoint',
  })
  async check(@Res() res: Response) {
    try {
      const result = await this.healthService.checkHealth();
      const httpStatus = result.status === 'up' ? 200 : 503;
      return res.status(httpStatus).json({
        statusCode: httpStatus,
        status: result.status === 'up' ? 'Success' : 'Failure',
        message: 'Health check completed',
        data: result,
      });
    } catch (error) {
      return res.status(503).json({
        statusCode: 503,
        status: 'Failure',
        message: 'Health check failed',
        error: (error as Error).message,
        data: null,
      });
    }
  }

  @Get(RouteNames.HEALTH_UI)
  @ApiExcludeEndpoint()
  @Render('health') // Renders views/health.pug
  async showHealth() {
    const raw = await this.healthService.checkHealth();
    return {
      status: raw.status,
      info: raw.info,
      user: `Developer`,
    };
  }
}
