import * as React from 'react';
import {
  DeviceEventEmitter,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  PanResponderGestureState,
  Platform,
  StyleProp,
  TouchableWithoutFeedback,
  View,
  ViewProps,
  ViewStyle,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { BackHandler } from './back-handler.js';
import styles from './modal.style';
import { Animation, CustomAnimation, GestureResponderEvent, Direction, OnOrientationChange, Orientation, OrNull, PresentationStyle } from './types';
import { reversePercentage } from './utils';

// react-native-animatable's default easing is CSS `ease`.
// Keep this curve so the same duration has the same perceived speed during
// migration from react-native-modal.
const ANIMATABLE_EASE = Easing.bezier(0.25, 0.1, 0.25, 1);

export type OnSwipeCompleteParams = { swipingDirection: Direction };

const defaultProps = {
  animationIn: 'slideInUp' as Animation | CustomAnimation,
  animationInTiming: 300,
  animationOut: 'slideOutDown' as Animation | CustomAnimation,
  animationOutTiming: 300,
  avoidKeyboard: false,
  coverScreen: true,
  hasBackdrop: true,
  backdropColor: 'black',
  backdropOpacity: 0.7,
  backdropTransitionInTiming: 300,
  backdropTransitionOutTiming: 300,
  customBackdrop: null as React.ReactNode,
  useNativeDriver: false,
  deviceHeight: null as OrNull<number>,
  deviceWidth: null as OrNull<number>,
  hideModalContentWhileAnimating: false,
  propagateSwipe: false as boolean | ((event: GestureResponderEvent, gestureState: PanResponderGestureState) => boolean),
  isVisible: false,
  panResponderThreshold: 4,
  swipeThreshold: 100,
  onModalShow: (() => null) as () => void,
  onModalWillShow: (() => null) as () => void,
  onModalHide: (() => null) as () => void,
  onModalWillHide: (() => null) as () => void,
  onBackdropPress: (() => null) as () => void,
  onBackButtonPress: (() => null) as () => void,
  scrollTo: null as OrNull<(event: any) => void>,
  scrollOffset: 0,
  scrollOffsetMax: 0,
  scrollHorizontal: false,
  statusBarTranslucent: false,
  supportedOrientations: ['portrait', 'landscape'] as Orientation[],
};

export type ModalProps = ViewProps & {
  children: React.ReactNode;
  onSwipeStart?: (gestureState: PanResponderGestureState) => void;
  onSwipeMove?: (percentageShown: number, gestureState: PanResponderGestureState) => void;
  onSwipeComplete?: (params: OnSwipeCompleteParams, gestureState: PanResponderGestureState) => void;
  onSwipeCancel?: (gestureState: PanResponderGestureState) => void;
  style?: StyleProp<ViewStyle>;
  swipeDirection?: Direction | Direction[];
  onDismiss?: () => void;
  onShow?: () => void;
  hardwareAccelerated?: boolean;
  onOrientationChange?: OnOrientationChange;
  presentationStyle?: PresentationStyle;
  useNativeDriverForBackdrop?: boolean;
} & Partial<typeof defaultProps>;

type AnimationValues = {
  translateX: number;
  translateY: number;
  opacity: number;
  scale: number;
  rotate: number;
  rotateX: number;
  rotateY: number;
};

const angleValue = (value: unknown) => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return Number.parseFloat(value) || 0;
  return 0;
};

const animationValues = (
  animation: Animation | CustomAnimation,
  width: number,
  height: number,
  entering: boolean,
): AnimationValues => {
  if (typeof animation === 'object') {
    const values = entering ? animation.from : animation.to;
    return {
      translateX: values.translateX ?? 0,
      translateY: values.translateY ?? 0,
      opacity: values.opacity ?? 1,
      scale: values.scale ?? 1,
      rotate: angleValue(values.rotate),
      rotateX: angleValue(values.rotateX),
      rotateY: angleValue(values.rotateY),
    };
  }
  const isEnteringAnimation = animation.toLowerCase().includes('in');
  const direction = animation.replace(/^(slideIn|slideOut)/, '').toLowerCase();
  const isOffscreen = isEnteringAnimation === entering;
  const values: AnimationValues = { translateX: 0, translateY: 0, opacity: 1, scale: 1, rotate: 0, rotateX: 0, rotateY: 0 };
  if (direction === 'up' || direction === 'down') {
    // Keep the original react-native-animatable definitions exactly:
    // slideInUp starts below and slideOutUp ends above; the down variants are
    // the inverse.
    const sign = direction === 'up'
      ? (isEnteringAnimation ? 1 : -1)
      : (isEnteringAnimation ? -1 : 1);
    values.translateY = isOffscreen ? sign * height : 0;
    return values;
  }
  if (direction === 'left' || direction === 'right') {
    // Horizontal animation names describe the destination edge. In
    // particular, slideOutLeft must leave through the left edge (not the
    // right edge), which is important for drawer-style modals.
    const sign = direction === 'left' ? -1 : 1;
    values.translateX = isOffscreen ? sign * width : 0;
    return values;
  }
  if (animation.toLowerCase().includes('fade')) {
    values.opacity = isOffscreen ? 0 : 1;
    return values;
  }
  const name = animation.toLowerCase();
  if (name.includes('zoom') || name.includes('bounce')) values.scale = isOffscreen ? 0.3 : 1;
  if (name.includes('flip')) {
    if (name.includes('x')) values.rotateX = isOffscreen ? (isEnteringAnimation ? -90 : 90) : 0;
    else values.rotateY = isOffscreen ? (isEnteringAnimation ? -90 : 90) : 0;
  }
  if (name.includes('rotate')) values.rotate = isOffscreen ? (isEnteringAnimation ? -200 : 200) : 0;
  if (name.includes('roll')) {
    values.translateX = isOffscreen ? (isEnteringAnimation ? -width : width) : 0;
    values.rotate = isOffscreen ? (isEnteringAnimation ? -120 : 120) : 0;
  }
  return values;
};

export const ReactNativeModal = (props: ModalProps) => {
  // React 19 no longer guarantees `defaultProps` for function components.
  // Merge them at runtime so callbacks and behavior remain compatible with
  // react-native-modal when consumers omit optional props.
  const mergedProps = { ...defaultProps, ...props };
  const propsRef = React.useRef(mergedProps);
  propsRef.current = mergedProps;
  const windowSize = React.useRef(Dimensions.get('window')).current;
  const [dimensions, setDimensions] = React.useState(windowSize);
  const [showContent, setShowContent] = React.useState(true);
  const [modalVisible, setModalVisible] = React.useState(Boolean(mergedProps.isVisible));
  const contentRef = React.useRef<any>(null);
  const isTransitioning = React.useRef(false);
  const inSwipeClosingState = React.useRef(false);
  const currentSwipingDirection = React.useRef<OrNull<Direction>>(null);
  const transitionTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const previousVisible = React.useRef(false);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);
  const rotate = useSharedValue(0);
  const rotateX = useSharedValue(0);
  const rotateY = useSharedValue(0);
  const backdropOpacity = useSharedValue(0);

  const deviceWidth = mergedProps.deviceWidth || dimensions.width;
  const deviceHeight = mergedProps.deviceHeight || dimensions.height;
  const getDeviceWidth = React.useCallback(() => propsRef.current.deviceWidth || dimensions.width, [dimensions.width]);
  const getDeviceHeight = React.useCallback(() => propsRef.current.deviceHeight || dimensions.height, [dimensions.height]);
  const clearTransitionTimer = React.useCallback(() => {
    if (transitionTimer.current !== null) {
      clearTimeout(transitionTimer.current);
      transitionTimer.current = null;
    }
  }, []);

  const updateDimensions = React.useCallback(() => {
    if (!propsRef.current.deviceHeight && !propsRef.current.deviceWidth) {
      const next = Dimensions.get('window');
      setDimensions(previous => previous.width === next.width && previous.height === next.height ? previous : next);
    }
  }, []);

  const onBackButtonPress = React.useCallback(() => {
    const currentProps = propsRef.current;
    if (currentProps.isVisible) {
      currentProps.onBackButtonPress();
      return true;
    }
    return false;
  }, []);

  React.useEffect(() => {
    if ((mergedProps as any).onSwipe) {
      console.warn('`<Modal onSwipe="..." />` is deprecated. Use `<Modal onSwipeComplete="..." />` instead.');
    }
    const dimensionSubscription = DeviceEventEmitter.addListener('didUpdateDimensions', updateDimensions);
    const backSubscription = BackHandler.addEventListener('hardwareBackPress', onBackButtonPress);
    return () => {
      dimensionSubscription.remove();
      backSubscription.remove();
      clearTransitionTimer();
    };
  }, [clearTransitionTimer, onBackButtonPress, updateDimensions]);

  const setAnimationStart = React.useCallback((animation: Animation | CustomAnimation, entering: boolean) => {
    const values = animationValues(animation, deviceWidth, deviceHeight, entering);
    translateX.value = values.translateX;
    translateY.value = values.translateY;
    opacity.value = values.opacity;
    scale.value = values.scale;
    rotate.value = values.rotate;
    rotateX.value = values.rotateX;
    rotateY.value = values.rotateY;
  }, [deviceHeight, deviceWidth, opacity, rotate, rotateX, rotateY, scale, translateX, translateY]);

  const finishClose = React.useCallback(() => {
    transitionTimer.current = null;
    isTransitioning.current = false;
    if (propsRef.current.isVisible) {
      open();
      return;
    }
    setShowContent(false);
    setModalVisible(false);
    propsRef.current.onModalHide();
  }, []);

  const open = React.useCallback(() => {
    const currentProps = propsRef.current;
    if (isTransitioning.current) return;
    clearTransitionTimer();
    isTransitioning.current = true;
    setShowContent(!(currentProps.hideModalContentWhileAnimating && currentProps.useNativeDriver));
    setAnimationStart(currentProps.animationIn, true);
    backdropOpacity.value = withTiming(currentProps.backdropOpacity, { duration: currentProps.backdropTransitionInTiming, easing: ANIMATABLE_EASE });
    currentProps.onModalWillShow();
    translateX.value = withTiming(0, { duration: currentProps.animationInTiming, easing: ANIMATABLE_EASE });
    translateY.value = withTiming(0, { duration: currentProps.animationInTiming, easing: ANIMATABLE_EASE });
    opacity.value = withTiming(1, { duration: currentProps.animationInTiming, easing: ANIMATABLE_EASE });
    scale.value = withTiming(1, { duration: currentProps.animationInTiming, easing: ANIMATABLE_EASE });
    rotate.value = withTiming(0, { duration: currentProps.animationInTiming, easing: ANIMATABLE_EASE });
    rotateX.value = withTiming(0, { duration: currentProps.animationInTiming, easing: ANIMATABLE_EASE });
    rotateY.value = withTiming(0, { duration: currentProps.animationInTiming, easing: ANIMATABLE_EASE });
    transitionTimer.current = setTimeout(() => {
      transitionTimer.current = null;
      isTransitioning.current = false;
      setShowContent(true);
      if (!propsRef.current.isVisible) close();
      else propsRef.current.onModalShow();
    }, currentProps.animationInTiming);
  }, [backdropOpacity, clearTransitionTimer, opacity, rotate, rotateX, rotateY, scale, setAnimationStart, translateX, translateY]);

  const close = React.useCallback(() => {
    const currentProps = propsRef.current;
    if (isTransitioning.current) return;
    clearTransitionTimer();
    isTransitioning.current = true;
    const animation = inSwipeClosingState.current && currentSwipingDirection.current
      ? `slideOut${currentSwipingDirection.current[0].toUpperCase()}${currentSwipingDirection.current.slice(1)}`
      : currentProps.animationOut;
    inSwipeClosingState.current = false;
    backdropOpacity.value = withTiming(0, { duration: currentProps.backdropTransitionOutTiming, easing: ANIMATABLE_EASE });
    currentProps.onModalWillHide();
    const values = animationValues(animation, deviceWidth, deviceHeight, false);
    translateX.value = withTiming(values.translateX, { duration: currentProps.animationOutTiming, easing: ANIMATABLE_EASE });
    translateY.value = withTiming(values.translateY, { duration: currentProps.animationOutTiming, easing: ANIMATABLE_EASE });
    opacity.value = withTiming(values.opacity, { duration: currentProps.animationOutTiming, easing: ANIMATABLE_EASE });
    scale.value = withTiming(values.scale, { duration: currentProps.animationOutTiming, easing: ANIMATABLE_EASE });
    rotate.value = withTiming(values.rotate, { duration: currentProps.animationOutTiming, easing: ANIMATABLE_EASE });
    rotateX.value = withTiming(values.rotateX, { duration: currentProps.animationOutTiming, easing: ANIMATABLE_EASE });
    rotateY.value = withTiming(values.rotateY, { duration: currentProps.animationOutTiming, easing: ANIMATABLE_EASE });
    transitionTimer.current = setTimeout(finishClose, currentProps.animationOutTiming);
  }, [backdropOpacity, clearTransitionTimer, deviceHeight, deviceWidth, finishClose, opacity, rotate, rotateX, rotateY, scale, setAnimationStart, translateX, translateY]);

  React.useEffect(() => {
    if (mergedProps.isVisible && !modalVisible) {
      setModalVisible(true);
      setShowContent(true);
      return;
    }
    if (mergedProps.isVisible && !previousVisible.current) open();
    else if (!mergedProps.isVisible && previousVisible.current) close();
    previousVisible.current = Boolean(mergedProps.isVisible);
  }, [close, modalVisible, open, mergedProps.isVisible]);

  const shouldPropagateSwipe = React.useCallback((event: GestureResponderEvent, gestureState: PanResponderGestureState) =>
    typeof propsRef.current.propagateSwipe === 'function' ? propsRef.current.propagateSwipe(event, gestureState) : propsRef.current.propagateSwipe, []);
  const getSwipingDirection = React.useCallback((gestureState: PanResponderGestureState): Direction =>
    Math.abs(gestureState.dx) > Math.abs(gestureState.dy) ? (gestureState.dx > 0 ? 'right' : 'left') : (gestureState.dy > 0 ? 'down' : 'up'), []);
  const isDirectionIncluded = React.useCallback((direction: Direction) => {
    const configured = propsRef.current.swipeDirection;
    return Array.isArray(configured) ? configured.indexOf(direction) !== -1 : configured === direction;
  }, []);
  const isSwipeDirectionAllowed = React.useCallback(({ dx, dy }: PanResponderGestureState) => {
    const direction = currentSwipingDirection.current;
    return (direction === 'up' && isDirectionIncluded('up') && dy < 0) ||
      (direction === 'down' && isDirectionIncluded('down') && dy > 0) ||
      (direction === 'left' && isDirectionIncluded('left') && dx < 0) ||
      (direction === 'right' && isDirectionIncluded('right') && dx > 0);
  }, [isDirectionIncluded]);
  const distancePercentage = React.useCallback((gestureState: PanResponderGestureState) => {
    switch (currentSwipingDirection.current) {
      case 'down': return (gestureState.moveY - gestureState.y0) / (getDeviceHeight() - gestureState.y0);
      case 'up': return reversePercentage(gestureState.moveY / gestureState.y0);
      case 'left': return reversePercentage(gestureState.moveX / gestureState.x0);
      case 'right': return (gestureState.moveX - gestureState.x0) / (getDeviceWidth() - gestureState.x0);
      default: return 0;
    }
  }, [getDeviceHeight, getDeviceWidth]);
  const panResponder = React.useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (event, gestureState) => {
      if (shouldPropagateSwipe(event, gestureState)) return false;
      const currentProps = propsRef.current;
      const shouldSet = Math.abs(gestureState.dx) >= currentProps.panResponderThreshold || Math.abs(gestureState.dy) >= currentProps.panResponderThreshold;
      if (shouldSet) currentProps.onSwipeStart?.(gestureState);
      currentSwipingDirection.current = getSwipingDirection(gestureState);
      return shouldSet;
    },
    onStartShouldSetPanResponder: (event: any, gestureState) => {
      const currentProps = propsRef.current;
      const hasScrollableView = event._dispatchInstances?.some((instance: any) => /scrollview|flatlist/i.test(instance.type));
      if (hasScrollableView && shouldPropagateSwipe(event, gestureState) && currentProps.scrollTo && currentProps.scrollOffset > 0) return false;
      currentProps.onSwipeStart?.(gestureState);
      currentSwipingDirection.current = null;
      return true;
    },
    onPanResponderMove: (event, gestureState) => {
      const currentProps = propsRef.current;
      if (!currentSwipingDirection.current) {
        if (gestureState.dx === 0 && gestureState.dy === 0) return;
        currentSwipingDirection.current = getSwipingDirection(gestureState);
      }
      if (isSwipeDirectionAllowed(gestureState)) {
        const percentage = 1 - distancePercentage(gestureState);
        backdropOpacity.value = currentProps.backdropOpacity * percentage;
        translateX.value = gestureState.dx;
        translateY.value = gestureState.dy;
        currentProps.onSwipeMove?.(percentage, gestureState);
      } else if (currentProps.scrollTo) {
        const maxOffset = Math.max(0, currentProps.scrollOffsetMax);
        let offset = currentProps.scrollHorizontal ? -gestureState.dx : -gestureState.dy;
        if (offset > maxOffset) offset -= (offset - maxOffset) / 2;
        currentProps.scrollTo(currentProps.scrollHorizontal ? { x: offset, animated: false } : { y: offset, animated: false });
      }
    },
    onPanResponderRelease: (_event, gestureState) => {
      const currentProps = propsRef.current;
      const direction = currentSwipingDirection.current;
      const distance = direction === 'up' ? -gestureState.dy : direction === 'down' ? gestureState.dy : direction === 'left' ? -gestureState.dx : gestureState.dx;
      if (distance > currentProps.swipeThreshold && isSwipeDirectionAllowed(gestureState)) {
        inSwipeClosingState.current = true;
        if (currentProps.onSwipeComplete) {
          currentProps.onSwipeComplete({ swipingDirection: getSwipingDirection(gestureState) }, gestureState);
          return;
        }
        if ((currentProps as any).onSwipe) {
          (currentProps as any).onSwipe();
          return;
        }
      }
      currentProps.onSwipeCancel?.(gestureState);
      backdropOpacity.value = withTiming(currentProps.backdropOpacity);
      translateX.value = withSpring(0, { damping: 20 });
      translateY.value = withSpring(0, { damping: 20 });
      if (currentProps.scrollTo && currentProps.scrollOffset > currentProps.scrollOffsetMax) {
        currentProps.scrollTo(currentProps.scrollHorizontal ? { x: currentProps.scrollOffsetMax, animated: true } : { y: currentProps.scrollOffsetMax, animated: true });
      }
    },
  }), [backdropOpacity, distancePercentage, getSwipingDirection, isSwipeDirectionAllowed, shouldPropagateSwipe, translateX, translateY]);

  const contentStyle = useAnimatedStyle(() => ({ transform: [{ translateX: translateX.value }, { translateY: translateY.value }, { scale: scale.value }, { rotate: `${rotate.value}deg` }, { rotateX: `${rotateX.value}deg` }, { rotateY: `${rotateY.value}deg` }], opacity: opacity.value }));
  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdropOpacity.value }));
  const makeBackdrop = () => {
    if (!mergedProps.hasBackdrop) return null;
    const hasCustomBackdrop = Boolean(mergedProps.customBackdrop);
    const backdrop = <Animated.View style={[styles.backdrop, backdropStyle, { width: deviceWidth, height: deviceHeight, backgroundColor: showContent && !hasCustomBackdrop ? mergedProps.backdropColor : 'transparent' }]}>{hasCustomBackdrop && mergedProps.customBackdrop}</Animated.View>;
    return hasCustomBackdrop ? backdrop : <TouchableWithoutFeedback onPress={mergedProps.onBackdropPress}>{backdrop}</TouchableWithoutFeedback>;
  };

  const {
    animationIn: _animationIn,
    animationInTiming: _animationInTiming,
    animationOut: _animationOut,
    animationOutTiming: _animationOutTiming,
    avoidKeyboard,
    coverScreen,
    hasBackdrop: _hasBackdrop,
    backdropColor: _backdropColor,
    backdropOpacity: _backdropOpacity,
    backdropTransitionInTiming: _backdropTransitionInTiming,
    backdropTransitionOutTiming: _backdropTransitionOutTiming,
    customBackdrop: _customBackdrop,
    deviceHeight: _deviceHeight,
    deviceWidth: _deviceWidth,
    hideModalContentWhileAnimating: _hideModalContentWhileAnimating,
    isVisible: _isVisible,
    panResponderThreshold: _panResponderThreshold,
    propagateSwipe: _propagateSwipe,
    scrollTo: _scrollTo,
    scrollOffset: _scrollOffset,
    scrollOffsetMax: _scrollOffsetMax,
    scrollHorizontal: _scrollHorizontal,
    swipeDirection: _swipeDirection,
    swipeThreshold: _swipeThreshold,
    useNativeDriver: _useNativeDriver,
    useNativeDriverForBackdrop: _useNativeDriverForBackdrop,
    onBackdropPress: _onBackdropPress,
    onBackButtonPress: _onBackButtonPress,
    onModalShow: _onModalShow,
    onModalWillShow: _onModalWillShow,
    onModalHide: _onModalHide,
    onModalWillHide: _onModalWillHide,
    onSwipeStart: _onSwipeStart,
    onSwipeMove: _onSwipeMove,
    onSwipeComplete: _onSwipeComplete,
    onSwipeCancel: _onSwipeCancel,
    children,
    style,
    onDismiss,
    onShow,
    hardwareAccelerated,
    onOrientationChange,
    presentationStyle,
    statusBarTranslucent,
    supportedOrientations,
    testID,
    ...containerProps
  } = mergedProps;
  const computedStyle = [{ margin: deviceWidth * 0.05, transform: [{ translateY: 0 }] }, styles.content, style];
  // Animated styles must be last. React Native resolves later style entries
  // over earlier ones, and `computedStyle` retains the original modal's
  // translateY compatibility transform.
  const containerView = <Animated.View {...(mergedProps.swipeDirection ? panResponder.panHandlers : {})} ref={contentRef} style={[computedStyle, contentStyle]} pointerEvents="box-none" {...containerProps}>{mergedProps.hideModalContentWhileAnimating && mergedProps.useNativeDriver && !showContent ? null : children}</Animated.View>;

  if (!coverScreen && modalVisible) return <View pointerEvents="box-none" style={[styles.backdrop, styles.containerBox]}>{makeBackdrop()}{containerView}</View>;
  return (
    <Modal
      transparent
      animationType="none"
      visible={modalVisible}
      onRequestClose={() => {
        onBackButtonPress();
      }}
      onDismiss={onDismiss}
      onShow={onShow}
      hardwareAccelerated={hardwareAccelerated}
      onOrientationChange={onOrientationChange}
      presentationStyle={presentationStyle}
      statusBarTranslucent={statusBarTranslucent}
      supportedOrientations={supportedOrientations}
      testID={testID}>
      {makeBackdrop()}
      {avoidKeyboard ? (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          pointerEvents="box-none"
          style={computedStyle.concat([{ margin: 0 }])}>
          {containerView}
        </KeyboardAvoidingView>
      ) : (
        containerView
      )}
    </Modal>
  );
};

ReactNativeModal.defaultProps = defaultProps;
export default ReactNativeModal;
