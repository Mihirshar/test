import { Table, Column, Model, DataType, BelongsTo, ForeignKey, CreatedAt, UpdatedAt } from 'sequelize-typescript';
import User from './User';
import { VisitorPassStatus } from '../types';

@Table({
  tableName: 'visitor_passes',
  timestamps: true,
})
export default class VisitorPass extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  declare id: number;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  userId!: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  visitorName!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  visitorPhone!: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  vehicleNumber!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: true,
  })
  otp!: string;

  @Column({
    type: DataType.ENUM(...Object.values(VisitorPassStatus)),
    allowNull: false,
    defaultValue: VisitorPassStatus.PENDING,
  })
  status!: VisitorPassStatus;

  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  validFrom!: Date;

  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  validUntil!: Date;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  purpose!: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  isRecurring!: boolean;

  @Column({
    type: DataType.JSON,
    allowNull: true,
  })
  recurringDays!: number[]; // [0-6] for Sunday-Saturday

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  entryTime!: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  exitTime!: Date;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  guardIdEntry!: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  guardIdExit!: number;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  entryPhoto!: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  notes!: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  rejectionReason!: string;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;

  // Associations
  @BelongsTo(() => User)
  user!: User;

  @BelongsTo(() => User, { foreignKey: 'guardIdEntry', as: 'entryGuard' })
  entryGuard!: User;

  @BelongsTo(() => User, { foreignKey: 'guardIdExit', as: 'exitGuard' })
  exitGuard!: User;
} 