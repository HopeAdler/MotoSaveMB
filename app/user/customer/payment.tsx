import React, { useEffect } from 'react';
import { StyleSheet, Text, ScrollView, KeyboardAvoidingView, NativeModules, DeviceEventEmitter } from 'react-native';
import { TextInput } from 'react-native-gesture-handler';
import { Button } from 'react-native-elements';
import CryptoJS from 'crypto-js';
import { useNavigation } from '@react-navigation/native';

const { PayZaloBridge } = NativeModules;

type PayZaloEventData = {
  returnCode: string;
  transactionId?: string;
};

const ZaloPayDemo = () => {
  const navigation = useNavigation<any>();

  const [money, setMoney] = React.useState<string>('10000');
  const [token, setToken] = React.useState<string>('');
  const [returncode, setReturnCode] = React.useState<number | null>(null);

  const [zpTransId, setZpTransId] = React.useState<string | null>(null);
  function getCurrentDateYYMMDD(): string {
    const todayDate = new Date().toISOString().slice(2, 10);
    return todayDate.split('-').join('');
  }

  async function createOrder(money: string): Promise<void> {
    const apptransid = getCurrentDateYYMMDD() + '_' + new Date().getTime();

    const appid = 2553;
    const amount = parseInt(money, 10);
    const appuser = 'ZaloPayDemo';
    const apptime = new Date().getTime();
    const embeddata = '{}';
    const item = '[]';
    const description = 'Merchant description for order #' + apptransid;
    const hmacInput = `${appid}|${apptransid}|${appuser}|${amount}|${apptime}|${embeddata}|${item}`;
    const mac = CryptoJS.HmacSHA256(hmacInput, 'PcY4iZIKFCIdgZvA6ueMcMHHUbRLYjPL').toString();

    const order = {
      app_id: appid,
      app_user: appuser,
      app_time: apptime,
      amount: amount,
      app_trans_id: apptransid,
      embed_data: embeddata,
      item: item,
      description: description,
      mac: mac,
    };

    console.log('Order:', order);

    const formBody = Object.keys(order)
      .map((key) => encodeURIComponent(key) + '=' + encodeURIComponent((order as any)[key]))
      .join('&');

    try {
      const response = await fetch('https://sb-openapi.zalopay.vn/v2/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        },
        body: formBody,
      });

      const resJson = await response.json();
      setToken(resJson.zp_trans_token || '');
      setReturnCode(resJson.return_code || null);
    } catch (error) {
      console.error('Error creating order:', error);
    }
  }

  function generateRandomString(length: number) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      result += characters[randomIndex];
    }
    return result;
  }
  
  async function refundTransaction(description: string) {
    const appid = 2553; // Application ID
    const key1 = 'PcY4iZIKFCIdgZvA6ueMcMHHUbRLYjPL'; // HMAC Key
    const refundUrl = 'https://sb-openapi.zalopay.vn/v2/refund';
  
    // Generate a unique refund ID and timestamp
    const timestamp = new Date().getTime();
    // const randomPart = Math.floor(111 + Math.random() * 888); // Random number between 111 and 999
    const randomPart = generateRandomString(10); // Random number between 111 and 999
    const mRefundId = `${getCurrentDateYYMMDD()}_${appid}_${randomPart}`;
    const amount = 5000;
    // Prepare parameters
    const params: RefundParams = {
      app_id: appid,
      m_refund_id: mRefundId,
      zp_trans_id: zpTransId, //transactionId from createOrder()
      amount: amount,
      timestamp: timestamp,
      description: description || 'Refund transaction',
    };
    
    // Compute HMAC and add it to params
    const hmacInput = `${appid}|${zpTransId}|${amount}|${description || ''}|${timestamp}`;
    params.mac = CryptoJS.HmacSHA256(hmacInput, key1).toString();
  
    console.log(params);
    // Serialize form data
    const formBody = (Object.keys(params) as Array<keyof RefundParams>)
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key] ?? '')}`)
    .join('&');
  
    // Make POST request
    try {
      const response = await fetch(refundUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        },
        body: formBody,
      });
  
      if (!response.ok) {
        throw new Error(`Refund failed: ${response.statusText}`);
      }
  
      const result = await response.json();
      console.log('Refund Result:', result);
      return result;
    } catch (error) {
      console.error('Error processing refund:', error);
      throw error;
    }
  }
  
  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener('EventPayZalo', (data: PayZaloEventData) => {
      console.log('Payment response:', data);
      if (data.returnCode === "1") {
        navigation.navigate('payment_success');
        setZpTransId(data.transactionId || null);
      } else {
        alert('Payment failed! Return code: ' + data.returnCode);
      }
    });

    // Cleanup subscription
    return () => {
      subscription.remove();
    };
  }, [navigation]);
    
  function payOrder(): void {
    console.log('Generating Zalopay transaction...')
    const payZP = NativeModules.PayZaloBridge;
    payZP.payOrder(token);
  }

  return (
    <ScrollView>
      <KeyboardAvoidingView style={styles.container}>
        <Text style={styles.welcomeHead}>ZaloPay App To App Demo</Text>
        <Text style={styles.welcome}>Amount:</Text>
        <TextInput
          onChangeText={(value) => setMoney(value)}
          value={money}
          keyboardType="numeric"
          placeholder="Input amount"
          style={styles.inputText}
        />
        <Button title="Create order" type="outline" onPress={() => createOrder(money)} />
        <Text style={styles.welcome}>ZpTranstoken: {token}</Text>
        <Text style={styles.welcome}>Return code: {returncode}</Text>
        {returncode === 1 && (
          <>
          <Button title="Pay order" type="outline" onPress={payOrder} />
          <Button title="Refund" type="outline" onPress={() => refundTransaction('Refundd')} />
          </>
        )}
      </KeyboardAvoidingView>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'whitesmoke',
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
  },
  welcomeHead: {
    fontSize: 20,
    textAlign: 'center',
    marginTop: 50,
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 20,
  },
  inputText: {
    marginBottom: 20,
    fontSize: 20,
    textAlign: 'center',
  },
});

export default ZaloPayDemo;
