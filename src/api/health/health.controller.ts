import { RouteNames } from '@common/route-names';
import { HealthService } from '@health/health.service';
import { Controller, Get, Render } from '@nestjs/common';
import { ApiExcludeEndpoint, ApiOperation, ApiTags } from '@nestjs/swagger';

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
  async check() {
    try {
      const result = await this.healthService.checkHealth();
      return {
        statusCode: 200,
        status: 'Success',
        message: 'Health check completed',
        data: result,
      };
    } catch (error) {
      return {
        statusCode: 503,
        status: 'Failure',
        message: 'Health check failed',
        error: (error as Error).message,
        data: null,
      };
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
