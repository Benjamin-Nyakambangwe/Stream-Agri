import React, { useState, useCallback } from 'react'
import { Text, TouchableOpacity, View, ScrollView, Alert, ActivityIndicator } from 'react-native'
import { Stack, useFocusEffect } from 'expo-router'
import { LogOut, Download, FileSpreadsheet } from 'lucide-react-native'
import { useSession } from '@/authContext'
import { EXPORT_TABLES, exportTableToCSV, shareCSVFile, exportAllTables } from '@/utils/exportUtils'
import { forceRunImageUploadService } from '@/utils/imageUploadService'

const Settings = () => {
  const { signOut } = useSession()
  const [exporting, setExporting] = useState<string | null>(null)
  const [exportingAll, setExportingAll] = useState(false)

  // Trigger image upload check when settings screen is focused
  useFocusEffect(
    useCallback(() => {
      forceRunImageUploadService().catch(error => 
        console.log('Settings image upload check failed:', error)
      );
    }, [])
  );

  const handleExportTable = async (table: typeof EXPORT_TABLES[0]) => {
    try {
      setExporting(table.name)
      const fileUri = await exportTableToCSV(table.name, table.displayName, table.query)
      await shareCSVFile(fileUri, table.displayName)
      Alert.alert('Success', `${table.displayName} data exported successfully!`)
    } catch (error) {
      console.error('Export error:', error)
      Alert.alert('Export Error', `Failed to export ${table.displayName}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setExporting(null)
    }
  }

  const handleExportAll = async () => {
    try {
      setExportingAll(true)
      const exportedFiles = await exportAllTables()
      Alert.alert('Success', `Exported ${exportedFiles.length} tables successfully!`)
    } catch (error) {
      console.error('Export all error:', error)
      Alert.alert('Export Error', 'Failed to export all tables')
    } finally {
      setExportingAll(false)
    }
  }

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
        <ScrollView showsVerticalScrollIndicator={false}>
          <View className="bg-white rounded-2xl p-4 mb-4">
            <Text className="text-xl font-semibold text-[#65435C] mb-4">App Settings</Text>
            
            {/* Export All Button */}
            <TouchableOpacity 
              onPress={handleExportAll}
              disabled={exportingAll}
              className={`flex-row items-center justify-center p-3 rounded-lg mb-4 ${
                exportingAll ? 'bg-gray-300' : 'bg-[#65435C]'
              }`}
            >
              {exportingAll ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <FileSpreadsheet size={20} color="white" />
              )}
              <Text className="text-white font-semibold ml-2">
                {exportingAll ? 'Exporting All...' : 'Export All Tables'}
              </Text>
            </TouchableOpacity>

            {/* Individual Table Export Buttons */}
            <Text className="text-lg font-semibold text-[#65435C] mb-3">Export Individual Tables</Text>
            <View className="space-y-2">
              {EXPORT_TABLES.map((table) => (
                <TouchableOpacity
                  key={table.name}
                  onPress={() => handleExportTable(table)}
                  disabled={exporting === table.name}
                  className={`flex-row items-center justify-between p-3 rounded-lg border ${
                    exporting === table.name 
                      ? 'bg-gray-100 border-gray-300' 
                      : 'bg-white border-[#65435C]'
                  }`}
                >
                  <View className="flex-row items-center flex-1">
                    {exporting === table.name ? (
                      <ActivityIndicator size="small" color="#65435C" />
                    ) : (
                      <Download size={18} color="#65435C" />
                    )}
                    <Text className={`ml-2 flex-1 ${
                      exporting === table.name ? 'text-gray-500' : 'text-[#65435C]'
                    }`}>
                      {table.displayName}
                    </Text>
                  </View>
                  {exporting === table.name && (
                    <Text className="text-gray-500 text-sm">Exporting...</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      </View>
    </>
  )
}

export default Settings
