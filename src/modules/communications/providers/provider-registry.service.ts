import { Injectable, OnModuleInit, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { FeatureFlagService } from '@core/feature-flags/feature-flag.service';
import { CommunicationProvider } from '../schemas/communication-provider.schema';
import { ICommunicationProvider } from './communication-provider.interface';
import { BrevoEmailProvider } from './brevo-email.provider';
import { CommunicationChannel } from '../schemas/communication-log.schema';

@Injectable()
export class ProviderRegistryService implements OnModuleInit {
  private readonly logger = new Logger(ProviderRegistryService.name);
  private readonly providers = new Map<string, ICommunicationProvider>();

  constructor(
    private readonly featureFlagService: FeatureFlagService,
    private readonly brevoEmailProvider: BrevoEmailProvider,
    @InjectModel(CommunicationProvider.name)
    private readonly providerModel: Model<CommunicationProvider>,
  ) {}

  async onModuleInit() {
    // Register available providers
    this.registerProvider(this.brevoEmailProvider);

    // Initialize all providers from DB configurations
    await this.reloadProviders();
  }

  registerProvider(provider: ICommunicationProvider) {
    this.providers.set(provider.name, provider);
    this.logger.log(`Registered provider: ${provider.name} for channel: ${provider.channel}`);
  }

  async reloadProviders(): Promise<void> {
    const dbProviders = await this.providerModel.find({ isDeleted: null }).exec();

    for (const [name, provider] of this.providers.entries()) {
      const dbConfig = dbProviders.find((p) => p.name === name);
      const credentials = dbConfig?.credentials || {};
      const config = dbConfig?.config || {};

      try {
        provider.initialize(credentials, config);
      } catch (error) {
        this.logger.error(`Failed to initialize provider ${name}: ${error.message}`);
      }
    }
  }

  getProvider(name: string): ICommunicationProvider {
    const provider = this.providers.get(name);
    if (!provider) {
      throw new NotFoundException(`Communication provider "${name}" not found.`);
    }
    return provider;
  }

  /**
   * Checks if a specific provider is enabled.
   * Priority: Feature flag toggle (e.g. FEATURE_EMAIL_PROVIDER_BREVO)
   */
  isEnabled(name: string): boolean {
    const flagKey = `FEATURE_EMAIL_PROVIDER_${name.toUpperCase()}`;
    return this.featureFlagService.isEnabled(flagKey);
  }

  /**
   * Returns all registered providers with their database and feature flag status
   */
  async getAllProviders(): Promise<any[]> {
    const dbProviders = await this.providerModel.find({ isDeleted: null }).exec();
    
    return Array.from(this.providers.values()).map((provider) => {
      const dbConfig = dbProviders.find((p) => p.name === provider.name);
      return {
        name: provider.name,
        displayName: dbConfig?.displayName || provider.name,
        channel: provider.channel,
        priority: dbConfig?.priority || 0,
        isEnabled: this.isEnabled(provider.name),
        config: dbConfig?.config || {},
        createdAt: dbConfig?.createdAt || null,
        updatedAt: dbConfig?.updatedAt || null,
        id: dbConfig?._id?.toString() || null,
      };
    });
  }

  /**
   * Resolves the active provider for a given communication channel based on priority and enablement
   */
  async resolveActiveProvider(channel: CommunicationChannel): Promise<ICommunicationProvider | null> {
    const dbProviders = await this.providerModel
      .find({ channel, isDeleted: null })
      .sort({ priority: -1 })
      .exec();

    for (const dbProvider of dbProviders) {
      if (this.isEnabled(dbProvider.name)) {
        const provider = this.providers.get(dbProvider.name);
        if (provider) {
          return provider;
        }
      }
    }

    // Fallback: If no provider is explicitly enabled/found in DB, but we have a registered provider and env credentials are set, check feature flag
    for (const provider of this.providers.values()) {
      if (provider.channel === channel && this.isEnabled(provider.name)) {
        return provider;
      }
    }

    return null;
  }
}
