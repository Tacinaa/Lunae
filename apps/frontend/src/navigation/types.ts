export type AuthStackParamList = {
  Onboarding: undefined;
  Welcome: undefined;
  Login: { email?: string } | undefined;
  Register: { email?: string } | undefined;
  OtpVerification: { email: string; type: 'email_verification' | 'login' };
};

export type OnboardingSetupStackParamList = {
  Consent: undefined;
  CycleSetup: undefined;
  CalendarPermission: undefined;
  CalendarImport: undefined;
  Ready: undefined;
};

export type AppStackParamList = {
  MainCalendar: undefined;
};
