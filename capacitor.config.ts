import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'me.hadoku.task',
  appName: 'Tasks',
  webDir: 'www',
  server: {
    url: 'https://hadoku.me/task/',
    androidScheme: 'https'
  },
  android: {
    allowMixedContent: false,
    appendUserAgent: 'HadokuTaskApp/3.0'
  }
};

export default config;
