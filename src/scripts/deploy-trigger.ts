import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { WebhookService } from '../webhook/webhook.service';

async function bootstrap() {
  const target = process.argv[2];
  if (!target) {
    console.error('Error: Deployment target is required.');
    console.error(
      'Usage: npm run deploy:trigger <target> (e.g. backend, frontend, website-1)',
    );
    process.exit(1);
  }

  const app = await NestFactory.createApplicationContext(AppModule);
  const webhookService = app.get(WebhookService);

  console.log(`Manually triggering deployment for target: "${target}"...`);
  try {
    webhookService.deploy(target);
    // Wait a brief moment to ensure child process is spawned and logged
    await new Promise((resolve) => setTimeout(resolve, 1500));
  } catch (err) {
    console.error('Failed to trigger deployment:', err);
  } finally {
    await app.close();
  }
}

bootstrap().catch((err) => {
  console.error('Error during manual deploy execution:', err);
  process.exit(1);
});
