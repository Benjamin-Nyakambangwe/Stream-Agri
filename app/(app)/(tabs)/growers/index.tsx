import React, { useCallback, useEffect, useState } from 'react'
import { Text, TouchableOpacity, View } from 'react-native'
import { router, Stack, useFocusEffect } from 'expo-router'
import { PlugZap, Unplug, Users } from 'lucide-react-native'
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
  //   grower_cellphone?: string;
  //   grower_email?: string;
  //   grower_farm_name?: string;
  //   grower_province?: string;
  };



const Growers = () => {
  const session = useSession();
  // console.log('session', session)
  const { isConnected } = useNetwork()

  const [growers, setGrowers] = useState<JoinedGrowerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [syncStatus, setSyncStatus] = useState(false);

  useFocusEffect(
    useCallback(() => {
      console.log('useFocusEffect Growers Screen');
      powersync.registerListener({
        statusChanged: (status) => {
          setSyncStatus(status.connected);
          // console.log('PowerSync status Growers Screen:', status);
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
    console.log('useEffect growers')
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
          console.log('Joined growers data updated, count:', result.rows?._array?.length);
          if (result.rows?._array) {
            // Log the first few records to debug
            if (result.rows._array.length > 0) {
              // console.log('Sample record:', JSON.stringify(result.rows._array[0]));
              // console.log('Join fields:', result.rows._array.slice(0, 3).map(row => ({
              //   registration_grower_id: row.registration_grower_id,
              //   grower_table_id: row.grower_table_id
              // })));
            }
            setGrowers(result.rows._array as JoinedGrowerData[]);
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

  // console.log('growers', growers)

  return (
    <>
      <Stack.Screen options={{ 
        title: `Growers : ${growers.length}`,
        headerShown: true,
        headerRight: () => (
            <View className="mr-4">
                <TouchableOpacity onPress={()=> console.log('refreshing')}>
                  {/* <Text>{syncStatus.?connected}</Text> */}
                  {syncStatus === true ? (
                    <PlugZap size={24} color="#1AD3BB" />

                  ) : (
                    <Unplug size={24} color="red" />
                  )}
                </TouchableOpacity>
            </View>
        )
      }} />
      <View className="flex-1 p-4 bg-[#65435C]">
        {/* <TouchableOpacity 
          className="bg-[#1AD3BB] p-3 rounded-xl mb-4 items-center" 
          onPress={() => {
            console.log('Button pressed');
            getSyncStatus();
          }}
        >
          <Text className="text-white font-bold">Test Sync Status</Text>
        </TouchableOpacity> */}

        <View className="flex-1 bg-white rounded-2xl p-4">
        <FlashList
      data={growers}
      renderItem={({ item }: { item: any }) => growerItem(item)}
      estimatedItemSize={200}
    />
        </View>
        {/* <View>
            {growers.map((grower, index) => (
                <Text key={index}>{grower.first_name} {grower.surname}</Text>
            ))}
        </View> */}
      </View>
    </>
  )
}

export default Growers


const growerItem = (item: any) => {
    // console.log('item', item)
    
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
            pathname: `/growers/[id]`,
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
                            {firstName.charAt(0)}{lastName.charAt(0)}
                        </Text>
                    </View>
                    
                    <View>
                        <Text className="text-lg font-bold text-[#65435C]">{firstName} {lastName}</Text>
                        {/* <Text className="text-gray-500 text-sm">Farmer ID: {item.grower_number}</Text> */}
                    </View>
                </View>
                
                {/* Right side with action indicator */}
                <View className="bg-gray-100 rounded-full h-8 w-8 items-center justify-center">
                    <Text className="text-[#65435C] font-bold">→</Text>
                </View>
            </View>
        </TouchableOpacity>
    )
}