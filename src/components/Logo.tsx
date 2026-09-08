import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { Colors } from '../constants/theme';

type LogoProps = {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  animated?: boolean;
};

export default function Logo({ size = 'md', showText = true, animated = true }: LogoProps) {
  const pulse = useRef(new Animated.Value(1)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!animated) return;
    const pulseAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.08,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    const rotateAnim = Animated.loop(
      Animated.timing(rotate, {
        toValue: 1,
        duration: 18000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    pulseAnim.start();
    rotateAnim.start();
    return () => {
      pulseAnim.stop();
      rotateAnim.stop();
    };
  }, [animated, pulse, rotate]);

  const dims = {
    sm: { box: 36, font: 14, text: 12 },
    md: { box: 56, font: 20, text: 16 },
    lg: { box: 80, font: 28, text: 20 },
    xl: { box: 110, font: 36, text: 26 },
  }[size];

  const spin = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.wrapper}>
      <Animated.View
        style={[
          styles.logoBox,
          {
            width: dims.box,
            height: dims.box,
            borderRadius: dims.box * 0.28,
            transform: [{ scale: pulse }],
          },
        ]}
      >
        <Animated.View
          style={[
            styles.innerRing,
            {
              width: dims.box * 0.72,
              height: dims.box * 0.72,
              borderRadius: dims.box * 0.22,
              transform: [{ rotate: spin }],
            },
          ]}
        />
        <View style={[styles.core, { width: dims.box * 0.42, height: dims.box * 0.42, borderRadius: dims.box * 0.14 }]}>
          <Text style={[styles.monogram, { fontSize: dims.font }]}>CAN</Text>
        </View>
        <View style={[styles.dot, styles.dotTL, { width: dims.box * 0.12, height: dims.box * 0.12 }]} />
        <View style={[styles.dot, styles.dotBR, { width: dims.box * 0.12, height: dims.box * 0.12 }]} />
      </Animated.View>
      {showText && (
        <View style={styles.textWrap}>
          <Text style={[styles.brand, { fontSize: dims.text }]}>Cushy Access</Text>
          <Text style={[styles.subBrand, { fontSize: dims.text * 0.75 }]}>NEXUS</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
  },
  logoBox: {
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  innerRing: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: Colors.accent,
    borderStyle: 'dashed',
  },
  core: {
    backgroundColor: Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monogram: {
    color: Colors.primaryDark,
    fontWeight: '900',
    letterSpacing: -1,
  },
  dot: {
    position: 'absolute',
    backgroundColor: Colors.accent,
    borderRadius: 99,
  },
  dotTL: {
    top: '12%',
    left: '12%',
  },
  dotBR: {
    bottom: '12%',
    right: '12%',
  },
  textWrap: {
    marginTop: 10,
    alignItems: 'center',
  },
  brand: {
    color: Colors.primary,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  subBrand: {
    color: Colors.accentDark,
    fontWeight: '800',
    letterSpacing: 4,
    marginTop: 2,
  },
});
