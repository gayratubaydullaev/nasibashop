import { Injectable } from '@nestjs/common';
import { PaymentProviderKind } from '../enums';
import { PaymentProvider } from './payment-provider';
import { PaymeProvider } from './payme.provider';
import { ClickProvider } from './click.provider';
import { UzcardProvider } from './uzcard.provider';
import { CashOnDeliveryProvider } from './cash-on-delivery.provider';

@Injectable()
export class PaymentProviderFactory {
  constructor(
    private readonly payme: PaymeProvider,
    private readonly click: ClickProvider,
    private readonly uzcard: UzcardProvider,
    private readonly cod: CashOnDeliveryProvider,
  ) {}

  get(kind: PaymentProviderKind): PaymentProvider {
    switch (kind) {
      case PaymentProviderKind.PAYME:
        return this.payme;
      case PaymentProviderKind.CLICK:
        return this.click;
      case PaymentProviderKind.UZCARD:
        return this.uzcard;
      case PaymentProviderKind.CASH_ON_DELIVERY:
        return this.cod;
      default:
        throw new Error(`Unsupported provider: ${String(kind)}`);
    }
  }
}
