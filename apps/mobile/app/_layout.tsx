import React from 'react';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {StatusBar} from 'expo-status-bar';
import {SessionProvider} from '../src/session';
import Navigation from '../src/navigation';
export default function Layout(){return <SafeAreaProvider><SessionProvider><StatusBar style='dark'/><Navigation/></SessionProvider></SafeAreaProvider>;}
