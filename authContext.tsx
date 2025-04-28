import { useContext, createContext, type PropsWithChildren, ReactNode, useState, useEffect } from 'react';
import { useStorageState } from './useStorageState';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Define a type for the Odoo user data
interface OdooUserData {
  uid: number;
  name: string;
  username: string;
  partner_id: number;
  is_admin: boolean;
  session_id?: string;
}

// Default values for Odoo connection
const DEFAULT_API_URL = 'http://192.168.10.244:8069';
const DEFAULT_DB = 'odoo_db2';

const AuthContext = createContext<{
  signIn: (login: string, password: string) => Promise<boolean>;
  signOut: () => void;
  session?: OdooUserData | null;
  isLoading: boolean;
  error: string | null;
}>({
  signIn: async () => false,
  signOut: () => null,
  session: null,
  isLoading: false,
  error: null,
});

// This hook can be used to access the user info.
export function useSession() {
  const value = useContext(AuthContext);
  if (process.env.NODE_ENV !== 'production') {
    if (!value) {
      throw new Error('useSession must be wrapped in a <SessionProvider />');
    }
  }

  return value;
}

export function SessionProvider({ children }: PropsWithChildren): ReactNode {
  const [[isLoading, session], setSession] = useStorageState('session');
  const [error, setError] = useState<string | null>(null);

  // Store the session ID in secure storage
  const storeSessionId = async (sessionId: string) => {
    await SecureStore.setItemAsync('odoo_session_id', sessionId);
  };

  // Get session ID from secure storage
  const getSessionId = async () => {
    return await SecureStore.getItemAsync('odoo_session_id');
  };

  // Get the server URL from secure storage
  const getServerUrl = async (): Promise<string> => {
    try {
      const serverIp = await SecureStore.getItemAsync('odoo_server_ip');
      if (serverIp) {
        // If it doesn't start with http, add it
        if (!serverIp.startsWith('http')) {
          return `https://${serverIp}`;
        }
        return serverIp;
      }
    } catch (error) {
      console.error('Error getting server URL:', error);
    }
    return DEFAULT_API_URL;
  };

  // Get the database name from secure storage
  const getDatabase = async (): Promise<string> => {
    try {
      const db = await SecureStore.getItemAsync('odoo_database');
      if (db) {
        return db;
      }
    } catch (error) {
      console.error('Error getting database name:', error);
    }
    return DEFAULT_DB;
  };

  return (
    <AuthContext.Provider
      value={{
        signIn: async (login: string, password: string) => {
          setError(null);
          try {
            // Get the server URL and database
            const apiBaseUrl = await getServerUrl();
            const database = await getDatabase();
            
            console.log('Making request to:', `${apiBaseUrl}/web/session/authenticate`);
            console.log('Using database:', database);
            
            const options = {
              method: 'POST',
              url: `${apiBaseUrl}/web/session/authenticate`,
              headers: {
                'Content-Type': 'application/json',
              },
              data: {
                jsonrpc: '2.0',
                params: {
                  db: database,
                  login,
                  password
                }
              }
            };

            const response = await axios.request(options);
            
            // Extract the session ID cookie from the response
            const cookies = response.headers['set-cookie'];
            let sessionId = '';
            
            if (cookies && cookies.length) {
              // Find and extract the session_id cookie
              const sessionCookie = cookies.find((cookie: string) => cookie.includes('session_id='));
              if (sessionCookie) {
                sessionId = sessionCookie.split(';')[0].split('=')[1];
                // Store the session ID securely
                await storeSessionId(sessionId);
              }
            }
            
            if (response.data && response.data.result) {
              // Save important user data
              const userData: OdooUserData = {
                uid: response.data.result.uid,
                name: response.data.result.name,
                username: response.data.result.username,
                partner_id: response.data.result.partner_id,
                is_admin: response.data.result.is_admin,
                session_id: sessionId
              };
              
              // Store the user data
              setSession(JSON.stringify(userData));
              return true;
            } else {
              setError('Invalid response from server');
              return false;
            }
          } catch (error) {
            console.error('Login error:', error);
            setError(error instanceof Error ? error.message : 'Authentication failed');
            return false;
          }
        },
        signOut: async () => {
          // Clear session from secure storage
          await SecureStore.deleteItemAsync('odoo_session_id');
          setSession(null);
        },
        session: session ? JSON.parse(session) : null,
        isLoading,
        error,
      }}>
      {children}
    </AuthContext.Provider>
  );
}
