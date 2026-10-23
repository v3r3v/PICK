import React from 'react';
import {Tabs} from 'expo-router/js-tabs';
import Feather from '@expo/vector-icons/Feather';
import {SafeAreaView} from 'react-native-safe-area-context';
import {colors} from './ui';
export default function Navigation(){return <SafeAreaView style={{flex:1,backgroundColor:colors.paper}} edges={['top','left','right']}><Tabs screenOptions={{headerShown:false,tabBarActiveTintColor:colors.brand,tabBarStyle:{minHeight:64,paddingTop:7},tabBarLabelStyle:{fontSize:12}}}>{[['index','Today / Queue','sun'],['timeline','Timeline','clock'],['demo','Demo tools','sliders']].map(([name,title,icon])=><Tabs.Screen key={name} name={name} options={{title,tabBarIcon:({color,size})=><Feather name={icon as 'sun'} color={typeof color==='string'?color:colors.muted} size={size}/>}}/>)}</Tabs></SafeAreaView>;}
