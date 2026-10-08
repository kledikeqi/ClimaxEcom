/**
 * Ambient types for Expo public environment variables.
 * Declared here (not via expo/types) to avoid pulling @types/node globals
 * into a React Native codebase.
 */
declare const process: {
  env: {
    EXPO_PUBLIC_API_URL?: string;
    NODE_ENV?: 'development' | 'production' | 'test';
  };
};
