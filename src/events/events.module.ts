import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { EventListeners } from './event-listeners';

@Module({
  imports: [
    EventEmitterModule.forRoot({
      // Use wildcard listeners if needed (e.g., 'user.*')
      wildcard: true,
      // Delimiter for wildcard events
      delimiter: '.',
      // Show verbose memory leak warnings after 20 listeners
      maxListeners: 20,
      // Disable throwing on unhandled 'error' events
      verboseMemoryLeak: true,
    }),
  ],
  providers: [EventListeners],
  exports: [EventEmitterModule],
})
export class EventsModule {}
