import { Injectable } from '@nestjs/common';
import { DevHttpProvider } from './dev-http-provider';

@Injectable()
export class UzcardProvider extends DevHttpProvider {
  protected name(): string {
    return 'UZCARD';
  }
}
