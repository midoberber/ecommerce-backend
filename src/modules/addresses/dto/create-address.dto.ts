import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateAddressDto {
  @IsString()
  @IsNotEmpty({ message: 'اسم العنوان مطلوب' })
  @MaxLength(60)
  label!: string;

  @IsString()
  @MinLength(3, { message: 'الاسم قصير جداً' })
  @MaxLength(255)
  fullName!: string;

  @IsString()
  @Matches(/^[0-9+\s-]{7,20}$/, { message: 'رقم جوال غير صالح' })
  phone!: string;

  @IsString()
  @IsNotEmpty({ message: 'المدينة مطلوبة' })
  @MaxLength(120)
  city!: string;

  @IsString()
  @MaxLength(120)
  @IsOptional()
  district?: string;

  @IsString()
  @MinLength(3, { message: 'الشارع مطلوب' })
  @MaxLength(255)
  street!: string;

  @IsString()
  @MaxLength(500)
  @IsOptional()
  details?: string;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}
