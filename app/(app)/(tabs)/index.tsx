import { View, Text, TouchableOpacity, Dimensions } from 'react-native'
import React from 'react'
import { CircleUserRound, FolderSync, Wifi, Users, Settings, BarChart, Leaf, ChevronRight, Building } from 'lucide-react-native';

import { useSession } from '@/authContext';
import { exportDatabase } from '@/export-db';
import { Stack, useRouter } from 'expo-router';
import { useNetwork } from '@/NetworkContext';


const index = () => {
  const { session, isLoading } = useSession();
  const router = useRouter();
  const { isConnected } = useNetwork()
  console.log(session)
  
  // Calculate dynamic tile sizes based on screen width
  const screenWidth = Dimensions.get('window').width;
  const tileSize = (screenWidth - 48) / 2; // 48 = 24px padding on each side + 8px gap between tiles
  
  return (
    <>
    <Stack.Screen options={{ 
      headerTitle: () => null,
      headerShown: true,
      headerRight: () => (
        <TouchableOpacity onPress={() => router.push('/(app)/settings' as any)}>
          <View className='flex flex-row items-center gap-2 mr-4'>
            {isConnected ? (
              <>
                <Wifi size={20} color="#1AD3BB" />
                <FolderSync size={20} color="#65435C" />
              </>
            ) : (
              <Wifi size={20} color="#FF0000" />
            )}
          </View>
        </TouchableOpacity>
      ),
      headerLeft: () => (
        <TouchableOpacity onPress={() => router.push('/(app)/settings' as any)}>
          <View className='flex flex-row items-center gap-2 ml-4'>
            <Building size={25} color="#1AD3BB" />
            {/* <Text className="ml-1 text-[#65435C] font-semibold">{session?.name}</Text> */}
            <Text className="text-2xl ml-1 text-[#65435C] font-semibold">CURVERID</Text>
          </View>
        </TouchableOpacity>
      ),
      
      
    }} />
    <View className='flex-1 p-4 bg-[#65435C]'>
      {/* Welcome Card */}
      <View className='bg-white rounded-2xl p-4 mb-6 mt-10 shadow-sm'>
        <Text className='text-2xl font-semibold text-[#65435C]'>Welcome back,</Text>
        <Text className='text-lg font-bold text-[#1AD3BB]'>{session?.name}</Text>
        <Text className='text-gray-500 mt-1'>What would you like to do today?</Text>
      </View>
      
      {/* Tiles Grid */}
      <View className='flex-row flex-wrap justify-between'>
        {/* Growers Tile */}
        <TouchableOpacity 
          style={{ width: tileSize, height: tileSize }}
          className='bg-white rounded-2xl p-4 mb-4 shadow-sm'
          onPress={() => router.push('/(app)/growers' as any)}
        >
          <View className='flex-1 justify-between'>
            <View className='h-12 w-12 bg-[#65435C] rounded-xl items-center justify-center'>
              <Users size={24} color="#1AD3BB" />
            </View>
            <View>
              <Text className='text-lg font-semibold text-[#65435C]'>Growers</Text>
              <View className='flex-row items-center mt-1'>
                <Text className='text-gray-500 text-sm'>Manage profiles</Text>
                <ChevronRight size={16} color="#65435C" />
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {/* Inputs Tile */}
        <TouchableOpacity 
          style={{ width: tileSize, height: tileSize }}
          className='bg-white rounded-2xl p-4 mb-4 shadow-sm'
          onPress={() => router.push('/(app)/inputs' as any)}
        >
          <View className='flex-1 justify-between'>
            <View className='h-12 w-12 bg-[#65435C] rounded-xl items-center justify-center'>
              <Leaf size={24} color="#1AD3BB" />
            </View>
            <View>
              <Text className='text-lg font-semibold text-[#65435C]'>Inputs</Text>
              <View className='flex-row items-center mt-1'>
                <Text className='text-gray-500 text-sm'>Track resources</Text>
                <ChevronRight size={16} color="#65435C" />
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {/* M&E Tile */}
        <TouchableOpacity 
          style={{ width: tileSize, height: tileSize }}
          className='bg-white rounded-2xl p-4 mb-4 shadow-sm'
          onPress={() => router.push('/(app)/monitoring' as any)}
        >
          <View className='flex-1 justify-between'>
            <View className='h-12 w-12 bg-[#65435C] rounded-xl items-center justify-center'>
              <BarChart size={24} color="#1AD3BB" />
            </View>
            <View>
              <Text className='text-lg font-semibold text-[#65435C]'>M&E</Text>
              <View className='flex-row items-center mt-1'>
                <Text className='text-gray-500 text-sm'>View analytics</Text>
                <ChevronRight size={16} color="#65435C" />
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {/* Settings Tile */}
        <TouchableOpacity 
          style={{ width: tileSize, height: tileSize }}
          className='bg-white rounded-2xl p-4 mb-4 shadow-sm'
          onPress={() => router.push('/(app)/settings' as any)}
        >
          <View className='flex-1 justify-between'>
            <View className='h-12 w-12 bg-[#65435C] rounded-xl items-center justify-center'>
              <Settings size={24} color="#1AD3BB" />
            </View>
            <View>
              <Text className='text-lg font-semibold text-[#65435C]'>Settings</Text>
              <View className='flex-row items-center mt-1'>
                <Text className='text-gray-500 text-sm'>App preferences</Text>
                <ChevronRight size={16} color="#65435C" />
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    </View>
    </>
  )
}

export default index