import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { Campaign } from './entities/campaign.entity';

@Injectable()
export class CampaignsService {
  constructor(
    @InjectRepository(Campaign)
    private readonly campaignRepository: Repository<Campaign>,
  ) {}

  async create(createCampaignDto: CreateCampaignDto): Promise<Campaign> {
    await this.checkForOverlap(createCampaignDto.startDate, createCampaignDto.endDate);
    const campaign = this.campaignRepository.create(createCampaignDto);
    return this.campaignRepository.save(campaign);
  }

  findAll() {
    return this.campaignRepository.find({ order: { startDate: 'DESC' } });
  }

  async findOne(id: number) {
    const campaign = await this.campaignRepository.findOneBy({ id });
    if (!campaign) {
      throw new NotFoundException(`Campaign with ID #${id} not found`);
    }
    return campaign;
  }

  async update(id: number, updateCampaignDto: UpdateCampaignDto): Promise<Campaign> {
    const campaign = await this.findOne(id);
    const startDate = updateCampaignDto.startDate || campaign.startDate;
    const endDate = updateCampaignDto.endDate || campaign.endDate;
    await this.checkForOverlap(startDate, endDate, id);
    this.campaignRepository.merge(campaign, updateCampaignDto);
    return this.campaignRepository.save(campaign);
  }

  async remove(id: number) {
    const result = await this.campaignRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Campaign with ID #${id} not found`);
    }
    return { message: 'Campaign deleted successfully' };
  }

  private async checkForOverlap(startDate: Date, endDate: Date, excludeId?: number): Promise<void> {
    const queryBuilder = this.campaignRepository.createQueryBuilder('campaign')
      .where('campaign.startDate <= :endDate', { endDate })
      .andWhere('campaign.endDate >= :startDate', { startDate });

    if (excludeId) {
      queryBuilder.andWhere('campaign.id != :excludeId', { excludeId });
    }

    const overlappingCampaign = await queryBuilder.getOne();

    if (overlappingCampaign) {
      throw new ConflictException(`Date range overlaps with existing campaign: "${overlappingCampaign.name}"`);
    }
  }
}