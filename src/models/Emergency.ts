import { Table, Column, Model, DataType, BelongsTo, ForeignKey, CreatedAt, UpdatedAt } from 'sequelize-typescript';
import User from './User';
import Society from './Society';
import { EmergencyStatus } from '../types';

@Table({
  tableName: 'emergencies',
  timestamps: true,
})
export default class Emergency extends Model {
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

  @ForeignKey(() => Society)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  societyId!: number;

  @Column({
    type: DataType.ENUM(...Object.values(EmergencyStatus)),
    allowNull: false,
    defaultValue: EmergencyStatus.ACTIVE,
  })
  status!: EmergencyStatus;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  description!: string;

  @Column({
    type: DataType.JSON,
    allowNull: true,
  })
  location!: {
    lat?: number;
    lng?: number;
    address?: string;
  };

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  resolvedAt!: Date;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  resolvedBy!: number;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  resolutionNotes!: string;

  @Column({
    type: DataType.JSON,
    allowNull: true,
  })
  notifiedUsers!: number[]; // User IDs who were notified

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  callInitiated!: boolean;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  callSid!: string; // Twilio call SID

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;

  // Associations
  @BelongsTo(() => User)
  user!: User;

  @BelongsTo(() => Society)
  society!: Society;

  @BelongsTo(() => User, { foreignKey: 'resolvedBy', as: 'resolver' })
  resolver!: User;
} 