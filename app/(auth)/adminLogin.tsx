"use client"

import React, { useState, useEffect } from "react"
import { View, Text, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Button, TextInput, ActivityIndicator, Alert } from "react-native"
import {Image} from "expo-image"
import { Eye, EyeOff, Mail, Lock, Settings, Database } from "lucide-react-native"
import { useSession } from "@/authContext"
import { useRouter } from "expo-router"
import * as SecureStore from 'expo-secure-store';
import axios from "axios";
import { useSQLiteContext } from "expo-sqlite"


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
  const [database, setDatabase] = useState("odoo_db2")
  const [adminUsername, setAdminUsername] = useState("")
  const [adminPassword, setAdminPassword] = useState("")
  
  const { signIn, adminLogin, session, error: authError } = useSession()
  const router = useRouter()
  const appDatabase = useSQLiteContext()


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

  

  const handleAdminLogin = async () => {
    console.log('Admin Login Pressed')
    if (!adminUsername || !adminPassword) {
      setLoginError("Please enter both admin username and password")
      return
    }
    await SecureStore.setItemAsync('odoo_server_ip', serverIP);
    await SecureStore.setItemAsync('odoo_database', database);
    
    setIsLoggingIn(true)
    setLoginError(null)
    
    try {
      const success = await adminLogin(adminUsername, adminPassword)
      if (success) {
        // Navigate to main app
        console.log('Admin Login Success')
        getUsers()
        // router.replace("/(auth)/login")
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

const getUsers = async () => {
    console.log('Getting Users In Progress');
    console.log('Session ID:', session?.session_id);
    
    try {
      let serverIp = await SecureStore.getItemAsync('odoo_server_ip');
      console.log('Server IP:', serverIp);
      
      if (!serverIp) {
        throw new Error('Server IP not configured');
      }
      
      if (!serverIp.startsWith('http')) {
        serverIp = `http://${serverIp}`;
      }
      
      // Change method to POST
      const options = {
        method: 'POST',  // Changed from GET to POST
        url: `${serverIp}/web/dataset/call_kw`,
        headers: {
          cookie: `session_id=${session?.session_id}; frontend_lang=en_GB`,
          'Content-Type': 'application/json',
          'User-Agent': 'insomnia/11.0.2'
        },
        data: {
          jsonrpc: '2.0',
          method: 'call',
          params: {
            model: 'hr.employee',
            method: 'search_read',
            args: [
              [],
              [
                'id',
                'name',
                'work_phone',
                'mobile_app_password'
              ]
            ],
            kwargs: {context: {}}
          },
          id: 1
        }
      };
      
      const response = await axios.request(options);
      
      if (response.data.error) {
        throw new Error(`Odoo API Error: ${response.data.error.message}`);
      }
      
      console.log('Prime DB Success - Response:', response.data);
      if (response.data.result && Array.isArray(response.data.result)) {
        primeDB(response.data.result);
        router.replace("/(auth)/login"); // Only redirect after successful insert
      } else {
        console.log('No employees found or invalid response format');
        setLoginError('No employee data found to import');
      }
      // router.replace("/(auth)/login");
      
    } catch (error) {
      console.error('Prime DB Failed');
      
      if (axios.isAxiosError(error)) {
        if (error.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          console.error('Error Response:', {
            status: error.response.status,
            data: error.response.data,
            headers: error.response.headers
          });
          setLoginError(`Server Error: ${error.response.status} - ${error.response.data?.error?.message || 'Unknown error'}`);
        } else if (error.request) {
          // The request was made but no response was received
          console.error('No Response Received:', error.request);
          setLoginError('No response from server. Please check your connection and server IP.');
        } else {
          // Something happened in setting up the request that triggered an Error
          console.error('Request Setup Error:', error.message);
          setLoginError(`Request Error: ${error.message}`);
        }
      } else {
        // Handle non-axios errors
        console.error('Non-Axios Error:', error);
        setLoginError(`Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`);
      }
    }
  };

  const primeDB = async (employees: Employee[]) => {
    console.log('Prime DB In Progress - Processing', employees.length, 'employees');
    
    try {      
      
      // Process all employees
      if (employees.length === 0) {
        console.log('No employees found');
        return;
      }

      // Clear Table First
      if (employees.length > 0) {
        console.log('Clearing Table');
        await appDatabase.execAsync('DELETE FROM users');
      }


      for (const employee of employees) {
        await appDatabase.runAsync(
          `INSERT INTO users (id, name, work_phone, mobile_app_password) 
           VALUES (?, ?, ?, ?)`, 
          [employee.id, employee.name, employee.work_phone, employee.mobile_app_password]
        );
      }
      
      console.log('Successfully inserted', employees.length, 'employees');
      router.replace("/(auth)/login");
    } catch (error) {
      // Rollback on error
      await appDatabase.execAsync('ROLLBACK');
      console.error('Error inserting employees:', error);
      setLoginError(`Database error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }


  // const saveServerSettings = async () => {
  //   if (!serverIP) {
  //     Alert.alert("Error", "Please enter a valid server IP address");
  //     return;
  //   }
    
  //   if (!database) {
  //     Alert.alert("Error", "Please enter a database name");
  //     return;
  //   }
    
  //   try {
  //     await SecureStore.setItemAsync('odoo_server_ip', serverIP);
  //     await SecureStore.setItemAsync('odoo_database', database);
  //     Alert.alert("Success", "Server settings saved successfully");
  //     setShowServerSettings(false);
  //   } catch (err) {
  //     Alert.alert("Error", "Failed to save server settings");
  //     console.error(err);
  //   }
  // }

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
          <Text className="text-2xl font-bold text-gray-500 dark:text-white">Welcome</Text>
          <Text className="text-[#1AD3BB] dark:text-gray-400 text-center mt-2">Sign in to your account and prime the database</Text>
          
          {loginError && (
            <View className="mt-2 mb-2 p-2 bg-red-100 rounded-md w-full">
              <Text className="text-red-600 text-center">{loginError}</Text>
            </View>
          )}
        </View>

        
          <View className="mb-5">
            <Text className="font-bold text-gray-700 mb-2">Server Configuration</Text>
            <View className="flex-row items-center rounded-md m-3 border-2 border-[#65435C] px-2">
              <Mail size={20} color="#1AD3BB" />
              <TextInput 
                value={adminUsername} 
                onChangeText={setAdminUsername} 
                placeholder="Enter Admin Username"
                className="flex-1 p-2"
                autoCapitalize="none"
              />
            </View>
            <View className="flex-row items-center rounded-md m-3 border-2 border-[#65435C] px-2">
              <Lock size={20} color="#1AD3BB" />
              <TextInput 
                value={adminPassword} 
                onChangeText={setAdminPassword} 
                placeholder="Enter Admin Password"
                className="flex-1 p-2"
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
                onPress={() => router.push('/(auth)/login')}
              >
                <Text className="text-white text-center">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                className="bg-[#1AD3BB] rounded-md p-2 flex-1 ml-2"
                onPress={handleAdminLogin}
              >
                <Text className="text-white text-center">Prime</Text>
              </TouchableOpacity>
            </View>
          </View>
        
        
        <TouchableOpacity 
          className="mt-4" 
          onPress={() => router.push('/(auth)/login')}
        >
          <Text className="text-[#1AD3BB] text-center">
            Field Officer Login
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
