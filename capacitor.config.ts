import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.cbsetoppers.learning',
  appName: 'CBSE TOPPERS',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
