import { Injectable, BadRequestException } from '@nestjs/common';
import { IPageSection } from '../interfaces/page-section.interface';
import { SectionType } from '../enums/section-type.enum';

@Injectable()
export class SectionService {
  validateSections(sections: IPageSection[]): void {
    if (!sections || !Array.isArray(sections)) {
      return;
    }

    const orders = new Set<number>();

    for (const section of sections) {
      if (!Object.values(SectionType).includes(section.type)) {
        throw new BadRequestException(`Invalid section type: ${section.type}`);
      }

      if (section.order === undefined || typeof section.order !== 'number') {
        throw new BadRequestException(`Section order must be a valid number`);
      }

      if (orders.has(section.order)) {
        throw new BadRequestException(
          `Duplicate section order found: ${section.order}`,
        );
      }

      orders.add(section.order);
    }
  }

  reorderSections(sections: IPageSection[]): IPageSection[] {
    if (!sections) return [];
    return [...sections].sort((a, b) => a.order - b.order);
  }
}
