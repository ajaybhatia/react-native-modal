import { Dimensions } from 'react-native';
import { Animation, CustomAnimation } from './types';

const { height, width } = Dimensions.get('window');

export const initializeAnimations = () => undefined;

export const makeSlideTranslation = (
  translationType: string,
  fromValue: number,
  toValue: number,
): CustomAnimation => ({
  from: { [translationType]: fromValue },
  to: { [translationType]: toValue },
});

export const buildAnimations = ({
  animationIn,
  animationOut,
}: {
  animationIn: Animation | CustomAnimation;
  animationOut: Animation | CustomAnimation;
}) => ({ animationIn, animationOut });

export const defaultAnimationDefinitions = {
  slideInDown: makeSlideTranslation('translateY', -height, 0),
  slideInUp: makeSlideTranslation('translateY', height, 0),
  slideInLeft: makeSlideTranslation('translateX', -width, 0),
  slideInRight: makeSlideTranslation('translateX', width, 0),
  slideOutDown: makeSlideTranslation('translateY', 0, height),
  slideOutUp: makeSlideTranslation('translateY', 0, -height),
  slideOutLeft: makeSlideTranslation('translateX', 0, -width),
  slideOutRight: makeSlideTranslation('translateX', 0, width),
};

export const reversePercentage = (x: number) => -(x - 1);
