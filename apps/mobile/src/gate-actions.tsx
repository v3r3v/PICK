import React,{useState} from 'react';
import {TextInput} from 'react-native';
import {useDemo} from './session';
import {Panel,Heading,Copy,Button,colors} from './ui';
export function GateVisitActions(){
 const {client,snapshot,queue,connected,busy,pending}=useDemo();const [reason,setReason]=useState('');
 const v=queue?.items.find(v=>v.tripId===snapshot?.tripId);if(!v)return null;
 return <Panel><Heading>Physical lane record</Heading><Copy>{v.status}{v.position?` · position ${v.position}`:''}. Record what you see; do not direct a car to overtake.</Copy><TextInput accessibilityLabel="Reason for manual arrival or physical exception move" placeholder="Reason for the observed exception or manual arrival" value={reason} onChangeText={setReason} multiline maxLength={240} style={{minHeight:56,borderWidth:1,borderColor:colors.line,borderRadius:8,padding:12,color:colors.ink,fontSize:16}}/>
  {(!v.announcedAt||v.position||v.exception)&&<Button label={!v.announcedAt?'I matched driver and vehicle · manual arrival':v.exception?'Vehicle physically rejoined rear of lane':'Vehicle physically moved to exception area'} secondary disabled={!connected||busy||!!pending||reason.trim().length<8} onPress={()=>{void client.executeQueue({action:!v.announcedAt?'manual_arrival':v.exception?'restore':'exception',visitId:v.visitId,reason});}}/>}
 </Panel>;
}
