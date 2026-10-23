import React, {useEffect,useState} from 'react';
import {View, StyleSheet, useWindowDimensions} from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import {personName,actionLabelForChild, type Action, type Snapshot} from '@pick/contracts';
import {useDemo} from './session';
import {AccountPicker} from './accounts';
import {Screen,Copy,Title,Heading,Panel,Row,Button,colors} from './ui';
import {ArrivalCheckIn} from './arrival';
import {GateVisitActions} from './gate-actions';
import {VehicleArt,DriverAvatar} from './vehicle-art';
import {nextStep,roleHeadings} from './copy';

function Progress({snapshot:s}: {snapshot:Snapshot}) {
  const step = s.trip === 'completed' ? 4 : s.passenger === 'delivered' ? 3 : s.passenger === 'onboard' ? 2 : s.permission === 'approved' ? 1 : 0;
  const labels = ['Permission','School handoff','On the way','Home handoff'];
  return <View style={{gap:16}}><Heading>From school to home</Heading><View style={local.progress}>{labels.map((label,i)=><View key={label} style={local.stop}>
    <View style={[local.marker, {backgroundColor:step > i ? colors.brand : step === i ? colors.brandPale : colors.paper,borderColor:step === i ? colors.brand : colors.line}]}>{step > i ? <Feather name="check" size={18} color="white"/> : <Copy style={{fontSize:14,fontWeight:'600',color:step===i?colors.brand:colors.muted}}>{i+1}</Copy>}</View><Copy style={{fontSize:13,lineHeight:18,textAlign:'center',fontWeight:step===i?'700':'400'}}>{label}</Copy>
  </View>)}</View><Copy muted style={{fontSize:12}}>Trip progress is simulated. This is not live tracking.</Copy></View>;
}

function PickupPlan({s,isParent}: {s:Snapshot;isParent:boolean}) {
  return (<Panel><Heading>{isParent?'The plan you’re approving':'Today’s pickup plan'}</Heading>
          <View><Row label="Driver" value={s.driver}/><Row label="Vehicle" value={s.vehicle}/><Row label="Pickup window" value="3:10–3:40 PM · demo clock"/>{s.destination && <Row label="Destination" value={s.destination}/>}<Row label="Permission" value={s.permission==='approved'?'Parent approved':s.permission==='revoked'?'Revoked · hold active':'Awaiting parent approval'}/>{s.recipient && <Row label="Receiving adult" value={s.recipient}/>}<Row label="Readiness" value={s.pickup==='expected'?'Waiting for teacher':s.pickup==='held'?'On hold':'Teacher confirmed present'}/>{isParent && <Row label="Approved backup" value={`${personName(s.assignment.backupId)} (preapproved backup)`}/>}</View>
          <Copy muted style={{fontSize:13,lineHeight:20}}>Eligibility and adult authority are seeded facts in this demo. They have not been independently verified.</Copy>
        </Panel>);
}
export default function TripScreen() {
  const {snapshot:s,session,client,busy,connected,pending} = useDemo();
  const {width} = useWindowDimensions(); const [confirm,setConfirm] = useState<Action|null>(null);
  useEffect(()=>setConfirm(null),[session?.account.id,s?.generation]);
  if (!session) return <Screen><View style={{paddingVertical:18,gap:16}}><Title>A good goodbye.{`\n`}A clear way home.</Title><Copy muted style={{maxWidth:540}}>Follow one child’s afternoon with the adults responsible for each step. Start with a parent, then try another perspective.</Copy></View><AccountPicker/></Screen>;
  if (!s) return <Screen><Title>Opening your afternoon…</Title><Panel><Copy muted>The shared trip is loading from the local server.</Copy><Button label="Try connection again" secondary onPress={() => {void client.refresh();}}/></Panel></Screen>;
  const secondaryActions: Action[] = ['revoke','recipient_absent','uncertain'];
  const main = s.availableActions.filter(a=>!secondaryActions.includes(a)&&a!=='request_arrival');
  const secondary = s.availableActions.filter(a=>secondaryActions.includes(a));
  const disabled = !connected || busy || !!pending;
  const transfer = s.trip === 'at_stop' ? s.homeTransfer : s.schoolTransfer;
  const pendingCustody = s.certainty !== 'confirmed';
  return <Screen>
    <View style={{gap:8,paddingTop:6}}><Title>{session.account.role==='recipient'?`Welcome ${s.child.split(' ')[0]} home.`:roleHeadings[session.account.role]}</Title><Copy muted>{s.school} · {new Date(s.demoTime).toLocaleDateString('en-US',{month:'long',day:'numeric',timeZone:'America/Puerto_Rico'})}</Copy></View>
    {session.account.role==='gate'&&<Panel><Heading>{s.assignment.vehicle.color} {s.assignment.vehicle.model}</Heading><VehicleArt vehicle={s.assignment.vehicle} large/><Copy style={{fontSize:22,fontWeight:'700'}}>{s.assignment.vehicle.plate}</Copy><View style={{flexDirection:'row',gap:12,alignItems:'center'}}><DriverAvatar name={s.driver}/><Copy>{s.driver}</Copy></View><Copy muted style={{fontSize:12}}>Model illustration · verify driver and plate.</Copy></Panel>}
    <View style={[local.columns,width>=850 && {flexDirection:'row',alignItems:'flex-start'}]}>
      <View style={[{gap:20,minWidth:0},width>=850 && {flex:1.3}]}>
        <Panel tone={pendingCustody || s.hold ? 'amber':'green'}>
          <View style={{flexDirection:'row',gap:16,alignItems:'center'}}><View style={local.initials}><Copy style={{fontSize:24,fontWeight:'600'}}>{s.child==='Assigned student'?'?':s.child.split(' ').map(n=>n[0]).join('')}</Copy></View><View style={{flex:1}}><Copy style={{fontSize:25,lineHeight:32,fontWeight:'700'}}>{s.child}</Copy><Copy muted>{s.trip==='completed'?'Home handoff complete':'Today’s school-to-home pickup'}</Copy></View></View>
          <View style={{borderTopWidth:StyleSheet.hairlineWidth,borderColor:pendingCustody?'#d8c69f':'#bfd4c6',paddingTop:16,gap:4}}><Copy style={{fontWeight:'600'}}>{pendingCustody ? 'Last confirmed custody' : 'Confirmed custody'}</Copy><Copy style={{fontSize:22,lineHeight:30,fontWeight:'600'}}>{s.holder}</Copy><Copy style={{color: pendingCustody?colors.amber:colors.muted}}>{s.certainty==='disputed'?'Physical custody needs reconciliation. Do not release again.':s.certainty==='transfer_pending'?'Transfer pending. The physical holder may have changed.':s.passenger==='delivered'?'Receipt verified by both adults.':s.passenger==='onboard'?'School release is recorded.':'The child is under school supervision.'}</Copy></View>
        </Panel>
        {width<850 && session.account.role==='parent' && <PickupPlan s={s} isParent/>}
        {session.account.role==='driver' && <ArrivalCheckIn/>}
        {session.account.role==='gate' && <GateVisitActions/>}
        <Panel><Heading>{s.trip==='completed'?'All steps recorded':s.hold?'Pickup on hold':main.length?'Your next step':'Waiting for the next participant'}</Heading><Copy muted>{nextStep(s)}</Copy>
          {transfer && transfer.status==='prepared' && <View style={local.evidence}><Copy style={{fontWeight:'600'}}>Two independent confirmations</Copy><Copy>{transfer.initiatorObserved?'Recorded':'Waiting'} · {s.homeTransfer===transfer?'Driver observation':'Gate observation'}</Copy><Copy>{transfer.receiverAcknowledged?'Recorded':'Waiting'} · {s.homeTransfer===transfer?'Recipient acknowledgement':'Driver acknowledgement'}</Copy></View>}
          {main.map(action=><Button key={action} label={busy?'Recording…':actionLabelForChild(action,s.child)} disabled={disabled} icon="arrow-right" onPress={()=>{void client.execute(action);}}/>)}
          {secondary.map(action=><Button key={action} label={actionLabelForChild(action,s.child)} secondary danger={action!=='recipient_absent'} disabled={disabled} onPress={()=>setConfirm(action)}/>)}
          {confirm && <View style={{gap:12,paddingTop:8}}><Copy style={{fontWeight:'600'}}>{actionLabelForChild(confirm,s.child)}?</Copy><Copy muted>{confirm==='revoke'?'This immediately blocks further release. If a handoff may have happened, custody will need reconciliation.':confirm==='uncertain'?'This preserves the last confirmed holder and prevents a second release. A coordinator must reconcile the physical facts.':'The child remains with the assigned driver. The coordinator can activate the backup already approved for this trip.'}</Copy><Button label="Confirm this action" danger disabled={disabled} onPress={()=>{void client.execute(confirm);setConfirm(null);}}/><Button label="Keep current plan" secondary onPress={()=>setConfirm(null)}/></View>}
          {s.recovery && <View style={{gap:4}}><Copy style={{fontWeight:'600'}}>Recovery owner · {s.recovery.owner}</Copy><Copy muted>{s.recovery.reason}{s.recovery.backupActivated?' · preapproved backup active':''}</Copy></View>}
          {!connected && <Button label="Refresh connection" secondary onPress={()=>{void client.refresh();}}/>}
        </Panel>
      </View>
      <View style={[{gap:20,minWidth:0},width>=850 && {flex:1}]}>
        <Panel><Progress snapshot={s}/></Panel>
        {!(width<850 && session.account.role==='parent') && <PickupPlan s={s} isParent={session.account.role==='parent'}/>}
      </View>
    </View>
  </Screen>;
}
const local=StyleSheet.create({columns:{gap:20},initials:{height:62,width:62,borderRadius:20,backgroundColor:'#ffffffa8',alignItems:'center',justifyContent:'center'},progress:{flexDirection:'row',justifyContent:'space-between',gap:6},stop:{flex:1,alignItems:'center',gap:10},marker:{width:32,height:32,borderWidth:1,borderRadius:16,alignItems:'center',justifyContent:'center'},evidence:{gap:6,padding:16,backgroundColor:colors.paper,borderRadius:12}});
