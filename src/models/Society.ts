import { Table, Column, Model, DataType, HasMany } from 'sequelize-typescript';
import User from './User';
import Flat from './Flat';

@Table({
  tableName: 'societies',
  timestamps: true,
  underscored: true,
})
export default class Society extends Model {
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  name!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  address!: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  city?: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  state?: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  pincode?: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
  })
  totalFlats!: number;

  @Column({
    type: DataType.JSONB,
    allowNull: true,
    defaultValue: [],
  })
  amenities?: string[];

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  })
  isActive!: boolean;

  // Associations
  @HasMany(() => User)
  users!: User[];

  @HasMany(() => Flat)
  flats!: Flat[];
} 