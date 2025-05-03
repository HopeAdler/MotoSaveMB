import React, { useContext, useEffect, useState } from "react";
import {
  Modal,
  ModalBackdrop,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
} from "@/components/ui/modal";
import { Button, ButtonText } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Icon, CloseIcon } from "@/components/ui/icon";
import { Alert, Text, TextInput, View } from "react-native";
import StationSelect from "./StationSelect";
import {
  calculateFare,
  createEmergencyRequestForGuest,
  createPayment,
  fetchStationOfAStaff,
} from "@/app/services/beAPI";
import AuthContext from "@/app/context/AuthContext";
import { getDirections, getReverseGeocode } from "@/app/services/goongAPI";
import { formatMoney } from "@/app/utils/utils";

type CreateGuestRequestForm = {
  receivername: string;
  receiverphone: string;
  pickuplong: number;
  pickuplat: number;
  deslng: number | any;
  deslat: number | any;
  pickuplocation: string;
  destination: string | any;
  totalprice: number;
  stationid: string;
};

interface Station {
  stationid: string;
  stationname: string;
  stationaddress: string;
  stationlong: number;
  stationlat: number;
}

interface CreateGuestRequestProps {
  currentLoc: { latitude: number; longitude: number; heading: number };
}
export const CreateGuestRequest: React.FC<CreateGuestRequestProps> = ({
  currentLoc,
}) => {
  const { token } = useContext(AuthContext);
  const [originQuery, setOriginQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [myStation, setMyStation] = useState<Station | null>();
  const [directionsInfo, setDirectionsInfo] = useState<any>(null);
  const [fare, setFare] = useState<number>(0);
  const [fareLoading, setFareLoading] = useState<boolean>(false);
  const [formErrors, setFormErrors] = useState<{
    receivername?: string;
    receiverphone?: string;
  }>({});
  const [formData, setFormData] = useState<CreateGuestRequestForm>({
    receivername: "",
    receiverphone: "",
    pickuplong: currentLoc.longitude,
    pickuplat: currentLoc.latitude,
    deslng: 0,
    deslat: 0,
    pickuplocation: "",
    destination: "",
    totalprice: 0,
    stationid: "",
  });

  useEffect(() => {
    if (currentLoc.latitude && currentLoc.longitude) {
      getReverseGeocode(currentLoc.latitude, currentLoc.longitude).then(
        (address) => {
          if (address) {
            setOriginQuery(address);
            setFormData((prev) => ({ ...prev, pickuplocation: address }));
          }
        }
      );
    }
  }, [showModal]);

  useEffect(() => {
    fetchStationOfAStaff(token).then((station) => {
      if (station) {
        setMyStation(station);
        setFormData((prev) => ({
          ...prev,
          stationid: station.stationid,
          deslng: station.stationlong,
          deslat: station.stationlat,
          destination: station.stationname,
        }));
      }
    });
  }, []);
  useEffect(() => {
    const originStr = `${currentLoc.latitude},${currentLoc.longitude}`;
    const destinationStr = `${myStation?.stationlat},${myStation?.stationlong}`;
    getDirections(originStr, destinationStr)
      .then((data) => {
        if (data.routes && data.routes.length > 0) {
          if (data.routes[0].legs && data.routes[0].legs.length > 0) {
            setDirectionsInfo(data.routes[0].legs[0]);
          }
        } else {
          console.log("No routes found:", data);
        }
      })
      .catch((error) => console.error("Error fetching directions:", error));
  }, [showModal]);
  useEffect(() => {
    if (directionsInfo) {
      const distanceValue = directionsInfo.distance?.value || 0;
      setFareLoading(true);
      calculateFare(distanceValue, 1, 0)
        .then((money) => {
          setFare(money);
          setFormData((prev) => ({
            ...prev,
            totalprice: money,
          }));
          setFareLoading(false);
        })
        .catch((error) => {
          console.error("Error calculating fare:", error);
          setFareLoading(false);
        });
    }
  }, [directionsInfo]);

  const handleSubmit = async () => {
    const errors: { receivername?: string; receiverphone?: string } = {};
    const name = formData.receivername.trim();
    const phone = formData.receiverphone.trim();

    if (!name) {
      errors.receivername = "Customer name is required.";
    }

    const phoneRegex = /^[0-9]{10}$/;
    if (!phone) {
      errors.receiverphone = "Customer phone is required.";
    } else if (!phoneRegex.test(phone)) {
      errors.receiverphone = "Phone number must be exactly 10 digits.";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({}); // Clear previous errors
    try {
      const result = await createEmergencyRequestForGuest(formData, token);
      console.log(result);
      const reqId = result.requestdetailid;
      const payment = await createPayment(
        {
          requestdetailid: reqId,
          totalamount: fare,
          paymentmethod: "Tiền mặt",
          paymentstatus: "Unpaid",
        },
        token
      );
      console.log(payment);
      Alert.alert("Success", "Emergency rescue request submitted!");
      setShowModal(false);
    } catch (error) {
      console.error("Submission failed", error);
      Alert.alert("Error", "Failed to submit request");
    }
  };
  
  const handleCancel = () => {
    setFormErrors({}); // Clear previous errors
    setShowModal(false)
  }

  return (
    <View className="p-4">
      <Button onPress={() => setShowModal(true)} className="bg-blue-500">
        <ButtonText>Create Guest Rescue Request</ButtonText>
      </Button>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} size="md">
        <ModalBackdrop />
        <ModalContent className="rounded-2xl bg-white max-h-[80%]">
          <ModalHeader className="border-b border-gray-200 px-4 py-3">
            <Heading
              size="md"
              className="text-center text-gray-800 font-semibold"
            >
              Create Rescue Request
            </Heading>
            <ModalCloseButton>
              <Icon as={CloseIcon} size="md" className="text-red-600" />
            </ModalCloseButton>
          </ModalHeader>

          <ModalBody className="px-4 py-3 space-y-4">
            <View className="mb-3">
              <Text className="text-sm text-gray-700 mb-1">Customer Name</Text>
              <TextInput
                // className="border border-gray-300 rounded-lg px-3 py-2 text-base"
                placeholder="Enter name"
                value={formData.receivername}
                onChangeText={(text) => {
                  setFormData({ ...formData, receivername: text });
                  setFormErrors((prev) => ({
                    ...prev,
                    receivername: undefined,
                  }));
                }}
                className={`border ${formErrors.receivername ? "border-red-500" : "border-gray-300"} rounded px-3 py-2`}
              />
              {formErrors.receivername && (
                <Text className="text-red-500 text-sm">
                  {formErrors.receivername}
                </Text>
              )}
            </View>

            <View className="mb-3">
              <Text className="text-sm text-gray-700 mb-1">Customer Phone</Text>
              <TextInput
                // className="border border-gray-300 rounded-lg px-3 py-2 text-base"
                placeholder="Enter phone"
                keyboardType="phone-pad"
                value={formData.receiverphone}
                onChangeText={(text) => {
                  setFormData({ ...formData, receiverphone: text });
                  setFormErrors((prev) => ({
                    ...prev,
                    receiverphone: undefined,
                  }));
                }}
                className={`border ${formErrors.receiverphone ? "border-red-500" : "border-gray-300"} rounded px-3 py-2`}
              />
              {formErrors.receiverphone && (
                <Text className="text-red-500 text-sm">
                  {formErrors.receiverphone}
                </Text>
              )}
            </View>

            <View className="mb-3">
              <Text className="text-sm text-gray-700 mb-1">
                Pickup Location
              </Text>
              <Text className="text-base text-gray-900">
                {formData.pickuplocation}
              </Text>
            </View>
            <View className="mb-3">
              <Text className="text-sm text-gray-700 mb-1">Destination</Text>
              <Text className="text-base text-gray-900">
                {formData.destination}
              </Text>
            </View>
            <View>
              <Text className="text-sm text-gray-700 mb-1">Price</Text>
              <Text className="text-black-800 text-base font-bold">
                {formatMoney(formData.totalprice || 0)}
              </Text>
            </View>
          </ModalBody>

          <ModalFooter className="border-gray-200 px-4 py-3 flex-row justify-between">
            <Button
              variant="outline"
              className="flex-1 mx-2 border-red-500"
              onPress={handleCancel}
            >
              <ButtonText className="text-red-500">Cancel</ButtonText>
            </Button>
            <Button onPress={handleSubmit} className="flex-1 mx-2 bg-blue-500">
              <ButtonText>Submit</ButtonText>
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </View>
  );
};
