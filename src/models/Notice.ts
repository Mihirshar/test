import { Table, Column, Model, DataType, BelongsTo, HasMany, ForeignKey, CreatedAt, UpdatedAt } from 'sequelize-typescript';
import Society from './Society';
import User from './User';
import NoticeReadStatus from './NoticeReadStatus';
import { NoticeType, NoticePriority } from '../types';

@Table({
  tableName: 'notices',
  timestamps: true,
})
export default class Notice extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  declare id: number;

  @ForeignKey(() => Society)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  societyId!: number;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  createdBy!: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  title!: string;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  content!: string;

  @Column({
    type: DataType.ENUM(...Object.values(NoticeType)),
    allowNull: false,
    defaultValue: NoticeType.GENERAL,
  })
  type!: NoticeType;

  @Column({
    type: DataType.ENUM(...Object.values(NoticePriority)),
    allowNull: false,
    defaultValue: NoticePriority.MEDIUM,
  })
  priority!: NoticePriority;

  @Column({
    type: DataType.JSON,
    allowNull: true,
  })
  attachments!: {
    url: string;
    type: string;
    name: string;
  }[];

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  expiryDate!: Date;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  })
  isActive!: boolean;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  isCritical!: boolean;

  @Column({
    type: DataType.JSON,
    allowNull: true,
  })
  targetFlats!: number[]; // If null, notice is for all flats

  @Column({
    type: DataType.JSON,
    allowNull: true,
  })
  metadata!: Record<string, any>;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;

  // Associations
  @BelongsTo(() => Society)
  society!: Society;

  @BelongsTo(() => User)
  creator!: User;

  @HasMany(() => NoticeReadStatus)
  readStatuses!: NoticeReadStatus[];
} 