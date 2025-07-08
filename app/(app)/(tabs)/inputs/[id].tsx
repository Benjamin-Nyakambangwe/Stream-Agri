import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, TextInput, ScrollView, Alert, Modal, Image, Button } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { CheckCheck, ChevronLeft, Pencil, X, Camera, MapPin } from 'lucide-react-native';
import { powersync } from '@/powersync/system';
import { Picker } from '@react-native-picker/picker';
import { DistributionPlanRecord, FlagsRecord, InputConfirmationsLinesRecord, ProductionSchemeRecord, RegionRecord } from '@/powersync/Schema';
import axios from 'axios';
import * as Location from 'expo-location';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
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
  const [inputConfirmationLineData, setInputConfirmationLineData] = useState<any>(null);

  // Camera and location states
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [showCamera, setShowCamera] = useState<boolean>(false);
  const [activeCamera, setActiveCamera] = useState<'grower_image' | 'grower_national_id' | null>(null);
  const [growerImage, setGrowerImage] = useState<string | null>(null);
  const [growerNationalIdImage, setGrowerNationalIdImage] = useState<string | null>(null);
  const [growerImageEncoded, setGrowerImageEncoded] = useState<string | null>(null);
  const [growerNationalIdImageEncoded, setGrowerNationalIdImageEncoded] = useState<string | null>(null);
  const [latitude, setLatitude] = useState<string>('');
  const [longitude, setLongitude] = useState<string>('');
  const [showConfirmationPopup, setShowConfirmationPopup] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const cameraRef = useRef<CameraView>(null);
  const UUID = Crypto.randomUUID();

  const [isEditing, setIsEditing] = useState(false);

  const getInputConfirmationLineData = async () => {
    console.log('Getting Input Confirmation Line Data for ID:', id);
    const query = `
      SELECT 
        icl.*,
        pcr.first_name,
        pcr.surname,
        pcr.grower_name,
        pcr.b010_contract_scale as contracted_hectares,
        pcr.production_cycle_name,
        ic.grv_number,
        ic.date_input,
        ic.state as confirmation_state,
        ip.name as input_pack_name,
        ip.code as input_pack_code
      FROM odoo_gms_input_confirmations_lines icl
      LEFT JOIN odoo_gms_production_cycle_registration pcr 
        ON icl.production_cycle_registration_id = pcr.id
      LEFT JOIN odoo_gms_input_confirmations ic 
        ON icl.input_confirmations_id = ic.id
      LEFT JOIN odoo_gms_input_pack ip 
        ON ic.input_pack_id = ip.id
      WHERE icl.id = ?
    `;
    
    try {
      const result = await powersync.get(query, [id]);
      console.log('Input Confirmation Line Data:', result);
      const inputConfirmationLineData = result as any;
      setInputConfirmationLineData(inputConfirmationLineData);
    } catch (error) {
      console.error('Error fetching input confirmation line data:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    }
  };

  useEffect(() => {
    requestPermission();
    getInputConfirmationLineData();
    getCurrentLocation();
  }, [id]);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required for confirmation.');
        return;
      }

      const location = await Location.getCurrentPositionAsync();
      setLatitude(location.coords.latitude.toString());
      setLongitude(location.coords.longitude.toString());
      console.log('Current location:', location.coords.latitude, location.coords.longitude);
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Could not get current location');
    }
  };

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 justify-center items-center bg-[#65435C]">
        <Text className="text-white mb-4">We need camera permission for delivery confirmation</Text>
        <Button onPress={requestPermission} title="Grant Permission" />
      </View>
    );
  }

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const takePicture = async () => {
    if (!showCamera || !cameraRef.current) return;

    try {
      const photo = await cameraRef.current.takePictureAsync({ base64: true });

      if (photo?.base64) {
        const base64Data = photo.base64;
        
        const fixBase64Padding = (str: string) => {
          const cleanStr = str.replace(/=/g, "");
          const missingPadding = cleanStr.length % 4;
          return missingPadding ? cleanStr + '='.repeat(4 - missingPadding) : cleanStr;
        };
        
        const paddedBase64 = fixBase64Padding(base64Data);
        
        if (activeCamera === 'grower_image') {
          setGrowerImage(`data:image/jpg;base64,${paddedBase64}`);
          setGrowerImageEncoded(paddedBase64);
        } else if (activeCamera === 'grower_national_id') {
          setGrowerNationalIdImage(`data:image/jpg;base64,${paddedBase64}`);
          setGrowerNationalIdImageEncoded(paddedBase64);
        }
      }
      
      setShowCamera(false);
      setActiveCamera(null);
    } catch (error) {
      console.error('Error taking picture:', error);
      Alert.alert('Error', 'Failed to capture image');
    }
  };

  const openCamera = (type: 'grower_image' | 'grower_national_id') => {
    setActiveCamera(type);
    setShowCamera(true);
  };

  const showConfirmationModal = () => {
    setShowConfirmationPopup(true);
  };

  const updateInputIssue = async () => {

    
    if (!growerImage || !growerNationalIdImage || !latitude || !longitude) {
      Alert.alert('Missing Images', 'Please capture both grower and national ID images before confirming.');
      return;
    }

    setIsSubmitting(true);
    try {
      console.log('UPDATE INPUT ISSUE with images and location');
      
      // Update the input confirmation line with new status and captured data
      await powersync.execute(`
        UPDATE odoo_gms_input_confirmations_lines 
        SET issue_state = ?, latitude = ?, longitude = ?, grower_image = ?, grower_national_id_image = ?
        WHERE id = ?
      `, ['received', latitude, longitude, growerImageEncoded, growerNationalIdImageEncoded, id]);

      Alert.alert('Success', 'Input delivery confirmed successfully!');
      setShowConfirmationPopup(false);
      router.back();
    } catch (error) {
      console.error('Error updating input issue:', error);
      Alert.alert('Error', 'Failed to confirm delivery. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitReturnInput = async () => {
    // Are you sure you want to return this input?

    Alert.alert('Are you sure you want to return this input?', 'This action cannot be undone.', [
      { text: 'No', style: 'cancel' },
      { text: 'Yes', onPress: async() => {
       setIsSubmitting(true);
        try {
          console.log('UPDATE INPUT ISSUE with images and location');
          
          // Update the input confirmation line with new status and captured data
          await powersync.execute(`
            UPDATE odoo_gms_input_confirmations_lines
            SET issue_state = ?, latitude = ?, longitude = ?
            WHERE id = ?
          `, ['returned', latitude, longitude, id]);

          // Alert.alert('Success', 'Input delivery returned successfully!');
          // setShowConfirmationPopup(false);
          router.back();
        } catch (error) {
          console.error('Error updating input issue:', error);
          // Alert.alert('Error', 'Failed to return delivery. Please try again.');
        } finally {
          setIsSubmitting(false);
        }
          } }
        ]);


    

    
  };
 

  return (
    <SafeAreaView className="flex-1 bg-[#65435C]">
      <View className="flex-1 mt-6 ">
        <View className="flex-1 bg-white rounded-t-3xl overflow-hidden ">
          <View className="flex-row justify-between items-center p-4 border-b border-gray-100 ">
            <TouchableOpacity className="flex-row items-center" onPress={() => router.back()}>
              <ChevronLeft size={28} color="#65435C" />
            <Text className="text-xl font-bold text-[#65435C]">Input Details</Text>
            </TouchableOpacity>
            </View>
            {inputConfirmationLineData?.issue_state === 'issued' && (
            <View className="flex-row justify-between items-center p-4 border-b border-gray-100 ">

            <TouchableOpacity 
              className="h-10 w-32 rounded-xl bg-[#1AD3BB] items-center justify-center flex-row gap-2"
              onPress={showConfirmationModal}
              >
                <Text className="text-white text-md">RECEIVE</Text>
              <CheckCheck size={20} color="white" className="w-10 h-10" />
            </TouchableOpacity>
            <TouchableOpacity 
              className="h-10 w-32 rounded-xl bg-[#65435C] items-center justify-center flex-row gap-2"
              onPress={submitReturnInput}
              >
                <Text className="text-white text-md">RETURN</Text>
              <X size={20} color="white" className="w-10 h-10" />
            </TouchableOpacity>
          </View>
          )}
            <ScrollView className="flex-1 px-4 py-6">
              <View className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                {/* Header with Grower Name */}
                <View className="flex-row items-center mb-6">
                  <View className="h-16 w-16 rounded-full bg-[#1AD3BB] items-center justify-center mr-4">
                    <Text className="text-white font-bold text-xl">
                      {inputConfirmationLineData?.first_name?.charAt(0)}{inputConfirmationLineData?.surname?.charAt(0)}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-2xl font-bold text-[#65435C]">
                      {inputConfirmationLineData?.first_name} {inputConfirmationLineData?.surname}
                    </Text>
                  </View>
                </View>

                {/* Hectares Cards */}
                <View className="flex-row justify-between mb-6">
                  <View className="flex-1 bg-[#65435C]/10 rounded-xl p-4 mr-2">
                    <Text className="text-[#65435C] text-sm font-medium mb-1">Contracted Ha</Text>
                    <Text className="text-[#65435C] text-2xl font-bold">
                      {inputConfirmationLineData?.contracted_hectares || '0'}
                    </Text>
                  </View>
                  <View className="flex-1 bg-[#65435C]/10 rounded-xl p-4 ml-2">
                    <Text className="text-[#65435C] text-sm font-medium mb-1">Confirmed Ha</Text>
                    <Text className="text-[#65435C] text-2xl font-bold">
                      {inputConfirmationLineData?.excel_hectares || '0'}
                    </Text>
                  </View>
                </View>

                {/* Details List */}
                <View className="space-y-4">
                  <View className="flex-row justify-between items-center py-3 border-b border-gray-100">
                    <Text className="text-gray-600 font-medium">Production Cycle</Text>
                    <Text className="text-[#65435C] font-semibold text-right flex-1 ml-4">
                      {inputConfirmationLineData?.production_cycle_name || 'N/A'}
                    </Text>
                  </View>
                  
                  <View className="flex-row justify-between items-center py-3 border-b border-gray-100">
                    <Text className="text-gray-600 font-medium">Input Pack</Text>
                    <Text className="text-[#65435C] font-semibold text-right flex-1 ml-4">
                      {inputConfirmationLineData?.input_pack_name || 'N/A'}
                    </Text>
                  </View>
                  
                  <View className="flex-row justify-between items-center py-3">
                    <Text className="text-gray-600 font-medium">Issue State</Text>
                    <View className={`px-3 py-1 rounded-lg ${
                      inputConfirmationLineData?.issue_state === 'issued' ? 'bg-blue-100' : 
                      inputConfirmationLineData?.issue_state === 'received' ? 'bg-yellow-100' : 'bg-green-100'
                    }`}>
                      <Text className={`text-sm font-medium ${
                        inputConfirmationLineData?.issue_state === 'issued' ? 'text-blue-800' : 
                        inputConfirmationLineData?.issue_state === 'received' ? 'text-yellow-800' : 'text-green-800'
                      }`}>
                        {inputConfirmationLineData?.issue_state.toUpperCase() || 'Unknown'}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </ScrollView>

            {/* Camera Modal */}
            <Modal visible={showCamera} animationType="slide">
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
                      <Text className="text-white mt-2 text-center">
                        {activeCamera === 'grower_image' ? 'Capture Grower Photo' : 'Capture National ID Photo'}
                      </Text>
                    </View>
                  </View>
                </CameraView>
              </View>
            </Modal>

            {/* Confirmation Popup Modal */}
            <Modal 
              visible={showConfirmationPopup} 
              animationType="slide" 
              presentationStyle="pageSheet"
            >
              <SafeAreaView className="flex-1 bg-[#65435C]">
                <View className="flex-1 mt-6">
                  <View className="flex-1 bg-white rounded-t-3xl overflow-hidden">
                    <View className="flex-row justify-between items-center p-4 border-b border-gray-100">
                      <Text className="text-xl font-bold text-[#65435C]">Confirm Delivery</Text>
                      <TouchableOpacity onPress={() => setShowConfirmationPopup(false)}>
                        <X size={24} color="#65435C" />
                      </TouchableOpacity>
                    </View>

                    <ScrollView className="flex-1 p-4">
                      {/* Location Display */}
                      <View className="bg-gray-50 rounded-xl p-4 mb-4">
                        <View className="flex-row items-center mb-2">
                          <MapPin size={20} color="#65435C" />
                          <Text className="text-[#65435C] font-semibold ml-2">Current Location</Text>
                        </View>
                        <Text className="text-gray-600 text-sm">
                          Latitude: {latitude || 'Getting location...'}
                        </Text>
                        <Text className="text-gray-600 text-sm">
                          Longitude: {longitude || 'Getting location...'}
                        </Text>
                      </View>

                      {/* Image Capture Section */}
                      <View className="flex-row justify-between mb-6">
                        <TouchableOpacity 
                          className="bg-white border border-gray-300 rounded-lg p-2 w-[48%] h-40"
                          onPress={() => openCamera('grower_image')}
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
                              <Text className="text-gray-600 mt-2 text-center">Grower Photo</Text>
                              <Text className="text-gray-400 text-xs text-center mt-1">Tap to capture</Text>
                            </View>
                          )}
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                          className="bg-white border border-gray-300 rounded-lg p-2 w-[48%] h-40"
                          onPress={() => openCamera('grower_national_id')}
                        >
                          {growerNationalIdImage ? (
                            <Image 
                              source={{ uri: growerNationalIdImage }} 
                              className="w-full h-full rounded-lg" 
                              resizeMode="cover"
                            />
                          ) : (
                            <View className="items-center justify-center h-full">
                              <Camera size={40} color="#65435C" />
                              <Text className="text-gray-600 mt-2 text-center">National ID Photo</Text>
                              <Text className="text-gray-400 text-xs text-center mt-1">Tap to capture</Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      </View>

                      {/* Grower Info Summary */}
                      <View className="bg-gray-50 rounded-xl p-4 mb-6">
                        <Text className="text-[#65435C] font-semibold mb-2">Delivery Summary</Text>
                        <Text className="text-gray-600">
                          Grower: {inputConfirmationLineData?.first_name} {inputConfirmationLineData?.surname}
                        </Text>
                        <Text className="text-gray-600">
                          Input Pack: {inputConfirmationLineData?.input_pack_name}
                        </Text>
                        <Text className="text-gray-600">
                          Hectares: {inputConfirmationLineData?.excel_hectares || '0'} Ha
                        </Text>
                      </View>

                      {/* Confirm Button */}
                      <TouchableOpacity 
                        className={`rounded-xl p-4 ${
                          growerImage && growerNationalIdImage && !isSubmitting 
                            ? 'bg-[#65435C]' 
                            : 'bg-gray-300'
                        }`}
                        onPress={updateInputIssue}
                        disabled={!growerImage || !growerNationalIdImage || isSubmitting}
                      >
                        <Text className={`text-center font-semibold text-lg ${
                          growerImage && growerNationalIdImage && !isSubmitting 
                            ? 'text-white' 
                            : 'text-gray-500'
                        }`}>
                          {isSubmitting ? 'Confirming...' : 'Confirm Delivery'}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity 
                        className="mt-3 p-4"
                        onPress={() => setShowConfirmationPopup(false)}
                      >
                        <Text className="text-center text-gray-500">Cancel</Text>
                      </TouchableOpacity>
                    </ScrollView>
                  </View>
                </View>
              </SafeAreaView>
            </Modal>
        </View>
      </View>
    </SafeAreaView>
  );
}




























