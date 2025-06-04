import { Table, Column, Model, DataType, BelongsTo, HasMany, ForeignKey, CreatedAt, UpdatedAt } from 'sequelize-typescript';
import Society from './Society';
import Flat from './Flat';
import VisitorPass from './VisitorPass';
import Notice from './Notice';
import NoticeReadStatus from './NoticeReadStatus';
import Emergency from './Emergency';
import MaintenanceBill from './MaintenanceBill';
import Payment from './Payment';
import { UserRole, UserStatus } from '../types';

@Table({
  tableName: 'users',
  timestamps: true,
  underscored: true,
})
export default class User extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  declare id: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  name!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  })
  email!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: true,
    field: 'phone_number'
  })
  phoneNumber!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  password!: string;

  @Column({
    type: DataType.ENUM(...Object.values(UserRole)),
    allowNull: false,
    defaultValue: UserRole.RESIDENT,
  })
  role!: UserRole;

  @Column({
    type: DataType.ENUM(...Object.values(UserStatus)),
    allowNull: false,
    defaultValue: UserStatus.PENDING_SOCIETY,
  })
  status!: UserStatus;

  @ForeignKey(() => Society)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  societyId?: number;

  @ForeignKey(() => Flat)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  flatId?: number;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  profilePicture?: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  fcmToken?: string;

  @Column({
    type: DataType.JSONB,
    allowNull: true,
  })
  deviceInfo?: Record<string, any>;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  lastLoginAt?: Date;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  })
  isActive!: boolean;

  @Column({
    type: DataType.JSONB,
    allowNull: true,
    defaultValue: {}
  })
  preferences?: Record<string, any>;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  resetPasswordToken?: string;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  resetPasswordExpires?: Date;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;

  // Associations
  @BelongsTo(() => Society)
  society?: Society;

  @BelongsTo(() => Flat)
  flat?: Flat;

  @HasMany(() => VisitorPass)
  visitorPasses!: VisitorPass[];

  @HasMany(() => Notice)
  notices!: Notice[];

  @HasMany(() => NoticeReadStatus)
  noticeReadStatuses!: NoticeReadStatus[];

  @HasMany(() => Emergency)
  emergencies!: Emergency[];

  @HasMany(() => MaintenanceBill)
  maintenanceBills!: MaintenanceBill[];

  @HasMany(() => Payment)
  payments!: Payment[];

  // Instance methods
  isApproved(): boolean {
    return this.status === UserStatus.ACTIVE;
  }

  isPendingApproval(): boolean {
    return this.status === UserStatus.PENDING_APPROVAL;
  }

  // Exclude sensitive data when converting to JSON
  toJSON() {
    const values = super.toJSON();
    delete values.fcmToken;
    return values;
  }
} 