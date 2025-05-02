import React, { useEffect, useState } from 'react'
import { Text, TouchableOpacity, View } from 'react-native'
import { router, Stack } from 'expo-router'
import { Users } from 'lucide-react-native'
import { useSession } from '@/authContext'
import * as SecureStore from 'expo-secure-store';
import { useSQLiteContext } from 'expo-sqlite'
import { FlashList } from '@shopify/flash-list'
import { RefreshCcw } from 'lucide-react-native'
import { useNetwork } from '@/NetworkContext'


const Growers = () => {
    const session = useSession();
    console.log('session', session)
    const appDatabase = useSQLiteContext()
    const [growers, setGrowers] = useState<any[]>([])
    const { isConnected } = useNetwork()
    const growersApi = async () => {
        const adminSessionToken = await SecureStore.getItemAsync('odoo_admin_session_id');
        console.log('adminSessionToken', adminSessionToken)
        console.log('growersApi')
        const response = await fetch('http://192.168.8.190:8081/api/growers', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                session_token: session?.session?.session_id,
                apiBaseUrl: 'http://192.168.8.190:8069',
                test: 'test',
                adminSessionToken: adminSessionToken
            })
        })
        console.log('response', response)
        const data = await response.json()
        console.log('actualdata', data.result.growers)
        console.log('result', data.result.success)

        if (data.result.success) {
            if (data.result.growers.length > 0) {
                addGrowersToDatabase(data.result.growers)
            } else {
                console.log('no growers')
            }
        } else {
            console.log('error')
        }
    }

    const addGrowersToDatabase = async (growers: any) => {
        console.log('addGrowersToDatabase', growers)

        if (growers.length > 0) {
            await appDatabase.execAsync('DELETE FROM growers');
        }
        try {
            for (const grower of growers) {
                await appDatabase.runAsync(
                    `INSERT INTO growers (id, first_name, surname) VALUES (?, ?, ?)`,
                    [grower.id, grower.first_name, grower.surname]
                )
            }

            console.log('Successfully inserted', growers.length, 'growers');
            setGrowers(growers)
        } catch (error) {
            console.error('Error inserting growers:', error);
        }
    }

    const getGrowersFromDatabase = async () => {
        const growers = await appDatabase.getAllAsync('SELECT * FROM growers');
        setGrowers(growers)
    }

    useEffect(() => {
        getGrowersFromDatabase()
    }, [])
  return (
    <>
      <Stack.Screen options={{ 
        title: "Growers",
        headerShown: true,
        headerRight: () => (
            <View className="mr-4">
                <TouchableOpacity onPress={growersApi} disabled={!isConnected}>
                    <RefreshCcw size={24} color="#1AD3BB" />
                </TouchableOpacity>
            </View>
        )
      }} />
      <View className="flex-1 p-4 bg-[#65435C]">
        {/* <View className="bg-white rounded-2xl p-4 flex-row items-center gap-4">
          <View className="h-12 w-12 bg-[#65435C] rounded-xl items-center justify-center">
            <Users size={24} color="#1AD3BB" />
          </View>
          <Text className="text-xl font-semibold text-[#65435C]">Growers</Text>
        </View> */}

        {/* <TouchableOpacity className="bg-white rounded-2xl p-4 flex-row items-center gap-4"
        onPress={growersApi}
        >
          <Text className="text-xl font-semibold text-[#65435C]">Farmer Profiles</Text>
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
    console.log('item', item)
    
    // Capitalize only the first letter of each name
    const capitalizeFirstLetter = (string: string) => {
        if (!string) return '';
        return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
    };
    
    const firstName = capitalizeFirstLetter(item.first_name);
    const lastName = capitalizeFirstLetter(item.surname);
    
    return (
        <View className="bg-white rounded-xl p-4 mb-3 border border-gray-100 shadow-sm">
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
                        <Text className="text-gray-500 text-sm">Farmer ID: {item.id}</Text>
                    </View>
                </View>
                
                {/* Right side with action indicator */}
                <View className="bg-gray-100 rounded-full h-8 w-8 items-center justify-center">
                    <Text className="text-[#65435C] font-bold">→</Text>
                </View>
            </View>
        </View>
    )
}