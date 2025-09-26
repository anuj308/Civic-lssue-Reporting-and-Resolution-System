import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const ReelsScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Reels Screen</Text>
      <Text style={styles.text}>Coming Soon...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
  },
  text: {
    color: 'white',
    fontSize: 24,
    marginBottom: 10,
  },
});

export default ReelsScreen;