import React, { useState, useRef } from "react";
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  CircularProgress,
  InputAdornment,
  IconButton,
  Link,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  AccountCircle,
} from "@mui/icons-material";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation, Link as RouterLink } from "react-router-dom";
import {
  loginUser,
  selectAuth,
  clearError,
  clearVerificationState,
} from "../../store/slices/authSlice";
import { AppDispatch } from "../../store/store";
import { showToast } from "../../utils/toast";
import { authAPI } from "../../services/api";

// Validation schema
const loginSchema = yup.object({
  email: yup
    .string()
    .email("Please enter a valid email address")
    .required("Email is required"),
  password: yup.string().required("Password is required"),
});

const forgotPasswordSchema = yup.object({
  email: yup
    .string()
    .email("Please enter a valid email address")
    .required("Email is required"),
});

interface LoginFormData {
  email: string;
  password: string;
}

interface ForgotPasswordFormData {
  email: string;
}

const Login: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [forgotPasswordDialogOpen, setForgotPasswordDialogOpen] = useState(false);
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const location = useLocation();
  const forgotPasswordFormRef = useRef<HTMLFormElement>(null);

  const {
    loading,
    error,
    isAuthenticated,
    needsVerification,
    verificationEmail,
    verificationPassword,
  } = useSelector(selectAuth);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<LoginFormData>({
    resolver: yupResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const {
    control: forgotPasswordControl,
    handleSubmit: handleForgotPasswordSubmit,
    formState: { errors: forgotPasswordErrors },
    reset: resetForgotPasswordForm,
  } = useForm<ForgotPasswordFormData>({
    resolver: yupResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  // Redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      const from =
        typeof location.state?.from === "string"
          ? location.state.from
          : "/dashboard";
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location.state?.from]);

  // Handle email verification required
  React.useEffect(() => {
    if (needsVerification && verificationEmail) {
      navigate("/verify-otp", {
        state: {
          email: verificationEmail,
          isLoginVerification: true,
          password: verificationPassword || "",
        },
        replace: true,
      });
    }
  }, [needsVerification, verificationEmail, verificationPassword, navigate]);

  // Check for error message in URL parameters
  React.useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const errorParam = urlParams.get('error');
    if (errorParam) {
      setUrlError(decodeURIComponent(errorParam));
      // Clear the error from URL
      navigate(location.pathname, { replace: true });
    }
  }, [location.search, navigate]);

  // Clear error when component unmounts
  React.useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  const onSubmit = async (data: LoginFormData) => {
    try {
      await dispatch(loginUser(data)).unwrap();
      // Reset redirecting flag after successful login
      authAPI.resetRedirectingFlag();
      // Navigation will be handled by the useEffect above
    } catch (error) {
      // Error will be handled by Redux state
      console.error("Login failed:", error);
    }
  };

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleClearError = () => {
    dispatch(clearError());
  };

  const handleForgotPassword = async (data: ForgotPasswordFormData) => {
    setForgotPasswordLoading(true);
    try {
      await authAPI.forgotPassword(data.email);
      setForgotPasswordSuccess(true);
      showToast.success("Password reset link sent to your email");
    } catch (error: any) {
      console.error("Forgot password failed:", error);
      showToast.error(error.message || "Failed to send password reset email");
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const handleForgotPasswordDialogClose = () => {
    setForgotPasswordDialogOpen(false);
    setForgotPasswordSuccess(false);
    resetForgotPasswordForm();
  };

  return (
    <>
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          padding: 3,
        }}
      >
      <Card
        sx={{
          width: "100%",
          maxWidth: 480,
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          borderRadius: 2,
        }}
      >
        <CardContent sx={{ p: 4 }}>
          {/* Header */}
          <Box sx={{ textAlign: "center", mb: 4 }}>
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 64,
                height: 64,
                borderRadius: "50%",
                backgroundColor: "primary.main",
                color: "white",
                mb: 2,
              }}
            >
              <AccountCircle sx={{ fontSize: 32 }} />
            </Box>
            <Typography
              variant="h4"
              component="h1"
              gutterBottom
              fontWeight="bold"
            >
              Welcome Back
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Sign in to Civic Issue Reporting System
            </Typography>
          </Box>

          {/* URL Error Alert */}
          {urlError && (
            <Alert 
              severity="info" 
              sx={{ mb: 3 }}
              onClose={() => setUrlError(null)}
            >
              {urlError}
            </Alert>
          )}

          {/* Login Form */}
          <Box 
            component="form" 
            onSubmit={handleSubmit(onSubmit)} 
            noValidate
            onKeyDown={(e) => {
              // Prevent form submission when forgot password dialog is open
              if (forgotPasswordDialogOpen && e.key === 'Enter') {
                e.preventDefault();
              }
            }}
          >
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Email Address"
                  type="email"
                  autoComplete="email"
                  error={!!errors.email}
                  helperText={errors.email?.message}
                  disabled={loading}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email color="action" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ mb: 3 }}
                />
              )}
            />

            <Controller
              name="password"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  error={!!errors.password}
                  helperText={errors.password?.message}
                  disabled={loading}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={handleTogglePasswordVisibility}
                          edge="end"
                          disabled={loading}
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{ mb: 2 }}
                />
              )}
            />

            {/* Forgot Password Link */}
            <Box sx={{ textAlign: "right", mb: 3 }}>
              <Link
                component="button"
                variant="body2"
                onClick={() => setForgotPasswordDialogOpen(true)}
                sx={{ textDecoration: "none" }}
              >
                Forgot Password?
              </Link>
            </Box>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{
                py: 1.5,
                fontSize: "1.1rem",
                fontWeight: 600,
                mb: 3,
              }}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "Sign In"
              )}
            </Button>
          </Box>

          <Divider sx={{ my: 3 }}>
            <Typography variant="body2" color="text.secondary">
              New to the platform?
            </Typography>
          </Divider>

          {/* Register Link */}
          <Box sx={{ textAlign: "center", mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Don't have an account?{" "}
              <Link component={RouterLink} to="/register" color="primary">
                Create one here
              </Link>
            </Typography>
          </Box>

          {/* Footer Info */}
          <Box sx={{ textAlign: "center" }}>
            <Typography variant="body2" color="text.secondary" paragraph>
              Report civic issues, track progress, and engage with your
              community.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Need help? Contact{" "}
              <Link href="mailto:support@civicissues.com" color="primary">
                support@civicissues.com
              </Link>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>

    {/* Forgot Password Dialog */}
    <Dialog
      open={forgotPasswordDialogOpen}
      onClose={handleForgotPasswordDialogClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Lock color="primary" />
          <Typography variant="h6">
            Reset Password
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Enter your email address and we'll send you a link to reset your password.
        </Typography>

        <Box component="form" onSubmit={handleForgotPasswordSubmit(handleForgotPassword)} noValidate>
          <Controller
            name="email"
            control={forgotPasswordControl}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="Email Address"
                type="email"
                autoComplete="email"
                error={!!forgotPasswordErrors.email}
                helperText={forgotPasswordErrors.email?.message}
                disabled={forgotPasswordLoading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email color="action" />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 3 }}
              />
            )}
          />

          <DialogActions sx={{ px: 0, pb: 0 }}>
            <Button
              onClick={handleForgotPasswordDialogClose}
              disabled={forgotPasswordLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={forgotPasswordLoading}
              startIcon={
                forgotPasswordLoading ? (
                  <CircularProgress size={16} color="inherit" />
                ) : null
              }
            >
              {forgotPasswordLoading ? "Sending..." : "Send Reset Link"}
            </Button>
          </DialogActions>
        </Box>
      </DialogContent>
    </Dialog>
    </>
  );
};

export default Login;
