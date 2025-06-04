import twilio from 'twilio';
import { config } from './env';
import logger from '../utils/logger';

// Initialize Twilio client with proper dummy values for development
const getValidTwilioConfig = () => {
  if (config.NODE_ENV === 'production') {
    return {
      accountSid: config.TWILIO_ACCOUNT_SID,
      authToken: config.TWILIO_AUTH_TOKEN
    };
  }
  // Use valid dummy values for development that satisfy Twilio's format requirements
  return {
    accountSid: 'AC' + '0'.repeat(32), // Starts with AC and has 34 total characters
    authToken: 'dummy_auth_token_for_development'
  };
};

const twilioConfig = getValidTwilioConfig();
const twilioClient = config.NODE_ENV === 'production' 
  ? twilio(twilioConfig.accountSid, twilioConfig.authToken)
  : twilio(twilioConfig.accountSid, twilioConfig.authToken); // Always initialize, but with dummy values in dev

// Send OTP using Twilio Verify
export const sendOTP = async (phoneNumber: string): Promise<boolean> => {
  try {
    // Check if we have valid Twilio credentials even in development
    const hasValidTwilioConfig = config.TWILIO_ACCOUNT_SID && 
                                 config.TWILIO_ACCOUNT_SID !== 'your_account_sid' &&
                                 config.TWILIO_ACCOUNT_SID !== 'test_account_sid' &&
                                 config.TWILIO_AUTH_TOKEN && 
                                 config.TWILIO_AUTH_TOKEN !== 'your_auth_token' &&
                                 config.TWILIO_AUTH_TOKEN !== 'test_auth_token' &&
                                 config.TWILIO_VERIFY_SERVICE_SID &&
                                 config.TWILIO_VERIFY_SERVICE_SID !== 'your_verify_service_sid' &&
                                 config.TWILIO_VERIFY_SERVICE_SID !== 'test_service_sid';

    if (config.NODE_ENV === 'production' || hasValidTwilioConfig) {
      const verification = await twilioClient!.verify.v2
      .services(config.TWILIO_VERIFY_SERVICE_SID)
      .verifications.create({
        to: phoneNumber,
        channel: 'sms',
      });
    
      logger.info(`Real OTP sent to ${phoneNumber}. Status: ${verification.status}`);
      return verification.status === 'pending';
    } else {
      logger.info(`[DEVELOPMENT] Mock OTP sent to ${phoneNumber}`);
      return true;
    }
  } catch (error) {
    logger.error('Error sending OTP:', error);
    throw error;
  }
};

// Verify OTP
export const verifyOTP = async (phoneNumber: string, code: string): Promise<boolean> => {
  try {
    // Check if we have valid Twilio credentials even in development
    const hasValidTwilioConfig = config.TWILIO_ACCOUNT_SID && 
                                 config.TWILIO_ACCOUNT_SID !== 'your_account_sid' &&
                                 config.TWILIO_ACCOUNT_SID !== 'test_account_sid' &&
                                 config.TWILIO_AUTH_TOKEN && 
                                 config.TWILIO_AUTH_TOKEN !== 'your_auth_token' &&
                                 config.TWILIO_AUTH_TOKEN !== 'test_auth_token' &&
                                 config.TWILIO_VERIFY_SERVICE_SID &&
                                 config.TWILIO_VERIFY_SERVICE_SID !== 'your_verify_service_sid' &&
                                 config.TWILIO_VERIFY_SERVICE_SID !== 'test_service_sid';

    if (config.NODE_ENV === 'production' || hasValidTwilioConfig) {
      const verificationCheck = await twilioClient!.verify.v2
      .services(config.TWILIO_VERIFY_SERVICE_SID)
      .verificationChecks.create({
        to: phoneNumber,
        code,
      });
    
      logger.info(`Real OTP verification for ${phoneNumber}. Status: ${verificationCheck.status}`);
      return verificationCheck.status === 'approved';
    } else {
      logger.info(`[DEVELOPMENT] Mock OTP verification for ${phoneNumber} with code ${code}`);
      // In development, accept "123456" as valid OTP
      return code === '123456';
    }
  } catch (error) {
    logger.error('Error verifying OTP:', error);
    return false;
  }
};

// Send SMS
export const sendSMS = async (to: string, body: string): Promise<string> => {
  try {
    if (config.NODE_ENV !== 'production') {
      logger.info(`[DEVELOPMENT] Mock SMS sent to ${to}: ${body}`);
      return 'mock_sms_sid_' + Date.now();
    }

    const message = await twilioClient!.messages.create({
      body,
      from: config.TWILIO_PHONE_NUMBER,
      to,
    });
    
    logger.info(`SMS sent to ${to}. SID: ${message.sid}`);
    return message.sid;
  } catch (error) {
    logger.error('Error sending SMS:', error);
    throw error;
  }
};

// Send WhatsApp message (if configured)
export const sendWhatsApp = async (to: string, body: string): Promise<string> => {
  try {
    if (config.NODE_ENV !== 'production') {
      logger.info(`[DEVELOPMENT] Mock WhatsApp message sent to ${to}: ${body}`);
      return 'mock_whatsapp_sid_' + Date.now();
    }

    const message = await twilioClient!.messages.create({
      body,
      from: `whatsapp:${config.TWILIO_PHONE_NUMBER}`,
      to: `whatsapp:${to}`,
    });
    
    logger.info(`WhatsApp message sent to ${to}. SID: ${message.sid}`);
    return message.sid;
  } catch (error) {
    logger.error('Error sending WhatsApp message:', error);
    throw error;
  }
};

// Make a call (for emergency)
export const makeCall = async (to: string, message: string): Promise<string> => {
  try {
    if (config.NODE_ENV !== 'production') {
      logger.info(`[DEVELOPMENT] Mock call initiated to ${to}: ${message}`);
      return 'mock_call_sid_' + Date.now();
    }

    const call = await twilioClient!.calls.create({
      twiml: `<Response><Say>${message}</Say></Response>`,
      to,
      from: config.TWILIO_PHONE_NUMBER,
    });
    
    logger.info(`Call initiated to ${to}. SID: ${call.sid}`);
    return call.sid;
  } catch (error) {
    logger.error('Error making call:', error);
    throw error;
  }
};

// Check if phone number is valid
export const validatePhoneNumber = async (phoneNumber: string): Promise<boolean> => {
  try {
    if (config.NODE_ENV !== 'production') {
      logger.info(`[DEVELOPMENT] Mock phone number validation for ${phoneNumber}`);
      // In development, consider all phone numbers valid if they match a basic pattern
      return /^\+[1-9]\d{1,14}$/.test(phoneNumber);
    }

    const phoneNumberInfo = await twilioClient!.lookups.v2
      .phoneNumbers(phoneNumber)
      .fetch();
    
    return phoneNumberInfo.valid;
  } catch (error) {
    logger.error('Error validating phone number:', error);
    return false;
  }
};

export default twilioClient; 