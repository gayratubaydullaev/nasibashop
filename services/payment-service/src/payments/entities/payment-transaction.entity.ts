import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PaymentEntity } from './payment.entity';

@Entity({ name: 'payment_transactions' })
export class PaymentTransactionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => PaymentEntity, (payment) => payment.transactions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'payment_id' })
  payment!: PaymentEntity;

  @Column()
  type!: string;

  @Column()
  status!: string;

  @Column({ type: 'jsonb', nullable: true })
  providerPayload?: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
