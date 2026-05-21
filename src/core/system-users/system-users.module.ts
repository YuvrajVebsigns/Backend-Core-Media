import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SystemUsersService } from './system-users.service';
import { SystemUsersController } from './system-users.controller';
import { SystemUser, SystemUserSchema } from './schemas/system-user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SystemUser.name, schema: SystemUserSchema },
    ]),
  ],
  controllers: [SystemUsersController],
  providers: [SystemUsersService],
  exports: [SystemUsersService],
})
export class SystemUsersModule {}
