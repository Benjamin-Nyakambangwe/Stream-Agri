import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, TextInput, ScrollView, Alert, Modal } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { ChevronLeft, Pencil, X } from 'lucide-react-native';
import { powersync } from '@/powersync/system';
import { Picker } from '@react-native-picker/picker';
import { DistributionPlanRecord, FlagsRecord, ProductionSchemeRecord, RegionRecord } from '@/powersync/Schema';
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
  const [firstName, setFirstName] = useState<string>('');
  const [surname, setSurname] = useState<string>('');
  const [contractedHa, setContractedHa] = useState<string>('');
  const [growerNumber, setGrowerNumber] = useState<string>('');
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [password, setPassword] = useState('');

  const [productionSchemes, setProductionSchemes] = useState<ProductionSchemeRecord[]>([]);
  const [groups, setGroups] = useState<RegionRecord[]>([]);
  const [distributionPlans, setDistributionPlans] = useState<DistributionPlan[]>([]);
  const [growerFlags, setGrowerFlags] = useState<FlagsRecord[]>([]);

  // Store string IDs instead of objects for selected values
  const [selectedProductionSchemeId, setSelectedProductionSchemeId] = useState<string>('');
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [selectedDistributionPlanId, setSelectedDistributionPlanId] = useState<string>('');
  const [selectedGrowerFlagId, setSelectedGrowerFlagId] = useState<string>('');

  const [displayRegionName, setDisplayRegionName] = useState<string>('');
  const [displayProductionSchemeName, setDisplayProductionSchemeName] = useState<string>('');
  const [displayDistributionPlanName, setDisplayDistributionPlanName] = useState<string>('');
  const [displayGrowerFlagName, setDisplayGrowerFlagName] = useState<string>('');


  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    powersync.get(`
      SELECT 
        pcr.*,
        g.grower_number 
      FROM 
        odoo_gms_production_cycle_registration pcr
      LEFT JOIN 
        odoo_gms_grower g ON pcr.grower_id = g.id
      WHERE 
        pcr.grower_id = ? AND pcr.production_cycle_name = ?`, 
      [grower_id, production_scheme])
      .then((result) => {
        const growerData = result as Grower;
        setGrower(growerData); 
        setSelectedGroupId(growerData?.region_id?.toString() || '');
        setSelectedProductionSchemeId(growerData?.production_scheme_id?.toString() || '');
        setSelectedDistributionPlanId(growerData?.distribution_plan?.toString() || '');
        setSelectedGrowerFlagId(growerData?.grower_flags?.toString() || '');
        setGrowerNumber(growerData?.grower_number || '');
        console.log('PCR GROWER with joined data:', growerData);
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

      setContractedHa(grower.b010_contract_scale?.toString() || '');
      setFirstName(grower.first_name || '');
      setSurname(grower.surname || '');
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

  const updateGrower = async () => {
    console.log('UPDATE GROWER');
    // console.log('Grower', grower);

    try {
      await powersync.execute(`UPDATE odoo_gms_production_cycle_registration SET 
        first_name = ?, surname = ?, b010_contract_scale = ?, distribution_plan = ?, 
        production_scheme_id = ?, region_id = ?
        WHERE grower_id = ? AND production_cycle_name = ?`, 
        [firstName, surname, contractedHa, 
          parseInt(selectedDistributionPlanId), parseInt(selectedProductionSchemeId), 
          parseInt(selectedGroupId),
          grower_id, production_scheme]
      ).then(() => {
        console.log('Grower Updated');
        // alert('Grower Updated');
        // router.back();
      }).catch((error) => {
        console.error('Error updating grower:', error);
        alert('Error updating grower');
      });
    } catch (error) {
      console.error('Error updating grower:', error);
      alert('Error updating grower');
    }

    try {
      await powersync.execute(`UPDATE odoo_gms_grower SET 
        grower_number = ?, b010_first_name = ?, b020_surname = ? 
        WHERE id = ? `, 
        [growerNumber, firstName, surname, 
          grower_id]
      ).then(() => {
        console.log('Actual Grower Updated');
        // alert('ActualGrower Updated');
        // router.back();
      }).catch((error) => {
        console.error('Error updating actual grower:', error);
        alert('Error updating actual grower');
      });
    } catch (error) {
      console.error('Error updating actual grower:', error);
      alert('Error updating actual grower');
    }

    alert('All Updated')
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

  const handlePasswordInput = (enteredPassword: string) => {
    if (enteredPassword === '12345678') {
      setIsEditing(true);
      setPasswordModalVisible(false);
      setPassword('');
    } else {
      Alert.alert('Error', 'Incorrect password');
    }
  };

  // GET ALL THE NAMES FOR THE SELECTED VALUES
  useEffect(() => {
    if (grower?.region_id) {
      powersync.get('SELECT name FROM odoo_gms_region WHERE id = ?', [grower.region_id])
        .then(result => {
          console.log('Region Name', result);
          setDisplayRegionName(result?.name || 'N/A');
        })
        .catch(err => {
          console.error('Error fetching region name:', err);
          setDisplayRegionName('N/A');
        });
    }
    if (grower?.production_scheme_id) {
      powersync.get('SELECT name FROM odoo_gms_production_scheme WHERE id = ?', [grower.production_scheme_id])
        .then(result => {
          console.log('Production Scheme Name', result);
          setDisplayProductionSchemeName(result?.name || 'N/A');
        })
        .catch(err => {
          console.error('Error fetching production scheme name:', err);
          setDisplayProductionSchemeName('N/A');
        });
    }
    if (grower?.grower_flags) {
      powersync.get('SELECT name FROM odoo_gms_flags WHERE id = ?', [grower.grower_flags])
        .then(result => {
          console.log('Grower Flag Name', result);
          setDisplayGrowerFlagName(result?.name || 'N/A');
        })
        .catch(err => {
          console.error('Error fetching grower flag name:', err);
          setDisplayGrowerFlagName('N/A');
        });
    }
    //Get Distribution Plans
  const getDisplayDistributionPlan = async () => {
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
      odoo_gms_activity a ON dp.activity_id = a.id
      WHERE dp.id = ?`, [selectedDistributionPlanId])
      .then(result => {
        console.log('Display Distribution Plan', result);
        if (result[0]) {
          setDisplayDistributionPlanName(result[0]?.production_cycle_name + ' - ' + result[0]?.production_scheme_name + ' - ' + result[0]?.activity_name || 'N/A');
        } else {
          setDisplayDistributionPlanName('N/A');
        }
      })
      .catch(ex => {
        console.error('Error fetching distribution plans:', ex);
        setError(ex.message);
      });
  }
  getDisplayDistributionPlan();

  }, [grower?.region_id, grower?.production_scheme_id, grower?.distribution_plan, grower?.grower_flags, selectedDistributionPlanId]);

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
            <TouchableOpacity className="flex-row items-center" onPress={() => router.back()}>
              <ChevronLeft size={28} color="#65435C" />
            <Text className="text-xl font-bold text-[#65435C]">Grower Details</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              className="h-10 w-10 rounded-xl bg-[#65435C] items-center justify-center"
              onPress={() => 
                isEditing ? setIsEditing(false) : setPasswordModalVisible(true)}>
              <Pencil size={20} color="white" />
            </TouchableOpacity>
          </View>
          
          {/* Password Modal */}
          <Modal
            animationType="fade"
            transparent={true}
            visible={passwordModalVisible}
            onRequestClose={() => setPasswordModalVisible(false)}
          >
            <View className="flex-1 justify-center items-center bg-black/50">
              <View className="bg-white rounded-xl p-5 w-4/5 shadow-lg">
                <Text className="text-lg font-bold text-[#65435C] mb-3">Password Required</Text>
                <Text className="text-gray-600 mb-4">Please enter password to edit grower details</Text>
                
                <TextInput
                  secureTextEntry
                  className="border border-gray-300 rounded-md p-3 mb-4"
                  placeholder="Enter password"
                  value={password}
                  onChangeText={setPassword}
                />
                
                <View className="flex-row justify-end">
                  <TouchableOpacity 
                    className="bg-gray-200 rounded-md px-4 py-2 mr-2"
                    onPress={() => {
                      setPasswordModalVisible(false);
                      setPassword('');
                    }}
                  >
                    <Text className="text-gray-800">Cancel</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    className="bg-[#65435C] rounded-md px-4 py-2"
                    onPress={() => handlePasswordInput(password)}
                  >
                    <Text className="text-white">Submit</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
          
          {isEditing ? (
          <ScrollView className="flex-1 px-4 py-2 pt-4"
          keyboardShouldPersistTaps="handled"
          >
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
                    <Text className="text-gray-600 w-1/3">Contracted Ha</Text>
                    <TextInput 
                        className="border border-gray-300 rounded-md p-2 w-2/3" 
                        value={contractedHa} 
                        onChangeText={(text) => {
                            setContractedHa(text);
                        }}
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
                {/* <View className="flex-row items-center justify-between my-2">
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
                </View> */}

                {/* Save Button */}
                <View className="flex-row justify-evenly mt-8 mb-8 gap-2">
                <TouchableOpacity className="bg-gray-200 rounded-md w-[50%]" onPress={()=> setIsEditing(false)}>
                    <Text className="text-[#65435C] text-xl text-center p-2">Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity className="bg-[#65435C] rounded-md w-[50%]" onPress={updateGrower}>
                    <Text className="text-white text-xl text-center p-2">Save</Text>
                    </TouchableOpacity>
                </View>
            </View>
          </ScrollView>
          ) : (
            <ScrollView className="flex-1 px-4 py-2 pt-4 mt-12">
              <View className="flex-1">
                <View className="flex-row items-center justify-between my-2 mb-4 pb-2">
                    <Text className="text-md font-bold w-1/2">Grower Number: </Text>
                    <Text className="text-md w-1/2">{grower?.grower_number}</Text>
                </View>
                <View className="flex-row items-center justify-between my-2 mb-4 pb-2">
                  <Text className="text-md font-bold w-1/2">First Name: </Text>
                  <Text className="text-md w-1/2">{grower?.first_name}</Text>
                </View>
                <View className="flex-row items-center justify-between my-2 mb-4 pb-2">
                  <Text className="text-md font-bold w-1/2">Surname: </Text>
                  <Text className="text-md w-1/2">{grower?.surname}</Text>
                </View>
                <View className="flex-row items-center justify-between my-2 mb-4 pb-2">
                  <Text className="text-md font-bold w-1/2">Contracted Ha: </Text>
                  <Text className="text-md w-1/2">{grower?.b010_contract_scale}</Text>
                </View>
                <View className="flex-row items-center justify-between my-2 mb-4 pb-2">
                  <Text className="text-md font-bold w-1/2">Production Scheme: </Text>
                  <Text className="text-md w-1/2">{displayProductionSchemeName}</Text>
                </View>
                <View className="flex-row items-center justify-between my-2 mb-4 pb-2">
                  <Text className="text-md font-bold w-1/2">Group: </Text>
                  <Text className="text-md w-1/2">{displayRegionName}</Text>
                </View>
                <View className="flex-row items-center justify-between my-2 mb-4 pb-2">
                  <Text className="text-md font-bold w-1/2">Distribution Plan: </Text>
                  <Text className="text-md w-1/2">{displayDistributionPlanName}</Text>
                </View>

                {/* <View className="flex-row items-center justify-between my-2 border-b-2 mb-4 pb-2">
                  <Text className="text-md font-bold w-1/2">Grower Flag: </Text>
                  <Text className="text-md w-1/2">{displayGrowerFlagName}</Text>
                </View> */}


              </View>

            </ScrollView>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}


































// import React, { useEffect, useState, useCallback } from 'react';
// import { View, Text, TouchableOpacity, SafeAreaView, TextInput, ActivityIndicator, Alert } from 'react-native';
// import { useLocalSearchParams, router } from 'expo-router';
// import { X } from 'lucide-react-native';
// import { powersync } from '@/powersync/system';
// import { Picker } from '@react-native-picker/picker';
// import { DistributionPlanRecord, FlagsRecord, ProductionSchemeRecord, RegionRecord } from '@/powersync/Schema';
// import axios from 'axios';

// // Define interfaces for your data types
// interface Grower {
//   id?: string;
//   grower_number?: string;
//   first_name?: string;
//   surname?: string;
//   b010_contract_scale?: string | number;
//   production_scheme_id?: string;
//   region_id?: string;
//   distribution_plan?: string;
//   grower_flags?: string;
//   [key: string]: any; // Allow any other properties
// }

// interface DistributionPlan {
//   id: string;
//   production_scheme_name: string;
//   production_cycle_name: string;
//   activity_name: string;
// }

// interface FormData {
//   firstName: string;
//   surname: string;
//   contractedHa: string;
//   growerNumber: string;
//   selectedProductionSchemeId: string;
//   selectedGroupId: string;
//   selectedDistributionPlanId: string;
//   selectedGrowerFlagId: string;
// }

// export default function GrowerModal() {
//   const { id, grower_id, production_scheme } = useLocalSearchParams();
//   const [grower, setGrower] = useState<Grower | null>(null);
//   const [error, setError] = useState<string | null>(null);
//   const [isLoading, setIsLoading] = useState(false);
//   const [isSubmitting, setIsSubmitting] = useState(false);
  
//   // Data sources for dropdowns
//   const [productionSchemes, setProductionSchemes] = useState<ProductionSchemeRecord[]>([]);
//   const [groups, setGroups] = useState<RegionRecord[]>([]);
//   const [distributionPlans, setDistributionPlans] = useState<DistributionPlan[]>([]);
//   const [growerFlags, setGrowerFlags] = useState<FlagsRecord[]>([]);
  
//   // Consolidated form state
//   const [formData, setFormData] = useState<FormData>({
//     firstName: '',
//     surname: '',
//     contractedHa: '',
//     growerNumber: '',
//     selectedProductionSchemeId: '',
//     selectedGroupId: '',
//     selectedDistributionPlanId: '',
//     selectedGrowerFlagId: ''
//   });

//   // Handler for form field changes
//   const handleFormChange = (field: keyof FormData, value: string) => {
//     setFormData(prev => ({
//       ...prev,
//       [field]: value
//     }));
//   };

//   // Load grower data
//   const loadGrowerData = useCallback(async () => {
//     setIsLoading(true);
//     try {
//       const result = await powersync.get(
//         'SELECT pcr.*, g.grower_number FROM odoo_gms_production_cycle_registration pcr LEFT JOIN odoo_gms_grower g ON pcr.grower_id = g.id WHERE pcr.grower_id = ? AND pcr.production_cycle_name = ?',
//         [grower_id, production_scheme]
//       );
//       setGrower(result as Grower);
//       console.log('#############################################GROWER#################################################4', result);
//     } catch (ex: any) {
//       setError(`Error loading grower: ${ex.message}`);
//     } finally {
//       setIsLoading(false);
//     }
//   }, [grower_id, production_scheme]);

//   // Load reference data
//   const loadReferenceData = useCallback(async () => {
//     try {
//       // Load all reference data in parallel
//       const [schemesResult, groupsResult, plansResult, flagsResult] = await Promise.all([
//         powersync.getAll('SELECT * FROM odoo_gms_production_scheme'),
//         powersync.getAll('SELECT * FROM odoo_gms_region'),
//         powersync.getAll(`SELECT 
//           dp.*,
//           pc.name AS production_cycle_name,
//           ps.name AS production_scheme_name,
//           a.name AS activity_name
//         FROM 
//           odoo_gms_distribution_plan dp
//         LEFT JOIN 
//           odoo_gms_production_cycle pc ON dp.production_cycle_id = pc.id
//         LEFT JOIN 
//           odoo_gms_production_scheme ps ON dp.production_scheme_id = ps.id
//         LEFT JOIN 
//           odoo_gms_activity a ON dp.activity_id = a.id`),
//         powersync.getAll('SELECT * FROM odoo_gms_flags')
//       ]);
      
//       setProductionSchemes(schemesResult as ProductionSchemeRecord[]);
//       setGroups(groupsResult as RegionRecord[]);
//       setDistributionPlans(plansResult as DistributionPlan[]);
//       setGrowerFlags(flagsResult as FlagsRecord[]);
//     } catch (ex: any) {
//       setError(`Error loading reference data: ${ex.message}`);
//     }
//   }, []);

//   // Initial data loading
//   useEffect(() => {
//     loadGrowerData();
//     loadReferenceData();
//   }, [loadGrowerData, loadReferenceData]);

//   // Update form values when grower data is loaded
//   useEffect(() => {
//     if (grower) {

//       console.log('#############################################CURRENT GROWER#################################################3', grower);
//       setFormData({
//         firstName: grower.first_name || '',
//         surname: grower.surname || '',
//         contractedHa: grower.b010_contract_scale?.toString() || '',
//         growerNumber: grower.grower_number?.toString() || '',
//         selectedProductionSchemeId: grower.production_scheme_id?.toString() || '',
//         selectedGroupId: grower.region_id?.toString() || '',
//         selectedDistributionPlanId: grower.distribution_plan?.toString() || '',
//         selectedGrowerFlagId: grower.grower_flags?.toString() || ''
//       });
//     }
//   }, [grower]);

//   // Build update payload by comparing form data with original grower data
//   const buildUpdatePayload = useCallback(() => {
//     if (!grower) return { timb_status: false };
    
//     const payload: { timb_status: boolean; [key: string]: any } = { timb_status: false };
    
//     // Field mappings - form field name to API field name and current value
//     const fieldMappings = [
//       { form: 'firstName', api: 'first_name', current: grower.first_name },
//       { form: 'surname', api: 'surname', current: grower.surname },
//       { form: 'contractedHa', api: 'b010_contract_scale', current: grower.b010_contract_scale?.toString() },
//       { form: 'growerNumber', api: 'grower_number', current: grower.grower_number?.toString() },
//       { form: 'selectedProductionSchemeId', api: 'production_scheme_id', current: grower.production_scheme_id?.toString() },
//       { form: 'selectedGroupId', api: 'region_id', current: grower.region_id?.toString() },
//       { form: 'selectedDistributionPlanId', api: 'distribution_plan', current: grower.distribution_plan?.toString() },
//       { form: 'selectedGrowerFlagId', api: 'grower_flags', current: grower.grower_flags?.toString() }
//     ];
    
//     // Only include fields that have changed and aren't empty
//     fieldMappings.forEach(({ form, api, current }) => {
//       const formValue = formData[form as keyof FormData];
//       if (formValue !== current && formValue !== '') {
//         payload[api] = formValue;
//       }
//     });
    
//     return payload;
//   }, [grower, formData]);

//   // Update grower data
//   const updateGrower = async () => {
//     // Basic validation
//     if (!formData.growerNumber.trim()) {
//       setError('Grower number is required');
//       return;
//     }
    
//     setIsSubmitting(true);
//     setError(null);
    
//     const params = buildUpdatePayload();
    
//     // If no changes, don't submit
//     if (Object.keys(params).length <= 1) { // only timb_status
//       Alert.alert('No Changes', 'No changes were made to update.');
//       setIsSubmitting(false);
//       return;
//     }
    
//     const options = {
//       method: 'PATCH',
//       url: `http://45.84.138.225:8069/api/update/${grower?.id}`,
//       headers: {
//         cookie: 'session_id=sZqyvCm3Paya3UgTLe1R5FY9EAyEA6-jmNbzuT3Egt20Yphpl8UJHxqzd0qjYUhzWnG7tMuLVluXaUYFfhPT; frontend_lang=en_GB',
//         'Content-Type': 'application/json',
//         'User-Agent': 'insomnia/11.0.2',
//         'X-FO-TOKEN': 'cfa0c7b5-9c87-4d8c-87c1-f8394fe1c94a'
//       },
//       data: {
//         jsonrpc: '2.0', 
//         method: 'call', 
//         params: params, 
//         id: null
//       }
//     };

//     try {
//       const response = await axios.request(options);
//       console.log('Grower updated successfully:', response.data);
//       Alert.alert('Success', 'Grower updated successfully', [
//         { text: 'OK', onPress: () => router.back() }
//       ]);
//     } catch (error: any) {
//       console.error('Error updating grower:', error);
//       setError(error.message || 'Failed to update grower');
//       Alert.alert('Error', `Failed to update grower: ${error.message}`);
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   // Create a reusable form field component
//   const FormField = ({ 
//     label, 
//     value, 
//     onChangeText, 
//     fieldKey 
//   }: { 
//     label: string; 
//     value: string; 
//     onChangeText: (text: string) => void;
//     fieldKey: string;
//   }) => (
//     <View className="flex-row items-center justify-between my-2">
//       <Text className="text-gray-600 w-1/3">{label}</Text>
//       <TextInput 
//         className="border border-gray-300 rounded-md p-2 w-2/3" 
//         value={value} 
//         onChangeText={onChangeText}
//         testID={`input-${fieldKey}`}
//       />
//     </View>
//   );

//   // Create a reusable picker component
//   const FormPicker = ({ 
//     label, 
//     selectedValue, 
//     onValueChange, 
//     items, 
//     fieldKey,
//     labelExtractor = (item: any) => item.name || ''
//   }: { 
//     label: string; 
//     selectedValue: string; 
//     onValueChange: (value: string) => void;
//     items: any[];
//     fieldKey: string;
//     labelExtractor?: (item: any) => string;
//   }) => (
//     <View className="flex-row items-center justify-between my-2">
//       <Text className="text-gray-600 w-1/3">{label}</Text>
//       <View className="border border-gray-300 rounded-md w-2/3">
//         <Picker
//           selectedValue={selectedValue}
//           onValueChange={onValueChange}
//           testID={`picker-${fieldKey}`}
//         >
//           <Picker.Item label={`Select a ${label.toLowerCase()}`} value="" />
//           {items.map((item) => (
//             <Picker.Item 
//               key={item.id} 
//               label={labelExtractor(item)} 
//               value={item.id} 
//             />
//           ))}
//         </Picker>
//       </View>
//     </View>
//   );

//   // Show loading state
//   if (isLoading) {
//     return (
//       <SafeAreaView className="flex-1 bg-[#65435C] items-center justify-center">
//         <View className="p-4 bg-white rounded-lg">
//           <ActivityIndicator size="large" color="#65435C" />
//           <Text className="mt-2 text-center">Loading grower data...</Text>
//         </View>
//       </SafeAreaView>
//     );
//   }

//   return (
//     <SafeAreaView className="flex-1 bg-[#65435C]">
//       <View className="flex-1 mt-6">
//         <View className="flex-1 bg-white rounded-t-3xl overflow-hidden">
//           <View className="flex-row justify-between items-center p-4 border-b border-gray-100">
//             <Text className="text-xl font-bold text-[#65435C]">Grower Details</Text>
//             <TouchableOpacity 
//               className="h-10 w-10 rounded-full bg-gray-100 items-center justify-center"
//               onPress={() => router.back()}
//               testID="close-button"
//             >
//               <X size={20} color="#65435C" />
//             </TouchableOpacity>
//           </View>
          
//           {error && (
//             <View className="bg-red-100 p-2 mx-4 mt-2 rounded">
//               <Text className="text-red-700">{error}</Text>
//             </View>
//           )}
          
//           <View className="flex-1 px-4 py-2 pt-6">
//             <View className="flex-1">
//               {/* Text input fields */}
//               <FormField 
//                 label="Grower Number" 
//                 value={formData.growerNumber} 
//                 onChangeText={(text) => handleFormChange('growerNumber', text)}
//                 fieldKey="growerNumber"
//               />
              
//               <FormField 
//                 label="First Name" 
//                 value={formData.firstName} 
//                 onChangeText={(text) => handleFormChange('firstName', text)}
//                 fieldKey="firstName"
//               />
              
//               <FormField 
//                 label="Surname" 
//                 value={formData.surname} 
//                 onChangeText={(text) => handleFormChange('surname', text)}
//                 fieldKey="surname"
//               />
              
//               <FormField 
//                 label="Contracted Ha" 
//                 value={formData.contractedHa} 
//                 onChangeText={(text) => handleFormChange('contractedHa', text)}
//                 fieldKey="contractedHa"
//               />
              
//               {/* Picker fields */}
//               <FormPicker 
//                 label="Production Scheme"
//                 selectedValue={formData.selectedProductionSchemeId}
//                 onValueChange={(value) => handleFormChange('selectedProductionSchemeId', value)}
//                 items={productionSchemes}
//                 fieldKey="productionScheme"
//               />
              
//               <FormPicker 
//                 label="Group"
//                 selectedValue={formData.selectedGroupId}
//                 onValueChange={(value) => handleFormChange('selectedGroupId', value)}
//                 items={groups}
//                 fieldKey="group"
//               />
              
//               <FormPicker 
//                 label="Distribution Plan"
//                 selectedValue={formData.selectedDistributionPlanId}
//                 onValueChange={(value) => handleFormChange('selectedDistributionPlanId', value)}
//                 items={distributionPlans}
//                 fieldKey="distributionPlan"
//                 labelExtractor={(item) => 
//                   `${item.production_cycle_name} - ${item.production_scheme_name} - ${item.activity_name}`
//                 }
//               />
              
//               <FormPicker 
//                 label="Grower Flag"
//                 selectedValue={formData.selectedGrowerFlagId}
//                 onValueChange={(value) => handleFormChange('selectedGrowerFlagId', value)}
//                 items={growerFlags}
//                 fieldKey="growerFlag"
//               />

//               {/* Save Button */}
//               <View className="flex-row items-center justify-center my-8">
//                 <TouchableOpacity 
//                   className={`w-full border border-gray-300 rounded-lg p-4 ${isSubmitting ? 'bg-gray-400' : 'bg-[#65435C]'}`} 
//                   onPress={updateGrower}
//                   disabled={isSubmitting}
//                   testID="save-button"
//                 >
//                   {isSubmitting ? (
//                     <View className="flex-row justify-center items-center">
//                       <ActivityIndicator size="small" color="white" />
//                       <Text className="text-white ml-2">Saving...</Text>
//                     </View>
//                   ) : (
//                     <Text className="text-white text-center">Save</Text>
//                   )}
//                 </TouchableOpacity>
//               </View>
//             </View>
//           </View>
//         </View>
//       </View>
//     </SafeAreaView>
//   );
// }