import React,{useEffect,useState} from 'react';
import {AccessibilityInfo} from 'react-native';
import {NativeTabs} from 'expo-router/unstable-native-tabs';
import {useDemo} from './session';
import {colors} from './ui';
export default function Navigation(){
 const {dragging}=useDemo();const [reduceTransparency,setTransparency]=useState(false),[reduceMotion,setMotion]=useState(false);
 useEffect(()=>{void AccessibilityInfo.isReduceTransparencyEnabled().then(setTransparency);void AccessibilityInfo.isReduceMotionEnabled().then(setMotion);const t=AccessibilityInfo.addEventListener('reduceTransparencyChanged',setTransparency),m=AccessibilityInfo.addEventListener('reduceMotionChanged',setMotion);return()=>{t.remove();m.remove();};},[]);
 return <NativeTabs tintColor={colors.brand} minimizeBehavior={dragging||reduceMotion?'never':'onScrollDown'} {...(reduceTransparency?{backgroundColor:colors.white,blurEffect:'none' as const}:{})}>
  <NativeTabs.Trigger name="index"><NativeTabs.Trigger.Label>Today / Queue</NativeTabs.Trigger.Label><NativeTabs.Trigger.Icon sf="car.fill"/></NativeTabs.Trigger>
  <NativeTabs.Trigger name="timeline"><NativeTabs.Trigger.Label>Timeline</NativeTabs.Trigger.Label><NativeTabs.Trigger.Icon sf="clock"/></NativeTabs.Trigger>
  <NativeTabs.Trigger name="demo"><NativeTabs.Trigger.Label>Demo tools</NativeTabs.Trigger.Label><NativeTabs.Trigger.Icon sf="slider.horizontal.3"/></NativeTabs.Trigger>
 </NativeTabs>;
}
