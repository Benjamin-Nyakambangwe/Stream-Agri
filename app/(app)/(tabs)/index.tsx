import { View, Text } from 'react-native'
import React from 'react'

import { useSession } from '@/authContext';

const index = () => {
  const { session, isLoading } = useSession();
  // console.log(session)
  return (
    <View className='flex flex-1 justify-start m-4'>
      <View className='flex flex-row items-center gap-2'>
        <Text className='font-semibold text-xl'>Name:</Text>
        <Text className='text-md'>{session?.name}</Text>
      </View>
      <View className='flex flex-row items-center gap-2'>
        <Text className='font-semibold text-xl'>Username:</Text>
        <Text className='text-md'>{session?.username}</Text>
      </View>
      <View className='flex flex-row items-center gap-2'>
        <Text className='font-semibold text-xl'>User ID:</Text>
        <Text className='text-md'>{session?.uid}</Text>
      </View>
      <View className='flex flex-col mt-8 items-center gap-2'>
        <Text className='font-semibold text-xl'>Session ID:</Text>
        <Text className='text-md'>{session?.session_id}</Text>
      </View>
    </View>
  )
}

export default index