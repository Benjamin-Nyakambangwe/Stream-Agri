import { View, Text, ScrollView, ActivityIndicator } from 'react-native'
import React, { useEffect, useState } from 'react'
import axios, { AxiosError } from 'axios'
import * as SecureStore from 'expo-secure-store'

// Define types for our Odoo response
interface OdooModule {
  id: number;
  name: string;
  state: string;
}

interface OdooResponse {
  jsonrpc: string;
  id: number;
  result: OdooModule[];
  error?: {
    code: number;
    message: string;
    data: {
      name: string;
      debug: string;
      message: string;
    };
  };
}

const Two = () => {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<OdooResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        // Get session ID from secure storage
        const sessionId = await SecureStore.getItemAsync('odoo_session_id')
        // Get server URL from secure storage
        const serverUrl = await SecureStore.getItemAsync('odoo_server_ip')
        const baseUrl = serverUrl ? 
          (serverUrl.startsWith('http') ? serverUrl : `https://${serverUrl}`) :
          'https://eport.cloud'

        console.log('Using session ID:', sessionId)
        console.log('Using base URL:', baseUrl)

        const options = {
          method: 'POST',
          url: `${baseUrl}/web/dataset/call_kw`,
          headers: {
            cookie: `session_id=${sessionId || 'lagzZVvlDCdg_tCGCMjgCfvex3ptYLD4j_bT-Y2wxE0C4Hqd2qfHpLR-gng3Y9MVhqgotmgE4tSlCTAear6-'}; frontend_lang=en_US`,
            'Content-Type': 'application/json'
          },
          data: {
            jsonrpc: '2.0',
            id: 1,
            params: {
              model: 'ir.module.module',
              method: 'search_read',
              args: [[['state', '=', 'installed']], ['name', 'state'], 0, 5],
              kwargs: {}
            }
          }
        }

        const response = await axios.request(options)
        console.log('API Response:', JSON.stringify(response.data, null, 2))
        setData(response.data as OdooResponse)
      } catch (err) {
        const error = err as Error | AxiosError
        console.error('Error fetching data:', error)
        setError(error.message || 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return (
    <View className="flex-1 p-4">
      <Text className="text-xl font-bold mb-4">Installed Modules</Text>
      
      {loading ? (
        <View className="items-center justify-center flex-1">
          <ActivityIndicator size="large" color="#65435C" />
          <Text className="mt-2">Loading modules...</Text>
        </View>
      ) : error ? (
        <View className="p-4 bg-red-100 rounded-md">
          <Text className="text-red-700">Error: {error}</Text>
        </View>
      ) : data ? (
        <ScrollView className="flex-1">
          {data.result && data.result.length > 0 ? (
            data.result.map((module: OdooModule) => (
              <View key={module.id} className="p-4 bg-gray-100 rounded-md mb-2">
                <Text className="font-bold">{module.name}</Text>
                <Text>State: {module.state}</Text>
                <Text className="text-gray-500">ID: {module.id}</Text>
              </View>
            ))
          ) : (
            <Text>No modules found</Text>
          )}
        </ScrollView>
      ) : (
        <Text>No data available</Text>
      )}
    </View>
  )
}

export default Two