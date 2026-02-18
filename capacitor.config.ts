import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.residencialpass.app',
  appName: 'Residencial Pass',
  webDir: 'www',
  server: {
    androidScheme: 'https',
    hostname: 'app.residencialpass.com',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#000000',
      showSpinner: false,
    },
  },
};

export default config;
