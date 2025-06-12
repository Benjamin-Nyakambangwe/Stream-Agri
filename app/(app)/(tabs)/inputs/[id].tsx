import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, TextInput, ScrollView, Alert, Modal } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { CheckCheck, ChevronLeft, Pencil, X } from 'lucide-react-native';
import { powersync } from '@/powersync/system';
import { Picker } from '@react-native-picker/picker';
import { DistributionPlanRecord, FlagsRecord, InputConfirmationsLinesRecord, ProductionSchemeRecord, RegionRecord } from '@/powersync/Schema';
import axios from 'axios';


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
    getInputConfirmationLineData();
  }, [id]);


  const updateInputIssue = async () => {
    console.log('UPDATE INPUT ISSUE');
    // console.log('Grower', grower)

    // try {
    //   await powersync.execute(`UPDATE odoo_gms_grower SET 
    //     grower_number = ?, b010_first_name = ?, b020_surname = ? 
    //     WHERE id = ? `, 
    //     [growerNumber, firstName, surname, 
    //       grower_id]
    //   ).then(() => {
    //     console.log('Actual Grower Updated');
    //     // alert('ActualGrower Updated');
    //     // router.back();
    //   }).catch((error) => {
    //     console.error('Error updating actual grower:', error);
    //     alert('Error updating actual grower');
    //   });
    // } catch (error) {
    //   console.error('Error updating actual grower:', error);
    //   alert('Error updating actual grower');
    // }

    alert('All Updated')
    router.back();
  }
 

  return (
    <SafeAreaView className="flex-1 bg-[#65435C]">
      <View className="flex-1 mt-6 ">
        <View className="flex-1 bg-white rounded-t-3xl overflow-hidden ">
          <View className="flex-row justify-between items-center p-4 border-b border-gray-100 ">
            <TouchableOpacity className="flex-row items-center" onPress={() => router.back()}>
              <ChevronLeft size={28} color="#65435C" />
            <Text className="text-xl font-bold text-[#65435C]">Input Details</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              className="h-10 w-32 rounded-xl bg-[#65435C] items-center justify-center flex-row gap-2"
              >
                <Text className="text-white text-sm">Confirm</Text>
              <CheckCheck size={20} color="white" className="w-10 h-10" />
            </TouchableOpacity>
          </View>
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
        </View>
      </View>
    </SafeAreaView>
  );
}




























