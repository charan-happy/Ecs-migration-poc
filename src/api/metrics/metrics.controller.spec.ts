import { Test, TestingModule } from '@nestjs/testing';
import { MetricsController } from '@metrics/metrics.controller';
import { MetricsService } from '@metrics/metrics.service';
import { ResponseUtil } from '@common/helpers/response.utils';
import { register } from 'prom-client';

jest.mock('prom-client', () => ({
  register: {
    metrics: jest.fn(),
  },
}));

describe('MetricsController', () => {
  let controller: MetricsController;

  const mockMetricsService = {
    incrementHttpRequests: jest.fn(),
    setActiveUsers: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MetricsController],
      providers: [{ provide: MetricsService, useValue: mockMetricsService }],
    }).compile();

    controller = module.get<MetricsController>(MetricsController);
  });

  describe('getDefaultMetrics', () => {
    it('should return default metrics on success', async () => {
      const fakeMetrics = 'some_metric_data';
      (register.metrics as jest.Mock).mockResolvedValue(fakeMetrics);

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      } as any;

      await controller.getDefaultMetrics(mockRes);
      expect(register.metrics).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
    it('should return error response on failed metric fetch', async () => {
      (register.metrics as jest.Mock).mockRejectedValue(new Error('fail'));

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      } as any;

      await controller.getDefaultMetrics(mockRes);
      expect(register.metrics).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.send).toHaveBeenCalledWith(
        ResponseUtil.error('Failed to retrieve metrics', 500, null)
      );
    });
  });
});
