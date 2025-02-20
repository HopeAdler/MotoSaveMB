import React, { useEffect, useState } from "react";
import {
  NativeModules,
  NativeEventEmitter,
  DeviceEventEmitter,
} from "react-native";
import CryptoJS from "crypto-js";
import { router } from "expo-router";

const { PayZaloBridge } = NativeModules;

export interface PayZaloEventData {
  returnCode: string;
  transactionId?: string;
}

interface RefundParams {
  app_id: number;
  m_refund_id: string;
  zp_trans_id: string | null;
  amount: number;
  timestamp: number;
  description: string;
  mac?: string; // Optional initially, added later
}

// const payZaloBridgeEmitter = new NativeEventEmitter(PayZaloBridge);

// payZaloBridgeEmitter.addListener('EventPayZalo', (data: PayZaloEventData) => {
//   if (data.returnCode === '1') {
//     console.log(data)
//     alert('Payment successful!');
//     router.navigate('/user/customer/rescueMap')
//   } else {
//     alert('Payment failed! Return code: ' + data.returnCode);
//     router.navigate('/user/customer/rescueMap')
//   }
// });

function getCurrentDateYYMMDD(): string {
  return new Date().toISOString().slice(2, 10).split("-").join("");
}

async function createOrder(money: number | null): Promise<string | null> {
  const apptransid = `${getCurrentDateYYMMDD()}_${new Date().getTime()}`;
  const appid = 2553;
  const amount = money;
  const appuser = "ZaloPayDemo";
  const apptime = new Date().getTime();
  const embeddata = "{}";
  const item = "[]";
  const description = `Merchant description for order #${apptransid}`;
  const hmacInput = `${appid}|${apptransid}|${appuser}|${amount}|${apptime}|${embeddata}|${item}`;
  const mac = CryptoJS.HmacSHA256(
    hmacInput,
    "PcY4iZIKFCIdgZvA6ueMcMHHUbRLYjPL"
  ).toString();

  const order = {
    app_id: appid,
    app_user: appuser,
    app_time: apptime,
    amount,
    app_trans_id: apptransid,
    embed_data: embeddata,
    item,
    description,
    mac,
  };

  console.log("Creating order:", order);

  const formBody = Object.keys(order)
    .map(
      (key) =>
        encodeURIComponent(key) + "=" + encodeURIComponent((order as any)[key])
    )
    .join("&");

  try {
    const response = await fetch("https://sb-openapi.zalopay.vn/v2/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      },
      body: formBody,
    });

    const resJson = await response.json();
    console.log("Order Response:", resJson);
    return resJson.zp_trans_token || null;
  } catch (error) {
    console.error("Error creating order:", error);
    return null;
  }
}

async function processPayment(money: number | null) {
  console.log("Processing payment...");
  const token = await createOrder(money);
  if (token) {
    console.log("Initiating ZaloPay payment...");
    NativeModules.PayZaloBridge.payOrder(token);
  } else {
    alert("Failed to create order. Please try again.");
  }
}

function generateRandomString(length: number) {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters[randomIndex];
  }
  return result;
}

async function refundTransaction(
  zpTransId: string,
  description: string,
  money: number
) {
  const appid = 2553; // Application ID
  const key1 = "PcY4iZIKFCIdgZvA6ueMcMHHUbRLYjPL"; // HMAC Key
  const refundUrl = "https://sb-openapi.zalopay.vn/v2/refund";

  // Generate a unique refund ID and timestamp
  const timestamp = new Date().getTime();
  // const randomPart = Math.floor(111 + Math.random() * 888); // Random number between 111 and 999
  const randomPart = generateRandomString(10); // Random number between 111 and 999
  const mRefundId = `${getCurrentDateYYMMDD()}_${appid}_${randomPart}`;
  // Prepare parameters
  const params: RefundParams = {
    app_id: appid,
    m_refund_id: mRefundId,
    zp_trans_id: zpTransId, //transactionId from createOrder()
    amount: money,
    timestamp: timestamp,
    description: description || "Refund transaction",
  };

  // Compute HMAC and add it to params
  const hmacInput = `${appid}|${zpTransId}|${money}|${description || ""}|${timestamp}`;
  params.mac = CryptoJS.HmacSHA256(hmacInput, key1).toString();

  console.log(params);
  // Serialize form data
  const formBody = (Object.keys(params) as Array<keyof RefundParams>)
    .map(
      (key) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(params[key] ?? "")}`
    )
    .join("&");

  // Make POST request
  try {
    const response = await fetch(refundUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      },
      body: formBody,
    });

    if (!response.ok) {
      throw new Error(`Refund failed: ${response.statusText}`);
    }

    const result = await response.json();
    console.log("Refund Result:", result);
    return result;
  } catch (error) {
    console.error("Error processing refund:", error);
    throw error;
  }
}

export { createOrder, processPayment, refundTransaction };
