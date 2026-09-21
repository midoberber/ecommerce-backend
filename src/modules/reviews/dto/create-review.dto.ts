import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class CreateReviewDto {
  @IsInt({ message: 'التقييم مطلوب' })
  @Min(1, { message: 'أقل تقييم نجمة واحدة' })
  @Max(5, { message: 'أعلى تقييم 5 نجوم' })
  rating!: number;

  @IsString()
  @MaxLength(1000)
  @IsOptional()
  comment?: string;
}
