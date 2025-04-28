"use client"

import React, { useState, useEffect } from "react"
import { View, Text, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Button, TextInput, ActivityIndicator, Alert } from "react-native"
import {Image} from "expo-image"
import { Eye, EyeOff, Mail, Lock, ArrowRight, Github, Twitter, Settings, Database } from "lucide-react-native"
import { useSession } from "../../authContext"
import { useRouter } from "expo-router"
import * as SecureStore from 'expo-secure-store';

interface LoginScreenProps {
  onRegisterPress: () => void
}

export default function LoginScreen({ onRegisterPress }: LoginScreenProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)
  const [showServerSettings, setShowServerSettings] = useState(false)
  const [serverIP, setServerIP] = useState("")
  const [database, setDatabase] = useState("odoo_db2")
  
  const { signIn, error: authError } = useSession()
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

  const handleLogin = async () => {
    console.log('Login Pressed')
    if (!email || !password) {
      setLoginError("Please enter both email and password")
      return
    }
    
    setIsLoggingIn(true)
    setLoginError(null)
    
    try {
      const success = await signIn(email, password)
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

  const saveServerSettings = async () => {
    if (!serverIP) {
      Alert.alert("Error", "Please enter a valid server IP address");
      return;
    }
    
    if (!database) {
      Alert.alert("Error", "Please enter a database name");
      return;
    }
    
    try {
      await SecureStore.setItemAsync('odoo_server_ip', serverIP);
      await SecureStore.setItemAsync('odoo_database', database);
      Alert.alert("Success", "Server settings saved successfully");
      setShowServerSettings(false);
    } catch (err) {
      Alert.alert("Error", "Failed to save server settings");
      console.error(err);
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
          <Text className="text-2xl font-bold text-gray-500 dark:text-white">Welcome Back</Text>
          <Text className="text-[#1AD3BB] dark:text-gray-400 text-center mt-2">Sign in to your account to continue</Text>
          
          {loginError && (
            <View className="mt-2 mb-2 p-2 bg-red-100 rounded-md w-full">
              <Text className="text-red-600 text-center">{loginError}</Text>
            </View>
          )}
        </View>

        {showServerSettings ? (
          <View className="mb-5">
            <Text className="font-bold text-gray-700 mb-2">Server Configuration</Text>
            <View className="flex-row items-center rounded-md m-3 border-2 border-[#65435C] px-2">
              <Settings size={20} color="#1AD3BB" />
              <TextInput 
                value={serverIP} 
                onChangeText={setServerIP} 
                placeholder="Enter Server IP (e.g. 192.168.1.100:8069)"
                className="flex-1 p-2"
                autoCapitalize="none"
              />
            </View>
            
            <View className="flex-row items-center rounded-md m-3 border-2 border-[#65435C] px-2">
              <Database size={20} color="#1AD3BB" />
              <TextInput 
                value={database} 
                onChangeText={setDatabase} 
                placeholder="Enter Database Name"
                className="flex-1 p-2"
                autoCapitalize="none"
              />
            </View>
            
            <View className="flex-row justify-between">
              <TouchableOpacity 
                className="bg-gray-500 rounded-md p-2 flex-1 mr-2"
                onPress={() => setShowServerSettings(false)}
              >
                <Text className="text-white text-center">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                className="bg-[#1AD3BB] rounded-md p-2 flex-1 ml-2"
                onPress={saveServerSettings}
              >
                <Text className="text-white text-center">Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            <View className="flex-row items-center rounded-md m-3 border-2 border-[#65435C] px-2">
              <Mail size={20} color="#1AD3BB" />
              <TextInput 
                value={email} 
                onChangeText={setEmail} 
                keyboardType="email-address" 
                placeholder="Enter Email"
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
        )}
        
        <TouchableOpacity 
          className="mt-4" 
          onPress={() => setShowServerSettings(!showServerSettings)}
        >
          <Text className="text-[#1AD3BB] text-center">
            {showServerSettings ? "Back to Login" : "Server Settings"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
