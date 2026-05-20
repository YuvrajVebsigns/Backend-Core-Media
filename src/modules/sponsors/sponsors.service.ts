import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Sponsor } from './schemas/sponsor.schema';
import { CreateSponsorDto, UpdateSponsorDto } from './dto/sponsor.dto';

@Injectable()
export class SponsorsService {
  constructor(
    @InjectModel(Sponsor.name) private sponsorModel: Model<Sponsor>,
  ) {}

  async create(createSponsorDto: CreateSponsorDto): Promise<Sponsor> {
    const createdSponsor = new this.sponsorModel(createSponsorDto);
    return createdSponsor.save();
  }

  async findAll(): Promise<Sponsor[]> {
    return this.sponsorModel.find().exec();
  }

  async findOne(id: string): Promise<Sponsor> {
    const sponsor = await this.sponsorModel.findById(id).exec();
    if (!sponsor) {
      throw new NotFoundException(`Sponsor with ID ${id} not found`);
    }
    return sponsor;
  }

  async update(id: string, updateSponsorDto: UpdateSponsorDto): Promise<Sponsor> {
    const updatedSponsor = await this.sponsorModel
      .findByIdAndUpdate(id, updateSponsorDto, { new: true })
      .exec();
    if (!updatedSponsor) {
      throw new NotFoundException(`Sponsor with ID ${id} not found`);
    }
    return updatedSponsor;
  }

  async remove(id: string): Promise<void> {
    const result = await this.sponsorModel.findByIdAndUpdate(id, { isDeleted: true }).exec();
    if (!result) {
      throw new NotFoundException(`Sponsor with ID ${id} not found`);
    }
  }
}
