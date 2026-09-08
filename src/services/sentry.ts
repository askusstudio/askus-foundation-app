import * as Sentry from '@sentry/react-native';
import { ENV } from '@/config/env';

export const initSentry = () => {
  if (__DEV__ || !ENV.SENTRY_DSN) {
    return;
  }

  Sentry.init({
    dsn: ENV.SENTRY_DSN,
    debug: false,
    tracesSampleRate: 0.2,
    enableAutoSessionTracking: true,
    // Privacy boundary filter: strips direct identifiers before transmission
    beforeSend(event) {
      if (event.user) {
        delete event.user.ip_address;
        delete event.user.email;
        delete event.user.username;
      }
      return event;
    },
  });
};

export { Sentry };
