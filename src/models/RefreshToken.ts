import { Table, Column, Model, DataType, BelongsTo, ForeignKey, CreatedAt, UpdatedAt } from 'sequelize-typescript';
import User from './User';

@Table({
  tableName: 'refresh_tokens',
  timestamps: true,
})
export default class RefreshToken extends Model {
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
    unique: true,
  })
  token!: string;

  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  expiresAt!: Date;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  })
  isActive!: boolean;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  deviceId!: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  deviceName!: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  deviceType!: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  ipAddress!: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  userAgent!: string;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;

  // Associations
  @BelongsTo(() => User)
  user!: User;

  // Instance methods
  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }
} 