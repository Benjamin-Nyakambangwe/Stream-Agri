import React from 'react'
import { Text, TouchableOpacity, View } from 'react-native'
import { Stack } from 'expo-router'
import { LogOut } from 'lucide-react-native'
import { useSession } from '@/authContext'

const Settings = () => {
  const { signOut } = useSession()
  return (
    <>
      <Stack.Screen options={{ 
        title: "Settings",
        headerShown: true,
        headerRight: () => (
          <TouchableOpacity onPress={() => {
            signOut()
          }}>
            <View className="flex-row items-center gap-2 mr-4 ">
              <LogOut size={20} color="#FF0000" />
              <Text className="text-lg font-bold text-[#65435C]">Logout</Text>
            </View>
          </TouchableOpacity>
        )
      }} />
      <View className="flex-1 p-4 bg-[#65435C]">
        <View className="bg-white rounded-2xl p-4">
          <Text className="text-xl font-semibold text-[#65435C]">App Settings</Text>
        </View>

      </View>
    </>
  )
}

export default Settings
