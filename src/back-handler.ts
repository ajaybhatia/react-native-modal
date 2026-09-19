import {
  BackPressEventName,
  NativeEventSubscription,
  Platform,
} from 'react-native';

type BackHandlerApi = {
  exitApp: () => void;
  addEventListener: (
    eventName: BackPressEventName,
    handler: () => boolean | null | undefined,
  ) => NativeEventSubscription;
  removeEventListener: (eventName: BackPressEventName, handler: () => boolean | null | undefined) => void;
};

const noopBackHandler: BackHandlerApi = {
  exitApp() {},
  addEventListener(
    eventName: BackPressEventName,
    handler: () => boolean | null | undefined,
  ): NativeEventSubscription {
    return { remove: () => {} };
  },
  removeEventListener: () => {},
};

export const BackHandler: BackHandlerApi =
  Platform.OS === 'web' ? noopBackHandler : require('react-native').BackHandler;
