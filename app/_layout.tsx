import { Slot, SplashScreen } from 'expo-router';
import { SessionProvider } from '../authContext'
import '../globals.css'
import { useFonts } from 'expo-font';
import { useEffect } from 'react';
import {SQLiteDatabase, SQLiteProvider} from 'expo-sqlite'
import { NetworkProvider } from '../NetworkContext'
export default function Root() {

    const [loaded] = useFonts({
      SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    });
  
    useEffect(() => {
      if (loaded) {
        SplashScreen.hideAsync();
      }
    }, [loaded]);
  
    if (!loaded) {
      return null;
    }
const createDbIfNeeded = async (db: SQLiteDatabase) => {
  console.log('Creating DB if needed')
  await db.execAsync(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER, 
    name TEXT, 
    work_phone TEXT, 
    mobile_app_password TEXT)`);
  await db.execAsync(`CREATE TABLE IF NOT EXISTS growers (
      id INTEGER, 
      first_name TEXT, 
      surname TEXT)`);
}


  // Set up the auth context and render our layout inside of it.
  return (
    <SessionProvider>
      <SQLiteProvider databaseName="app.db" onInit={createDbIfNeeded}>
        <NetworkProvider>
          <Slot />
        </NetworkProvider>
      </SQLiteProvider>
    </SessionProvider>
  );
}