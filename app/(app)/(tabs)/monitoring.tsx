import React from 'react'
import { Text, View } from 'react-native'
import { Stack } from 'expo-router'
import { BarChart } from 'lucide-react-native'

const Monitoring = () => {
  return (
    <>
      <Stack.Screen options={{ 
        title: "Monitoring & Evaluation",
        headerShown: true 
      }} />
      <View className="flex-1 p-4 bg-[#65435C]">
        <View className="bg-white rounded-2xl p-4 flex-row items-center gap-4">
          <View className="h-12 w-12 bg-[#65435C] rounded-xl items-center justify-center">
            <BarChart size={24} color="#1AD3BB" />
          </View>
          <Text className="text-xl font-semibold text-[#65435C]">M&E Dashboard</Text>
        </View>
      </View>
    </>
  )
}

export default Monitoring
