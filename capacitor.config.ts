import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.residencialpass.app',
  appName: 'Residencial Pass',
  webDir: 'www',
  server: {
    androidScheme: 'https',
    hostname: 'app.residencialpass.com',
  },
};

export default config;
