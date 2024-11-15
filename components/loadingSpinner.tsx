// LoadingSpinner.tsx
import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  color?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'large',
  color = '#0000ff',
}) => {
  return (
    <View style={styles.spinnerContainer}>
      <ActivityIndicator size={size} color={color} />
    </View>
  );
};

const styles = StyleSheet.create({
  spinnerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
});

export default LoadingSpinner;
