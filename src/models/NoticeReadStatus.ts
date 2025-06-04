import { Table, Column, Model, DataType, BelongsTo, ForeignKey, CreatedAt, UpdatedAt } from 'sequelize-typescript';
import User from './User';
import Notice from './Notice';

@Table({
  tableName: 'notice_read_statuses',
  timestamps: true,
  underscored: true,
})
export default class NoticeReadStatus extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  declare id: number;

  @ForeignKey(() => Notice)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: 'notice_id',
  })
  noticeId!: number;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: 'user_id',
  })
  userId!: number;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
    field: 'read_at',
  })
  readAt!: Date;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'is_muted',
  })
  isMuted!: boolean;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;

  // Associations
  @BelongsTo(() => Notice)
  notice!: Notice;

  @BelongsTo(() => User)
  user!: User;
}