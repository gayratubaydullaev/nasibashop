import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PaymentProviderKind, PaymentStatus } from '../enums';
import { PaymentTransactionEntity } from './payment-transaction.entity';
import { PaymentRefundEntity } from './payment-refund.entity';
import { PaymentLogEntity } from './payment-log.entity';

@Entity({ name: 'payments' })
export class PaymentEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'order_id', unique: true })
  orderId!: string;

  @Column({ name: 'user_id' })
  userId!: string;

  @Column({ name: 'store_id' })
  storeId!: string;

  @Column({ name: 'currency_code' })
  currencyCode!: string;

  @Column({ name: 'amount_units', type: 'bigint' })
  amountUnits!: string;

  @Column({ type: 'enum', enum: PaymentStatus })
  status!: PaymentStatus;

  @Column({ type: 'enum', enum: PaymentProviderKind })
  provider!: PaymentProviderKind;

  @Column({ name: 'external_id', nullable: true })
  externalId?: string;

  @Column({ name: 'redirect_url', nullable: true })
  redirectUrl?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @OneToMany(() => PaymentTransactionEntity, (tx) => tx.payment, { cascade: true })
  transactions!: PaymentTransactionEntity[];

  @OneToMany(() => PaymentRefundEntity, (refund) => refund.payment, { cascade: true })
  refunds!: PaymentRefundEntity[];

  @OneToMany(() => PaymentLogEntity, (log) => log.payment, { cascade: true })
  logs!: PaymentLogEntity[];
}
