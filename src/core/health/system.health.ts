import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';
import * as os from 'os';

@Injectable()
export class SystemHealthIndicator extends HealthIndicator {
  async check(key: string): Promise<HealthIndicatorResult> {
    const memoryUsage = process.memoryUsage();
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();

    // Bandwidth is hard to measure in a single request without a monitoring agent.
    // We will provide network interface information as a starting point.
    const networkInterfaces = os.networkInterfaces();

    return this.getStatus(key, true, {
      memory: {
        heapUsed: `${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
        heapTotal: `${(memoryUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
        rss: `${(memoryUsage.rss / 1024 / 1024).toFixed(2)} MB`,
        systemTotal: `${(totalMemory / 1024 / 1024 / 1024).toFixed(2)} GB`,
        systemFree: `${(freeMemory / 1024 / 1024 / 1024).toFixed(2)} GB`,
      },
      uptime: `${process.uptime().toFixed(2)}s`,
      loadAverage: os.loadavg(),
    });
  }
}
