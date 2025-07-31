"use client"

import React, { useState, useEffect, useCallback } from "react"
import { View, Text, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Button, TextInput, ActivityIndicator, Alert } from "react-native"
import {Image} from "expo-image"
import { Eye, EyeOff, Mail, Lock, Settings, Database } from "lucide-react-native"
import { useSession } from "@/authContext"
import { useFocusEffect, useRouter } from "expo-router"
import * as SecureStore from 'expo-secure-store';
import axios from "axios";
import { powersync } from "@/powersync/system";
import { Connector } from "@/powersync/Connector";


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
  const [powerSyncURI, setPowerSyncURI] = useState("")
  const [downloadProgress, setDownloadProgress] = useState(0)
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncStatusText, setSyncStatusText] = useState("")

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
    await SecureStore.setItemAsync('odoo_server_ip', serverIP);
    await SecureStore.setItemAsync('odoo_database', database);
    
    setIsLoggingIn(true)
    setLoginError(null)
    
    try {
      const success = await adminLogin(adminUsername, adminPassword, powerSyncURI)
      if (success) {
        // Navigate to main app
        console.log('Admin Login Success')
        const connector = new Connector();
        
        // Listen for sync completion before checking for users
        setIsSyncing(true);
        setSyncStatusText("Connecting to PowerSync...");
        
        const unregister = powersync.registerListener({
          statusChanged: (status) => {
            console.log('🔄 PowerSync status during admin login:', {
              connected: status.connected,
              lastSyncedAt: status.lastSyncedAt,
              downloadProgress: status.downloadProgress
            });
            
            // Update progress bar
            if (status.downloadProgress && typeof status.downloadProgress === 'number') {
              setDownloadProgress(status.downloadProgress * 100);
              setSyncStatusText(`Downloading data... ${Math.round(status.downloadProgress * 100)}%`);
            } else if (status.connected && !status.lastSyncedAt) {
              setSyncStatusText("Connected, preparing to sync...");
              setDownloadProgress(10);
            } else if (!status.connected) {
              setSyncStatusText("Connecting to PowerSync...");
              setDownloadProgress(5);
            }
            
            // Only check for users once we're connected AND have synced data
            if (status.connected && status.lastSyncedAt) {
              console.log('✅ PowerSync connected and synced - checking for employees');
              setSyncStatusText("Sync complete! Loading employees...");
              setDownloadProgress(100);
              
              setTimeout(() => {
                setIsSyncing(false);
                unregister(); // Stop listening once we've synced
                getUsers();
              }, 500);
            }
          }
        });
        
        const currentStatus = powersync.connect(connector);
        console.log('Current Status:', currentStatus);
        
        // Also check if already connected (in case connection was instant)
        setTimeout(() => {
          const status = powersync.currentStatus;
          if (status?.connected && status?.lastSyncedAt) {
            console.log('💡 Already connected and synced - checking employees immediately');
            setSyncStatusText("Already synced! Loading employees...");
            setDownloadProgress(100);
            setTimeout(() => {
              setIsSyncing(false);
              unregister();
              getUsers();
            }, 500);
          }
        }, 1000);
      } else {
        console.log('Admin Login Failed')
        console.log(authError)
        setLoginError(authError || "Login failed. Please check your credentials.")
        setIsSyncing(false);
        setDownloadProgress(0);
        setSyncStatusText("");
      }
    } catch (err) {
      setLoginError("An error occurred during login")
      console.error(err)
      setIsSyncing(false);
      setDownloadProgress(0);
      setSyncStatusText("");
    } finally {
      setIsLoggingIn(false)
    }
  }

const getUsers = async () => {    
  console.log('Getting All HR Employees');
  
  // First check if table exists and has structure
  try {
    // Check PowerSync system status
    console.log('PowerSync status:', powersync.currentStatus);
    
    // Check tables in PowerSync
    const tables = await powersync.execute('SELECT name FROM sqlite_master WHERE type="table"');
    console.log('Available tables:', tables);
    
    // Check table structure
    const tableInfo = await powersync.execute('PRAGMA table_info(hr_employee)');
    console.log('HR employee table structure:', tableInfo);
  } catch (error) {
    console.error('Error checking PowerSync structure:', error);
  }
  
  // Option 1: Use with callback (easier)
  powersync.getAll(
    'SELECT * from hr_employee' 
  ).then((result) => {
    console.log('Employee data count:', result?.length || 0);
    console.log('First employee (if any):', result?.[0] || 'No employees found');
    console.log('Employee data:', result);
    
    if (!result || result.length === 0) {
      console.log('No employee data found - checking for sync errors');
      setIsSyncing(false);
      setDownloadProgress(0);
      setSyncStatusText("");
      // Don't navigate if no data found
      alert('No employee data found. Check network connection and try again.');
    } else {
      setIsSyncing(false);
      setDownloadProgress(0);
      setSyncStatusText("");
      router.replace('/login');
    }
  }).catch((error) => {
    console.error('Error fetching employee data:', error);
    setIsSyncing(false);
    setDownloadProgress(0);
    setSyncStatusText("");
    alert(`Error fetching employee data: ${error.message}`);
  });
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
                onChangeText={setServerIP} 
                placeholder="Enter Server IP (e.g. 192.168.1.100:8069)"
                className="flex-1 p-3.5"
                autoCapitalize="none"
              />
            </View>
            
            <View className="flex-row items-center rounded-md m-3 border-2 border-[#65435C] px-2">
              <Database size={20} color="#1AD3BB" />
              <TextInput 
                value={database} 
                onChangeText={setDatabase} 
                placeholder="Enter Database Name"
                className="flex-1 p-3.5"
                autoCapitalize="none"
              />
            </View>

            <View className="flex-row items-center rounded-md m-3 border-2 border-[#65435C] px-2">
              <Mail size={20} color="#1AD3BB" />
              <TextInput
                value={adminUsername} 
                onChangeText={setAdminUsername} 
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
                onChangeText={setPowerSyncURI} 
                placeholder="PowerSync URI"
                className="flex-1 p-3.5"
                autoCapitalize="none"
              />
            </View>
            
            {/* Progress Bar */}
            {isSyncing && (
              <View className="mx-3 mb-4">
                <Text className="text-sm text-[#65435C] mb-2">{syncStatusText}</Text>
                <View className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <View 
                    className="h-full bg-[#1AD3BB] rounded-full transition-all duration-300"
                    style={{ width: `${downloadProgress}%` }}
                  />
                </View>
              </View>
            )}
            
            <View className="flex-row justify-between">
              <TouchableOpacity 
                className="bg-[#1AD3BB] rounded-md p-2 flex-1 mr-2"
                onPress={() => router.push('/(auth)/login')}
              >
                <Text className="text-white text-center">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                className={`rounded-md p-2 flex-1 ml-2 ${
                  isSyncing || isLoggingIn 
                    ? 'bg-gray-400' 
                    : 'bg-[#65435C]'
                }`}
                onPress={handleAdminLogin}
                disabled={isSyncing || isLoggingIn}
              >
                <Text className="text-white text-center">
                  {isSyncing ? 'Syncing...' : isLoggingIn ? 'Priming...' : 'Prime'}
                </Text>
              </TouchableOpacity>
            </View>
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
