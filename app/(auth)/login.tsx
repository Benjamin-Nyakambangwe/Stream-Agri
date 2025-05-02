"use client"

import React, { useState, useEffect } from "react"
import { View, Text, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Button, TextInput, ActivityIndicator, Alert } from "react-native"
import {Image} from "expo-image"
import { Eye, EyeOff, Mail, Lock, ArrowRight, Github, Twitter, Settings, Database, Wifi, Phone } from "lucide-react-native"
import { useSession } from "../../authContext"
import { useRouter } from "expo-router"
import * as SecureStore from 'expo-secure-store';
import { exportDatabase } from "../../export-db"
import { useSQLiteContext } from "expo-sqlite"
import { useNetwork } from "@/NetworkContext"

interface LoginScreenProps {
  onRegisterPress: () => void
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

  
 
  
  const { logIn, localLogin, error: authError } = useSession()
  const router = useRouter()
  const appDatabase = useSQLiteContext()

  const viewUsers = async () => {
    const users = await appDatabase.getAllAsync('SELECT * FROM users')
    console.log(users)
  }

  const { isConnected } = useNetwork()

  useEffect(() => {
    if (!isConnected) {
      Alert.alert("No internet connection", "Please check your internet connection and try again.")
      return
    }else{
      console.log("Connected to internet")
    }
  }, [isConnected])



  


  const handleLogin = async () => {
console.log('Login Pressed')
    const currentUser = await appDatabase.getAllAsync('SELECT * FROM users WHERE work_phone = ?', [phoneNumber])
    console.log(currentUser)

    if (currentUser.length === 0) {
      setLoginError("User not found")
      return
    } else {
      setMobileAppPasswordHash(currentUser[0].mobile_app_password)
      setFullName(currentUser[0].name)
      setWorkPhone(currentUser[0].work_phone)
      setUserId(currentUser[0].id)
    }

    if (!phoneNumber || !password) {
      setLoginError("Please enter both phone number and password")
      return
    }
    
    setIsLoggingIn(true)
    setLoginError(null)
    
    try {
      let success
      isConnected ? 
      success = await logIn(password, phoneNumber)
      :
      success = await localLogin(password, mobileAppPasswordHash, fullName, workPhone, userId)
      if (success) {
        // Navigate to main app
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



  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
      <ScrollView
        className="flex-1 px-6"
        contentContainerClassName="flex-grow justify-center"
        showsVerticalScrollIndicator={false}
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
                className="flex-1 p-2"
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
                className="flex-1 p-2"
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
                  <Text className="text-white text-2xl text-center p-2">Login</Text>
                )}
              </TouchableOpacity>
            </View>
          </>
        
        <TouchableOpacity 
          className="mt-4" 
          onPress={() => router.push('/(auth)/adminLogin')}
        >
          <Text className="text-[#1AD3BB] text-center">
            Admin Login
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          className="mt-4" 
          onPress={viewUsers}
        >
          <Text className="text-[#1AD3BB] text-center">
            View Users
          </Text>
        </TouchableOpacity>
        
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
