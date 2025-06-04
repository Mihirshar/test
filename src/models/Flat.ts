import { Table, Column, Model, DataType, ForeignKey, BelongsTo, HasMany } from 'sequelize-typescript';
import Society from './Society';
import User from './User';

@Table({
  tableName: 'flats',
  timestamps: true,
  underscored: true,
})
export default class Flat extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true
  })
  declare id: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: 'flat_number'
  })
  flatNumber!: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: 'floor_number'
  })
  floorNumber!: number;

  @Column({
    type: DataType.STRING,
    allowNull: true
  })
  wing?: string;

  @Column({
    type: DataType.STRING,
    allowNull: true
  })
  block?: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
  })
  totalResidents!: number;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  })
  isOccupied!: boolean;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    field: 'is_active'
  })
  isActive!: boolean;

  @ForeignKey(() => Society)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: 'society_id'
  })
  societyId!: number;

  @Column({
    type: DataType.JSONB,
    allowNull: true
  })
  metadata?: Record<string, any>;

  // Associations
  @BelongsTo(() => Society)
  society!: Society;

  @HasMany(() => User)
  residents!: User[];
} 