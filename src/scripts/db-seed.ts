import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';

async function bootstrap() {
  console.log('🌱 Starting manual database seeding...');
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    // Give seeders that rely on internal setTimeouts time to complete (e.g. system-users: 1s, websites: 1.5s)
    console.log('Waiting for seeders to finish database transactions...');
    await new Promise((resolve) => setTimeout(resolve, 3000));
    console.log('✅ Manual database seeding completed successfully!');
  } catch (err) {
    console.error('❌ Database seeding failed:', err);
  } finally {
    await app.close();
  }
}

bootstrap().catch((err) => {
  console.error('Error during database seeding execution:', err);
  process.exit(1);
});
