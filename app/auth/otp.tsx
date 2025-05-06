import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet } from 'react-native';
import { CodeField, Cursor, useBlurOnFulfill, useClearByFocusCell } from 'react-native-confirmation-code-field';

import { firebase, getToken } from '@react-native-firebase/app-check';
import { TouchableOpacity } from 'react-native';
import { getAuth, PhoneAuthProvider } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

import auth from '@react-native-firebase/auth'; // For backward compatibility where needed
const CELL_COUNT = 6; // Number of OTP digits
const RESEND = 90;
let interval: string | number | NodeJS.Timeout | undefined;
const appCheckForDefaultApp = firebase.appCheck();
export default function OTPScreen() {
  const router = useRouter();
  const { phoneNumber } = useLocalSearchParams();
  const [otpValue, setOtpValue] = useState('');
  const [resendButtonDisabledTime, setResendButtonDisabledTime] = useState(RESEND);

  const [confirm, setConfirm] = useState<any>(null);
  // Start the resend OTP timer
  const startResendOtpTimer = () => {
    interval = setInterval(() => {
      if (resendButtonDisabledTime <= 0) {
        clearInterval(interval);
      } else {
        setResendButtonDisabledTime(resendButtonDisabledTime - 1);
      }
    }, 1000);
  };
  // Initialize the timer on screen launch
  useEffect(() => {
    startResendOtpTimer();
    return () => clearInterval(interval);
  }, []);
  // Handle resend OTP button press
  const [isVerificationSent, setIsVerificationSent] = useState(false);

  const sendVerification = async () => {
    try {
      const tokenResult = await getToken(appCheckForDefaultApp); // Force refresh the App Check token

      if (tokenResult.token.length > 0) {
        console.log('AppCheck verification passed');

        if (isVerificationSent) return; // Prevent multiple sends
        setIsVerificationSent(true);

        try {
          const VNphoneNumber = '+84' + phoneNumber;

          const unsubscribe = getAuth().verifyPhoneNumber(VNphoneNumber).on(
            'state_changed',
            async (phoneAuthSnapshot) => {
              switch (phoneAuthSnapshot.state) {
                case auth.PhoneAuthState.CODE_SENT:
                  setConfirm(unsubscribe);
                  console.log('SMS code sent');
                  break;

                case auth.PhoneAuthState.ERROR:
                  Alert.alert('Lượt gửi mã OTP vượt giới hạn, vui lòng thử lại sau 4 tiếng');
                  console.error('PhoneAuth Error:', phoneAuthSnapshot.error);
                  break;

                case auth.PhoneAuthState.AUTO_VERIFY_TIMEOUT:
                  console.error('Auto verify timeout');
                  break;

                case auth.PhoneAuthState.AUTO_VERIFIED:
                  console.log('Auto verified');
                  handleSignUp();

                  if (!phoneAuthSnapshot.code) return;

                  const phoneCredential = PhoneAuthProvider.credential(
                    phoneAuthSnapshot.verificationId,
                    phoneAuthSnapshot.code
                  );

                  const response = await getAuth().signInWithCredential(phoneCredential);
                  console.log('Phone auth sign-in success:', response);
                  break;
              }
            }
          );
        } catch (error) {
          console.error('Failed to send verification:', error);
          setIsVerificationSent(false);
        }
      }
    } catch (error) {
      console.log('AppCheck verification failed:', error);
    }
  };

  useEffect(() => {
    console.log(phoneNumber);
    // Uncomment the following line to send verification on component mount
    sendVerification();
  }, []);

  const confirmCode = async () => {
    try {
      const userCredential = await confirm.confirm(otpValue);
      const user = userCredential.user;

      const userDocument = await firestore().collection(user.uid).get();

      if (!userDocument.empty) {
        Alert.alert('Số điện thoại đã được đăng kí!');
        router.back();
      } else {
        handleSignUp();
      }
    } catch (error) {
      Alert.alert('Mã OTP không hợp lệ');
      console.log(error);
    }
  };




  const handleResendOtp = () => {
    // Clear input field
    setOtpValue('');
    // Reset timer
    setResendButtonDisabledTime(RESEND);
    // Call your resend OTP API here
    console.log('Resend OTP requested');
  };


  const handleSignUp = async () => {
    try {
      Alert.alert('OTP successfully verified!');
      console.log('OTP successfully verified!');
      router.navigate('/auth/login')
    } catch (error: any) {
      Alert.alert(error.response.data.error)
      console.log(error.response.data.error);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setResendButtonDisabledTime(prevTime => (prevTime > 0 ? prevTime - 1 : 0));
    }, 1000);

    return () => {
      clearInterval(interval); // Clear the interval when the component unmounts
    };
  }, []); // Empty dependency array ensures this effect runs only once on mount

  const ref = useBlurOnFulfill({ value: otpValue, cellCount: CELL_COUNT });
  const [props, getCellOnLayoutHandler] = useClearByFocusCell({ value: otpValue, setValue: setOtpValue });

  return (
    <Box style={styles.container}>
      <Text style={styles.title}>Xác nhận OTP</Text>
      <Text style={styles.reminder}>Vui lòng đợi trong giây lát (khoảng 10s) để app tiến hành xử lí</Text>
      <Text style={styles.subTitle}>Chúng tôi sẽ gửi mã OTP đến: {phoneNumber}</Text>
      <CodeField
        ref={ref}
        {...props}
        value={otpValue}
        onChangeText={setOtpValue}
        cellCount={CELL_COUNT}
        rootStyle={styles.codeFieldRoot}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        renderCell={({ index, symbol, isFocused }) => (
          <Text
            key={index}
            style={[styles.cell, isFocused && styles.focusCell]}
            onLayout={getCellOnLayoutHandler(index)}
          >
            {symbol || (isFocused ? <Cursor /> : null)}
          </Text>
        )}
      />

      <TouchableOpacity style={styles.resendButton} onPress={handleResendOtp} disabled={resendButtonDisabledTime > 0}>
        <Text style={styles.resendButtonText}>
          {resendButtonDisabledTime > 0 ? `Gửi lại mã trong ${resendButtonDisabledTime}s` : 'GỦi lại mã OTP'}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={confirmCode} >
        <Text style={styles.buttonText}>
          Xác nhận mã
        </Text>
      </TouchableOpacity>
    </Box>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
  },
  title: {
    fontSize: 20,
    marginBottom: 20,
    textAlign: 'center',
    fontStyle: 'normal',
    // fontWeight: 'bold',
    fontFamily: 'sans-serif-medium',
  },
  subTitle: {
    paddingHorizontal: 90,
    lineHeight: 30,
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    // backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  reminder: {
    paddingHorizontal: 35,
    lineHeight: 20,
    fontSize: 16,
    marginBottom: 10,
    textAlign: 'center',
  },
  codeFieldRoot: {
    // marginTop: 20,
    // backgroundColor: 'rgba(0, 0, 0, 0.05)',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cell: {
    width: 40,
    height: 40,
    // lineHeight: 0,
    fontSize: 20,
    borderWidth: 2,
    textAlign: 'center',
    textAlignVertical: 'center',

    backgroundColor: '#f5f5f5',
    // textDecorationLine: 'line-through', 
    borderRadius: 10,
    margin: 8,
  },
  focusCell: {
    borderColor: 'gray',
  },
  button: {
    padding: 10,
    borderRadius: 10,
  },
  buttonText: {
    fontSize: 18,
    color: 'white',
    textAlign: 'center',
  },
  resendButton: {
    marginTop: 20,
  },
  resendButtonText: {
    padding: 10,
  },
});
//Screen nay la cho cai viec xac nhan otp cho login, hay la xac nhan gi do
//nhung ma screen nay chac uu tien cho phan auth thoi, reusable