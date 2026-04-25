import { Injectable } from '@nestjs/common';
import { DevHttpProvider } from './dev-http-provider';

@Injectable()
export class ClickProvider extends DevHttpProvider {
  protected name(): string {
    return 'CLICK';
  }
}
