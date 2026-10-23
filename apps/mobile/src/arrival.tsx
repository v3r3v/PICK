import React,{useState} from 'react';
import * as Location from 'expo-location';
import {simulatedSample,type LocationSample} from '@pick/contracts';
import {useDemo} from './session';
import {Panel,Heading,Copy,Button} from './ui';
export async function foregroundSample(zoneVersion:number):Promise<LocationSample>{
 const permission=await Location.requestForegroundPermissionsAsync();
 if(permission.status!=='granted')throw new Error('Location permission denied. You can try again or ask gate staff to record a physical arrival.');
 const sample=await Promise.race([Location.getCurrentPositionAsync({accuracy:Location.Accuracy.High}),new Promise<never>((_,reject)=>setTimeout(()=>reject(new Error('Location is taking too long. Try again from the approved waiting area.')),15000))]);
 return {latitude:sample.coords.latitude,longitude:sample.coords.longitude,accuracy:sample.coords.accuracy,timestamp:sample.timestamp,zoneVersion,source:'device'};
}
export function ArrivalCheckIn(){
 const {client,snapshot:s,queue,session,locationMode,connected,busy,pending}=useDemo();const [locating,setLocating]=useState(false),[message,setMessage]=useState('');
 if(!s||!queue?.zone)return null;
 const visit=queue.items.find(v=>v.tripId===s.tripId),announced=!!visit?.announcedAt;
 const eligible=s.availableActions.includes('request_arrival');
 async function announce(){
  if(!s||!queue?.zone||!session)return;
  const token=session.token,tripId=s.tripId;setLocating(true);setMessage('');
  try{const sample=locationMode==='device'?await foregroundSample(queue.zone.version):simulatedSample(queue.zone,locationMode);
   if(client.state.session?.token!==token||client.state.snapshot?.tripId!==tripId)return;
   await client.execute('request_arrival',sample);
  }catch(e){setMessage(e instanceof Error?e.message:'Location could not be measured.');}finally{setLocating(false);}
 }
 return <Panel><Heading>{announced?'Arrival announced':'Arrival check-in'}</Heading><Copy>{announced?`${visit?.confirmedAt?'Gate confirmed your vehicle.':'Waiting for gate staff to physically match your vehicle.'}${visit?.position?` Recorded lane position ${visit.position}.`:''}`:'Park in the approved waiting area. A fresh location reading only qualifies your announcement; gate staff confirm identity and physical order.'}</Copy>
  {!announced&&<><Copy muted>{locationMode==='device'?`Foreground device reading · demo zone radius ${queue.zone.radius} m`:`SIMULATED ${locationMode} sample · change in Demo tools`}</Copy><Button label={locating?'Locating…':"I'm here — parked"} disabled={!eligible||!connected||busy||!!pending||locating} onPress={()=>{void announce();}}/>{!eligible&&<Copy muted>{s.hold?'Pickup held. Gate staff can record the physically present vehicle; the hold still blocks release.':!s.accepted?'Accept the approved assignment first.':'Begin approach while parked before announcing arrival.'}</Copy>}</>}
  {!!message&&<Copy accessibilityRole="alert">{message}</Copy>}
 </Panel>;
}
