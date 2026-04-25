import { IsNotEmpty, IsString } from 'class-validator';

export class RefundPaymentDto {
  @IsString()
  @IsNotEmpty()
  amountUnits!: string;
}
