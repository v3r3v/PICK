import React from 'react';
import {View,StyleSheet} from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import {useDemo} from '../src/session';
import {Screen,Title,Copy,Panel,colors} from '../src/ui';
import {AccountPicker} from '../src/accounts';
export default function Timeline() {
  const {snapshot,session,queue}=useDemo();
  return <Screen><Title>The afternoon, recorded.</Title><Copy muted>Confirmed events from the shared trip. An open handoff stays open until both adults confirm.</Copy>{session?.account.role==='gate'&&queue&&<Panel><Copy style={{fontWeight:'700'}}>Shared lane audit</Copy>{queue.events.map(event=><View key={event.id} style={{gap:4,paddingVertical:8}}><Copy>{event.message}</Copy><Copy muted>{event.actor} · {new Date(event.at).toLocaleTimeString()}</Copy></View>)}</Panel>}{!session?<AccountPicker/>:!snapshot?<Panel><Copy>Waiting for the server’s history.</Copy></Panel>:<Panel>{[...snapshot.timeline].reverse().map((event,i)=><View key={event.id} style={{flexDirection:'row',gap:16}}><View style={{alignItems:'center',width:24}}><Feather name={event.type.includes('Disputed')||event.type.includes('Revoked')?'alert-circle':'check-circle'} size={21} color={colors.brand}/>{i<snapshot.timeline.length-1&&<View style={{width:1,backgroundColor:colors.line,flex:1,marginTop:8}}/>}</View><View style={{flex:1,gap:6,paddingBottom:24,borderBottomWidth:StyleSheet.hairlineWidth,borderColor:colors.line}}><Copy style={{fontWeight:'600'}}>{event.message}</Copy><Copy muted style={{fontSize:13}}>{event.actor} · {new Date(event.at).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit',second:'2-digit'})}</Copy></View></View>)}</Panel>}</Screen>;
}
