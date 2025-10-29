import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'me.hadoku.task',
  appName: 'Tasks',
  webDir: 'www',
  server: {
    androidScheme: 'https'
  },
  android: {
    allowMixedContent: false
  },
  plugins: {
    CapacitorHttp: {
      enabled: true
    }
  }
};

export default config;
