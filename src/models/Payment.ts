import { Table, Column, Model, DataType, BelongsTo, ForeignKey, CreatedAt, UpdatedAt } from 'sequelize-typescript';
import MaintenanceBill from './MaintenanceBill';
import User from './User';

@Table({
  tableName: 'payments',
  timestamps: true,
})
export default class Payment extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  declare id: number;

  @ForeignKey(() => MaintenanceBill)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  billId!: number;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  userId!: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: true,
  })
  transactionId!: string;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
  })
  amount!: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  paymentMethod!: string; // UPI, Card, Bank Transfer, Cash

  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
  })
  paymentDate!: Date;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  referenceNumber!: string;

  @Column({
    type: DataType.JSON,
    allowNull: true,
  })
  metadata!: {
    upiId?: string;
    bankName?: string;
    cardLast4?: string;
    [key: string]: any;
  };

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  notes!: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  receiptUrl!: string;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;

  // Associations
  @BelongsTo(() => MaintenanceBill)
  bill!: MaintenanceBill;

  @BelongsTo(() => User)
  user!: User;
}