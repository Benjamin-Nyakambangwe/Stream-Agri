import React, { useCallback, useEffect, useState } from 'react'
import { Alert, KeyboardAvoidingView, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { router, Stack, useFocusEffect } from 'expo-router'
import { CircleArrowRight, PlugZap, Search, Unplug, UserPlus, Users } from 'lucide-react-native'
import { useSession } from '@/authContext'
import * as SecureStore from 'expo-secure-store';
import { FlashList } from '@shopify/flash-list'
import { RefreshCcw } from 'lucide-react-native'
import { useNetwork } from '@/NetworkContext'
import { powersync, setupPowerSync } from '@/powersync/system';
import { ProductionCycleRegistrationRecord } from '@/powersync/Schema'

// Combined type for joined data
type JoinedGrowerData = ProductionCycleRegistrationRecord & {
    grower_number?: string;
  };

// Tab type
type TabType = 'issued' | 'received' | 'returned';

const Inputs = () => {
  const session = useSession();
  const { isConnected } = useNetwork()

  const [growers, setGrowers] = useState<JoinedGrowerData[]>([]);
  const [filteredGrowers, setFilteredGrowers] = useState<JoinedGrowerData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [syncStatus, setSyncStatus] = useState(false);
  const [growerWithInputData, setGrowerWithInputData] = useState<any[]>([]);
  const [growerWithInputDataReceived, setGrowerWithInputDataReceived] = useState<any[]>([]);
  const [growerWithInputDataReturned, setGrowerWithInputDataReturned] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('issued');

  useFocusEffect(
    useCallback(() => {
      console.log('useFocusEffect Inputs Screen');
      powersync.registerListener({
        statusChanged: (status) => {
          setSyncStatus(status.connected);
          // console.log('PowerSync status Inputs Screen:', status);
        }
      });
    }, [])
  );
  const getSyncStatus = () => {
    console.log('getSyncStatus')
    const status = powersync.currentStatus
    console.log('getSyncStatus', status)
  }

  useEffect(() => {
    console.log('useEffect Inputs')
    // Initialize PowerSync if not already initialized
    setupPowerSync();
    // Set up a watch query to get and monitor growers data
    const controller = new AbortController();
    // console.log('Setting up growers data watcher with JOIN...');
    powersync.watch(
      `SELECT 
        r.id, 
        r.grower_name, 
        r.mobile, 
        r.production_scheme_id, 
        r.production_cycle_name,
        r.first_name,
        r.surname,
        r.grower_id as registration_grower_id,
        g.id as grower_table_id,
        g.grower_number as grower_number
      FROM odoo_gms_production_cycle_registration r
      LEFT JOIN odoo_gms_grower g ON CAST(r.grower_id AS TEXT) = g.id
      ORDER BY r.grower_name`,
      [],
      {
        onResult: (result) => {
          // console.log('Joined growers data updated, count:', result.rows?._array?.length);
          if (result.rows?._array) {
            const growersData = result.rows._array as JoinedGrowerData[];
            setGrowers(growersData);
            setFilteredGrowers(growersData);
          }
          setLoading(false);
        },
        onError: (err) => {
          console.error('Error fetching growers:', err);
          setError(err.message);
          setLoading(false);
        }
      },
      { signal: controller.signal }
    );
    
    return () => {
      controller.abort();
    };
  }, []);

  // Search feature implementation
  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (text.trim() === '') {
      setFilteredGrowers(growers);
      return;
    }

    const lowercaseQuery = text.toLowerCase();
    const filtered = growers.filter(
      grower => 
        (grower.first_name?.toLowerCase().includes(lowercaseQuery) ||
        grower.surname?.toLowerCase().includes(lowercaseQuery) ||
        grower.production_cycle_name?.toLowerCase().includes(lowercaseQuery) ||
        grower.grower_name?.toLowerCase().includes(lowercaseQuery) ||
        grower.grower_number?.toLowerCase().includes(lowercaseQuery))
    );
    setFilteredGrowers(filtered);
  };


  const getInputConfirmations = async () => {
    const inputConfirmations = await powersync.execute(`SELECT * FROM odoo_gms_input_confirmations`);
    // console.log('inputConfirmations', inputConfirmations.rows?._array);
  }

  const getInputConfirmationsLines = async () => {
    const inputConfirmationsLines = await powersync.execute(`SELECT * FROM odoo_gms_input_confirmations_lines WHERE issue_state = 'issued'`);
    // console.log('inputConfirmationsLines', inputConfirmationsLines.rows?._array);
  }

  const getInputPacks = async () => {
    const inputPacks = await powersync.execute(`SELECT * FROM odoo_gms_input_pack`);
    console.log('inputPacks', inputPacks);
  }

  const getGrowerWithInputData = async () => {
    console.log('Getting Input Confirmation Lines Data');
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
      WHERE pcr.field_technician_id = 148 AND icl.issue_state = 'issued'
    `;
    
    const result = powersync.watch(query, [], {
      onResult: (result) => {
        // console.log('Input Confirmation Lines Data:', result.rows?._array);
        setGrowerWithInputData(result.rows?._array || []);
      }
    });
    // const rows = result.rows?._array || [];
    // console.log('Input Confirmation Lines Data:', rows);
    // setGrowerWithInputData(rows);
    // return rows;
  }

  const getGrowerWithInputDataReceived = async () => {
    console.log('Getting Input Confirmation Lines Data');
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
      WHERE pcr.field_technician_id = 148 AND icl.issue_state = 'received'
    `;
    
    const result = powersync.watch(query, [], {
      onResult: (result) => {
        // console.log('Input Confirmation Lines Data Received:', result.rows?._array);
        setGrowerWithInputDataReceived(result.rows?._array || []);
      }
    });
    // const rows = result.rows?._array || [];
    // console.log('Input Confirmation Lines Data:', rows);
    // setGrowerWithInputData(rows);
    // return rows;
  }

  const getGrowerWithInputDataReturned = async () => {
    console.log('Getting Input Confirmation Lines Data');
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
      WHERE pcr.field_technician_id = 148 AND icl.issue_state = 'returned'
    `;
    
    const result = powersync.watch(query, [], {
      onResult: (result) => {
        // console.log('Input Confirmation Lines Data Returned:', result.rows?._array);
        setGrowerWithInputDataReturned(result.rows?._array || []);
      }
    });
    // const rows = result.rows?._array || [];
    // console.log('Input Confirmation Lines Data:', rows);
    // setGrowerWithInputData(rows);
    // return rows;
  }

  useEffect(() => {
    getInputConfirmations();
    getInputConfirmationsLines();
    getInputPacks();
    getGrowerWithInputData()
    getGrowerWithInputDataReceived()
    getGrowerWithInputDataReturned()
  }, []);

  return (
    <>
      <Stack.Screen options={{ 
        title: 'Inputs',
        headerTitleStyle: {
          fontSize: 24,
          fontWeight: 'bold',
          color: '#65435C'
        },
        headerShown: true,
        headerRight: () => (
            <View className="mr-4 flex-row items-center gap-2">
                <TouchableOpacity onPress={()=> console.log('refreshing')}>
                  {syncStatus === true ? (
                    <PlugZap size={24} color="#1AD3BB" />

                  ) : (
                    <Unplug size={24} color="red" />
                  )}
                </TouchableOpacity>
            </View>
        )
      }} />
      <View className="flex-1 p-4 bg-[#65435C]"
      >
        {/* <View className="flex-row items-center justify-between gap-2 mb-4 h-14">
          <View className="relative w-[80%]">
            <View className="absolute left-3 top-4 z-10">
              <Search size={20} color="#65435C" />
            </View>
            <TextInput
              placeholder="Search"
              placeholderTextColor="#65435C" 
              className="text-white text-lg bg-[#937B8C] rounded-full p-4 pl-12 w-full"
              value={searchQuery}
              onChangeText={handleSearch}
            />
          </View>
        <View className="flex-row items-center justify-center h-12 w-[20%]">
          <Text className="text-white font-bold text-2xl text-center">{filteredGrowers.length}</Text>
        </View>
      </View> */}

        <View className="flex-1 bg-white rounded-2xl p-4">
          {/* Tab Switcher */}
          <View className="flex-row bg-gray-100 rounded-xl p-1 mb-4">
            <TouchableOpacity
              className={`flex-1 py-3 rounded-lg ${activeTab === 'issued' ? 'bg-[#65435C]' : 'bg-transparent'}`}
              onPress={() => setActiveTab('issued')}
            >
              <Text className={`text-center font-semibold ${activeTab === 'issued' ? 'text-white' : 'text-[#65435C]'}`}>
                Issued
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              className={`flex-1 py-3 rounded-lg ${activeTab === 'received' ? 'bg-[#65435C]' : 'bg-transparent'}`}
              onPress={() => setActiveTab('received')}
            >
              <Text className={`text-center font-semibold ${activeTab === 'received' ? 'text-white' : 'text-[#65435C]'}`}>
                Received
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className={`flex-1 py-3 rounded-lg ${activeTab === 'returned' ? 'bg-[#65435C]' : 'bg-transparent'}`}
              onPress={() => setActiveTab('returned')}
            >
              <Text className={`text-center font-semibold ${activeTab === 'returned' ? 'text-white' : 'text-[#65435C]'}`}>
                Returned
              </Text>
            </TouchableOpacity>
          </View>
         
          
          <FlashList
      data={activeTab === 'issued' ? growerWithInputData : activeTab === 'received' ? growerWithInputDataReceived : growerWithInputDataReturned}
      renderItem={({ item }: { item: any }) => growerItem(item)}
      estimatedItemSize={200}
      keyboardShouldPersistTaps="handled"
    />
    </View>
    </View>
    </>
  )
}

export default Inputs


const growerItem = (item: any) => {
    // Capitalize only the first letter of each name
    const capitalizeFirstLetter = (string: string) => {
        if (!string) return '';
        return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
    };
    
    const firstName = capitalizeFirstLetter(item.first_name);
    const lastName = capitalizeFirstLetter(item.surname);
    
    return (
        <TouchableOpacity className="bg-white rounded-xl p-4 mb-3 border border-gray-100 shadow-sm" 
        onPress={() => router.push({
            pathname: `/inputs/[id]`,
            params: { 
                id: item.id,
                grower_id: item.registration_grower_id,
                production_scheme: item.production_cycle_name
            }
        })}>
            <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                    {/* Avatar circle with initials */}
                    <View className="h-12 w-12 rounded-full bg-[#1AD3BB] items-center justify-center mr-3">
                        <Text className="text-white font-bold text-lg">
                            {item.grower_name.charAt(0)}{item.surname.charAt(0)}
                        </Text>
                    </View>
                    
                    <View>
                        <Text className="text-lg font-bold text-[#65435C] truncate max-w-[200px]">{item.first_name} {item.surname}</Text>
                        <Text className="text-gray-500 text-sm">{item.input_pack_name} - {item.production_cycle_name}</Text>
                    </View>
                </View>
                
                {/* Right side with action indicator */}
                <View className=" rounded-full h-8 w-8 items-center justify-center">
                  <CircleArrowRight size={24} color="#65435C" />
                    {/* <Text className="text-[#65435C] font-bold">→</Text> */}
                </View>
            </View>
        </TouchableOpacity>
    )
}