import { ApiProperty } from '@nestjs/swagger';
import { ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { SeoMetaDto } from './create-page.dto';

export class UpdateSeoDto {
  @ApiProperty({ type: SeoMetaDto })
  @ValidateNested()
  @Type(() => SeoMetaDto)
  seo: SeoMetaDto;
}
