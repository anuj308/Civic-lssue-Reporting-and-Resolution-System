export type RootStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  OTPVerification: { email: string; phone?: string; isLoginVerification?: boolean; password?: string };
  MainTabs: undefined;
  ReportIssue: undefined;
  IssueDetail: { issueId: string };
  Map: undefined;
  Profile: undefined;
  Security: undefined;
  SecurityAlerts: undefined;
  SecurityAlert: { alertId: string };
  DeviceManagement: undefined;
  SecuritySettings: undefined;
};

export type MainTabParamList = {
  Issues: undefined;
  Map: undefined;
  Report: undefined;
  Profile: undefined;
};

export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  OTPVerification: { email: string; phone?: string; isLoginVerification?: boolean; password?: string };
};

export type SecurityStackParamList = {
  Security: undefined;
  SecurityAlerts: undefined;
  SecurityAlert: { alertId: string };
  DeviceManagement: undefined;
  SecuritySettings: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
