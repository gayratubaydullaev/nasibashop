import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { RefundPaymentDto } from './dto/refund-payment.dto';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Get()
  list(
    @Query('page') page?: string,
    @Query('size') size?: string,
    @Query('status') status?: string,
  ) {
    return this.payments.listPayments({ page, size, status });
  }

  @Post('create')
  create(@Body() body: CreatePaymentDto) {
    return this.payments.createPayment(body);
  }

  @Get(':id/status')
  status(@Param('id') id: string) {
    return this.payments.getPaymentStatus(id);
  }

  @Post(':id/refund')
  refund(@Param('id') id: string, @Body() body: RefundPaymentDto) {
    return this.payments.refundPayment(id, body);
  }

  @Post('payme/callback')
  paymeCallback(@Body() body: Record<string, unknown>) {
    return this.payments.handleProviderWebhook('PAYME', body);
  }

  @Post('click/callback')
  clickCallback(@Body() body: Record<string, unknown>) {
    return this.payments.handleProviderWebhook('CLICK', body);
  }

  @Post('uzcard/callback')
  uzcardCallback(@Body() body: Record<string, unknown>) {
    return this.payments.handleProviderWebhook('UZCARD', body);
  }
}
