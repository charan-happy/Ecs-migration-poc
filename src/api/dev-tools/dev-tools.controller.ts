import { RouteNames } from '@common/route-names';
import { EnvConfig } from '@config/env.config';
import { Controller, Get, Query, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiExcludeController, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { marked } from 'marked';

@Controller({ path: RouteNames.DEV_TOOLS, version: '1' })
@ApiTags('Dev Tools')
@ApiExcludeController()
export class DevToolsController {
  private readonly jaegerUrl;
  private readonly grafanaUrl;
  private readonly apiDocsUrl;
  private readonly queueDashboardUrl;
  private readonly systemHealthUrl;

  constructor(private readonly configService: ConfigService<EnvConfig>) {
    this.grafanaUrl = this.configService.get('GRAFANA_URL') || 'http://localhost:3001';
    this.systemHealthUrl =
      this.configService.get('SERVICES_HEALTH_URL') || '/v1/health/health-ui';
    this.jaegerUrl = this.configService.get('JAGER_URL') || 'http://localhost:16686';
    this.apiDocsUrl = `/${RouteNames.API_DOCS}`;
    this.queueDashboardUrl = `/v1/${RouteNames.QUEUES_UI}/dashboard`;
  }

  @Get()
  showTools(@Res() res: Response) {
    const tools = [
      { name: 'Grafana', url: this.grafanaUrl, icon: 'grafana.png' },
      { name: 'Jaeger', url: this.jaegerUrl, icon: 'jaeger.png' },
      { name: 'Application Logs', url: '/v1/dev-tools/logs', icon: 'logs.png' },
      { name: 'System Health', url: this.systemHealthUrl, icon: 'health.png' },
      { name: 'Dev Docs', url: '/v1/dev-tools/docs', icon: 'docs.png' },
      { name: 'API Docs', url: this.apiDocsUrl, icon: 'swagger.png' },
      { name: 'Queue Dashboard', url: this.queueDashboardUrl, icon: 'bull.png' },
    ];

    res.render('dev-tools', {
      title: 'Dev Tools',
      tools,
      user: 'Developer',
    });
  }

  @Get('docs')
  showDocs(@Query('file') file: string | undefined, @Res() res: Response) {
    // If ?file= is provided, show that specific doc
    if (file) {
      return this.renderDocFile(file, res);
    }

    // Otherwise show the docs index
    const docsDir = path.join(process.cwd(), 'docs');
    const docs = this.scanDocsDir(docsDir, 'docs');

    res.render('docs', {
      title: 'Dev Docs',
      user: 'Developer',
      docs,
    });
  }

  @Get('logs')
  showLogs(@Res() res: Response) {
    const logsDir = path.join(process.cwd(), 'logs');
    let logFiles: { name: string; size: string; modified: string }[] = [];
    let recentLines: string[] = [];

    if (fs.existsSync(logsDir)) {
      const files = fs.readdirSync(logsDir).filter(f => f.endsWith('.log'));
      logFiles = files
        .map(f => {
          const stats = fs.statSync(path.join(logsDir, f));
          return {
            name: f,
            size: this.formatBytes(stats.size),
            modified: stats.mtime.toISOString(),
          };
        })
        .sort((a, b) => b.modified.localeCompare(a.modified));

      // Read last 100 lines of the most recent log file
      if (logFiles[0]) {
        const latestLog = path.join(logsDir, logFiles[0].name);
        const fileContent = fs.readFileSync(latestLog, 'utf-8');
        const allLines = fileContent.split('\n').filter(l => l.trim());
        recentLines = allLines.slice(-100).reverse();
      }
    }

    res.render('logs', {
      title: 'Application Logs',
      user: 'Developer',
      logFiles,
      recentLines,
      latestFile: logFiles[0]?.name ?? 'none',
    });
  }

  private renderDocFile(filePath: string, res: Response): void {
    const docsBase = path.resolve(path.join(process.cwd(), 'docs'));
    const resolved = path.resolve(path.join(docsBase, filePath));

    // Prevent directory traversal
    if (!resolved.startsWith(docsBase)) {
      res.status(403).send('Forbidden');
      return;
    }

    if (!fs.existsSync(resolved) || !resolved.endsWith('.md')) {
      res.status(404).render('not-found', { path: `/v1/dev-tools/docs?file=${filePath}` });
      return;
    }

    const raw = fs.readFileSync(resolved, 'utf-8');
    const fileName = path.basename(resolved);
    const htmlContent = marked.parse(raw) as string;

    res.render('doc-viewer', {
      title: fileName,
      user: 'Developer',
      fileName,
      htmlContent,
      breadcrumb: filePath,
    });
  }

  private scanDocsDir(
    dir: string,
    relativeTo: string,
  ): { name: string; path: string; isDir: boolean; children?: any[] }[] {
    if (!fs.existsSync(dir)) return [];

    return fs
      .readdirSync(dir)
      .filter(f => !f.startsWith('.'))
      .map(f => {
        const fullPath = path.join(dir, f);
        const relPath = path.relative(path.join(process.cwd(), relativeTo), fullPath);
        const isDir = fs.statSync(fullPath).isDirectory();

        if (isDir) {
          return {
            name: f,
            path: relPath,
            isDir: true,
            children: this.scanDocsDir(fullPath, relativeTo),
          };
        }
        return { name: f, path: relPath, isDir: false };
      })
      .filter(f => f.isDir || f.name.endsWith('.md'));
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }
}
