import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'me.hadoku.task',
  appName: 'Tasks',
  webDir: 'www',
  server: {
    hostname: 'localhost',
    androidScheme: 'https',
    iosScheme: 'capacitor'
  },
  android: {
    allowMixedContent: false,
    appendUserAgent: 'HadokuTaskApp/3.0'
  },
  plugins: {
    CapacitorHttp: {
      enabled: true
    }
  }
};

export default config;
