import React,{useEffect,useRef,useState} from 'react';
import {View,Pressable,Modal,ScrollView,PanResponder,AccessibilityInfo,useWindowDimensions} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Feather from '@expo/vector-icons/Feather';
import type {QueueItem,QueueSnapshot} from '@pick/contracts';
import {useDemo} from './session';
import {Screen,Title,Heading,Copy,Panel,Button,colors} from './ui';
import {VehicleArt,DriverAvatar} from './vehicle-art';
import TripScreen from './trip-screen';

export function moveOrder(order:string[],id:string,target:number){const next=order.filter(x=>x!==id);next.splice(Math.max(0,Math.min(target,next.length)),0,id);return next;}
function Handle({disabled,onStart,onMove,onEnd,onCancel,label}:{disabled:boolean;onStart:()=>void;onMove:(y:number)=>void;onEnd:()=>void;onCancel:()=>void;label:string}){
 const callbacks=useRef({disabled,onStart,onMove,onEnd,onCancel});callbacks.current={disabled,onStart,onMove,onEnd,onCancel};
 const pan=useRef(PanResponder.create({onStartShouldSetPanResponder:()=>!callbacks.current.disabled,onMoveShouldSetPanResponder:()=>!callbacks.current.disabled,onPanResponderGrant:()=>callbacks.current.onStart(),onPanResponderMove:(_,g)=>callbacks.current.onMove(g.moveY),onPanResponderRelease:()=>callbacks.current.onEnd(),onPanResponderTerminate:()=>callbacks.current.onCancel(),onPanResponderTerminationRequest:()=>false})).current;
 return <View {...pan.panHandlers} accessible accessibilityRole="text" accessibilityLabel={label+' Drag handle. Use Move forward or Move back buttons for accessible reordering.'} style={{width:48,minHeight:64,alignItems:'center',justifyContent:'center',opacity:disabled?.35:1}}><Feather name="menu" size={23} color={colors.muted}/></View>;
}
function Identity({item:v}:{item:QueueItem}){return <View style={{gap:8,flex:1}}><View style={{flexDirection:'row',gap:10,alignItems:'center'}}><VehicleArt vehicle={v.vehicle}/><View style={{flex:1,minWidth:0,gap:5}}><Copy style={{fontWeight:'700',fontSize:18}}>{v.vehicle.model}</Copy><Copy muted>{v.vehicle.color}</Copy><Copy style={{fontWeight:'700'}}>{v.vehicle.plate}</Copy></View></View><View style={{flexDirection:'row',alignItems:'center',gap:8}}><DriverAvatar name={v.driver||'Assigned driver'}/><View style={{flex:1}}><Copy>{v.driver}</Copy><Copy style={{color:v.hold?colors.red:colors.muted,fontSize:13}}>{v.status}</Copy></View></View><Copy muted style={{fontSize:13}}>{v.student} · {v.ready?'Ready':'Not ready'}{v.locked?' · position locked':''}</Copy></View>;}
export function GateQueue(){
 const {client,queue,session,connected,busy,pending,dragging}=useDemo();const {width}=useWindowDimensions();
 const [selected,setSelected]=useState<string|null>(null),[drag,setDrag]=useState<{id:string;target:number;frozen:QueueSnapshot}|null>(null),[retry,setRetry]=useState<{id:string;target:number}|null>(null),[announcement,setAnnouncement]=useState('');
 const dragRef=useRef(drag);dragRef.current=drag;
 const scroll=useRef<ScrollView>(null),lane=useRef<View>(null),offset=useRef(0),origin=useRef(0),startOffset=useRef(0),point=useRef(0),bounds=useRef({top:0,height:600,max:0}),velocity=useRef(0),rows=useRef<Record<string,{y:number;height:number}>>({});
 const active=drag?.frozen||queue;
 const order=(active?.items.filter(v=>v.position!==null).sort((a,b)=>a.position!-b.position!)||[]);
 const disabled=!connected||busy||!!pending;
 function cancel(){setDrag(null);client.setDragging(false);velocity.current=0;}
 async function commit(id:string,target:number,revision:number,ids:string[]){
  setRetry({id,target});const ok=await client.executeQueue({action:'reorder',visitId:id,order:moveOrder(ids,id,target)},revision);
  if(ok){setRetry(null);const text=`${queue?.items.find(v=>v.visitId===id)?.vehicle.plate||'Vehicle'} moved to position ${target+1}.`;setAnnouncement(text);AccessibilityInfo.announceForAccessibility(text);}
 }
 function move(y:number){
  point.current=y;const d=dragRef.current;if(!d)return;
  const items=d.frozen.items.filter(v=>v.position!==null).sort((a,b)=>a.position!-b.position!);
  const relative=y-origin.current+(offset.current-startOffset.current);
  let target=items.findIndex(v=>{const r=rows.current[v.visitId];return r&&relative<r.y+r.height/2;});if(target<0)target=items.length-1;
  if(target!==d.target){const next={...d,target};dragRef.current=next;setDrag(next);}
  velocity.current=y<bounds.current.top+70?-10:y>bounds.current.top+bounds.current.height-110?10:0;
 }
 useEffect(()=>{if(!dragging)return;const timer=setInterval(()=>{if(!velocity.current)return;const next=Math.max(0,Math.min(bounds.current.max,offset.current+velocity.current));scroll.current?.scrollTo({y:next,animated:false});move(point.current);},60);return()=>clearInterval(timer);},[dragging]); // bounded 167 px/s, no animated reorder
 useEffect(()=>{setSelected(null);setDrag(null);setRetry(null);return()=>{client.setDragging(false);};},[client,session?.token]);
 async function inspect(v:QueueItem){setSelected(v.visitId);await client.selectTrip(v.tripId);}
 if(!queue)return <Screen><Title>Opening the gate lane…</Title><Copy>Loading the shared dismissal session.</Copy></Screen>;
 return <><Screen scrollRef={scroll} scrollEnabled={!dragging} onScroll={e=>{offset.current=e.nativeEvent.contentOffset.y;bounds.current.max=Math.max(0,e.nativeEvent.contentSize.height-e.nativeEvent.layoutMeasurement.height);}} scrollEventThrottle={16} onLayout={()=>{scroll.current?.getNativeScrollRef()?.measureInWindow((_x,y,_w,h)=>{bounds.current.top=y;bounds.current.height=h;});}}>
  <Title>Gate queue</Title><Copy muted>Confirm who is here, then record the order you see. A move corrects this record; it never tells a driver to overtake.</Copy>
  {queue.migrationAvailable&&<Panel tone="amber"><Heading>Add the queue review vehicles</Heading><Copy>The original trip is preserved. Add four synthetic assignments from Demo tools on this computer.</Copy></Panel>}
  {!!announcement&&<Copy accessibilityLiveRegion="polite">{announcement}</Copy>}
  {drag&&<Copy accessibilityLiveRegion="polite">Preview only · position {drag.target+1}{queue.revision!==drag.frozen.revision?' · lane changed while dragging; drop will require review':''}</Copy>}
  {retry&&!drag&&<Panel tone="amber"><Heading>Review before retrying this move</Heading><Copy>Move {queue.items.find(v=>v.visitId===retry.id)?.vehicle.plate} to position {retry.target+1} in the latest lane. No move is replayed automatically.</Copy><Button label="Retry this move against the refreshed lane" disabled={disabled} onPress={()=>{void commit(retry.id,retry.target,queue.revision,queue.items.filter(v=>v.position!==null).sort((a,b)=>a.position!-b.position!).map(v=>v.visitId));}}/><Button label="Discard proposed move" secondary onPress={()=>setRetry(null)}/></Panel>}
  <View style={{flexDirection:width>=1050?'row':'column',gap:24,alignItems:'stretch'}}>
   <View ref={lane} style={{flex:width>=1050?1.5:undefined,gap:12}}>
    <View style={{padding:20,borderWidth:2,borderStyle:'dashed',borderColor:colors.brand,borderRadius:12,gap:6}}><Heading>Pickup bay · 1</Heading><Copy>{queue.bayVisitId?queue.items.find(v=>v.visitId===queue.bayVisitId)?.vehicle.plate+' · reserved / occupied':'Available · call the ready front vehicle'}</Copy></View>
    <Copy muted>Confirmed lane · front to rear</Copy>
    {!order.length&&<Copy>No physically confirmed vehicles yet. Match a vehicle from arrivals or record a manual arrival.</Copy>}
    {order.map((v,i)=><View key={v.visitId} onLayout={e=>{rows.current[v.visitId]=e.nativeEvent.layout;}} style={{backgroundColor:colors.white,borderRadius:12,borderWidth:drag?.id===v.visitId?2:1,borderColor:drag?.id===v.visitId?colors.brand:colors.line,padding:12,gap:8}}>
     {drag?.target===i&&<View style={{height:5,backgroundColor:colors.brand,borderRadius:3}}/>}
     <View style={{flexDirection:'row',alignItems:'center'}}><View style={{width:32,alignItems:'center'}}><Copy style={{fontSize:22,fontWeight:'700'}}>{i+1}</Copy></View><Pressable accessibilityRole="button" accessibilityLabel={`Inspect position ${i+1}, ${v.vehicle.color} ${v.vehicle.model}, ${v.vehicle.plate}, ${v.driver}, ${v.status}`} disabled={busy||!!pending} onPress={()=>{void inspect(v);}} style={{flex:1,minHeight:120}}><Identity item={v}/></Pressable><Handle disabled={disabled||v.locked} label={v.vehicle.plate} onStart={()=>{if(!queue)return;startOffset.current=offset.current;lane.current?.measureInWindow((_x,y)=>{origin.current=y;});const d={id:v.visitId,target:i,frozen:queue};dragRef.current=d;setDrag(d);client.setDragging(true);}} onMove={move} onCancel={cancel} onEnd={()=>{const d=dragRef.current;cancel();if(d&&d.target!==i)void commit(d.id,d.target,d.frozen.revision,d.frozen.items.filter(x=>x.position!==null).sort((a,b)=>a.position!-b.position!).map(x=>x.visitId));}}/></View>
     <View style={{flexDirection:'row',gap:8,flexWrap:'wrap'}}><Button label="Forward" accessibilityLabel={`Move ${v.vehicle.plate} forward`} secondary disabled={disabled||v.locked||i===0||dragging} onPress={()=>{void commit(v.visitId,i-1,queue.revision,order.map(x=>x.visitId));}}/><Button label="Back" accessibilityLabel={`Move ${v.vehicle.plate} back`} secondary disabled={disabled||v.locked||i===order.length-1||dragging} onPress={()=>{void commit(v.visitId,i+1,queue.revision,order.map(x=>x.visitId));}}/></View>
    </View>)}
   </View>
   <View style={{flex:width>=1050?1:undefined,gap:16}}>
    {(['arrivals','exception','expected'] as const).map(group=>{const items=queue.items.filter(v=>group==='arrivals'?v.announcedAt&&!v.confirmedAt:group==='exception'?v.exception:!v.announcedAt&&!v.departed);return <View key={group} style={{gap:12}}><Heading>{group==='arrivals'?'Arrivals · not yet matched':group==='exception'?'Exception area':'Expected vehicles'}</Heading>{!items.length&&<Copy muted>{group==='arrivals'?'No unconfirmed announcements.':group==='exception'?'No recorded exception-area moves.':'All expected vehicles have announced.'}</Copy>}{items.map(v=><Pressable key={v.visitId} accessibilityRole="button" accessibilityLabel={`Inspect ${v.vehicle.plate}, ${v.status}`} disabled={busy||!!pending} onPress={()=>{void inspect(v);}} style={{backgroundColor:colors.white,borderRadius:12,padding:16,borderWidth:1,borderColor:colors.line}}><Identity item={v}/><Copy muted style={{fontSize:12,marginTop:8}}>{v.source==='simulated'?'SIMULATED proximity':v.source==='manual'?'Gate-recorded manual arrival':v.source==='device'?'Device proximity · identity unverified':'Tap for details and physical checks'}</Copy></Pressable>)}</View>;})}
   </View>
  </View><Copy muted style={{fontSize:12}}>Model illustrations · verify driver and plate.</Copy>
 </Screen><Modal visible={!!selected} presentationStyle="pageSheet" animationType="none" onRequestClose={()=>setSelected(null)}><SafeAreaView style={{flex:1,backgroundColor:colors.paper}}><View style={{padding:12}}><Button label="Close vehicle details" secondary onPress={()=>setSelected(null)}/></View><TripScreen/></SafeAreaView></Modal></>;
}
export function ClassroomQueue(){
 const {client,queue,session,connected,busy,pending}=useDemo();const previous=useRef(''),[notice,setNotice]=useState('');
 const fingerprint=queue?.items.filter(v=>v.position!==null).map(v=>`${v.visitId}:${v.position}`).join('|')||'';
 useEffect(()=>{if(previous.current&&previous.current!==fingerprint)setNotice('The coordinator updated the lane. Preparation priority now reflects the committed order. Readiness and custody are unchanged.');previous.current=fingerprint;},[fingerprint]);
 if(!queue)return <Screen><Title>Opening your classroom…</Title></Screen>;
 const ordered=queue.items.filter(v=>v.position!==null).sort((a,b)=>a.position!-b.position!);
 return <Screen><Title>{session?.account.classroomId==='oak'?'Oak':'Maple'} classroom</Title><Copy muted>The coordinator’s physical lane order sets preparation priority. Keep children supervised; this list never authorizes release.</Copy>{!!notice&&<Copy accessibilityLiveRegion="polite">{notice}</Copy>}
  {(['ordered','pending','other'] as const).map(group=>{const list=group==='ordered'?ordered:queue.items.filter(v=>v.position===null&&(group==='pending'?v.announcedAt&&!v.confirmedAt:!(v.announcedAt&&!v.confirmedAt)));return <View key={group} style={{gap:12}}><Heading>{group==='ordered'?'Prepare in this order':group==='pending'?'Arrival pending':'Other assigned students'}</Heading>{!list.length&&<Copy muted>No students in this section.</Copy>}{list.map(v=><Panel key={v.visitId} tone={v.hold?'amber':'white'}><View style={{flexDirection:'row',gap:12,alignItems:'center'}}>{v.classSequence&&<Copy style={{fontWeight:'700',fontSize:26}}>{v.classSequence}</Copy>}<View style={{flex:1}}><Heading>{v.student}</Heading><Copy>{v.position?`Vehicle position ${v.position} · `:''}{v.vehicle.plate}</Copy><Copy muted>{v.vehicle.color} {v.vehicle.model}</Copy></View></View><Copy>{v.status} · {v.custody==='school'?'School retains custody':v.custody==='driver'?'School release recorded':v.custody==='recipient'?'Home handoff recorded':v.custody}</Copy>{!v.ready&&!v.hold&&<Button label={`Confirm ${v.student} is present and ready`} disabled={!connected||busy||!!pending} onPress={()=>{void (async()=>{await client.selectTrip(v.tripId);await client.execute('ready');})();}}/>}{v.hold&&<Copy>Blocked. Coordinate with gate staff; do not dispatch this child.</Copy>}</Panel>)}</View>;})}
 </Screen>;
}
