import { Table, Column, Model, DataType, BelongsTo, HasMany, ForeignKey, CreatedAt, UpdatedAt } from 'sequelize-typescript';
import Flat from './Flat';
import Society from './Society';
import Payment from './Payment';
import { PaymentStatus } from '../types';

@Table({
  tableName: 'maintenance_bills',
  timestamps: true,
})
export default class MaintenanceBill extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  declare id: number;

  @ForeignKey(() => Flat)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  flatId!: number;

  @ForeignKey(() => Society)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  societyId!: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: true,
  })
  billNumber!: string;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
  })
  amount!: number;

  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  billDate!: Date;

  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  dueDate!: Date;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  billPeriod!: string; // e.g., "January 2024"

  @Column({
    type: DataType.ENUM(...Object.values(PaymentStatus)),
    allowNull: false,
    defaultValue: PaymentStatus.PENDING,
  })
  status!: PaymentStatus;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
  })
  paidAmount!: number;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  paidDate!: Date;

  @Column({
    type: DataType.JSON,
    allowNull: true,
  })
  breakdown!: {
    maintenance: number;
    water: number;
    electricity?: number;
    others?: Record<string, number>;
  };

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: true,
  })
  lateFee!: number;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  notes!: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    unique: true,
  })
  qrCode!: string; // QR code data for payment

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
  })
  reminderCount!: number;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  lastReminderAt!: Date;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;

  // Associations
  @BelongsTo(() => Flat)
  flat!: Flat;

  @BelongsTo(() => Society)
  society!: Society;

  @HasMany(() => Payment)
  payments!: Payment[];
}