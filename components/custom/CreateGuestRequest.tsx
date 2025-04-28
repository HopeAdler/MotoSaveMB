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
import { fetchStationOfAStaff } from "@/app/services/beAPI";
import AuthContext from "@/app/context/AuthContext";

type CreateGuestRequestForm = {
  receivername: string;
  receiverphone: string;
  pickuplocation: string;
  destination: string;
  totalprice: string;
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
  currentLoc: { latitude: 0, longitude: 0, heading: 0 },
}
export const CreateGuestRequest : React.FC<CreateGuestRequestProps> = (
  currentLoc
) => {
  const { token } = useContext(AuthContext);
  const [showModal, setShowModal] = useState(false);
  const [myStation, setMyStation] = useState<Station | null>();
  const [formData, setFormData] = useState<CreateGuestRequestForm>({
    receivername: '',
    receiverphone: '',
    pickuplocation: '',
    destination: '',
    totalprice: '',
    stationid: myStation?.stationid || '',
  });

  const fetchMyStationn = async () => {
    try {
      const result = await fetchStationOfAStaff(token);
      // Prevent unnecessary state updates
      setMyStation(result);
      setFormData((prev) => ({ ...prev, stationid: result?.stationid || '' }));
    } catch (error) {
      console.error("Error fetching station:", error);
    }
  };

  useEffect(() => {
    fetchMyStationn();
    console.log(myStation)
  }, []);
  const handleChange = (key: keyof CreateGuestRequestForm, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = () => {
    Alert.alert('Form submitted');
    setShowModal(false);
  };

  return (
    <View className="h-auto">
      <Button onPress={() => setShowModal(true)}>
        <ButtonText>Create Emergency rescue request for Guest</ButtonText>
      </Button>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} size="md">
        <ModalBackdrop />
        <ModalContent className="h-[80%] max-h-[80%]">
          <ModalHeader
            className="bg-background-100 border-b border-background-200 rounded-t-xl">
            <Heading size="md"
              className="text-center text-gray-800 font-semibold">
              Create Emergency rescue request for Guest
            </Heading>
            <ModalCloseButton>
              <Icon
                as={CloseIcon}
                size="md"
                className="stroke-background-400 group-[:hover]/modal-close-button:stroke-background-700 group-[:active]/modal-close-button:stroke-background-900 group-[:focus-visible]/modal-close-button:stroke-background-900"
              />
            </ModalCloseButton>
          </ModalHeader>

          <ModalBody className="p-10">
            <View className="space-y-3">
              {(Object.keys(formData) as (keyof CreateGuestRequestForm)[]).map((key) => (
                <TextInput
                  key={key}
                  className="bg-white border border-gray-300 rounded-xl p-4 mb-3 text-base"
                  placeholder={key}
                  keyboardType={
                    ["pickuplong", "pickuplat", "deslng", "deslat", "totalprice"].includes(key)
                      ? "numeric"
                      : "default"
                  }
                  value={formData[key]}
                  onChangeText={(text) => handleChange(key, text)}
                />
              ))}
            </View>
          </ModalBody>

          <ModalFooter className="flex flex-row justify-between items-center p-4 bg-gray-100 rounded-b-xl">
            <Button variant="outline" action="secondary" onPress={() => setShowModal(false)}>
              <ButtonText>Cancel</ButtonText>
            </Button>
            <Button onPress={handleSubmit}>
              <ButtonText>Submit</ButtonText>
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </View>
  );
};

