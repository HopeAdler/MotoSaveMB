import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const PaymentSuccessScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Payment Successful!</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'green',
  },
});

export default PaymentSuccessScreen;
