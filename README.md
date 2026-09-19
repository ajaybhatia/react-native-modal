# @ajaybhatia/react-native-modal

This project is a community-maintained continuation of the original
[`react-native-modal`](https://github.com/react-native-modal/react-native-modal)
package, maintained by Ajay Bhatia. It keeps the familiar API while updating
the implementation for modern React Native releases, including versions where
legacy APIs such as `InteractionManager` are no longer available.

The goal is to provide a reliable, actively maintained `@ajaybhatia/react-native-modal` for developers who
need the animation, backdrop, swipe, and keyboard behavior of the original
project across current React Native versions.

[![npm version](https://img.shields.io/npm/v/%40ajaybhatia%2Freact-native-modal.svg)](https://www.npmjs.com/package/%40ajaybhatia%2Freact-native-modal)
[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)

An enhanced, animated, customizable React Native modal for modern React Native applications.

The goal of `@ajaybhatia/react-native-modal` is expanding the original React Native `<Modal>` component by adding animations, style customization options, and new features, while still providing a simple API.

<p align="center">
<img src="/.github/images/example-modal.gif" height="500" />
</p>

## Features

- Smooth enter/exit animations
- Plain simple and flexible APIs
- Customizable backdrop opacity, color and timing
- Listeners for the modal animations ending
- Resize itself correctly on device rotation
- Swipeable
- Scrollable

## Setup

This library is available on npm. The package requires React Native 0.86+,
Reanimated 4.7+, and the matching Worklets runtime.

### React Native Community CLI

Create a current React Native application and install the package with its
animation runtime:

```sh
npx @react-native-community/cli@latest init MyApp
cd MyApp
pnpm add @ajaybhatia/react-native-modal react-native-reanimated@4.7.0 react-native-worklets@0.13.0
```

Add the Worklets plugin last in `babel.config.js`:

```js
module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: ['react-native-worklets/plugin'],
};
```

Then install iOS pods and rebuild the native application:

```sh
cd ios && pod install && cd ..
pnpm android # or: pnpm ios
```

The Worklets plugin is required for React Native Community CLI projects and
must remain the last Babel plugin.

### Expo

For a new Expo application:

```sh
pnpm create expo-app@latest my-app
cd my-app
pnpm expo install @ajaybhatia/react-native-modal react-native-reanimated react-native-worklets
```

Expo's Babel preset configures Reanimated automatically. No manual Babel plugin
entry is needed. Use an Expo SDK whose React Native version is supported by
Reanimated 4, and rebuild the development build after installing native
dependencies.

## Usage

Since `@ajaybhatia/react-native-modal` is an extension of the [original React Native modal](https://reactnative.dev/docs/modal.html), it works in a similar fashion.

1.  Import `@ajaybhatia/react-native-modal`:

```javascript
import Modal from '@ajaybhatia/react-native-modal';
```

2.  Create a `<Modal>` component and nest its content inside of it:

```javascript
function WrapperComponent() {
  return (
    <View>
      <Modal>
        <View style={{flex: 1}}>
          <Text>I am the modal content!</Text>
        </View>
      </Modal>
    </View>
  );
}
```

3.  Then, show the modal by setting the `isVisible` prop to `true`:

```javascript
function WrapperComponent() {
  return (
    <View>
      <Modal isVisible={true}>
        <View style={{flex: 1}}>
          <Text>I am the modal content!</Text>
        </View>
      </Modal>
    </View>
  );
}
```

The `isVisible` prop is the only prop you'll really need to make the modal work: you should control this prop value by saving it in your wrapper component state and setting it to `true` or `false` when needed.

## A complete example

The following example consists in a component (`ModalTester`) with a button and a modal.
The modal is controlled by the `isModalVisible` state variable and it is initially hidden, since its value is `false`.  
Pressing the button sets `isModalVisible` to true, making the modal visible.  
Inside the modal there is another button that, when pressed, sets `isModalVisible` to false, hiding the modal.

```javascript
import React, {useState} from 'react';
import {Button, Text, View} from 'react-native';
import Modal from '@ajaybhatia/react-native-modal';

function ModalTester() {
  const [isModalVisible, setModalVisible] = useState(false);

  const toggleModal = () => {
    setModalVisible(!isModalVisible);
  };

  return (
    <View style={{flex: 1}}>
      <Button title="Show modal" onPress={toggleModal} />

      <Modal isVisible={isModalVisible}>
        <View style={{flex: 1}}>
          <Text>Hello!</Text>

          <Button title="Hide modal" onPress={toggleModal} />
        </View>
      </Modal>
    </View>
  );
}

export default ModalTester;
```

For a more complex implementation, combine the modal with your app's existing
navigation and state-management patterns; this package intentionally does not
ship an example application.

## Available props

| Name                             | Type                 | Default                          | Description                                                                                                                                |
| -------------------------------- | -------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `animationIn`                    | `string` or `object` | `"slideInUp"`                    | Modal show animation                                                                                                                       |
| `animationInTiming`              | `number`             | `300`                            | Timing for the modal show animation (in ms)                                                                                                |
| `animationOut`                   | `string` or `object` | `"slideOutDown"`                 | Modal hide animation                                                                                                                       |
| `animationOutTiming`             | `number`             | `300`                            | Timing for the modal hide animation (in ms)                                                                                                |
| `avoidKeyboard`                  | `bool`               | `false`                          | Move the modal up if the keyboard is open                                                                                                  |
| `coverScreen`                    | `bool`               | `true`                           | Will use RN `Modal` component to cover the entire screen wherever the modal is mounted in the component hierarchy                          |
| `hasBackdrop`                    | `bool`               | `true`                           | Render the backdrop                                                                                                                        |
| `backdropColor`                  | `string`             | `"black"`                        | The backdrop background color                                                                                                              |
| `backdropOpacity`                | `number`             | `0.70`                           | The backdrop opacity when the modal is visible                                                                                             |
| `backdropTransitionInTiming`     | `number`             | `300`                            | The backdrop show timing (in ms)                                                                                                           |
| `backdropTransitionOutTiming`    | `number`             | `300`                            | The backdrop hide timing (in ms)                                                                                                           |
| `customBackdrop`                 | `node`               | `null`                           | The custom backdrop element                                                                                                                |
| `children`                       | `node`               | **REQUIRED**                     | The modal content                                                                                                                          |
| `deviceHeight`                   | `number`             | `null`                           | Device height (useful on devices that can hide the navigation bar)                                                                         |
| `deviceWidth`                    | `number`             | `null`                           | Device width (useful on devices that can hide the navigation bar)                                                                          |
| `isVisible`                      | `bool`               | **REQUIRED**                     | Show the modal?                                                                                                                            |
| `onBackButtonPress`              | `func`               | `() => null`                     | Called when the Android back button is pressed                                                                                             |
| `onBackdropPress`                | `func`               | `() => null`                     | Called when the backdrop is pressed                                                                                                        |
| `onModalWillHide`                | `func`               | `() => null`                     | Called before the modal hide animation begins                                                                                              |
| `onModalHide`                    | `func`               | `() => null`                     | Called when the modal is completely hidden                                                                                                 |
| `onModalWillShow`                | `func`               | `() => null`                     | Called before the modal show animation begins                                                                                              |
| `onModalShow`                    | `func`               | `() => null`                     | Called when the modal is completely visible                                                                                                |
| `onSwipeStart`                   | `func`               | `() => null`                     | Called when the swipe action started                                                                                                       |
| `onSwipeMove`                    | `func`               | `(percentageShown) => null`      | Called on each swipe event                                                                                                                 |
| `onSwipeComplete`                | `func`               | `({ swipingDirection }) => null` | Called when the `swipeThreshold` has been reached                                                                                          |
| `onSwipeCancel`                  | `func`               | `() => null`                     | Called when the `swipeThreshold` has not been reached                                                                                      |
| `panResponderThreshold`          | `number`             | `4`                              | The threshold for when the panResponder should pick up swipe events                                                                        |
| `scrollOffset`                   | `number`             | `0`                              | When > 0, disables swipe-to-close, in order to implement scrollable content                                                                |
| `scrollOffsetMax`                | `number`             | `0`                              | Used to implement overscroll feel when content is scrollable                                                                               |
| `scrollTo`                       | `func`               | `null`                           | Used to implement a scrollable modal                                                                                                      |
| `scrollHorizontal`               | `bool`               | `false`                          | Set to true if your scrollView is horizontal (for a correct scroll handling)                                                               |
| `swipeThreshold`                 | `number`             | `100`                            | Swiping threshold that when reached calls `onSwipeComplete`                                                                                |
| `swipeDirection`                 | `string` or `array`  | `null`                           | Defines the direction where the modal can be swiped. Can be 'up', 'down', 'left, or 'right', or a combination of them like `['up','down']` |
| `useNativeDriver`                | `bool`               | `false`                          | Kept for API compatibility; animations are driven by Reanimated                                                                            |
| `useNativeDriverForBackdrop`     | `bool`               | `null`                           | Kept for API compatibility; backdrop animations are driven by Reanimated                                                                   |
| `hideModalContentWhileAnimating` | `bool`               | `false`                          | Enhances the performance by hiding the modal content until the animations complete                                                         |
| `propagateSwipe`                 | `bool` or `func`     | `false`                          | Allows swipe events to propagate to children components (eg a ScrollView inside a modal)                                                   |
| `style`                          | `any`                | `null`                           | Style applied to the modal                                                                                                                 |

## Frequently Asked Questions

### The component is not working as expected

Under the hood `@ajaybhatia/react-native-modal` uses React Native's original [Modal component](https://reactnative.dev/docs/modal).
Before reporting a bug, try swapping `@ajaybhatia/react-native-modal` with React Native's original Modal component and, if the issue persists, check if it has already been reported as a [React Native issue](https://github.com/facebook/react-native/issues).

### The backdrop is not completely filled/covered on some Android devices (Galaxy, for one)

React-Native has a few issues detecting the correct device width/height of some devices.  
If you're experiencing this issue, you'll need to install [`react-native-extra-dimensions-android`](https://github.com/Sunhat/react-native-extra-dimensions-android).  
Then, provide the real window height (obtained from `react-native-extra-dimensions-android`) to the modal:

```javascript
const deviceWidth = Dimensions.get('window').width;
const deviceHeight =
  Platform.OS === 'ios'
    ? Dimensions.get('window').height
    : require('react-native-extra-dimensions-android').get(
        'REAL_WINDOW_HEIGHT',
      );

function WrapperComponent() {
  const [isModalVisible, setModalVisible] = useState(true);

  return (
    <Modal
      isVisible={isModalVisible}
      deviceWidth={deviceWidth}
      deviceHeight={deviceHeight}>
      <View style={{flex: 1}}>
        <Text>I am the modal content!</Text>
      </View>
    </Modal>
  );
}
```

### How can I hide the modal by pressing outside of its content?

The prop `onBackdropPress` allows you to handle this situation:

```javascript
<Modal
  isVisible={isModalVisible}
  onBackdropPress={() => setModalVisible(false)}>
  <View style={{flex: 1}}>
    <Text>I am the modal content!</Text>
  </View>
</Modal>
```

### How can I hide the modal by swiping it?

The prop `onSwipeComplete` allows you to handle this situation (remember to set `swipeDirection` too!):

```javascript
<Modal
  isVisible={isModalVisible}
  onSwipeComplete={() => setModalVisible(false)}
  swipeDirection="left">
  <View style={{flex: 1}}>
    <Text>I am the modal content!</Text>
  </View>
</Modal>
```

Swipe gestures are driven by Reanimated shared values, so they do not depend on
the legacy `useNativeDriver` flag.

### The modal flashes in a weird way when animating

If the modal content flashes during a transition, set
`hideModalContentWhileAnimating={true}` as a rendering workaround.
Also, do not assign a `backgroundColor` property directly to the Modal. Prefer to set it on the child container.

### The modal background doesn't animate properly

Are you sure you named the `isVisible` prop correctly? Make sure it is spelled correctly: `isVisible`, not `visible`.

### The modal doesn't change orientation

Add a `supportedOrientations={['portrait', 'landscape']}` prop to the component, as described [in the React Native documentation](https://reactnative.dev/docs/modal.html#supportedorientations).

Also, if you're providing the `deviceHeight` and `deviceWidth` props you'll have to manually update them when the layout changes.

### I can't show multiple modals one after another

Unfortunately right now react-native doesn't allow multiple modals to be displayed at the same time.
This means that, in `@ajaybhatia/react-native-modal`, if you want to immediately show a new modal after closing one you must first make sure that the modal that you are closing has completed its hiding animation by using the `onModalHide` prop.

### I can't show multiple modals at the same time

See the question above.
Showing multiple modals (or even alerts/dialogs) at the same time is not doable because of a react-native bug.
That said, I would strongly advice against using multiple modals at the same time because, most often than not, this leads to a bad UX, especially on mobile (just my opinion).

### The StatusBar style changes when the modal shows up

This issue has been discussed [here](https://github.com/react-native-community/react-native-modal/issues/50).  
The TLDR is: it's a know React-Native issue with the Modal component 😞

### The modal is not covering the entire screen

The modal style applied by default has a small margin.  
If you want the modal to cover the entire screen you can easily override it this way:

```js
<Modal style={{margin: 0}}>...</Modal>
```

### I can't scroll my ScrollView inside of the modal

Enable propagateSwipe to allow your child components to receive swipe events:

```js
<Modal propagateSwipe>...</Modal>
```

Please notice that this is still a WIP fix and might not fix your issue yet, see [issue #236](https://github.com/react-native-community/react-native-modal/issues/236).

### The modal enter/exit animation flickers

Make sure your `animationIn` and `animationOut` are set correctly.  
We noticed that, for example, using `fadeIn` as an exit animation makes the modal flicker (it should be `fadeOut`!).
Also, some users have noticed that setting backdropTransitionOutTiming={0} can fix the flicker without affecting the animation.

### The custom backdrop doesn't fill the entire screen

You need to specify the size of your custom backdrop component. You can also make it expand to fill the entire screen by adding a `flex: 1` to its style:

```javascript
<Modal isVisible={isModalVisible} customBackdrop={<View style={{flex: 1}} />}>
  <View style={{flex: 1}}>
    <Text>I am the modal content!</Text>
  </View>
</Modal>
```

### The custom backdrop doesn't dismiss the modal on press

You can provide an event handler to the custom backdrop element to dismiss the modal. The prop `onBackdropPress` is not supported for a custom backdrop.

```javascript
<Modal
  isVisible={isModalVisible}
  customBackdrop={
    <TouchableWithoutFeedback onPress={dismissModalHandler}>
      <View style={{flex: 1}} />
    </TouchableWithoutFeedback>
  }
/>
```

## Available animations

Animations are powered by `react-native-reanimated`, which is a peer dependency of
`@ajaybhatia/react-native-modal`. Install it in your application and follow its installation steps,
including `react-native-worklets` and the Babel plugin configuration required by
Reanimated 4:

```sh
pnpm add react-native-reanimated@4.7.0 react-native-worklets@0.13.0
```

For React Native Community CLI applications, add
`react-native-worklets/plugin` as the last Babel plugin, then rebuild the native
application. This release targets React Native 0.86 through 0.88. Applications
on older React Native versions must remain on the original package or use a
separate compatibility release; this package intentionally follows the current
native runtime rather than preserving obsolete native dependencies.

The compatibility animation names currently supported are:

- `slideInUp`, `slideInDown`, `slideInLeft`, `slideInRight`
- `slideOutUp`, `slideOutDown`, `slideOutLeft`, `slideOutRight`
- `fadeIn`, `fadeOut`
- `zoomIn`, `zoomOut`, `bounceIn`, `bounceOut`
- `flipInX`, `flipOutX`, `flipInY`, `flipOutY`
- `rotateIn`, `rotateOut`, `rollIn`, `rollOut`

Custom animations can be supplied with the same `{ from, to }` shape used by the
original `react-native-modal` API. Numeric `translateX`, `translateY`, `opacity`,
`scale`, `rotate`, `rotateX`, and `rotateY` values are supported. Unknown legacy
`react-native-animatable` names are not silently remapped; use a custom animation
definition for those effects so the result is explicit and predictable.

## Migration from react-native-modal

For an application already configured for Reanimated 4, the component usage is
intended to be a one-line import change:

```diff
- import Modal from 'react-native-modal';
+ import Modal from '@ajaybhatia/react-native-modal';
```

The existing modal props and lifecycle callbacks remain available. Install the
runtime prerequisites from the setup section, remove `react-native-animatable`
if it was only used by the original modal, and rebuild the native app after the
dependency change.

## Alternatives

- [React Native's built-in `<Modal>` component](https://reactnative.dev/docs/modal.html)
- [React Native Paper `<Modal>` component](https://callstack.github.io/react-native-paper/modal.html)
- [React Native Modalfy](https://github.com/colorfy-software/react-native-modalfy)

## Acknowledgements

Thanks [@brentvatne](https://github.com/brentvatne) for the npm namespace and to everyone who contributed to the original project and this continuation.

Pull requests, feedbacks and suggestions are welcome!
