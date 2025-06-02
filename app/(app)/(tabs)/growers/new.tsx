import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, TextInput, ScrollView, Alert, Modal } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { ChevronLeft, MapPinPlus, Pencil, X } from 'lucide-react-native';
import { powersync } from '@/powersync/system';
import { Picker } from '@react-native-picker/picker';
import { DistributionPlanRecord, FlagsRecord, ProductionSchemeRecord, RegionRecord } from '@/powersync/Schema';
import axios from 'axios';
import * as Location from 'expo-location';


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

interface DistributionPlan {
  id: string;
  production_scheme_name: string;
  production_cycle_name: string;
  activity_name: string;
}



export default function GrowerModal() {
  const { id, grower_id, production_scheme } = useLocalSearchParams();
  const [grower, setGrower] = useState<Grower | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [firstName, setFirstName] = useState<string>('');
  const [surname, setSurname] = useState<string>('');
  const [nationalId, setNationalId] = useState<string>('');
  const [growerNumber, setGrowerNumber] = useState<string>('');
  const [middleName, setMiddleName] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [latitude, setLatitude] = useState<string>('');
  const [longitude, setLongitude] = useState<string>('');
  const [state, setState] = useState<string>('');
  const [dateOfBirth, setDateOfBirth] = useState<string>('');


  const createGrower = async () => {
    console.log('CREATING GROWER');
    // console.log('Grower', grower);
    try {
      await powersync.execute(`INSERT INTO odoo_gms_grower (grower_number, b010_first_name, b020_surname, b030_middle_name, b040_phone_number, b050_latitude, b060_longitude, b070_state, b080_date_of_birth) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
        [growerNumber, firstName, surname, middleName, phoneNumber, latitude, longitude, state, dateOfBirth]
      ).then(() => {
        console.log('Grower Created');
        // alert('ActualGrower Updated');
        // router.back();
      }).catch((error) => {
        console.error('Error creating grower:', error);
        alert('Error creating grower');
      });
    } catch (error) {
      console.error('Error creating grower:', error);
      alert('Error creating grower');
    }

    alert('Grower Created')
    router.back();

    

    // const options = {
    //   method: 'PATCH',
    //   url: `http://45.84.138.225:8069/api/update/${grower?.id}`,
    //   headers: {
    //     cookie: 'session_id=sZqyvCm3Paya3UgTLe1R5FY9EAyEA6-jmNbzuT3Egt20Yphpl8UJHxqzd0qjYUhzWnG7tMuLVluXaUYFfhPT; frontend_lang=en_GB',
    //     'Content-Type': 'application/json',
    //     'User-Agent': 'insomnia/11.0.2',
    //     'X-FO-TOKEN': 'cfa0c7b5-9c87-4d8c-87c1-f8394fe1c94a'
    //   },
    //   data: {jsonrpc: '2.0', method: 'call', params: {
    //     timb_status: false,
    //     "distribution_plan": parseInt(selectedDistributionPlanId),
    //     "production_scheme_id": parseInt(selectedProductionSchemeId),
    //     "region_id": parseInt(selectedGroupId),
    //     "grower_flags": parseInt(selectedGrowerFlagId),
    //     ...(firstName !== grower?.first_name && firstName !== '' && { first_name: firstName }),
    //     ...(surname !== grower?.surname && surname !== '' && { surname: surname }),
    //     ...(contractedHa !== grower?.b010_contract_scale?.toString() && contractedHa !== '' && { b010_contract_scale: contractedHa }),
    //     ...(growerNumber !== grower?.grower_number?.toString() && growerNumber !== '' && { grower_number: growerNumber }),
    //     // ...(selectedProductionSchemeId !== grower?.production_scheme_id?.toString() && selectedProductionSchemeId !== '' && { production_scheme_id: selectedProductionSchemeId }),
    //     // ...(selectedGroupId !== grower?.region_id?.toString() && selectedGroupId !== '' && { region_id: selectedGroupId }), // Assuming API expects region_id based on grower object
    //     // ...(selectedDistributionPlanId !== grower?.distribution_plan?.toString() && selectedDistributionPlanId !== '' && { distribution_plan: parseInt(selectedDistributionPlanId) }),
    //     // ...(selectedGrowerFlagId !== grower?.grower_flags?.toString() && selectedGrowerFlagId !== '' && { grower_flags: parseInt(selectedGrowerFlagId) }),
    //   }, id: null}
    // };


    // console.log('Options', options);
    // axios.request(options).then(function (response) {
    //   console.log(response.data);
    //   console.log('Grower Updated');
    //   console.log(response);
    //   alert('Grower Updated');
    //   router.back();
    // }).catch(function (error) {
    //   console.error('Error', error);
    // });
  }

  const getLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
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
        
          
          <ScrollView className="flex-1 px-4 py-2 pt-4"
          keyboardShouldPersistTaps="handled"
          >
            <View className="flex-1">
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
                        onChangeText={(text) => {
                            setPhoneNumber(text);
                        }}
                    />
                </View>
                <View className="flex-row items-center justify-between my-2">
                    <Text className="text-gray-600 w-1/3">Latitude</Text>
                    <View className="flex-row items-center justify-between w-2/3">
                    <TextInput 
                        className="border border-gray-300 rounded-md p-2 w-2/3" 
                        value={latitude} 
                        onChangeText={(text) => {
                            setLatitude(text);
                        }}
                    />
                    <TouchableOpacity onPress={() => {
                      getLocation();
                    }}>
                      <MapPinPlus size={20} color="#65435C" />
                    </TouchableOpacity>
                    </View>
                </View>
                <View className="flex-row items-center justify-between my-2">
                    <Text className="text-gray-600 w-1/3">Longitude</Text>
                    <TextInput 
                        className="border border-gray-300 rounded-md p-2 w-2/3" 
                        value={longitude} 
                        onChangeText={(text) => {
                            setLongitude(text);
                        }}
                    />
                </View>
                <View className="flex-row items-center justify-between my-2">
                    <Text className="text-gray-600 w-1/3">State</Text>
                    <TextInput 
                        className="border border-gray-300 rounded-md p-2 w-2/3" 
                        value={state} 
                        onChangeText={(text) => {
                            setState(text);
                        }}
                    />
                </View>
                <View className="flex-row items-center justify-between my-2">
                    <Text className="text-gray-600 w-1/3">Date of Birth</Text>
                    <TextInput 
                        className="border border-gray-300 rounded-md p-2 w-2/3" 
                        value={dateOfBirth} 
                        onChangeText={(text) => {
                            setDateOfBirth(text);
                        }}
                    />
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
        
        </View>
      </View>
    </SafeAreaView>
  );
}






























