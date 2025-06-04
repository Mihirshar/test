import User from '../models/User';
import Society from '../models/Society';
import Flat from '../models/Flat';
import { UserUpdateData, NotificationSettings, DeviceInfo } from '../types';
import { NotFoundError } from '../utils/errors';

export default class UserService {
  static async getUserProfile(userId: number): Promise<User> {
    const user = await User.findByPk(userId, {
      include: [
        {
          model: Society,
          as: 'society',
          attributes: ['id', 'name', 'address', 'city', 'state'],
        },
        {
          model: Flat,
          as: 'flat',
          attributes: ['id', 'flatNumber', 'block', 'floor'],
        },
      ],
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return user;
  }

  static async updateUserProfile(userId: number, data: UserUpdateData): Promise<User> {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    await user.update(data);
    return user;
  }

  static async getUserNotifications(userId: number): Promise<any[]> {
    // TODO: Implement notifications
    return [];
  }

  static async updateNotificationSettings(userId: number, settings: NotificationSettings): Promise<NotificationSettings> {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    await user.update({
      preferences: {
        ...user.preferences,
        notifications: settings,
      },
    });

    return settings;
  }

  static async getUserDevices(userId: number): Promise<DeviceInfo[]> {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    return user.deviceInfo?.devices || [];
  }

  static async addUserDevice(userId: number, deviceData: DeviceInfo): Promise<DeviceInfo> {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const devices = user.deviceInfo?.devices || [];
    const existingDeviceIndex = devices.findIndex(d => d.deviceId === deviceData.deviceId);

    if (existingDeviceIndex >= 0) {
      devices[existingDeviceIndex] = deviceData;
    } else {
      devices.push(deviceData);
    }

    await user.update({
      deviceInfo: {
        ...user.deviceInfo,
        devices,
      },
    });

    return deviceData;
  }

  static async removeUserDevice(userId: number, deviceId: string): Promise<void> {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const devices = user.deviceInfo?.devices || [];
    const updatedDevices = devices.filter(d => d.deviceId !== deviceId);

    await user.update({
      deviceInfo: {
        ...user.deviceInfo,
        devices: updatedDevices,
      },
    });
  }
} 