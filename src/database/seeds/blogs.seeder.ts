import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { BlogsService } from '../../modules/blogs/blogs.service';
import { WebsitesService } from '../../modules/websites/websites.service';
import { SystemUsersService } from '../../system-users/system-users.service';

@Injectable()
export class BlogsSeeder implements OnApplicationBootstrap {
  constructor(
    private readonly blogsService: BlogsService,
    private readonly websitesService: WebsitesService,
    private readonly systemUsersService: SystemUsersService,
  ) { }

  async onApplicationBootstrap() {
    // Delay to ensure Websites and SystemUsers are seeded first
    setTimeout(async () => {
      await this.seed();
    }, 2500);
  }

  async seed() {
    const websites = await this.websitesService.findAll({ limit: 100 });
    const admin = await this.systemUsersService.findByEmail('superadmin@gmail.com');

    if (!admin || websites.data.length === 0) {
      console.warn('⚠️ Skipping Blogs seeding: Admin or Websites not found');
      return;
    }

    const blogTitles = [
      'The Future of Digital Media in 2026',
      'How AI is Transforming Corporate Communications',
      'Top 10 Tech Trends for the Next Decade',
      'Building Sustainable Business Models in the MEA Region',
      'The Rise of Angel Investing in Emerging Markets',
      'Cybersecurity Essentials for Modern Enterprises',
      'Cloud Computing: Strategies for Multi-Site Management',
      'Data-Driven Decision Making for CXOs',
      'The Impact of 5G on Global Connectivity',
      'Innovation Leaders: A Spotlight on DCCAI 2026',
      'Strategic Planning in a Volatile Economy',
      'Developing the Next Generation of Leadership',
      'The Evolution of Social Media for Brands',
      'Fintech Revolution: What to Expect Next',
      'E-commerce Growth Strategies for 2026',
      'Harnessing Big Data for Marketing Excellence',
      'Remote Work: Best Practices for Global Teams',
      'Blockchain Beyond Cryptocurrency',
      'The Importance of Mental Health in High-Stakes Roles',
      'Building a Global Brand from the Ground Up',
    ];

    for (let i = 0; i < 20; i++) {
      const title = blogTitles[i];
      const slug = title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]/g, '');
      const website = websites.data[i % websites.data.length];

      const existing = await this.blogsService.findBySlug(slug);
      if (!existing) {
        await this.blogsService.create({
          title,
          slug,
          content: [
            {
              type: 'header',
              data: { text: `Understanding ${title}`, level: 2 }
            },
            {
              type: 'paragraph',
              data: { text: `As we look towards the future of digital media and technology, it becomes increasingly clear that staying ahead of the curve is essential for any modern enterprise. This article explores how ${website.name} is leading the way in innovation.` }
            },
            {
              type: 'quote',
              data: { 
                text: 'Innovation is the ability to see change as an opportunity - not a threat.',
                caption: 'Industry Expert',
                alignment: 'left'
              }
            },
            {
              type: 'header',
              data: { text: 'Core Strategies and Implementation', level: 3 }
            },
            {
              type: 'list',
              data: {
                style: 'unordered',
                items: [
                  `Key trends driving ${title}`,
                  `Strategic impact on ${website.name}`,
                  'Future projections and scalability'
                ]
              }
            },
            {
              type: 'image',
              data: {
                file: { url: `https://picsum.photos/seed/${i + 100}/800/400` },
                caption: `Visual representation of ${title} strategies`,
                withBorder: false,
                stretched: false,
                withBackground: true
              }
            },
            {
              type: 'delimiter',
              data: {}
            },
            {
              type: 'paragraph',
              data: { text: 'In conclusion, the path forward requires a blend of technological adoption and strategic foresight. Companies that embrace these changes will find themselves well-positioned for the challenges of tomorrow.' }
            }
          ],
          excerpt: `Learn more about ${title} and its impact on the industry in this insightful article.`,
          featureImage: `https://picsum.photos/seed/${i}/1200/630`,
          websites: [website.id],
          isActive: true,
          tags: ['Tech', 'Business', 'Innovation', website.name.split(' ')[0]],
          seo: {
            metaTitle: title,
            metaDescription: `Read about ${title} on the official blog of ${website.name}.`,
            keywords: ['media', 'tech', 'future', website.name.toLowerCase()],
            ogImage: `https://picsum.photos/seed/${i}/1200/630`,
          }
        }, admin._id.toString());
        console.log(`✅ Blog seeded: ${title} (${website.name})`);
      }
    }
  }
}
