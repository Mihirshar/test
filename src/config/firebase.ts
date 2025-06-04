import * as admin from 'firebase-admin';
import { config } from './env';
import logger from '../utils/logger';

const isDevelopment = config.NODE_ENV === 'development';

// Initialize Firebase Admin SDK
let firebaseApp: admin.app.App | null = null;

try {
  if (config.NODE_ENV === 'production') {
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: config.FIREBASE_PROJECT_ID,
        privateKey: config.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        clientEmail: config.FIREBASE_CLIENT_EMAIL,
      }),
    });
    logger.info('✅ Firebase Admin SDK initialized successfully');
  } else {
    logger.info('[DEVELOPMENT] Firebase running in mock mode');
  }
} catch (error) {
  logger.error('Error initializing Firebase Admin SDK:', error);
  if (config.NODE_ENV === 'production') {
    throw error;
  }
}

// Initialize Firebase Cloud Messaging
export const messaging = isDevelopment || !firebaseApp ? null : admin.messaging();

// Send push notification
export const sendPushNotification = async (
  token: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<void> => {
  try {
    if (isDevelopment || !messaging) {
      logger.info('[DEVELOPMENT] Mock push notification:', { token, title, body, data });
      return;
    }

    await messaging.send({
      token,
      notification: {
        title,
        body,
      },
      data,
    });
    logger.info('Push notification sent successfully');
  } catch (error) {
    logger.error('Error sending push notification:', error);
    throw error;
  }
};

// Send push notification to multiple tokens
export const sendMulticastPushNotification = async (
  tokens: string[],
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<void> => {
  try {
    if (isDevelopment || !messaging) {
      logger.info('[DEVELOPMENT] Mock multicast push notification:', { tokens, title, body, data });
      return;
    }

    const response = await messaging.sendMulticast({
      tokens,
      notification: {
        title,
        body,
      },
      data,
    });

    logger.info(`Multicast push notification sent. Success: ${response.successCount}/${tokens.length}`);
  } catch (error) {
    logger.error('Error sending multicast push notification:', error);
    throw error;
  }
};

export default firebaseApp;