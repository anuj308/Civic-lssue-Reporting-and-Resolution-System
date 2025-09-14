import React from 'react';
import { View, StyleSheet, Image, Dimensions } from 'react-native';
import { Button, Text, Card } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { theme, spacing } from '../../utils/theme';
import { AuthStackParamList } from '../../navigation/AuthNavigator';

const { width } = Dimensions.get('window');

type WelcomeScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Welcome'>;

interface Props {
  navigation: WelcomeScreenNavigationProp;
}

const WelcomeScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo and App Name */}
        <View style={styles.header}>
          <Image
            source={require('../../../assets/icon.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text variant="headlineLarge" style={styles.title}>
            Civic Issue Reporter
          </Text>
          <Text variant="bodyLarge" style={styles.subtitle}>
            Report civic issues in your community and track their resolution
          </Text>
        </View>

        {/* Features */}
        <Card style={styles.featuresCard}>
          <Card.Content>
            <View style={styles.feature}>
              <Text variant="titleMedium" style={styles.featureTitle}>
                📱 Easy Reporting
              </Text>
              <Text variant="bodyMedium" style={styles.featureText}>
                Report issues with photos and location in seconds
              </Text>
            </View>

            <View style={styles.feature}>
              <Text variant="titleMedium" style={styles.featureTitle}>
                📍 Location Tracking
              </Text>
              <Text variant="bodyMedium" style={styles.featureText}>
                Automatic location detection for accurate reporting
              </Text>
            </View>

            <View style={styles.feature}>
              <Text variant="titleMedium" style={styles.featureTitle}>
                🔔 Real-time Updates
              </Text>
              <Text variant="bodyMedium" style={styles.featureText}>
                Get notified when your issues are being addressed
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            style={styles.primaryButton}
            labelStyle={styles.buttonLabel}
            onPress={() => navigation.navigate('Login')}
          >
            Sign In
          </Button>

          <Button
            mode="outlined"
            style={styles.secondaryButton}
            labelStyle={styles.buttonLabel}
            onPress={() => navigation.navigate('Register')}
          >
            Create Account
          </Button>
        </View>

        {/* Footer */}
        <Text variant="bodySmall" style={styles.footer}>
          By continuing, you agree to our Terms of Service and Privacy Policy
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginTop: spacing.xxl,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: spacing.lg,
  },
  title: {
    color: theme.colors.primary,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: spacing.lg,
  },
  featuresCard: {
    marginVertical: spacing.xl,
    backgroundColor: theme.colors.surface,
  },
  feature: {
    marginBottom: spacing.lg,
  },
  featureTitle: {
    color: theme.colors.onSurface,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  featureText: {
    color: theme.colors.onSurfaceVariant,
    lineHeight: 20,
  },
  buttonContainer: {
    marginBottom: spacing.xl,
  },
  primaryButton: {
    marginBottom: spacing.md,
    borderRadius: 12,
    paddingVertical: spacing.xs,
  },
  secondaryButton: {
    borderRadius: 12,
    paddingVertical: spacing.xs,
    borderColor: theme.colors.primary,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
    paddingVertical: spacing.xs,
  },
  footer: {
    textAlign: 'center',
    color: theme.colors.onSurfaceVariant,
    lineHeight: 18,
    marginBottom: spacing.lg,
  },
});

export default WelcomeScreen;
