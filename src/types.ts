import { NativeSyntheticEvent, NativeTouchEvent } from 'react-native';

export type OrNull<T> = null | T;

/**
 * Built-in animation names supported by @ajaybhatia/react-native-modal.
 *
 * The `string & {}` fallback intentionally keeps arbitrary names assignable
 * for compatibility with existing react-native-modal code while preserving
 * autocomplete for the built-in names in TypeScript editors.
 */
export type AnimationName =
  | 'slideInUp'
  | 'slideInDown'
  | 'slideInLeft'
  | 'slideInRight'
  | 'slideOutUp'
  | 'slideOutDown'
  | 'slideOutLeft'
  | 'slideOutRight'
  | 'fadeIn'
  | 'fadeOut'
  | 'zoomIn'
  | 'zoomOut'
  | 'bounceIn'
  | 'bounceOut'
  | 'flipInX'
  | 'flipOutX'
  | 'flipInY'
  | 'flipOutY'
  | 'rotateIn'
  | 'rotateOut'
  | 'rollIn'
  | 'rollOut';

export type Animation = AnimationName | (string & {});
export type CustomAnimation = {
  from: Record<string, number>;
  to: Record<string, number>;
};
export type SupportedAnimation = Animation | CustomAnimation;
export type Animations = {
  animationIn: Animation;
  animationOut: Animation;
};

export type Orientation =
  | 'portrait'
  | 'portrait-upside-down'
  | 'landscape'
  | 'landscape-left'
  | 'landscape-right';

export type Direction = 'up' | 'down' | 'left' | 'right';
export type AnimationEvent = (...args: any[]) => void;
export type PresentationStyle =
  | 'fullScreen'
  | 'pageSheet'
  | 'formSheet'
  | 'overFullScreen';
export type OnOrientationChange = (
  orientation: NativeSyntheticEvent<any>,
) => void;

export interface GestureResponderEvent
  extends NativeSyntheticEvent<NativeTouchEvent> {}
