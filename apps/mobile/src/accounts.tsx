import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { accounts, type Role } from '@pick/contracts';
import { Copy, Heading, colors, Button } from './ui';
import { useDemo } from './session';
const icons: Record<Role, React.ComponentProps<typeof Feather>['name']> = {parent:'heart',driver:'navigation',teacher:'book-open',gate:'check-square',recipient:'home',support:'life-buoy'};
export function AccountPicker({all = false}: {all?: boolean}) {
  const {client,busy,session} = useDemo();
  return <View style={{gap:16}}><Heading>{session ? 'Switch your viewpoint' : 'Choose a demo account'}</Heading><Copy muted>Each account joins the same shared trip. Open another browser tab or phone to review with someone else.</Copy><View style={s.list}>
    {accounts.filter(a => all || (['parent-a','driver-a','teacher-a','teacher-oak','gate-a','recipient-a'].includes(a.id))).map(account => <Pressable key={account.id} accessibilityRole="button" accessibilityLabel={`Continue as ${account.name}, ${account.description}`} disabled={busy} onPress={() => {void client.selectAccount(account.id);}} style={({pressed})=>[s.account, pressed && {backgroundColor:colors.brandPale},busy && {opacity:.5}]}>
      <View style={s.avatar}><Feather name={icons[account.role]} size={22} color={colors.brand}/></View><View style={{flex:1}}><Copy style={{fontWeight:'600'}}>{account.name}</Copy><Copy muted style={{fontSize:14}}>{account.description}</Copy></View><Feather name="arrow-right" size={20} color={colors.muted}/>
    </Pressable>)}
  </View>{session && <Button label="Leave this demo account" secondary onPress={() => {void client.logout();}}/>}</View>;
}
const s = StyleSheet.create({list:{backgroundColor:colors.white,borderRadius:16,overflow:'hidden'},account:{flexDirection:'row',alignItems:'center',gap:16,padding:18,minHeight:84,borderBottomWidth:StyleSheet.hairlineWidth,borderBottomColor:colors.line},avatar:{width:44,height:44,alignItems:'center',justifyContent:'center',borderRadius:12,backgroundColor:colors.brandPale}});
