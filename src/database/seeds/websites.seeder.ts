import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { WebsitesService } from '../../modules/websites/websites.service';

@Injectable()
export class WebsitesSeeder implements OnApplicationBootstrap {
  constructor(private readonly websitesService: WebsitesService) { }

  async onApplicationBootstrap() {
    // Small delay to ensure database is ready
    setTimeout(async () => {
      await this.seed();
    }, 1500);
  }

  async seed() {

    const websites = [
      { name: 'CIO Angel Network', domain: 'https://cioangel.com', logo: 'https://cioangelnetwork.com/images/cio-angel-network-logo.jpg' },
      { name: 'DCCAI 2026', domain: 'https://dccai2026.com', logo: 'https://core-mediagroup.com/dccai2026/wp-content/uploads/2026/02/logo-white.png' },
      { name: 'MEA CIO Choice', domain: 'https://meachoice.com', logo: 'https://mea.cio-choice.com/wp-content/uploads/2025/10/logo2.png' },
      { name: 'MEA CIO Powerlist', domain: 'https://meacio.com', logo: 'https://cxo-capital.com/wp-content/uploads/2026/02/CPL-Powerlist-LOGO-Final-B.png' },
      { name: 'CXO Capital', domain: 'https://cxocapital.com', logo: 'https://cxo-capital.com/wp-content/uploads/2023/10/CXO-Capital-Final-Logo.png' },
      { name: 'CIO Crown', domain: 'https://ciocrown.com', logo: 'https://ciocrown.com/images/logo.png' },
      { name: 'CIO Choice', domain: 'https://ciochoice.com', logo: 'http://www.cio-choice.in/wp-content/uploads/2016/04/CIO_logo.png' },
      { name: 'LeaderNext', domain: 'https://leader-next.com', logo: 'http://leader-next.com/wp-content/uploads/2025/11/logo1.png' },
      { name: 'CIO Dialogues', domain: 'https://ciodialogues.com', logo: 'https://ciodialogues.com/wp-content/uploads/2019/01/cio-dialogues.png' },
      { name: 'CIO Powerlist', domain: 'https://ciopowerlist.com', logo: 'https://www.ciopowerlist.com/wp-content/uploads/2023/04/cio-powerlist_logo.png' },
      { name: 'CORE Media Group', domain: 'https://coremediagroup.com' },
    ];

    for (const site of websites) {
      const slug = site.name
        .toLowerCase()
        .replace(/ /g, '-')
        .replace(/[^\w-]/g, '');

      const existing = await this.websitesService.findBySlug(slug);

      if (!existing) {
        await this.websitesService.create({
          name: site.name,
          slug,
          domain: site.domain,
          isActive: true,
          seo: {
            metaTitle: site.name,
            metaDescription: `Official website of ${site.name}`,
            metaKeywords: site.name.split(' ').map(k => k.toLowerCase()),
            ogImage: '',
          }
        });
        console.log(`✅ Website seeded: ${site.name}`);
      }
    }
  }
}
