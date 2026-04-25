import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { PaymentProviderKind } from '../enums';

export class CreatePaymentDto {
  @IsString()
  @IsNotEmpty()
  orderId!: string;

  @IsString()
  @IsNotEmpty()
  userId!: string;

  @IsString()
  @IsNotEmpty()
  storeId!: string;

  @IsString()
  @IsNotEmpty()
  currencyCode!: string;

  @IsString()
  @IsNotEmpty()
  amountUnits!: string;

  @IsEnum(PaymentProviderKind)
  provider!: PaymentProviderKind;

  @IsOptional()
  metadata?: Record<string, unknown>;
}
