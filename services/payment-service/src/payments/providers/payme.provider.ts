import { Injectable } from '@nestjs/common';
import { DevHttpProvider } from './dev-http-provider';

@Injectable()
export class PaymeProvider extends DevHttpProvider {
  protected name(): string {
    return 'PAYME';
  }
}
