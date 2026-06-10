import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Report, ReportSchema } from './schemas/report.schema';
import { Registree, RegistreeSchema } from '@modules/attendees/schemas/registree.schema';
import { FilesModule } from '@core/files/files.module';
import { AuthModule } from '@core/auth/auth.module';
import { ReportsService } from './reports.service';
import { AdminReportsController } from './admin-reports.controller';
import { WebsiteReportsController } from './website-reports.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Report.name, schema: ReportSchema },
      { name: Registree.name, schema: RegistreeSchema },
    ]),
    FilesModule,
    AuthModule,
  ],
  providers: [ReportsService],
  controllers: [AdminReportsController, WebsiteReportsController],
  exports: [ReportsService],
})
export class ReportsModule {}
