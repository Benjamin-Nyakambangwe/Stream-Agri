import React from 'react'
import { Text, View } from 'react-native'
import { Stack } from 'expo-router'
import { Leaf } from 'lucide-react-native'

const Inputs = () => {
  return (
    <>
      <Stack.Screen options={{ 
        title: "Farm Inputs",
        headerShown: true 
      }} />
      <View className="flex-1 p-4 bg-[#65435C]">
        <View className="bg-white rounded-2xl p-4 flex-row items-center gap-4">
          <View className="h-12 w-12 bg-[#65435C] rounded-xl items-center justify-center">
            <Leaf size={24} color="#1AD3BB" />
          </View>
          <Text className="text-xl font-semibold text-[#65435C]">Input Resources</Text>
        </View>
      </View>
    </>
  )
}

export default Inputs
