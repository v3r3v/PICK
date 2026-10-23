import React,{useState} from 'react';
import {View,useWindowDimensions} from 'react-native';
import {assignments} from '@pick/contracts';
import {VehicleArt} from './vehicle-art';
import {catalogFor} from './vehicle-catalog';
import {Button,Copy,Heading,colors} from './ui';

export function VehicleGallery(){
 const [open,setOpen]=useState(false),{width}=useWindowDimensions();
 return <View style={{gap:16}}><Heading>Car model gallery</Heading><Copy muted>Five generated model illustrations. Compare body shape, then verify the driver and written plate. Viewing these examples does not change the queue.</Copy>
  <Button label={open?'Hide car model gallery':'Show all five car models'} secondary onPress={()=>setOpen(!open)}/>
  {open&&<View style={{flexDirection:'row',flexWrap:'wrap',gap:16}}>{assignments.filter(a=>a.schoolId==='school-a').map(a=><View key={a.vehicle.id} style={{width:width>=1000?'31%':width>=650?'47%':'100%',padding:16,gap:6,backgroundColor:colors.white,borderRadius:12}}><VehicleArt vehicle={a.vehicle} large/><Heading>{a.vehicle.model}</Heading><Copy>{a.vehicle.color} · {a.vehicle.plate}</Copy><Copy muted style={{fontSize:13}}>{catalogFor(a.vehicle)?.generation}</Copy></View>)}</View>}
  {open&&<Copy muted style={{fontSize:12}}>Representative generated artwork, not OEM imagery or photos of the assigned vehicles. Generation and trim details are approximate.</Copy>}
 </View>;
}
