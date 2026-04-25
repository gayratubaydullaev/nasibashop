import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PaymentEntity } from './payment.entity';

@Entity({ name: 'payment_refunds' })
export class PaymentRefundEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => PaymentEntity, (payment) => payment.refunds, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'payment_id' })
  payment!: PaymentEntity;

  @Column({ name: 'amount_units', type: 'bigint' })
  amountUnits!: string;

  @Column()
  status!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
