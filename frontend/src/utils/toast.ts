import { toast } from 'react-toastify';

// Toast utility functions for consistent error/success messaging
export const showToast = {
  success: (message: string) => {
    toast.success(message, {
      position: 'top-right',
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
  },

  error: (message: string) => {
    toast.error(message, {
      position: 'top-right',
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
  },

  warning: (message: string) => {
    toast.warning(message, {
      position: 'top-right',
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
  },

  info: (message: string) => {
    toast.info(message, {
      position: 'top-right',
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
  },

  // Handle validation errors from backend
  handleValidationErrors: (error: any) => {
    if (error?.response?.data?.errors) {
      // Handle express-validator errors
      const errors = error.response.data.errors;
      if (Array.isArray(errors)) {
        errors.forEach((err: any) => {
          toast.error(err.msg || err.message, {
            position: 'top-right',
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          });
        });
      } else {
        showToast.error(error.response.data.message || 'Validation error occurred');
      }
    } else if (error?.response?.data?.message) {
      showToast.error(error.response.data.message);
    } else if (error?.message) {
      showToast.error(error.message);
    } else {
      showToast.error('An unexpected error occurred');
    }
  },

  // Handle auth errors specifically
  handleAuthError: (error: any) => {
    if (error?.response?.status === 401) {
      showToast.error('Invalid credentials. Please check your email and password.');
    } else if (error?.response?.status === 403) {
      showToast.error('Account verification required. Please check your email.');
    } else if (error?.response?.status === 429) {
      showToast.error('Too many attempts. Please try again later.');
    } else {
      showToast.handleValidationErrors(error);
    }
  },

  // Handle OTP errors specifically
  handleOTPError: (error: any) => {
    if (error?.response?.status === 400) {
      showToast.error('Invalid verification code. Please try again.');
    } else if (error?.response?.status === 429) {
      showToast.error('Too many attempts. Please wait before trying again.');
    } else if (error?.response?.status === 410) {
      showToast.error('Verification code has expired. Please request a new one.');
    } else {
      showToast.handleValidationErrors(error);
    }
  },
};

export default showToast;