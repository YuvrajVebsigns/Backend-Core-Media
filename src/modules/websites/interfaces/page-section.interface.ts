import { SectionType } from '../enums/section-type.enum';

export interface IPageSection {
  type: SectionType;
  order: number;
  data: Record<string, any>;
}
