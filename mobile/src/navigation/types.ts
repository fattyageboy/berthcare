import { NavigatorScreenParams } from '@react-navigation/native';

// Main stack navigator param list
export type RootStackParamList = {
  Login: undefined;
  MainTabs: NavigatorScreenParams<MainTabParamList>;
  PatientProfile: { patientId: string };
  VisitDocumentation: { visitId: string };
  Review: { visitId: string };
};

// Bottom tab navigator param list
export type MainTabParamList = {
  Schedule: undefined;
  Home: undefined;
};

// Deep linking configuration types
export type DeepLinkConfig = {
  screens: {
    Login: string;
    MainTabs: {
      screens: {
        Schedule: string;
        Home: string;
      };
    };
    PatientProfile: string;
    VisitDocumentation: string;
    Review: string;
  };
};
