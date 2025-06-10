import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, TextInput, ScrollView, Alert, Modal, Button, Image } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { ChevronLeft, MapPinPlus, Pencil, X, Camera, CalendarIcon } from 'lucide-react-native';
import { powersync } from '@/powersync/system';
import { Picker } from '@react-native-picker/picker';
import { DistributionPlanRecord, FlagsRecord, ProductionSchemeRecord, RegionRecord } from '@/powersync/Schema';
import axios from 'axios';
import * as Location from 'expo-location';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Crypto from 'expo-crypto';

// Define interfaces for your data types
interface Grower {
  id?: string;
  grower_id?: string;
  grower_number?: string;
  first_name?: string;
  surname?: string;
  fir?: string;
  b010_contract_scale?: string | number;
  production_scheme_id?: string;
  region_id?: string;
  distribution_plan?: string;
  grower_flags?: string;
  production_cycle_name?: string;
  [key: string]: any; // Allow any other properties
}




export default function NewGrowerModal() {
  const [firstName, setFirstName] = useState<string>('');
  const [surname, setSurname] = useState<string>('');
  const [nationalId, setNationalId] = useState<string>('');
  const [growerNumber, setGrowerNumber] = useState<string>('');
  const [middleName, setMiddleName] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [latitude, setLatitude] = useState<string>('');
  const [longitude, setLongitude] = useState<string>('');
  const [dateOfBirth, setDateOfBirth] = useState<string>('');
  const [gender, setGender] = useState<string>('');

  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [showCamera, setShowCamera] = useState<boolean>(false);
  const [activeCamera, setActiveCamera] = useState<'grower' | 'id' | null>(null);
  const [growerImage, setGrowerImage] = useState<string | null>(null);
  const [idImage, setIdImage] = useState<string | null>(null);
  const [growerImageEncoded, setGrowerImageEncoded] = useState<string | null>(null);
  const [idImageEncoded, setIdImageEncoded] = useState<string | null>(null);

  const cameraRef = useRef<CameraView>(null);
  const UUID = Crypto.randomUUID();

  // Add state for showing date picker
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    requestPermission();
  }, []);

  if (!permission) {
    // Camera permissions are still loading.
    return <View />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet.
    return (
      <View>
        <Text>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title="grant permission" />
      </View>
    );
  }

  function toggleCameraFacing() {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  }

  const takePicture = async () => {
    if (!showCamera || !cameraRef.current) return;

    try {
      const photo = await cameraRef.current.takePictureAsync({ base64: true });

if (photo?.base64) {
  const base64Data = photo.base64;
  
  // Proper base64 padding fix
  const fixBase64Padding = (str) => {
    // Remove any existing padding
    const cleanStr = str.replace(/=/g, "");
    // Calculate how much padding we need
    const missingPadding = cleanStr.length % 4;
    // Add the right amount of padding
    return missingPadding ? cleanStr + '='.repeat(4 - missingPadding) : cleanStr;
  };
  
  const paddedBase64 = fixBase64Padding(base64Data);
  
  if (activeCamera === 'grower') {
    setGrowerImage(`data:image/jpg;base64,${paddedBase64}`);
    setGrowerImageEncoded(paddedBase64);
  } else if (activeCamera === 'id') {
    setIdImage(`data:image/jpg;base64,${paddedBase64}`);
    setIdImageEncoded(paddedBase64);
  }
}
      
      setShowCamera(false);
      setActiveCamera(null);
    } catch (error) {
      console.error('Error taking picture:', error);
      Alert.alert('Error', 'Failed to capture image');
    }
  };

  const openCamera = (type: 'grower' | 'id') => {
    setActiveCamera(type);
    setShowCamera(true);
  };

  

  const createGrower = async () => {
    console.log('CREATING GROWER');


    
    try {
      await powersync.execute(`INSERT INTO odoo_gms_grower (id, grower_number, b010_first_name, b020_surname, b030_national_id, middle_name, b040_phone_number, latitude, longitude, state, date_of_birth, grower_image, grower_national_id_image, is_from_mobile, gender) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
        [UUID, growerNumber, firstName, surname, nationalId, middleName, phoneNumber, latitude, longitude, 'draft', dateOfBirth, growerImageEncoded, idImageEncoded, '1', gender]
      ).then(() => {
        console.log('Grower Created');
      }).catch((error) => {
        console.error('Error creating grower:', error);
        alert('Error creating grower');
      });
    } catch (error) {
      console.error('Error creating grower:', error);
      alert('Error creating grower');
    }


// try {
//   console.log('#############################iMAGE#############################')
//   // console.log(growerImage)
//   // console.log(idImage)

//   console.log('Date Of Birth', dateOfBirth)
//   console.log('Grower Image', growerImage)  
//   console.log('Id Image', idImage)
  
//   const options = {
//     method: 'POST',
//     url: 'http://45.84.138.225:8069/api/fo/create-grower',
//   headers: {
//     'Content-Type': 'application/json',
//     'User-Agent': 'insomnia/11.1.0',
//     'X-FO-TOKEN': 'e0925492-77cb-4a4e-a85d-fc0ea1312f4b'
//   },
//   data: {
//     b010_first_name: firstName,
//     b020_surname: surname,
//     b030_national_id: nationalId,
//     b040_phone_number: phoneNumber,
//     date_of_birth: dateOfBirth,
//     gender: gender,
//     grower_image: growerImageEncoded,
//     grower_national_id_image: idImageEncoded,
//     grower_number: growerNumber,
//     is_from_mobile: true,
//     longitude: longitude,
//     latitude: latitude,
//     state: 'draft'
//   }
// };

// axios.request(options).then(function (response) {
//   console.log(response.data);
// }).catch(function (error) {
//   console.error(error);
// })
// } catch (error) {
//   console.error(error);
// }


    alert('Grower Created')
    router.back();
  }

  const getLocation = async () => {
    console.log('Getting Location');
    const { status } = await Location.requestForegroundPermissionsAsync();
    console.log('Status', status);
    if (status !== 'granted') {
      Alert.alert('Permission not granted');
      return;
    } else if (status === 'granted') {
      const location = await Location.getCurrentPositionAsync();
      console.log('Location', location.coords.latitude, location.coords.longitude);
      setLatitude(location.coords.latitude.toString());
      setLongitude(location.coords.longitude.toString());
    } else {
      Alert.alert('Permission not granted');
      return;
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-[#65435C]">
      <View className="flex-1 mt-6 ">
        <View className="flex-1 bg-white rounded-t-3xl overflow-hidden ">
          <View className="flex-row justify-between items-center p-4 border-b border-gray-100 ">
            <TouchableOpacity className="flex-row items-center" onPress={() => router.back()}>
              <ChevronLeft size={28} color="#65435C" />
            <Text className="text-xl font-bold text-[#65435C]">Add New Grower</Text>
            </TouchableOpacity>
          </View>
        
          {showCamera ? (
            <View className="flex-1">
              <CameraView 
                ref={cameraRef}
                style={{flex: 1}} 
                facing={facing}
              >
                <View className="flex-1 justify-between p-4">
                  <View className="flex-row justify-between">
                    <TouchableOpacity 
                      className="bg-white p-2 rounded-full" 
                      onPress={toggleCameraFacing}
                    >
                      <Camera size={24} color="#65435C" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      className="bg-white p-2 rounded-full" 
                      onPress={() => setShowCamera(false)}
                    >
                      <X size={24} color="#65435C" />
                    </TouchableOpacity>
                  </View>
                  <View className="items-center mb-10">
                    <TouchableOpacity 
                      className="bg-white p-4 rounded-full" 
                      onPress={takePicture}
                    >
                      <View className="bg-[#65435C] h-12 w-12 rounded-full" />
                    </TouchableOpacity>
                  </View>
                </View>
              </CameraView>
            </View>
          ) : (
            <ScrollView className="flex-1 px-4 py-2 pt-4" keyboardShouldPersistTaps="handled">
              <View className="flex-1">
              <View className="flex-row items-center justify-between my-2">
                    <Text className="text-gray-600 w-1/3">Grower Number</Text>
                    <TextInput 
                        className="border border-gray-300 rounded-md p-2 w-2/3" 
                        value={growerNumber} 
                        // editable={false}
                        onChangeText={(text) => {
                            setGrowerNumber(text);
                        }}
                    />
                </View>
                <View className="flex-row items-center justify-between my-2">
                    <Text className="text-gray-600 w-1/3">First Name</Text>
                    <TextInput 
                        className="border border-gray-300 rounded-md p-2 w-2/3" 
                        value={firstName} 
                        // editable={false}
                        onChangeText={(text) => {
                            setFirstName(text);
                        }}
                    />
                </View>
                <View className="flex-row items-center justify-between my-2">
                    <Text className="text-gray-600 w-1/3">Middle Name</Text>
                    <TextInput 
                        className="border border-gray-300 rounded-md p-2 w-2/3" 
                        value={middleName} 
                        onChangeText={(text) => {
                            setMiddleName(text);
                        }}
                    />
                </View>

                <View className="flex-row items-center justify-between my-2">
                    <Text className="text-gray-600 w-1/3">Surname</Text>
                    <TextInput 
                        className="border border-gray-300 rounded-md p-2 w-2/3" 
                        value={surname} 
                        // editable={false}
                        onChangeText={(text) => {
                            setSurname(text);
                        }}
                    />
                </View>
                <View className="flex-row items-center justify-between my-2">
                    <Text className="text-gray-600 w-1/3">National ID</Text>
                    <TextInput 
                        className="border border-gray-300 rounded-md p-2 w-2/3" 
                        value={nationalId} 
                        onChangeText={(text) => {
                            setNationalId(text);
                        }}
                    />
                </View>
                <View className="flex-row items-center justify-between my-2">
                    <Text className="text-gray-600 w-1/3">Phone Number</Text>
                    <TextInput 
                        className="border border-gray-300 rounded-md p-2 w-2/3" 
                        value={phoneNumber} 
                        keyboardType="phone-pad"
                        onChangeText={(text) => {
                            setPhoneNumber(text);
                        }}
                    />
                </View>
                <View className="flex-row items-center justify-between my-2">
                    <Text className="text-gray-600 w-1/3">Latitude</Text>
                    <View className="flex-row items-center justify-between w-2/3">
                    <TextInput 
                        className="border border-gray-300 rounded-md p-2 w-[80%] mr-2" 
                        value={latitude} 
                        editable={false}
                        onChangeText={(text) => {
                            setLatitude(text);
                        }}
                    />
                    <TouchableOpacity onPress={() => {
                      getLocation();
                    }}
                    className="bg-gray-200 rounded-md p-2 w-[15%]"
                    >
                      <MapPinPlus size={20} color="#65435C" />
                    </TouchableOpacity>
                    </View>
                </View>
                <View className="flex-row items-center justify-between my-2">
                    <Text className="text-gray-600 w-1/3">Longitude</Text>
                    <TextInput 
                        className="border border-gray-300 rounded-md p-2 w-2/3" 
                        value={longitude} 
                        editable={false}
                        onChangeText={(text) => {
                            setLongitude(text);
                        }}
                    />
                </View>
                <View className="flex-row items-center justify-between my-2">
                    <Text className="text-gray-600 w-1/3">Date of Birth</Text>
                    <View className="border border-gray-300 rounded-md p-2 w-2/3 flex-row justify-between items-center">
                        <Text>{dateOfBirth || "Select date"}</Text>
                        <TouchableOpacity onPress={() => setShowDatePicker(true)}>
                            <CalendarIcon size={20} color="#65435C" />
                        </TouchableOpacity>
                    </View>
                </View>
                {showDatePicker && (
                  <DateTimePicker
                    value={dateOfBirth ? new Date(dateOfBirth) : new Date()}
                    mode="date"
                    display="default"
                    maximumDate={new Date()}
                    onChange={(event, selectedDate) => {
                      setShowDatePicker(false);
                      if (selectedDate && event.type !== 'dismissed') {
                        const formattedDate = selectedDate.toISOString().split('T')[0];
                        console.log('Formatted Date', formattedDate)
                        setDateOfBirth(formattedDate);
                      }
                    }}
                  />
                )}
                <View className="flex-row items-center justify-between my-2">
                    <Text className="text-gray-600 w-1/3">Gender</Text>
                    <View className="border border-gray-300 rounded-md w-2/3">
                    <Picker
                      selectedValue={gender}
                      onValueChange={(itemValue) => setGender(itemValue)}
                    >
                      <Picker.Item key="male" label="Male" value="male" />
                      <Picker.Item key="female" label="Female" value="female" />
                    </Picker>
                    </View>
                </View>
                <View className="flex-row items-center justify-between my-4">
                  <TouchableOpacity 
                    className="bg-white border border-gray-300 rounded-lg p-2 w-[48%] h-40"
                    onPress={() => openCamera('grower')}
                  >
                    {growerImage ? (
                      <Image 
                        source={{ uri: growerImage }} 
                        className="w-full h-full rounded-lg" 
                        resizeMode="cover"
                      />
                    ) : (
                      <View className="items-center justify-center h-full">
                        <Camera size={40} color="#65435C" />
                        <Text className="text-gray-600 mt-2 text-center">Grower Image</Text>
                        <Text className="text-gray-400 text-xs text-center mt-1">Tap to capture</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    className="bg-white border border-gray-300 rounded-lg p-2 w-[48%] h-40"
                    onPress={() => openCamera('id')}
                  >
                    {idImage ? (
                      <Image 
                        source={{ uri: idImage }} 
                        className="w-full h-full rounded-lg" 
                        resizeMode="cover"
                      />
                    ) : (
                      <View className="items-center justify-center h-full">
                        <Camera size={40} color="#65435C" />
                        <Text className="text-gray-600 mt-2 text-center">National ID Image</Text>
                        <Text className="text-gray-400 text-xs text-center mt-1">Tap to capture</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Save Button */}
                <View className="flex-row justify-evenly mt-8 mb-8 gap-2">
                <TouchableOpacity className="bg-gray-200 rounded-md w-[50%]" onPress={()=> router.back()}>
                    <Text className="text-[#65435C] text-xl text-center p-2">Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity className="bg-[#65435C] rounded-md w-[50%]" onPress={createGrower}>
                    <Text className="text-white text-xl text-center p-2">Save</Text>
                    </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}






























