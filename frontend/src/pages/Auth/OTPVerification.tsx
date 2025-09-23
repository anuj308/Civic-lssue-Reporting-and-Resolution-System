import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  CircularProgress,
  IconButton,
} from '@mui/material';
import {
  ArrowBack,
  Email,
  Refresh,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import { verifyOTP, resendOTP, verifyAndLogin, resendLoginOTP, selectAuth, clearError, clearVerificationState } from '../../store/slices/authSlice';
import { AppDispatch } from '../../store/store';
import { showToast } from '../../utils/toast';

// Validation schema
const otpSchema = yup.object({
  otp: yup
    .string()
    .matches(/^\d{6}$/, 'OTP must be exactly 6 digits')
    .required('OTP is required'),
});

interface OTPFormData {
  otp: string;
}

interface LocationState {
  email: string;
  isLoginVerification?: boolean;
  password?: string;
  from?: string;
}

const OTPVerification: React.FC = () => {
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const location = useLocation();

  const { loading, error, isAuthenticated } = useSelector(selectAuth);

  // Get data from navigation state or localStorage
  const state = location.state as LocationState;
  const storedState = localStorage.getItem('otpVerificationState');
  const parsedStoredState = storedState ? JSON.parse(storedState) : null;
  
  const { email, isLoginVerification = false, password, from } = state || parsedStoredState || {};

  console.log('OTPVerification component loaded with state:', {
    email,
    isLoginVerification,
    password: !!password,
    from,
    fullState: state,
    storedState: parsedStoredState,
  });

  // Store state in localStorage as backup
  React.useEffect(() => {
    if (state) {
      localStorage.setItem('otpVerificationState', JSON.stringify(state));
    }
  }, [state]);

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<OTPFormData>({
    resolver: yupResolver(otpSchema),
    defaultValues: {
      otp: '',
    },
  });

  const otpValue = watch('otp');

  // Redirect if no email provided
  useEffect(() => {
    if (!email) {
      navigate('/login', { replace: true });
    }
  }, [email, navigate]);

  // Handle authentication success
  useEffect(() => {
    if (isAuthenticated && !loading) {
      // Navigation will be handled by toast success in reducer
      setTimeout(() => {
        const redirectTo = from || '/dashboard';
        navigate(redirectTo, { replace: true });
        // Clean up stored state on successful navigation
        localStorage.removeItem('otpVerificationState');
      }, 1500);
    }
  }, [isAuthenticated, loading, navigate, from]);

  // Timer countdown
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

  // Clear error when component unmounts
  useEffect(() => {
    return () => {
      dispatch(clearError());
      // Clean up stored state
      localStorage.removeItem('otpVerificationState');
    };
  }, [dispatch]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const maskEmail = (email: string) => {
    const [local, domain] = email.split('@');
    const maskedLocal = local.length > 2
      ? local.substring(0, 2) + '*'.repeat(local.length - 2)
      : local;
    return `${maskedLocal}@${domain}`;
  };

  const onSubmit = async (data: OTPFormData) => {
    try {
      if (isLoginVerification) {
        // Use verify and login for login verification flow
        await dispatch(
          verifyAndLogin({
            email,
            otpCode: data.otp,
            password: password || '',
          })
        ).unwrap();
      } else {
        // Use regular verify OTP for registration flow
        await dispatch(
          verifyOTP({
            email,
            otpCode: data.otp,
          })
        ).unwrap();
      }
    } catch (error) {
      // Error will be handled by Redux state
      console.error('OTP verification failed:', error);
    }
  };

  const handleResendOTP = async () => {
    if (!canResend || loading) return;

    try {
      if (isLoginVerification) {
        // Use specific resend login OTP for login verification flow
        await dispatch(
          resendLoginOTP({
            email,
          })
        ).unwrap();
      } else {
        // Use regular resend OTP for registration flow
        await dispatch(
          resendOTP({
            email,
          })
        ).unwrap();
      }

      setTimer(60);
      setCanResend(false);
      setValue('otp', ''); // Clear OTP field

    } catch (error) {
      console.error('Failed to resend OTP:', error);
    }
  };

  const handleBack = () => {
    console.log('handleBack called, isLoginVerification:', isLoginVerification);
    const targetPath = isLoginVerification ? '/login' : '/register';
    console.log('Navigating to:', targetPath);
    
    // Clear verification state to prevent auto-redirect
    dispatch(clearVerificationState());
    
    // Clean up stored state before navigating back
    localStorage.removeItem('otpVerificationState');
    
    // Use window.location for forced navigation
    window.location.href = targetPath;
  };

  const handleClearError = () => {
    dispatch(clearError());
  };

  if (!email) {
    return null; // Will redirect
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: 3,
      }}
    >
      <Card
        sx={{
          width: '100%',
          maxWidth: 480,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          borderRadius: 2,
        }}
      >
        <CardContent sx={{ p: 4 }}>
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 4, position: 'relative' }}>
            <IconButton
              onClick={handleBack}
              sx={{
                position: 'absolute',
                left: 0,
                top: 0,
                color: 'text.secondary',
              }}
            >
              <ArrowBack />
            </IconButton>

            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 64,
                height: 64,
                borderRadius: '50%',
                backgroundColor: 'primary.main',
                color: 'white',
                mb: 2,
                mx: 'auto',
              }}
            >
              <Email sx={{ fontSize: 32 }} />
            </Box>
            <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
              {isLoginVerification ? 'Verify Email to Login' : 'Verify Your Account'}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {isLoginVerification
                ? `Please verify your email to continue logging in.`
                : `We've sent a 6-digit verification code to`
              }
            </Typography>
            <Typography variant="body1" color="primary" fontWeight="medium">
              {maskEmail(email)}
            </Typography>
          </Box>

          {/* OTP Form */}
          <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <Controller
              name="otp"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Enter 6-digit code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  error={!!errors.otp}
                  helperText={errors.otp?.message}
                  disabled={loading}
                  inputProps={{
                    maxLength: 6,
                    pattern: '[0-9]*',
                  }}
                  sx={{
                    mb: 3,
                    '& .MuiInputBase-input': {
                      textAlign: 'center',
                      fontSize: '1.5rem',
                      fontWeight: 'bold',
                      letterSpacing: '0.5rem',
                    },
                  }}
                />
              )}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading || otpValue.length !== 6}
              sx={{
                py: 1.5,
                fontSize: '1.1rem',
                fontWeight: 600,
                mb: 3,
              }}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                isLoginVerification ? 'Verify & Login' : 'Verify Account'
              )}
            </Button>
          </Box>

          {/* Resend Section */}
          <Box sx={{ textAlign: 'center' }}>
            {!canResend ? (
              <Typography variant="body2" color="text.secondary">
                Resend code in {formatTime(timer)}
              </Typography>
            ) : (
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Didn't receive the code?
                </Typography>
                <Button
                  onClick={handleResendOTP}
                  disabled={loading}
                  startIcon={<Refresh />}
                  sx={{ textTransform: 'none' }}
                >
                  Resend Code
                </Button>
              </Box>
            )}
          </Box>

          {/* Help Text */}
          <Box sx={{ textAlign: 'center', mt: 3 }}>
            <Typography variant="body2" color="text.secondary">
              Having trouble? Check your spam folder or{' '}
              <Button
                onClick={handleBack}
                sx={{
                  textTransform: 'none',
                  fontSize: 'inherit',
                  fontWeight: 'inherit',
                  p: 0,
                  minHeight: 'auto',
                  color: 'primary.main',
                  textDecoration: 'underline',
                  '&:hover': {
                    textDecoration: 'underline',
                    backgroundColor: 'transparent',
                  },
                }}
              >
                try a different email
              </Button>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default OTPVerification;