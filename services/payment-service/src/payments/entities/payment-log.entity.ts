import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PaymentEntity } from './payment.entity';

@Entity({ name: 'payment_logs' })
export class PaymentLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => PaymentEntity, (payment) => payment.logs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'payment_id' })
  payment!: PaymentEntity;

  @Column()
  level!: string;

  @Column({ type: 'text' })
  message!: string;

  @Column({ type: 'jsonb', nullable: true })
  context?: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
