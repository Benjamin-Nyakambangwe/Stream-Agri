import { Slot, SplashScreen } from 'expo-router';
import { SessionProvider } from '../authContext'
import '../globals.css'
import { useFonts } from 'expo-font';
import { useEffect } from 'react';
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


  // Set up the auth context and render our layout inside of it.
  return (
    <SessionProvider>
        <NetworkProvider>
          <Slot />
        </NetworkProvider>
    </SessionProvider>
  );
}