import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateProfileDto {
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  @IsOptional()
  name?: string;

  @IsString()
  @MaxLength(30)
  @IsOptional()
  phone?: string;

  @IsString()
  @MaxLength(500)
  @IsOptional()
  address?: string;

  @IsString()
  @MaxLength(120)
  @IsOptional()
  city?: string;

  @IsString()
  @MaxLength(500)
  @IsOptional()
  avatarUrl?: string;
}
