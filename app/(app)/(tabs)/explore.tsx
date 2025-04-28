import { View, Text, TouchableOpacity } from 'react-native'
import React, { useEffect, useState } from 'react'
import { useSession } from '@/authContext'
import * as SecureStore from 'expo-secure-store';

const explore = () => {
  const {session, signOut} = useSession()
  const [db, setDb] = useState('')
  const [ip, setIp] = useState('')

  const currentDB = async () => {
    const db = await SecureStore.getItemAsync('odoo_database');
    setDb(db)
    return db;
  }
  const currentIP = async () => {
    const ip = await SecureStore.getItemAsync('odoo_server_ip');
    setIp(ip)
    return ip;
  }

  useEffect(() => {
    currentDB()
    currentIP()
  }, [])

  return (
    <View className='flex-1 justify-center items-center'>
      <Text className='text-red-500 text-2xl font-bold text-center mb-6'>explore</Text>
      <View>
        {session && (
          <TouchableOpacity onPress={signOut}
            className='bg-red-500 p-2 rounded-md'
          >
            <Text className='text-white text-center'>Logout</Text>
          </TouchableOpacity>
        )}
      </View>
      <View className='flex justify-center items-center mt-12'>
        <View className='flex-row items-center gap-2'>
          <Text className='text-xl font-bold'>Database:</Text>
          <Text className='text-xl'>{db}</Text>
        </View>
        <View className='flex-row items-center gap-2'>
          <Text className='text-xl font-bold'>IP:</Text>
          <Text className='text-xl'>{ip}</Text>
        </View>
      </View>
    </View>
  )
}

export default explore