"use client"

import React, { useState, useEffect, useCallback } from "react"
import { View, Text, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Button, TextInput, ActivityIndicator, Alert } from "react-native"
import {Image} from "expo-image"
import { Eye, EyeOff, Mail, Lock, ArrowRight, Github, Twitter, Settings, Database, Wifi, Phone } from "lucide-react-native"
import { useSession } from "../../authContext"
import { useFocusEffect, useRouter } from "expo-router"
import * as SecureStore from 'expo-secure-store';
import { exportDatabase } from "../../export-db"
// import { useSQLiteContext } from "expo-sqlite"
import { useNetwork } from "@/NetworkContext"
import { powersync, setupPowerSync } from "@/powersync/system"

interface LoginScreenProps {
  onRegisterPress: () => void
}

// Define the employee type based on database structure
interface Employee {
  id: number;
  name: string;
  mobile_phone: string;
  mobile_app_password: string;
  [key: string]: any; // For any other properties
}

export default function LoginScreen({ onRegisterPress }: LoginScreenProps) {
  const [email, setEmail] = useState<string>("")
  const [phoneNumber, setPhoneNumber] = useState<string>("")
  const [password, setPassword] = useState<string>("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)
  const [mobileAppPasswordHash, setMobileAppPasswordHash] = useState<string>("")
  const [fullName, setFullName] = useState<string>("")
  const [workPhone, setWorkPhone] = useState<string>("")
  const [userId, setUserId] = useState<number>(0)
  const [syncStatus, setSyncStatus] = useState<string>("")
  
  const { logIn, localLogin, error: authError } = useSession()
  const router = useRouter()
  // const appDatabase = useSQLiteContext()

  const viewUsers = async () => {
    // const users = await appDatabase.getAllAsync('SELECT * FROM users')
    console.log("users")
  }

  const { isConnected } = useNetwork()

  useEffect(() => {
    setupPowerSync();
    if (!isConnected) {
      Alert.alert("No internet connection", "Please check your internet connection and try again.")
      return
    }else{
      console.log("Connected to internet")
    }
  }, [isConnected])

  useFocusEffect(
    useCallback(() => {
      console.log('useFocusEffect');
      powersync.registerListener({
        statusChanged: (status) => {
          setSyncStatus(JSON.stringify(status));
          // console.log('PowerSync status:', status);
        }
      });
    }, [])
  );



  


  const handleLogin = async () => {
    // setIsLoggingIn(true)
    console.log('Login Pressed')
    // const currentUser = await appDatabase.getAllAsync('SELECT * FROM users WHERE work_phone = ?', [phoneNumber])
    // console.log(currentUser)
    console.log('phoneNumber', phoneNumber)
    console.log("Now queying powersync")
    // let currentUser = []
    
    try {
      const currentUser = await powersync.get<Employee>('SELECT * from hr_employee WHERE mobile_phone = ?', [phoneNumber])
      console.log('currentUser from powersync login page')
      console.log(currentUser)

      if (!currentUser) {
        console.log('No user found with phone number:', phoneNumber)
        setLoginError("User not found")
        return
      } else {
        console.log('User found, setting credentials')
        console.log('currentUser', currentUser)
        console.log('currentUser.mobile_app_password', currentUser.mobile_app_password)
        setMobileAppPasswordHash(currentUser.mobile_app_password)
        setFullName(currentUser.name)
        setWorkPhone(currentUser.mobile_phone)
        setUserId(currentUser.id)
        
        if (!phoneNumber || !password) {
          setLoginError("Please enter both phone number and password")
          return
        }
        
        setIsLoggingIn(true)
        setLoginError(null)
        
        try {
          console.log('Connected to internet Login')
          console.log('Hash Password', currentUser.mobile_app_password)
          let success
          isConnected ? 
          // success = true
          success = await logIn(password, phoneNumber)
          :
          success = await localLogin(password, currentUser.mobile_app_password, currentUser.salt, currentUser.name, currentUser.mobile_phone, String(currentUser.id))
          if (success) {
            // Navigate to main app
            setIsLoggingIn(false)
            router.replace("/(app)/(tabs)")
          } else {
            setLoginError(authError || "Login failed. Please check your credentials.")
          }
        } catch (err) {
          setLoginError("An error occurred during login")
          console.error(err)
        } finally {
          setIsLoggingIn(false)
        }
      }
    } catch (error: any) {
      console.error('PowerSync query error:', error);
      
      // Detailed error tracking based on error type
      if (error.name === 'DatabaseError') {
        console.error('Database operation failed:', error.message);
        setLoginError(`Database error: ${error.message}`);
      } else if (error.name === 'NetworkError') {
        console.error('Network issues with PowerSync:', error.message);
        setLoginError('Network error: Please check your connection and try again');
      } else {
        console.error('Unknown PowerSync error:', {
          message: error.message,
          stack: error.stack,
          name: error.name
        });
        setLoginError(`Error retrieving user data: ${error.message || 'Unknown error'}`);
      }
      return;
    }
  }



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
          <View className="flex-row items-center">
            <Text className="text-2xl font-bold text-gray-500">Welcome Back</Text>
            <View className="mb-6 ml-1">
              {isConnected ? (
                <Wifi size={20} color="#1AD3BB"  />
              ) : (
                <Wifi size={20} color="red"  />
              )}
            </View>
          </View>
          <Text className="text-[#1AD3BB] dark:text-gray-400 text-center mt-2">Sign in to your account to continue</Text>
          
          {loginError && (
            <View className="mt-2 mb-2 p-2 bg-red-100 rounded-md w-full">
              <Text className="text-red-600 text-center">{loginError}</Text>
            </View>
          )}
        </View>

        
          <>
            <View className="flex-row items-center rounded-md m-3 border-2 border-[#65435C] px-2">
              <Phone size={20} color="#1AD3BB" />
              <TextInput 
                value={phoneNumber} 
                onChangeText={setPhoneNumber} 
                keyboardType="phone-pad" 
                placeholder="Enter Phone Number"
                className="flex-1 p-3.5"
                autoCapitalize="none"
              />
            </View>

            <View className="flex-row items-center rounded-md m-3 border-2 border-[#65435C] px-2">
              <Lock size={20} color="#1AD3BB" />
              <TextInput 
                value={password} 
                onChangeText={setPassword}  
                placeholder="Password" 
                secureTextEntry={!showPassword}
                className="flex-1 p-3.5"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                {showPassword ? (
                  <EyeOff size={20} color="#4B5563" />
                ) : (
                  <Eye size={20} color="#4B5563" />
                )}
              </TouchableOpacity>
            </View>

            <View>
              <TouchableOpacity 
                className="bg-[#65435C] rounded-md m-3" 
                onPress={handleLogin}
                disabled={isLoggingIn}
              >
                {isLoggingIn ? (
                  <ActivityIndicator color="white" className="p-2" />
                ) : (
                  <Text className="text-white text-xl text-center p-2">Login</Text>
                )}
              </TouchableOpacity>
            </View>
          </>
        
        <TouchableOpacity 
          className="mt-4 rounded-md border-2 border-[#65435C] p-2" 
          onPress={() => router.push('/(auth)/adminLogin')}
        >
          <Text className="text-[#1AD3BB] text-center">
            Server Configuration
          </Text>
        </TouchableOpacity>

        {/* <TouchableOpacity 
          className="mt-4" 
          onPress={viewUsers}
        >
          <Text className="text-[#1AD3BB] text-center">
            View Users
          </Text>
        </TouchableOpacity> */}
        
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
