import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { WebsitesService } from '@modules/websites/websites.service';
import { SystemUsersService } from '@core/system-users/system-users.service';
import { WebsitePage } from '@modules/websites/schemas/website-page.schema';
import { Navbar } from '@modules/websites/schemas/navbar.schema';
import { PageStatus } from '@modules/websites/enums/page-status.enum';
import { PageType } from '@modules/websites/enums/page-type.enum';
import { SectionType } from '@modules/websites/enums/section-type.enum';
import { NavbarPosition } from '@modules/websites/enums/navbar-position.enum';
import { MenuType } from '@modules/websites/enums/menu-type.enum';

@Injectable()
export class WebsiteCmsSeeder implements OnApplicationBootstrap {
  constructor(
    @InjectModel(WebsitePage.name) private readonly pageModel: Model<WebsitePage>,
    @InjectModel(Navbar.name) private readonly navbarModel: Model<Navbar>,
    private readonly websitesService: WebsitesService,
    private readonly systemUsersService: SystemUsersService,
  ) {}

  async onApplicationBootstrap() {
    // Run after a slight delay to ensure website and admin seeds are ready
    setTimeout(async () => {
      await this.seed();
    }, 3500);
  }

  async seed() {
    // 1. Get first website (CIO Angel Network)
    const website = await this.websitesService.findBySlug('cio-angel-network');
    // 2. Get active admin to assign as creator
    const admin = await this.systemUsersService.findByEmail('superadmin@gmail.com');

    if (!website || !admin) {
      console.warn('⚠️ Skipping CMS seeding: Website (cio-angel-network) or Admin not found');
      return;
    }

    const siteId = website._id.toString();
    const adminId = admin._id.toString();

    console.log(`🌱 Seeding pages and navigation for website: ${website.name} (${siteId})`);

    // Define core pages data
    const pagesData = [
      {
        title: 'Home',
        slug: 'home',
        shortDescription: 'Welcome to CIO Angel Network. We fund the next generation of enterprise technology startups.',
        pageType: PageType.LANDING_PAGE,
        isHomepage: true,
        sections: [
          {
            type: SectionType.HERO,
            order: 0,
            data: {
              heading: 'Empowering Enterprise Tech Founders',
              subheading: 'CIO Angel Network accelerates growth by connecting seed-stage startups with leading CIOs and corporate technology partners.',
              ctaLabel: 'Apply for Funding',
              ctaLink: '/contact-us',
              backgroundImage: 'https://images.unsplash.com/photo-1557804506-669a67965ba0',
            },
          },
          {
            type: SectionType.FEATURES,
            order: 1,
            data: {
              title: 'Why Startups Partner With Us',
              subtitle: 'We bring much more than just financial investment.',
              items: [
                {
                  title: 'CIO Network Access',
                  desc: 'Pitch directly to decision makers from the Fortune 500.',
                },
                {
                  title: 'Strategic Capital',
                  desc: 'Tailored seed investments up to $500k to accelerate product-market fit.',
                },
                {
                  title: 'Enterprise Mentorship',
                  desc: 'Scale your sales cycles under direct guidance from veteran tech leaders.',
                },
              ],
            },
          },
          {
            type: SectionType.CTA,
            order: 2,
            data: {
              heading: 'Ready to take your product to the next level?',
              text: 'Applications for our Q3 cohort are now open.',
              btnLabel: 'Apply Today',
              btnLink: '/contact-us',
            },
          },
        ],
        seo: {
          metaTitle: 'CIO Angel Network | Seed Funding for Enterprise Tech Startups',
          metaDescription: 'CIO Angel Network accelerates technology startups by offering seed funding and strategic access to leading Chief Information Officers.',
          metaKeywords: ['angel investing', 'cio network', 'seed funding', 'enterprise tech'],
          canonicalUrl: `${website.domain}/home`,
          noIndex: false,
          noFollow: false,
        },
      },
      {
        title: 'About Us',
        slug: 'about-us',
        shortDescription: 'Learn about our history, our team of CIOs, and our mission.',
        pageType: PageType.STATIC_PAGE,
        isHomepage: false,
        sections: [
          {
            type: SectionType.TEXT_BLOCK,
            order: 0,
            data: {
              title: 'Our Journey and Vision',
              content: 'CIO Angel Network was founded with a singular focus: to bridge the gap between brilliant enterprise SaaS founders and industry-leading corporate technology leaders. Our network comprises over 150 active CIOs, CTOs, and global tech executives committed to investing in and mentoring early-stage companies.',
            },
          },
          {
            type: SectionType.FAQ,
            order: 1,
            data: {
              title: 'Frequently Asked Questions',
              items: [
                {
                  question: 'What types of startups do you invest in?',
                  answer: 'We focus exclusively on early-stage enterprise software (SaaS), cyber security, AI, cloud infrastructure, and deep tech companies.',
                },
                {
                  question: 'How active are the CIOs in the startups?',
                  answer: 'Extremely active. Aside from investing capital, our members provide product feedback, pilot opportunities, and strategic customer introductions.',
                },
              ],
            },
          },
        ],
        seo: {
          metaTitle: 'About Our Network | CIO Angel Network',
          metaDescription: 'Discover our mission to bridge enterprise technology founders and active global Chief Information Officers.',
          metaKeywords: ['about us', 'tech network', 'saas investment'],
          canonicalUrl: `${website.domain}/about-us`,
          noIndex: false,
          noFollow: false,
        },
      },
      {
        title: 'Services',
        slug: 'services',
        shortDescription: 'Strategic programs and incubator opportunities offered by CIO Angel Network.',
        pageType: PageType.STATIC_PAGE,
        isHomepage: false,
        sections: [
          {
            type: SectionType.FEATURES,
            order: 0,
            data: {
              title: 'Accelerator & Growth Services',
              items: [
                {
                  title: 'Proof of Concept (PoC) Sandbox',
                  desc: 'Test your product directly in corporate test-beds managed by our CIOs.',
                },
                {
                  title: 'Sales Enablement Workshops',
                  desc: 'Optimize your pricing models and enterprise contract legal structures.',
                },
                {
                  title: 'Follow-on Funding Syndicate',
                  desc: 'Access co-investment pools from larger venture capital partners.',
                },
              ],
            },
          },
        ],
        seo: {
          metaTitle: 'Accelerator Programs & Services | CIO Angel Network',
          metaDescription: 'Leverage our PoC Sandboxes, enterprise sales workshops, and VC syndicate pools.',
          metaKeywords: ['poc sandbox', 'sales enablement', 'funding syndicate'],
          canonicalUrl: `${website.domain}/services`,
          noIndex: false,
          noFollow: false,
        },
      },
      {
        title: 'Contact Us',
        slug: 'contact-us',
        shortDescription: 'Get in touch with our team to apply for funding or join as an angel investor.',
        pageType: PageType.STATIC_PAGE,
        isHomepage: false,
        sections: [
          {
            type: SectionType.TEXT_BLOCK,
            order: 0,
            data: {
              title: 'Get In Touch',
              content: 'Are you an enterprise SaaS founder seeking funding? Or a CIO interested in joining our active investment syndicate? We would love to hear from you. Drop us a line at info@cioangel.com.',
            },
          },
        ],
        seo: {
          metaTitle: 'Contact Our Team | CIO Angel Network',
          metaDescription: 'Reach out to CIO Angel Network to schedule pitches, request information, or apply to join our angel syndicate.',
          metaKeywords: ['contact', 'email', 'pitch submit'],
          canonicalUrl: `${website.domain}/contact-us`,
          noIndex: false,
          noFollow: false,
        },
      },
    ];

    // Map created pages to link them to Navbars
    const createdPageMap = new Map<string, any>();

    for (const pageInfo of pagesData) {
      const existingPage = await this.pageModel.findOne({
        siteId: siteId as any,
        slug: pageInfo.slug,
        isDeleted: null,
      });

      if (!existingPage) {
        const page = new this.pageModel({
          ...pageInfo,
          siteId: siteId as any,
          status: PageStatus.PUBLISHED,
          createdBy: adminId as any,
          publishedAt: new Date(),
        });
        const saved = await page.save();
        createdPageMap.set(pageInfo.slug, saved);
        console.log(`  📄 Seeded Page: ${pageInfo.title}`);
      } else {
        createdPageMap.set(pageInfo.slug, existingPage);
      }
    }

    // 3. Seed Navbar Menu Items
    const headerMenuItems = [
      { title: 'Home', slug: 'home', order: 0 },
      { title: 'About Us', slug: 'about-us', order: 1 },
      { title: 'Services', slug: 'services', order: 2 },
      { title: 'Contact Us', slug: 'contact-us', order: 3 },
    ];

    for (const item of headerMenuItems) {
      const page = createdPageMap.get(item.slug);
      const existingNav = await this.navbarModel.findOne({
        siteId: siteId as any,
        position: NavbarPosition.HEADER,
        slug: `/${item.slug}`,
        isDeleted: null,
      });

      if (!existingNav) {
        const nav = new this.navbarModel({
          siteId: siteId as any,
          title: item.title,
          position: NavbarPosition.HEADER,
          order: item.order,
          isVisible: true,
          createdBy: adminId as any,
          items: [
            {
              title: item.title,
              slug: `/${item.slug}`,
              menuType: MenuType.INTERNAL_PAGE,
              pageId: page ? page._id : null,
              target: '_self',
              isVisible: true,
            },
          ],
        });
        await nav.save();
        console.log(`  🍔 Seeded Header Link: ${item.title}`);
      }
    }

    const footerMenuItems = [
      { title: 'Privacy Policy', slug: 'privacy-policy', order: 0 },
      { title: 'Terms of Service', slug: 'terms-of-service', order: 1 },
    ];

    for (const item of footerMenuItems) {
      const existingNav = await this.navbarModel.findOne({
        siteId: siteId as any,
        position: NavbarPosition.FOOTER,
        slug: `/${item.slug}`,
        isDeleted: null,
      });

      if (!existingNav) {
        const nav = new this.navbarModel({
          siteId: siteId as any,
          title: item.title,
          position: NavbarPosition.FOOTER,
          order: item.order,
          isVisible: true,
          createdBy: adminId as any,
          items: [
            {
              title: item.title,
              slug: `/${item.slug}`,
              menuType: MenuType.CUSTOM_URL,
              target: '_blank',
              isVisible: true,
            },
          ],
        });
        await nav.save();
        console.log(`  🍔 Seeded Footer Link: ${item.title}`);
      }
    }

    console.log(`🌱 CMS seeding for ${website.name} complete!`);
  }
}
