import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Sponsor, SponsorType, SponsorTier } from '@modules/sponsors/schemas/sponsor.schema';
import { WebsitesService } from '@modules/websites/websites.service';

interface SponsorSeedData {
  name: string;
  companyName: string;
  companyDomain: string;
  email: string;
  phone: string;
  designation: string;
  website: string;
  valuation: string;
  type: SponsorType;
  tier: SponsorTier;
  description: string;
  socialLinks: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
    instagram?: string;
  };
  address: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    zip?: string;
  };
}

const SPONSORS_SEED_DATA: SponsorSeedData[] = [
  {
    name: 'Rajesh Mehta',
    companyName: 'InfiniTech Solutions',
    companyDomain: 'infinitech.io',
    email: 'rajesh@infinitech.io',
    phone: '+971-4-555-0101',
    designation: 'CEO & Founder',
    website: 'https://infinitech.io',
    valuation: '$2.5B',
    type: SponsorType.COMPANY,
    tier: SponsorTier.PLATINUM,
    description: 'A global leader in enterprise AI solutions, powering digital transformation for Fortune 500 companies across the Middle East and beyond.',
    socialLinks: { linkedin: 'https://linkedin.com/company/infinitech', twitter: 'https://twitter.com/infinitech' },
    address: { street: 'Tower 1, DIFC', city: 'Dubai', state: 'Dubai', country: 'UAE', zip: '506010' },
  },
  {
    name: 'Priya Sharma',
    companyName: 'CloudNova Technologies',
    companyDomain: 'cloudnova.com',
    email: 'priya@cloudnova.com',
    phone: '+91-22-6789-1234',
    designation: 'CTO',
    website: 'https://cloudnova.com',
    valuation: '$800M',
    type: SponsorType.COMPANY,
    tier: SponsorTier.GOLD,
    description: 'Cloud infrastructure and DevOps platform enabling seamless multi-cloud deployments for enterprises worldwide.',
    socialLinks: { linkedin: 'https://linkedin.com/company/cloudnova', twitter: 'https://twitter.com/cloudnova', instagram: 'https://instagram.com/cloudnova' },
    address: { street: 'BKC Complex, Bandra', city: 'Mumbai', state: 'Maharashtra', country: 'India', zip: '400051' },
  },
  {
    name: 'Ahmad Al-Rashid',
    companyName: 'Gulf Digital Ventures',
    companyDomain: 'gulfdigital.ae',
    email: 'ahmad@gulfdigital.ae',
    phone: '+971-2-555-0202',
    designation: 'Managing Director',
    website: 'https://gulfdigital.ae',
    valuation: '$1.2B',
    type: SponsorType.COMPANY,
    tier: SponsorTier.PLATINUM,
    description: 'A premier venture capital firm investing in deep-tech startups across the GCC region with a focus on AI and fintech.',
    socialLinks: { linkedin: 'https://linkedin.com/company/gulfdigital', facebook: 'https://facebook.com/gulfdigital' },
    address: { street: 'Etihad Towers', city: 'Abu Dhabi', state: 'Abu Dhabi', country: 'UAE', zip: '111222' },
  },
  {
    name: 'Sarah Chen',
    companyName: 'Nexus AI Labs',
    companyDomain: 'nexusai.com',
    email: 'sarah@nexusai.com',
    phone: '+1-650-555-0303',
    designation: 'VP of Partnerships',
    website: 'https://nexusai.com',
    valuation: '$4B',
    type: SponsorType.COMPANY,
    tier: SponsorTier.PLATINUM,
    description: 'Pioneering generative AI research and enterprise applications, with cutting-edge LLM solutions for content, coding, and analytics.',
    socialLinks: { linkedin: 'https://linkedin.com/company/nexusai', twitter: 'https://twitter.com/nexusailabs' },
    address: { street: '1200 Innovation Dr', city: 'Palo Alto', state: 'California', country: 'USA', zip: '94301' },
  },
  {
    name: 'Omar Khalil',
    companyName: 'FinEdge Capital',
    companyDomain: 'finedge.com',
    email: 'omar@finedge.com',
    phone: '+971-4-555-0404',
    designation: 'Chief Investment Officer',
    website: 'https://finedge.com',
    valuation: '$3.1B',
    type: SponsorType.COMPANY,
    tier: SponsorTier.GOLD,
    description: 'A leading fintech investment firm providing digital banking solutions and crypto-asset management across the MENA region.',
    socialLinks: { linkedin: 'https://linkedin.com/company/finedge', twitter: 'https://twitter.com/finedge' },
    address: { street: 'Gate Village 4', city: 'Dubai', state: 'Dubai', country: 'UAE', zip: '507000' },
  },
  {
    name: 'Dr. Lisa Wang',
    companyName: 'BioSphere Innovations',
    companyDomain: 'biosphere.tech',
    email: 'lisa@biosphere.tech',
    phone: '+44-20-7946-0505',
    designation: 'Chief Scientific Officer',
    website: 'https://biosphere.tech',
    valuation: '$650M',
    type: SponsorType.COMPANY,
    tier: SponsorTier.SILVER,
    description: 'Biotech company leveraging AI for drug discovery and precision medicine, with partnerships across 30+ countries.',
    socialLinks: { linkedin: 'https://linkedin.com/company/biosphere-innovations', instagram: 'https://instagram.com/biospheretech' },
    address: { street: '85 Whitechapel Rd', city: 'London', state: 'England', country: 'UK', zip: 'E1 1DU' },
  },
  {
    name: 'Marcus Thompson',
    companyName: 'Quantum Bridge Systems',
    companyDomain: 'quantumbridge.io',
    email: 'marcus@quantumbridge.io',
    phone: '+1-512-555-0606',
    designation: 'CEO',
    website: 'https://quantumbridge.io',
    valuation: '$1.8B',
    type: SponsorType.COMPANY,
    tier: SponsorTier.GOLD,
    description: 'Enterprise quantum computing solutions enabling next-generation cryptography and complex simulation workloads for global industries.',
    socialLinks: { linkedin: 'https://linkedin.com/company/quantumbridge', twitter: 'https://twitter.com/quantumbridge' },
    address: { street: '4200 Congress Ave', city: 'Austin', state: 'Texas', country: 'USA', zip: '78701' },
  },
  {
    name: 'Fatima Al-Zahra',
    companyName: 'EduVerse Platform',
    companyDomain: 'eduverse.io',
    email: 'fatima@eduverse.io',
    phone: '+966-11-555-0707',
    designation: 'Founder & CEO',
    website: 'https://eduverse.io',
    valuation: '$400M',
    type: SponsorType.COMPANY,
    tier: SponsorTier.SILVER,
    description: 'EdTech startup building immersive virtual classrooms and AI-powered tutoring systems for the Middle East education market.',
    socialLinks: { linkedin: 'https://linkedin.com/company/eduverse', twitter: 'https://twitter.com/eduverse', instagram: 'https://instagram.com/eduverse' },
    address: { street: 'King Fahd Rd', city: 'Riyadh', state: 'Riyadh', country: 'Saudi Arabia', zip: '12214' },
  },
  {
    name: 'Vikram Patel',
    companyName: 'DataStream Analytics',
    companyDomain: 'datastream.co',
    email: 'vikram@datastream.co',
    phone: '+91-80-4567-0808',
    designation: 'Head of Strategy',
    website: 'https://datastream.co',
    valuation: '$550M',
    type: SponsorType.COMPANY,
    tier: SponsorTier.SILVER,
    description: 'Real-time big data analytics platform helping enterprises derive actionable insights from structured and unstructured data at scale.',
    socialLinks: { linkedin: 'https://linkedin.com/company/datastream', facebook: 'https://facebook.com/datastream' },
    address: { street: 'Outer Ring Rd, HSR Layout', city: 'Bengaluru', state: 'Karnataka', country: 'India', zip: '560102' },
  },
  {
    name: 'Elena Rodriguez',
    companyName: 'GreenGrid Energy',
    companyDomain: 'greengrid.energy',
    email: 'elena@greengrid.energy',
    phone: '+34-91-555-0909',
    designation: 'Director of Sustainability',
    website: 'https://greengrid.energy',
    valuation: '$1.5B',
    type: SponsorType.COMPANY,
    tier: SponsorTier.GOLD,
    description: 'Renewable energy tech company optimizing solar and wind farms with AI-driven grid management across Europe and MENA.',
    socialLinks: { linkedin: 'https://linkedin.com/company/greengrid', twitter: 'https://twitter.com/greengrid', instagram: 'https://instagram.com/greengrid' },
    address: { street: 'Paseo de la Castellana 200', city: 'Madrid', state: 'Madrid', country: 'Spain', zip: '28046' },
  },
  {
    name: 'James Mitchell',
    companyName: 'CyberFort Security',
    companyDomain: 'cyberfort.com',
    email: 'james@cyberfort.com',
    phone: '+1-703-555-1010',
    designation: 'CISO',
    website: 'https://cyberfort.com',
    valuation: '$2B',
    type: SponsorType.COMPANY,
    tier: SponsorTier.PLATINUM,
    description: 'Enterprise cybersecurity platform offering zero-trust architecture, threat intelligence, and automated incident response solutions.',
    socialLinks: { linkedin: 'https://linkedin.com/company/cyberfort', twitter: 'https://twitter.com/cyberfort' },
    address: { street: '1600 Wilson Blvd', city: 'Arlington', state: 'Virginia', country: 'USA', zip: '22209' },
  },
  {
    name: 'Yuki Tanaka',
    companyName: 'RoboSphere Corp',
    companyDomain: 'robosphere.jp',
    email: 'yuki@robosphere.jp',
    phone: '+81-3-5555-1111',
    designation: 'VP of Engineering',
    website: 'https://robosphere.jp',
    valuation: '$900M',
    type: SponsorType.COMPANY,
    tier: SponsorTier.GOLD,
    description: 'Robotics and automation company specializing in industrial cobots and warehouse automation systems for global supply chains.',
    socialLinks: { linkedin: 'https://linkedin.com/company/robosphere', twitter: 'https://twitter.com/robosphere' },
    address: { street: '3-1 Akasaka', city: 'Tokyo', state: 'Tokyo', country: 'Japan', zip: '107-0052' },
  },
  {
    name: 'David Okonkwo',
    companyName: 'PayBridge Africa',
    companyDomain: 'paybridge.africa',
    email: 'david@paybridge.africa',
    phone: '+234-1-555-1212',
    designation: 'Co-Founder',
    website: 'https://paybridge.africa',
    valuation: '$350M',
    type: SponsorType.COMPANY,
    tier: SponsorTier.BRONZE,
    description: 'Mobile payments and digital banking platform serving over 15 million users across Sub-Saharan Africa with seamless cross-border transactions.',
    socialLinks: { linkedin: 'https://linkedin.com/company/paybridge', twitter: 'https://twitter.com/paybridgeafrica', instagram: 'https://instagram.com/paybridge' },
    address: { street: 'Victoria Island', city: 'Lagos', state: 'Lagos', country: 'Nigeria', zip: '101241' },
  },
  {
    name: 'Anna Petrova',
    companyName: 'SpaceTech Dynamics',
    companyDomain: 'spacetech.io',
    email: 'anna@spacetech.io',
    phone: '+49-30-555-1313',
    designation: 'Chief Operations Officer',
    website: 'https://spacetech.io',
    valuation: '$1.1B',
    type: SponsorType.COMPANY,
    tier: SponsorTier.PARTNER,
    description: 'Space technology company developing satellite-based IoT connectivity and earth observation analytics for agriculture and logistics.',
    socialLinks: { linkedin: 'https://linkedin.com/company/spacetech', twitter: 'https://twitter.com/spacetechdyn' },
    address: { street: 'Friedrichstraße 130', city: 'Berlin', state: 'Berlin', country: 'Germany', zip: '10117' },
  },
  {
    name: 'Michael Torres',
    companyName: 'HealthSync',
    companyDomain: 'healthsync.com',
    email: 'michael@healthsync.com',
    phone: '+1-415-555-1414',
    designation: 'CEO',
    website: 'https://healthsync.com',
    valuation: '$720M',
    type: SponsorType.COMPANY,
    tier: SponsorTier.SILVER,
    description: 'Digital health platform integrating wearable data, EHR systems, and AI diagnostics to provide predictive healthcare analytics.',
    socialLinks: { linkedin: 'https://linkedin.com/company/healthsync', facebook: 'https://facebook.com/healthsync', instagram: 'https://instagram.com/healthsync' },
    address: { street: '500 Market St', city: 'San Francisco', state: 'California', country: 'USA', zip: '94105' },
  },
  {
    name: 'Ravi Krishnan',
    companyName: 'MetaForge Studios',
    companyDomain: 'metaforge.studio',
    email: 'ravi@metaforge.studio',
    phone: '+91-44-5555-1515',
    designation: 'Creative Director',
    website: 'https://metaforge.studio',
    valuation: '$200M',
    type: SponsorType.COMPANY,
    tier: SponsorTier.BRONZE,
    description: 'Metaverse and XR studio creating immersive brand experiences, virtual event platforms, and 3D digital twins for enterprise clients.',
    socialLinks: { linkedin: 'https://linkedin.com/company/metaforge', twitter: 'https://twitter.com/metaforgestudio', instagram: 'https://instagram.com/metaforge' },
    address: { street: 'OMR, Thoraipakkam', city: 'Chennai', state: 'Tamil Nadu', country: 'India', zip: '600097' },
  },
  {
    name: 'Charlotte Bennett',
    companyName: 'AeroLogix',
    companyDomain: 'aerologix.com',
    email: 'charlotte@aerologix.com',
    phone: '+61-2-5555-1616',
    designation: 'Head of Global Partnerships',
    website: 'https://aerologix.com',
    valuation: '$600M',
    type: SponsorType.COMPANY,
    tier: SponsorTier.PARTNER,
    description: 'Drone logistics and autonomous delivery company providing last-mile solutions for e-commerce and emergency medical supply chains.',
    socialLinks: { linkedin: 'https://linkedin.com/company/aerologix', twitter: 'https://twitter.com/aerologix' },
    address: { street: '100 Barangaroo Ave', city: 'Sydney', state: 'NSW', country: 'Australia', zip: '2000' },
  },
  {
    name: 'Hassan Bakr',
    companyName: 'SmartPort Technologies',
    companyDomain: 'smartport.tech',
    email: 'hassan@smartport.tech',
    phone: '+971-4-555-1717',
    designation: 'VP of Innovation',
    website: 'https://smartport.tech',
    valuation: '$450M',
    type: SponsorType.COMPANY_UNIT,
    tier: SponsorTier.SILVER,
    description: 'Smart logistics and port automation platform leveraging IoT sensors and AI for real-time cargo tracking and operational optimization.',
    socialLinks: { linkedin: 'https://linkedin.com/company/smartport', twitter: 'https://twitter.com/smartporttech' },
    address: { street: 'Jebel Ali Free Zone', city: 'Dubai', state: 'Dubai', country: 'UAE', zip: '262000' },
  },
  {
    name: 'Sophia Laurent',
    companyName: 'LuxBrand Digital',
    companyDomain: 'luxbrand.digital',
    email: 'sophia@luxbrand.digital',
    phone: '+33-1-5555-1818',
    designation: 'Managing Partner',
    website: 'https://luxbrand.digital',
    valuation: '$300M',
    type: SponsorType.INDIVIDUAL,
    tier: SponsorTier.BRONZE,
    description: 'Luxury brand digital consultancy helping heritage fashion and lifestyle brands build premium digital experiences and DTC e-commerce platforms.',
    socialLinks: { linkedin: 'https://linkedin.com/in/sophialaurent', instagram: 'https://instagram.com/luxbranddigital' },
    address: { street: '12 Rue du Faubourg Saint-Honoré', city: 'Paris', state: 'Île-de-France', country: 'France', zip: '75008' },
  },
  {
    name: 'Alex Volkov',
    companyName: 'NeuralNet Systems',
    companyDomain: 'neuralnet.dev',
    email: 'alex@neuralnet.dev',
    phone: '+972-3-555-1919',
    designation: 'Chief Architect',
    website: 'https://neuralnet.dev',
    valuation: '$1.3B',
    type: SponsorType.COMPANY,
    tier: SponsorTier.GOLD,
    description: 'Deep learning infrastructure company providing GPU cloud clusters and MLOps tooling for training and deploying large-scale AI models.',
    socialLinks: { linkedin: 'https://linkedin.com/company/neuralnet', twitter: 'https://twitter.com/neuralnetsys', facebook: 'https://facebook.com/neuralnet' },
    address: { street: 'Rothschild Blvd 45', city: 'Tel Aviv', state: 'Tel Aviv', country: 'Israel', zip: '6688312' },
  },
];

@Injectable()
export class SponsorsSeeder implements OnApplicationBootstrap {
  constructor(
    @InjectModel(Sponsor.name) private sponsorModel: Model<Sponsor>,
    private readonly websitesService: WebsitesService,
  ) {}

  async onApplicationBootstrap() {
    // Delay to ensure Websites are seeded first
    setTimeout(async () => {
      await this.seed();
    }, 3000);
  }

  async seed() {
    const websites = await this.websitesService.findAll({ limit: 100 });

    if (websites.data.length === 0) {
      console.warn('⚠️ Skipping Sponsors seeding: No websites found');
      return;
    }

    let seeded = 0;

    for (let i = 0; i < SPONSORS_SEED_DATA.length; i++) {
      const data = SPONSORS_SEED_DATA[i];

      // Check if sponsor already exists by name + companyDomain
      const existing = await this.sponsorModel.findOne({
        name: data.name,
        companyDomain: data.companyDomain,
      });

      if (existing) {
        continue;
      }

      // Assign to websites in round-robin fashion
      const website = websites.data[i % websites.data.length];

      await this.sponsorModel.create({
        ...data,
        websites: [website.id || website._id] as any,
        isActive: true,
        sortOrder: i,
      });

      seeded++;
    }

    if (seeded > 0) {
      console.log(`✅ Sponsors seeded: ${seeded} sponsors created`);
    }
  }
}
