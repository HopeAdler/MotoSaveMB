import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet } from "react-native";

const RippleEffect = () => {
  const rippleScale = useRef(new Animated.Value(1)).current;
  const rippleOpacity = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    const rippleAnimation = Animated.loop(
      Animated.parallel([
        Animated.timing(rippleScale, {
          toValue: 2.5,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(rippleOpacity, {
          toValue: 0,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ]),
      { resetBeforeIteration: true }
    );

    rippleAnimation.start();

    return () => rippleAnimation.stop();
  }, []);

  return (
    <Animated.View
      style={[
        styles.ripple,
        {
          transform: [{ scale: rippleScale }],
          opacity: rippleOpacity,
        },
      ]}
    />
  );
};

const styles = StyleSheet.create({
  ripple: {
    position: "absolute",
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(0, 128, 255, 0.3)",
  },
});

export default RippleEffect;
