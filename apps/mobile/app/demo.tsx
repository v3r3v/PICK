import React,{useState} from 'react';
import {View,Pressable} from 'react-native';
import {scenarios,type Scenario} from '@pick/contracts';
import {useDemo} from '../src/session';
import {Screen,Title,Heading,Copy,Panel,Button,Row,colors} from '../src/ui';
import {ZoneTools} from '../src/zone-tools';
import {AccountPicker} from '../src/accounts';
import {VehicleGallery} from '../src/vehicle-gallery';
export default function Demo() {
  const {client,snapshot,paused,dropNext,busy,queue}=useDemo(); const [reset,setReset]=useState<Scenario|null>(null);
  return <Screen><Title>Review the whole journey.</Title><Copy muted>These tools are only for this synthetic local demo. Switching accounts does not reset anyone’s trip.</Copy><VehicleGallery/><AccountPicker all/>
    <ZoneTools/>{queue?.migrationAvailable&&<Panel><Heading>Add queue fixtures without resetting</Heading><Copy>This adds four synthetic trips and preserves the original afternoon, audit history and sessions. Host computer only.</Copy><Button label="Add four queue review vehicles" disabled={busy} onPress={()=>{void client.migrateQueue();}}/></Panel>}
    <Panel><Heading>Connection and fault checks</Heading><Row label="API" value={client.url}/><Copy muted>Authorized snapshots poll every second while this view is active. Device location is read only when requested. No background tracking or push notifications.</Copy>
      <DemoToggle label="Pause this device’s connection" value={paused} onChange={v=>client.setPaused(v)}/>
      <DemoToggle label="Lose the next command response" value={dropNext} onChange={v=>client.setDropNext(v)}/>
      <Copy muted>The server will commit the next successful action, then drop its response. PICK looks up the receipt instead of sending the action twice.</Copy>
      <Button label="Refresh shared state" secondary onPress={()=>{void client.refresh();}} disabled={paused}/>
    </Panel>
    <Panel><Heading>Start a review scenario</Heading><Copy muted>Reset affects every connected reviewer and expires all demo sessions. Run it from the computer hosting PICK.</Copy>{scenarios.map(s=><View key={s.id} style={{gap:8}}><Button label={s.title} secondary disabled={busy} onPress={()=>setReset(s.id)}/><Copy muted style={{fontSize:13}}>{s.detail}</Copy></View>)}
      {reset&&<View style={{gap:12,backgroundColor:colors.amberPale,padding:16,borderRadius:12}}><Heading>Reset everyone’s demo?</Heading><Copy>Current trip history will be replaced with the selected synthetic scenario. All participants must choose an account again.</Copy><Button label="Reset shared demo" danger disabled={busy} onPress={()=>{void client.reset(reset);setReset(null);}}/><Button label="Cancel reset" secondary onPress={()=>setReset(null)}/></View>}
    </Panel>
    {snapshot&&<Panel><Heading>Technical state</Heading><Row label="Trip / revision" value={`${snapshot.tripId} / ${snapshot.version}`}/><Row label="Assignment revision" value={String(snapshot.assignmentRevision)}/><Row label="Pickup" value={snapshot.pickup}/><Row label="Vehicle visit" value={snapshot.visit}/><Row label="Trip" value={snapshot.trip}/><Row label="Passenger" value={snapshot.passenger}/><Row label="Custody certainty" value={snapshot.certainty}/><Copy muted>Audit events are appended in SQLite with state changes. This local database is not tamper-proof.</Copy></Panel>}
  </Screen>;
}

function DemoToggle({label,value,onChange}: {label:string;value:boolean;onChange:(value:boolean)=>void}) {
  return <Pressable accessibilityRole="switch" accessibilityLabel={label} accessibilityState={{checked:value}} onPress={()=>onChange(!value)} style={{flexDirection:'row',alignItems:'center',gap:16,minHeight:48}}>
    <Copy style={{flex:1}}>{label}</Copy><View pointerEvents="none" style={{width:44,height:28,borderRadius:14,padding:4,backgroundColor:value?colors.brand:colors.line,alignItems:value?'flex-end':'flex-start'}}><View style={{width:20,height:20,borderRadius:10,backgroundColor:colors.white}}/></View>
  </Pressable>;
}
