import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CommunicationProvider } from '@modules/communications/schemas/communication-provider.schema';
import { CommunicationChannel } from '@modules/communications/schemas/communication-log.schema';

@Injectable()
export class CommunicationsProviderSeeder implements OnApplicationBootstrap {
  constructor(
    @InjectModel(CommunicationProvider.name)
    private readonly providerModel: Model<CommunicationProvider>,
  ) {}

  async onApplicationBootstrap() {
    await this.seed();
  }

  async seed() {
    const existing = await this.providerModel.findOne({ name: 'brevo' }).exec();
    if (!existing) {
      await this.providerModel.create({
        name: 'brevo',
        displayName: 'Brevo (Sendinblue)',
        channel: CommunicationChannel.EMAIL,
        priority: 10,
        credentials: {
          apiKey: process.env.BREVO_API_KEY || '',
        },
        config: {
          senderEmail:
            process.env.BREVO_SENDER_EMAIL || 'noreply@coremediagroup.com',
          senderName: process.env.BREVO_SENDER_NAME || 'Core Media',
        },
      });
      console.log('✅ Communication Provider seeded: brevo');
    }
  }
}
