import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const uri = configService.get<string>('MONGODB_URI');
        const nodeEnv = configService.get<string>('NODE_ENV');

        console.log('\n┌─────────────────────────────────────────────────────┐');
        console.log('│           🍃  MongoDB Connection Status              │');
        console.log('├─────────────────────────────────────────────────────┤');
        console.log(`│  ENV      : ${nodeEnv?.padEnd(39)}│`);
        console.log(`│  URI      : ${uri?.replace(/:\/\/([^:]+):([^@]+)@/, '://<user>:<pass>@').padEnd(39)}│`);
        console.log('└─────────────────────────────────────────────────────┘\n');

        return {
          uri,
          connectionFactory: (connection: any) => {
            connection.on('connected', () => {
              console.log('✅  [MongoDB] Successfully connected to database');
            });
            connection.on('disconnected', () => {
              console.warn('⚠️   [MongoDB] Disconnected from database');
            });
            connection.on('error', (err: Error) => {
              console.error('❌  [MongoDB] Connection error:', err.message);
            });
            return connection;
          },
        };
      },
    }),
  ],
  exports: [MongooseModule],
})
export class DatabaseModule { }
