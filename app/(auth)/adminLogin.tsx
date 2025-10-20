"use client"

import React, { useState, useEffect, useCallback } from "react"
import { View, Text, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Button, TextInput, ActivityIndicator, Alert, DevSettings } from "react-native"
import {Image} from "expo-image"
import { Eye, EyeOff, Mail, Lock, Settings, Database } from "lucide-react-native"
import { useSession } from "@/authContext"
import { useFocusEffect, useRouter } from "expo-router"
import * as SecureStore from 'expo-secure-store';
import axios from "axios";
import { powersync } from "@/powersync/system";


interface LoginScreenProps {
  onRegisterPress: () => void
}

interface Employee {
  id: number;
  name: string;
  work_phone: string;
  mobile_app_password: string;
}

export default function LoginScreen({ onRegisterPress }: LoginScreenProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)
  const [serverIP, setServerIP] = useState("")
  const [database, setDatabase] = useState("odoo_database")
  const [adminUsername, setAdminUsername] = useState("")
  const [adminPassword, setAdminPassword] = useState("")
  const [powerSyncURI, setPowerSyncURI] = useState("")

  const { adminLogin, session, error: authError } = useSession()
  const router = useRouter()


  // Load saved server IP and database on component mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedIP = await SecureStore.getItemAsync('odoo_server_ip');
        if (savedIP) {
          setServerIP(savedIP);
        }
        
        const savedDB = await SecureStore.getItemAsync('odoo_database');
        if (savedDB) {
          setDatabase(savedDB);
        }
      } catch (err) {
        console.error('Error loading settings:', err);
      }
    };
    loadSettings();
  }, []);

  const [syncStatus, setSyncStatus] = useState(false);

  useFocusEffect(
    useCallback(() => {
      console.log('useFocusEffect Admin Login Screen');
      powersync.registerListener({
        statusChanged: (status) => {
          setSyncStatus(status.connected);
          console.log('PowerSync status Admin Login Screen:', status);
        }
      });
    }, [])
  );
  

  const handleAdminLogin = async () => {
    console.log('Admin Login Pressed')

    if (!adminUsername || !adminPassword) {
      setLoginError("Please enter both admin username and password")
      return
    }
    
    // Save server configuration
    await SecureStore.setItemAsync('odoo_server_ip', serverIP);
    await SecureStore.setItemAsync('odoo_database', database);


    
    setIsLoggingIn(true)
    setLoginError(null)
    
    try {
      const success = await adminLogin(adminUsername, adminPassword, powerSyncURI)
      if (success) {
        console.log('Admin Login Success - navigating to user login')
        router.replace('/login');
      } else {
        console.log('Admin Login Failed')
        console.log(authError)
        setLoginError(authError || "Login failed. Please check your credentials.")
      }
    } catch (err) {
      setLoginError("An error occurred during login")
      console.error(err)
    } finally {
      setIsLoggingIn(false)
    }
  }



  const handleClearStorage = async () => {
    Alert.alert(
      'Clear Storage',
      'Are you sure you want to clear all storage? This will reset the app to its initial state.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'OK',
          onPress: async () => {
            try {
              // Clear PowerSync data
              await powersync.disconnectAndClear();
              await SecureStore.deleteItemAsync('odoo_server_ip');
              await SecureStore.deleteItemAsync('odoo_database');
              // Restart the app
              DevSettings.reload();
            } catch (error) {
              console.error('Failed to clear storage:', error);
              Alert.alert('Error', 'Failed to clear storage.');
            }
          },
        },
      ],
      { cancelable: false }
    );
  };


  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
      <ScrollView
        className="flex-1 px-6"
        contentContainerClassName="flex-grow justify-center"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View className="items-center mb-10 mt-10">
          <View>
            <Image 
              source={require('../../assets/images/odoo_logo.svg')}
              style={{ width: 120, height: 120 }}
              contentFit="contain"
            />
          </View>
          <Text className="text-2xl font-bold text-gray-500 dark:text-white">Welcome</Text>
          <Text className="text-[#1AD3BB] dark:text-gray-400 text-center mt-2">Sign in to your account and prime the database</Text>
          
          {loginError && (
            <View className="mt-2 mb-2 p-2 bg-red-100 rounded-md w-full">
              <Text className="text-red-600 text-center">{loginError}</Text>
            </View>
          )}
        </View>

          <View className="mb-5">
            <Text className="font-bold text-[#65435C] text-lg mb-2">Server Configuration</Text>
            
            <View className="flex-row items-center rounded-md m-3 border-2 border-[#65435C] px-2">
              <Settings size={20} color="#1AD3BB" />
              <TextInput 
                value={serverIP} 
                onChangeText={ (text) => setServerIP(text.trim())} 
                placeholder="Enter Your Server URL"
                className="flex-1 p-3.5"
                autoCapitalize="none"
              />
            </View>
            
            <View className="flex-row items-center rounded-md m-3 border-2 border-[#65435C] px-2">
              <Database size={20} color="#1AD3BB" />
              <TextInput 
                value={database} 
                onChangeText={(text) => setDatabase(text.trim())} 
                placeholder="Enter Database Name"
                className="flex-1 p-3.5"
                autoCapitalize="none"
              />
            </View>

            <View className="flex-row items-center rounded-md m-3 border-2 border-[#65435C] px-2">
              <Mail size={20} color="#1AD3BB" />
              <TextInput
                value={adminUsername} 
                onChangeText={(text) => setAdminUsername(text.trim())} 
                placeholder="Enter Admin Username"
                className="flex-1 p-3.5"
                autoCapitalize="none"
              />
            </View>
            <View className="flex-row items-center rounded-md m-3 border-2 border-[#65435C] px-2">
              <Lock size={20} color="#1AD3BB" />
              <TextInput 
                value={adminPassword} 
                onChangeText={setAdminPassword} 
                placeholder="Enter Admin Password"
                className="flex-1 p-3.5"
                autoCapitalize="none"
                secureTextEntry={!showPassword}
              />
               <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                {showPassword ? (
                  <EyeOff size={20} color="#4B5563" />
                ) : (
                  <Eye size={20} color="#4B5563" />
                )}
              </TouchableOpacity>
            </View>

            <View className="flex-row items-center rounded-md m-3 border-2 border-[#65435C] px-2">
              {/* <Mail size={20} color="#1AD3BB" /> */}
              <TextInput
                value={powerSyncURI} 
                onChangeText={(text) => setPowerSyncURI(text.trim())} 
                placeholder="PowerSync URI"
                className="flex-1 p-3.5"
                autoCapitalize="none"
              />
            </View>

            
            <View className="flex-row justify-between">
              <TouchableOpacity 
                className="bg-[#1AD3BB] rounded-md p-2 flex-1 mr-2"
                onPress={() => router.push('/(auth)/login')}
              >
                <Text className="text-white text-center">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                className={`rounded-md p-2 flex-1 ml-2 ${
                  isLoggingIn 
                    ? 'bg-gray-400' 
                    : 'bg-[#65435C]'
                }`}
                onPress={handleAdminLogin}
                disabled={isLoggingIn}
              >
                <Text className="text-white text-center">
                  {isLoggingIn ? 'Logging in...' : 'Login & Configure'}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
                className={`rounded-md p-2 flex-1 mt-4 bg-red-500`}
                onPress={handleClearStorage}
              >
                <Text className="text-white text-center">
                 Clear Storage
                </Text>
              </TouchableOpacity>
          </View>
        
        
        {/* <TouchableOpacity 
          className="mt-4 rounded-md border-2 border-[#65435C] p-2" 
          onPress={() => router.push('/(auth)/login')}
        >
          <Text className="text-[#1AD3BB] text-center">
            Field Officer Login
          </Text>
        </TouchableOpacity> */}
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
