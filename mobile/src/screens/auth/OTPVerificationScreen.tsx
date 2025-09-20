import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TextInput as RNTextInput,
  Alert,
} from 'react-native';
import {
  Text,
  Button,
  Card,
  Surface,
  IconButton,
  HelperText,
  Snackbar,
} from 'react-native-paper';
import { useSelector } from 'react-redux';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RootState, useAppDispatch } from '../../store/store';
import { verifyOTP, resendOTP, verifyAndLogin, resendLoginOTP } from '../../store/slices/authSlice';
import { theme } from '../../utils/theme';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../navigation/AuthNavigator';

type Props = NativeStackScreenProps<AuthStackParamList, 'OTPVerification'>;

const OTPVerificationScreen: React.FC<Props> = ({ navigation, route }) => {
  const { email, phoneNumber, isLoginVerification = false, password } = route.params;
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  
  const dispatch = useAppDispatch();
  const { isLoading, isAuthenticated } = useSelector((state: RootState) => state.auth);
  
  const otpRefs = useRef<(RNTextInput | null)[]>([]);

  // Handle authentication success - navigate to main app
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      console.log('✅ User authenticated successfully, navigating to main app');
      setSuccessMessage(isLoginVerification ? 'Login successful!' : 'Account verified successfully!');
      
      // Show success message briefly before navigating
      setTimeout(() => {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Welcome' }], // This will trigger navigation to main app
        });
      }, 1500);
    }
  }, [isAuthenticated, isLoading, navigation, isLoginVerification]);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setCanResend(true);
    }
  }, [timer]);

  const handleOtpChange = (value: string, index: number) => {
    if (value.length > 1) return; // Prevent multiple characters
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError('');

    // Auto-focus next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
    
    // Auto-submit when all fields are filled
    if (newOtp.every(digit => digit !== '') && value) {
      handleVerifyOTP(newOtp.join(''));
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async (otpCode?: string) => {
    const code = otpCode || otp.join('');
    
    if (code.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    // Prevent double submission
    if (isVerifying || isLoading) {
      console.log('⚠️ OTP verification already in progress, ignoring duplicate call');
      return;
    }

    setIsVerifying(true);
    setError('');
    setSuccessMessage('');

    try {
      console.log('🔥 Starting OTP verification for:', email, 'isLoginVerification:', isLoginVerification);
      
      let result;
      if (isLoginVerification) {
        // Use verify and login for login verification flow
        result = await dispatch(
          verifyAndLogin({
            email,
            otpCode: code,
            password: password, // Include password for login verification
          })
        ).unwrap();
        console.log('✅ Login verification successful:', result);
        setSuccessMessage('Email verified! Logging you in...');
      } else {
        // Use regular verify OTP for registration flow
        result = await dispatch(
          verifyOTP({
            email,
            phoneNumber: phoneNumber || '',
            otp: code,
          })
        ).unwrap();
        console.log('✅ Registration verification successful:', result);
        setSuccessMessage('Account verified successfully! Welcome aboard!');
      }

      // Clear OTP on success
      setOtp(['', '', '', '', '', '']);
      
    } catch (error: any) {
      console.error('❌ OTP verification failed:', error);
      setError(error.message || 'Invalid verification code. Please try again.');
      // Clear OTP fields on error
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOTP = async () => {
    if (!canResend || isLoading) return;
    
    setError('');
    setSuccessMessage('');
    
    try {
      if (isLoginVerification) {
        // Use specific resend login OTP for login verification flow
        await dispatch(
          resendLoginOTP({
            email,
          })
        ).unwrap();
        console.log('✅ Login OTP resent successfully');
        setSuccessMessage('Verification code sent to your email!');
      } else {
        // Use regular resend OTP for registration flow
        await dispatch(
          resendOTP({
            email,
            phoneNumber: phoneNumber || '',
          })
        ).unwrap();
        console.log('✅ Registration OTP resent successfully');
        setSuccessMessage('Verification code sent to your email and phone!');
      }
      
      setTimer(60);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
      
    } catch (error: any) {
      console.error('❌ Failed to resend OTP:', error);
      setError(error.message || 'Failed to resend verification code. Please try again.');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const maskedContact = email 
    ? email.replace(/(.{2})(.*)(@.*)/, '$1***$3')
    : phoneNumber?.replace(/(\d{3})(\d*)(\d{3})/, '$1***$3');

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Surface style={styles.header} elevation={0}>
          <IconButton
            icon="arrow-left"
            size={24}
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          />
          <Text variant="headlineMedium" style={styles.title}>
            {isLoginVerification ? 'Verify Email to Login' : 'Verify Account'}
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            {isLoginVerification 
              ? `Please verify your email to continue logging in.\nWe've sent a 6-digit code to\n`
              : `We've sent a 6-digit code to\n`
            }
            <Text style={styles.contact}>{maskedContact}</Text>
          </Text>
        </Surface>

        <Card style={styles.card} elevation={2}>
          <Card.Content style={styles.cardContent}>
            {/* Success Message */}
            {successMessage ? (
              <Surface style={styles.successContainer} elevation={1}>
                <Text style={styles.successText}>{successMessage}</Text>
              </Surface>
            ) : null}

            {/* Error Message */}
            {error ? (
              <Surface style={styles.errorContainer} elevation={1}>
                <Text style={styles.errorText}>{error}</Text>
              </Surface>
            ) : null}

            <Text variant="labelLarge" style={styles.otpLabel}>
              Enter Verification Code
            </Text>

            <View style={styles.otpContainer}>
              {otp.map((digit, index) => (
                <RNTextInput
                  key={index}
                  ref={(ref) => (otpRefs.current[index] = ref)}
                  style={[
                    styles.otpInput,
                    digit ? styles.otpInputFilled : null,
                    error ? styles.otpInputError : null,
                  ]}
                  value={digit}
                  onChangeText={(value) => handleOtpChange(value, index)}
                  onKeyPress={({ nativeEvent }) => 
                    handleKeyPress(nativeEvent.key, index)
                  }
                  keyboardType="numeric"
                  maxLength={1}
                  textAlign="center"
                  autoFocus={index === 0}
                  selectTextOnFocus
                />
              ))}
            </View>

            <Button
              mode="contained"
              onPress={() => handleVerifyOTP()}
              disabled={otp.some(digit => !digit) || isLoading || isVerifying || !!successMessage}
              loading={isLoading || isVerifying}
              style={[
                styles.verifyButton,
                successMessage ? styles.verifyButtonSuccess : null
              ]}
              contentStyle={styles.buttonContent}
            >
              {isVerifying 
                ? (isLoginVerification ? 'Verifying & Logging In...' : 'Verifying Account...')
                : successMessage 
                  ? '✓ Success'
                  : (isLoginVerification ? 'Verify & Login' : 'Verify Account')
              }
            </Button>

            <View style={styles.resendContainer}>
              {!canResend ? (
                <Text style={styles.timerText}>
                  Resend code in {formatTime(timer)}
                </Text>
              ) : (
                <View style={styles.resendRow}>
                  <Text style={styles.resendText}>Didn't receive the code? </Text>
                  <Button
                    mode="text"
                    onPress={handleResendOTP}
                    compact
                    labelStyle={styles.resendButtonText}
                  >
                    Resend
                  </Button>
                </View>
              )}
            </View>

            <View style={styles.helpContainer}>
              <Text style={styles.helpText}>
                Having trouble? Check your spam folder or{' '}
              </Text>
              <Button
                mode="text"
                onPress={() => navigation.navigate('Register')}
                compact
                labelStyle={styles.helpButtonText}
              >
                try a different method
              </Button>
            </View>
          </Card.Content>
        </Card>

        {/* Success Snackbar */}
        <Snackbar
          visible={!!successMessage}
          onDismiss={() => setSuccessMessage('')}
          duration={3000}
          style={styles.successSnackbar}
        >
          {successMessage}
        </Snackbar>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    backgroundColor: 'transparent',
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    left: 16,
    top: 20,
  },
  title: {
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginBottom: 12,
  },
  subtitle: {
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 20,
  },
  contact: {
    fontWeight: '600',
    color: theme.colors.primary,
  },
  card: {
    marginHorizontal: 20,
    backgroundColor: theme.colors.surface,
  },
  cardContent: {
    padding: 24,
  },
  errorContainer: {
    backgroundColor: theme.colors.errorContainer,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: theme.colors.onErrorContainer,
    textAlign: 'center',
  },
  successContainer: {
    backgroundColor: theme.colors.primaryContainer,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  successText: {
    color: theme.colors.onPrimaryContainer,
    textAlign: 'center',
    fontWeight: '600',
  },
  otpLabel: {
    color: theme.colors.onSurface,
    marginBottom: 16,
    textAlign: 'center',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
    paddingHorizontal: 8,
  },
  otpInput: {
    width: 45,
    height: 50,
    borderWidth: 1.5,
    borderColor: theme.colors.outline,
    borderRadius: 8,
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.onSurface,
    backgroundColor: theme.colors.surface,
  },
  otpInputFilled: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryContainer,
  },
  otpInputError: {
    borderColor: theme.colors.error,
  },
  verifyButton: {
    marginBottom: 24,
  },
  verifyButtonSuccess: {
    backgroundColor: theme.colors.primaryContainer,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  resendContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  timerText: {
    color: theme.colors.onSurfaceVariant,
    fontSize: 14,
  },
  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resendText: {
    color: theme.colors.onSurfaceVariant,
    fontSize: 14,
  },
  resendButtonText: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  helpContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  helpText: {
    color: theme.colors.onSurfaceVariant,
    fontSize: 12,
    textAlign: 'center',
  },
  helpButtonText: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  successSnackbar: {
    backgroundColor: theme.colors.primaryContainer,
  },
});

export default OTPVerificationScreen;
