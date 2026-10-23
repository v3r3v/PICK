import React,{useEffect,useState} from 'react';
import {Image,View} from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import type {Vehicle} from '@pick/contracts';
import {catalogFor} from './vehicle-catalog';
import {Copy,colors} from './ui';

export function VehicleArt({vehicle,large=false}:{vehicle:Vehicle;large?:boolean}){
 const entry=catalogFor(vehicle),[failed,setFailed]=useState(false);
 useEffect(()=>setFailed(false),[entry?.source]);
 const label=entry&&!failed?`Generated model illustration: ${vehicle.color} ${vehicle.model}, ${entry.generation}`:`Generic vehicle placeholder. Model illustration unavailable for ${vehicle.color} ${vehicle.model}`;
 return <View style={large?{width:'100%',maxWidth:480,aspectRatio:1.5,alignSelf:'center'}:{width:118,height:84,flexShrink:0}}>
  {entry&&!failed?<Image source={entry.source} accessibilityLabel={label} resizeMode="contain" fadeDuration={0} onError={()=>setFailed(true)} style={{width:'100%',height:'100%'}}/>
   :<View accessible accessibilityLabel={label} style={{flex:1,alignItems:'center',justifyContent:'center',gap:4,backgroundColor:colors.paper,borderRadius:8}}><Feather name="truck" size={large?48:28} color={colors.muted}/><Copy muted style={{fontSize:12,lineHeight:16,textAlign:'center'}}>Generic vehicle</Copy><Copy muted style={{fontSize:11,lineHeight:14,textAlign:'center'}}>Image unavailable</Copy></View>}
 </View>;
}
export function DriverAvatar({name}:{name:string}){return <View accessible accessibilityLabel={`Synthetic avatar for ${name}`} style={{width:42,height:42,borderRadius:21,backgroundColor:colors.brandPale,alignItems:'center',justifyContent:'center'}}><Copy style={{fontWeight:'700'}}>{name.split(' ').slice(0,2).map(x=>x[0]).join('')}</Copy></View>;}