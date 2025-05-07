import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, TextInput } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { X } from 'lucide-react-native';
import { powersync } from '@/powersync/system';
import { Picker } from '@react-native-picker/picker';
import { DistributionPlanRecord, FlagsRecord, ProductionSchemeRecord, RegionRecord } from '@/powersync/Schema';

// Define interfaces for your data types
interface Grower {
  id?: string;
  grower_number?: string;
  grower_name?: string;
  contracted_ha?: string | number;
  production_scheme_id?: string;
  group_id?: string;
  distribution_plan_id?: string;
  grower_flags?: string;
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

  const [productionSchemes, setProductionSchemes] = useState<ProductionSchemeRecord[]>([]);
  const [groups, setGroups] = useState<RegionRecord[]>([]);
  const [distributionPlans, setDistributionPlans] = useState<DistributionPlan[]>([]);
  const [growerFlags, setGrowerFlags] = useState<FlagsRecord[]>([]);

  // Store string IDs instead of objects for selected values
  const [selectedProductionSchemeId, setSelectedProductionSchemeId] = useState<string>('');
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [selectedDistributionPlanId, setSelectedDistributionPlanId] = useState<string>('');
  const [selectedGrowerFlagId, setSelectedGrowerFlagId] = useState<string>('');

  useEffect(() => {
    powersync.get('SELECT * FROM odoo_gms_production_cycle_registration WHERE grower_id = ? AND production_cycle_name = ?', [grower_id, production_scheme])
      .then((result) => {
        setGrower(result as Grower);
        
        setSelectedGroupId(grower?.region_id?.toString() || '');
        setSelectedProductionSchemeId(grower?.production_scheme_id?.toString() || '');
        setSelectedDistributionPlanId(grower?.distribution_plan?.toString() || '');
        setSelectedGrowerFlagId(grower?.grower_flags?.toString() || '');
        // console.log('PCR GROWER', result);
      })
      .catch(ex => setError(ex.message));
    getProductionSchemes();
    getGroups();
    getDistributionPlans();
    getGrowerFlags();
    
  }, [id]);

  const getProductionSchemes = async () => {
    console.log('GET PRODUCTION SCHEMES');
    powersync.getAll('SELECT * FROM odoo_gms_production_scheme')
      .then(result => {
        setProductionSchemes(result as ProductionSchemeRecord[]);
        // console.log('Production Scheme', result);
        console.log('After setProductionSchemes');
      })
      .catch(ex => {
        console.error('Error fetching production schemes:', ex);
        setError(ex.message);
      });
  }

  useEffect(() => {
    if (grower) {
      setSelectedGroupId(grower.region_id?.toString() || '');
      setSelectedProductionSchemeId(grower.production_scheme_id?.toString() || '');
      setSelectedDistributionPlanId(grower.distribution_plan?.toString() || '');
      setSelectedGrowerFlagId(grower.grower_flags?.toString() || '');
    }
  }, [grower]);

  //Get Groups/Regions
  const getGroups = async () => {
    console.log('GET GROUPS');
    powersync.getAll('SELECT * FROM odoo_gms_region')
      .then(result => {
        // console.log('Groups', result);
        setGroups(result as RegionRecord[]);
      })
      .catch(ex => {
        console.error('Error fetching groups:', ex);
        setError(ex.message);
      });
  }

  //Get Distribution Plans
  const getDistributionPlans = async () => {
    console.log('GET DISTRIBUTION PLANS');
    powersync.getAll(`SELECT 
      dp.*,
      pc.name AS production_cycle_name,
      ps.name AS production_scheme_name,
      a.name AS activity_name
    FROM 
      odoo_gms_distribution_plan dp
    LEFT JOIN 
      odoo_gms_production_cycle pc ON dp.production_cycle_id = pc.id
    LEFT JOIN 
      odoo_gms_production_scheme ps ON dp.production_scheme_id = ps.id
    LEFT JOIN 
      odoo_gms_activity a ON dp.activity_id = a.id`)
      .then(result => {
        console.log('Distribution Plans', result);
        setDistributionPlans(result as DistributionPlan[]);
      })
      .catch(ex => {
        console.error('Error fetching distribution plans:', ex);
        setError(ex.message);
      });
  }

  //Get Grower Flags
  const getGrowerFlags = async () => {
    console.log('GET GROWER FLAGS');
    powersync.getAll('SELECT * FROM odoo_gms_flags')
      .then(result => {
        console.log('Grower Flags', result);  
        setGrowerFlags(result as FlagsRecord[]);
      })
      .catch(ex => {
        console.error('Error fetching grower flags:', ex);
        setError(ex.message);
      });
  }


    console.log('Group ID', grower?.region_id);
    console.log('Type of Group ID', typeof grower?.region_id);
        console.log('Production Scheme ID', grower?.production_scheme_id);
        console.log('Distribution Plan ID', grower?.distribution_plan);
        console.log('Grower Flag ID', grower?.grower_flags);
  

  return (
    <SafeAreaView className="flex-1 bg-[#65435C]">
      <View className="flex-1 mt-6 ">
        <View className="flex-1 bg-white rounded-t-3xl overflow-hidden ">
          <View className="flex-row justify-between items-center p-4 border-b border-gray-100 ">
            <Text className="text-xl font-bold text-[#65435C]">Grower Details</Text>
            <TouchableOpacity 
              className="h-10 w-10 rounded-full bg-gray-100 items-center justify-center"
              onPress={() => router.back()}
            >
              <X size={20} color="#65435C" />
            </TouchableOpacity>
          </View>
          
          <View className="flex-1 px-4 py-2 pt-28">
            <View className="flex-1">
                <View className="flex-row items-center justify-between my-2">
                    <Text className="text-gray-600 w-1/3">Grower Number</Text>
                    <TextInput 
                        className="border border-gray-300 rounded-md p-2 w-2/3" 
                        value={grower?.grower_number} 
                    />
                </View>
                <View className="flex-row items-center justify-between my-2">
                    <Text className="text-gray-600 w-1/3">Grower Name</Text>
                    <TextInput 
                        className="border border-gray-300 rounded-md p-2 w-2/3" 
                        value={grower?.grower_name} 
                    />
                </View>
                <View className="flex-row items-center justify-between my-2">
                    <Text className="text-gray-600 w-1/3">Contracted Ha</Text>
                    <TextInput 
                        className="border border-gray-300 rounded-md p-2 w-2/3" 
                        value={grower?.b010_contract_scale?.toString() || ''} 
                    />
                </View>
                
                {/* Production Scheme Picker */}
                <View className="flex-row items-center justify-between my-2">
                    <Text className="text-gray-600 w-1/3">Production Scheme</Text>
                    <View className="border border-gray-300 rounded-md w-2/3">
                        <Picker
                            selectedValue={selectedProductionSchemeId}
                            onValueChange={(itemValue) => {
                                setSelectedProductionSchemeId(itemValue);
                                console.log('Scheme', itemValue);
                            }}
                        >
                            <Picker.Item label="Select a scheme" value="" />
                            {productionSchemes.map((scheme) => (
                                <Picker.Item key={scheme.id} label={scheme.name || ''} value={scheme.id} />
                            ))}
                        </Picker>
                    </View>
                </View>
                
                {/* Group Picker */}
                <View className="flex-row items-center justify-between my-2">
                    <Text className="text-gray-600 w-1/3">Group</Text>
                    <View className="border border-gray-300 rounded-md w-2/3">
                        <Picker
                            selectedValue={selectedGroupId}
                            onValueChange={(itemValue) => {
                                setSelectedGroupId(itemValue);
                                console.log('Group', itemValue);
                            }}
                        >
                            <Picker.Item label="Select a group" value="" />
                            {groups.map((group) => (
                                <Picker.Item key={group.id} label={group.name || ''} value={group.id} />
                            ))}
                        </Picker>
                    </View>
                </View>
                
                {/* Distribution Plan Picker */}
                <View className="flex-row items-center justify-between my-2">
                    <Text className="text-gray-600 w-1/3">Distribution Plan</Text>
                    <View className="border border-gray-300 rounded-md w-2/3">
                        <Picker
                            selectedValue={selectedDistributionPlanId}
                            onValueChange={(itemValue) => {
                                setSelectedDistributionPlanId(itemValue);
                                console.log('Distribution Plan', itemValue);
                            }}
                        >
                            <Picker.Item label="Select a plan" value="" />
                            {distributionPlans.map((plan) => (
                                <Picker.Item key={plan.id} label={plan.production_cycle_name + ' - ' + plan.production_scheme_name + ' - ' + plan.activity_name} value={plan.id} />
                            ))}
                        </Picker>
                    </View>
                </View>
                
                {/* Grower Flag Picker */}
                <View className="flex-row items-center justify-between my-2">
                    <Text className="text-gray-600 w-1/3">Grower Flag</Text>
                    <View className="border border-gray-300 rounded-md w-2/3">
                        <Picker
                            selectedValue={selectedGrowerFlagId}
                            onValueChange={(itemValue) => {
                                setSelectedGrowerFlagId(itemValue);
                                console.log('Grower Flag', itemValue);
                            }}
                        >
                            <Picker.Item label="Select a flag" value="" />
                            {growerFlags.map((flag) => (
                                <Picker.Item key={flag.id} label={flag.name || ''} value={flag.id} />
                            ))}
                        </Picker>
                    </View>
                </View>

                {/* Save Button */}
                <View className="flex-row items-center justify-center my-8">
                    <TouchableOpacity className="w-full border border-gray-300 rounded-lg p-4 bg-[#65435C]">
                        <Text className="text-white">Save</Text>
                    </TouchableOpacity>
                </View>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}