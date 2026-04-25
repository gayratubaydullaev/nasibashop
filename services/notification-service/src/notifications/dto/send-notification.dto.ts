import { IsArray, IsOptional, IsString } from 'class-validator';

export class SendNotificationDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  storeId?: string;

  @IsString()
  title!: string;

  @IsString()
  body!: string;

  @IsOptional()
  @IsString()
  topic?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  channels?: string[];
}
