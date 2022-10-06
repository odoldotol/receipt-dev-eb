import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Read Mart Receipts - Dev Server';
  }
}
