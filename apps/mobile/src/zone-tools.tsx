import React,{useState} from 'react';
import {TextInput} from 'react-native';
import {type DemoLocationMode,type PickupZone} from '@pick/contracts';
import {useDemo} from './session';
import {foregroundSample} from './arrival';
import {Panel,Heading,Copy,Button,colors} from './ui';
export function ZoneTools(){
 const {client,session,queue,locationMode,busy,connected}=useDemo();const [radius,setRadius]=useState('100'),[draft,setDraft]=useState<Omit<PickupZone,'id'|'version'>|null>(null),[message,setMessage]=useState(''),[locating,setLocating]=useState(false);
 return <>
  {session?.account.role==='driver'&&<Panel><Heading>Arrival location source</Heading><Copy>Device readings request foreground permission only when you choose check-in. Simulated samples never access device location.</Copy>{(['device','inside','outside','stale','inaccurate'] as DemoLocationMode[]).map(mode=><Button key={mode} label={`${locationMode===mode?'Selected · ':''}${mode==='device'?'Actual foreground device location':`SIMULATED ${mode} sample`}`} secondary onPress={()=>client.setLocationMode(mode)}/>)}</Panel>}
  {session?.account.role==='gate'&&queue?.zone&&<Panel><Heading>Configure the DEMO waiting zone</Heading><Copy>This is a review-only waiting/check-in area, not a validated school location. Radius currently {queue.zone.radius} m; version {queue.zone.version}. Source: {queue.zone.source==='synthetic'?'synthetic fixture':'reviewer explicitly selected location'}.</Copy>
   <Copy>Radius in meters (25–500)</Copy><TextInput accessibilityLabel="Demo pickup zone radius in meters" keyboardType="numeric" value={radius} onChangeText={setRadius} style={{borderWidth:1,borderColor:colors.line,borderRadius:8,padding:12,minHeight:48,fontSize:16,color:colors.ink}}/>
   <Button label="Review synthetic zone settings" secondary onPress={()=>setDraft({latitude:18.45,longitude:-66.08,radius:Number(radius),source:'synthetic'})}/>
   <Button label={locating?'Measuring location…':'Use my current location for the DEMO zone'} secondary disabled={locating||busy} onPress={()=>{void(async()=>{setLocating(true);setMessage('');const token=session.token;try{const sample=await foregroundSample(queue.zone!.version);if(client.state.session?.token!==token)return;if(sample.accuracy===null||sample.accuracy>25||Date.now()-sample.timestamp>30000)throw new Error('A fresh reading accurate within 25 meters is required.');setDraft({latitude:sample.latitude,longitude:sample.longitude,radius:Number(radius),source:'reviewer'});}catch(e){setMessage(e instanceof Error?e.message:'Could not measure location.');}finally{setLocating(false);}})();}}/>
   {!!message&&<Copy accessibilityRole="alert">{message}</Copy>}
   {draft&&<><Heading>Save this demo zone?</Heading><Copy>{draft.source==='reviewer'?'This explicitly saves your measured location in the private local demo database. It will not become a committed school fixture or appear in teacher views.':'This uses the synthetic fixture center.'} Radius: {draft.radius} m. Existing announcements remain accepted.</Copy><Button label="Confirm demo zone settings" disabled={!connected||busy} onPress={()=>{void client.executeQueue({action:'zone',zone:draft});setDraft(null);}}/><Button label="Discard zone change" secondary onPress={()=>setDraft(null)}/></>}
  </Panel>}
 </>;
}
