'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create societies table
    await queryInterface.createTable('societies', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      address: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      city: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      state: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      pincode: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      total_flats: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      admin_contact: {
        type: Sequelize.STRING,
      },
      metadata: {
        type: Sequelize.JSONB,
        defaultValue: {},
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });

    // Create flats table
    await queryInterface.createTable('flats', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      society_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'societies',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      flat_number: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      block: {
        type: Sequelize.STRING,
      },
      floor: {
        type: Sequelize.INTEGER,
      },
      type: {
        type: Sequelize.STRING,
      },
      is_occupied: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });

    // Create users table
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      phone_number: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      name: {
        type: Sequelize.STRING,
      },
      email: {
        type: Sequelize.STRING,
      },
      role: {
        type: Sequelize.ENUM('resident', 'guard', 'admin'),
        allowNull: false,
      },
      society_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'societies',
          key: 'id',
        },
        onDelete: 'SET NULL',
      },
      flat_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'flats',
          key: 'id',
        },
        onDelete: 'SET NULL',
      },
      profile_picture: {
        type: Sequelize.STRING,
      },
      fcm_token: {
        type: Sequelize.TEXT,
      },
      device_info: {
        type: Sequelize.JSONB,
        defaultValue: {},
      },
      preferences: {
        type: Sequelize.JSONB,
        defaultValue: {},
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });

    // Create visitor_passes table
    await queryInterface.createTable('visitor_passes', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      resident_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      society_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'societies',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      visitor_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      visitor_phone: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      vehicle_number: {
        type: Sequelize.STRING,
      },
      purpose: {
        type: Sequelize.STRING,
      },
      otp: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('pending', 'approved', 'rejected', 'used', 'expired'),
        defaultValue: 'approved',
      },
      valid_from: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      valid_until: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      entry_time: {
        type: Sequelize.DATE,
      },
      exit_time: {
        type: Sequelize.DATE,
      },
      verified_by: {
        type: Sequelize.INTEGER,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'SET NULL',
      },
      photo: {
        type: Sequelize.STRING,
      },
      notes: {
        type: Sequelize.TEXT,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });

    // Create notices table
    await queryInterface.createTable('notices', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      society_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'societies',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      type: {
        type: Sequelize.ENUM('general', 'maintenance', 'emergency', 'event'),
        defaultValue: 'general',
      },
      priority: {
        type: Sequelize.ENUM('low', 'medium', 'high', 'urgent'),
        defaultValue: 'medium',
      },
      created_by: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      attachments: {
        type: Sequelize.JSONB,
        defaultValue: [],
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      expires_at: {
        type: Sequelize.DATE,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });

    // Create notice_read_status table
    await queryInterface.createTable('notice_read_status', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      notice_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'notices',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      is_read: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      is_muted: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      read_at: {
        type: Sequelize.DATE,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });

    // Create emergencies table
    await queryInterface.createTable('emergencies', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      society_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'societies',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      type: {
        type: Sequelize.ENUM('fire', 'medical', 'security', 'maintenance', 'other'),
        defaultValue: 'other',
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      location: {
        type: Sequelize.JSONB,
        defaultValue: {},
      },
      status: {
        type: Sequelize.ENUM('active', 'resolved', 'cancelled'),
        defaultValue: 'active',
      },
      resolved_by: {
        type: Sequelize.INTEGER,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'SET NULL',
      },
      resolved_at: {
        type: Sequelize.DATE,
      },
      resolution_notes: {
        type: Sequelize.TEXT,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });

    // Create maintenance_bills table
    await queryInterface.createTable('maintenance_bills', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      flat_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'flats',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      society_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'societies',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      bill_number: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      bill_date: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      due_date: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      bill_period: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('pending', 'partial', 'paid', 'overdue'),
        defaultValue: 'pending',
      },
      paid_amount: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0,
      },
      paid_date: {
        type: Sequelize.DATE,
      },
      late_fee: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0,
      },
      breakdown: {
        type: Sequelize.JSONB,
        defaultValue: {},
      },
      notes: {
        type: Sequelize.TEXT,
      },
      qr_code: {
        type: Sequelize.TEXT,
      },
      reminder_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      last_reminder_at: {
        type: Sequelize.DATE,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });

    // Create payments table
    await queryInterface.createTable('payments', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      bill_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'maintenance_bills',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      transaction_id: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      payment_method: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      payment_date: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      reference_number: {
        type: Sequelize.STRING,
      },
      metadata: {
        type: Sequelize.JSONB,
        defaultValue: {},
      },
      notes: {
        type: Sequelize.TEXT,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });

    // Create user_sessions table
    await queryInterface.createTable('user_sessions', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      refresh_token: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      device_info: {
        type: Sequelize.JSONB,
        defaultValue: {},
      },
      ip_address: {
        type: Sequelize.STRING,
      },
      user_agent: {
        type: Sequelize.TEXT,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });

    // Add indexes for better performance
    await queryInterface.addIndex('flats', ['society_id', 'flat_number'], {
      unique: true,
    });
    await queryInterface.addIndex('visitor_passes', ['society_id', 'status']);
    await queryInterface.addIndex('visitor_passes', ['otp']);
    await queryInterface.addIndex('notices', ['society_id', 'is_active']);
    await queryInterface.addIndex('notice_read_status', ['notice_id', 'user_id'], {
      unique: true,
    });
    await queryInterface.addIndex('emergencies', ['society_id', 'status']);
    await queryInterface.addIndex('maintenance_bills', ['flat_id', 'bill_period'], {
      unique: true,
    });
    await queryInterface.addIndex('maintenance_bills', ['society_id', 'status']);
    await queryInterface.addIndex('payments', ['bill_id']);
    await queryInterface.addIndex('user_sessions', ['user_id', 'is_active']);
  },

  down: async (queryInterface, Sequelize) => {
    // Drop tables in reverse order due to foreign key constraints
    await queryInterface.dropTable('user_sessions');
    await queryInterface.dropTable('payments');
    await queryInterface.dropTable('maintenance_bills');
    await queryInterface.dropTable('emergencies');
    await queryInterface.dropTable('notice_read_status');
    await queryInterface.dropTable('notices');
    await queryInterface.dropTable('visitor_passes');
    await queryInterface.dropTable('users');
    await queryInterface.dropTable('flats');
    await queryInterface.dropTable('societies');
  },
}; 