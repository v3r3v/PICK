import React from 'react';
import { Text, View, Pressable, StyleSheet, ScrollView, useWindowDimensions, type TextProps, type ViewStyle, type ScrollViewProps } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { useDemo } from './session';

export const colors = { ink: '#18382d', muted: '#53665d', brand: '#176347', brandPale: '#e5efe8', paper: '#f5f6f1', white: '#ffffff', line: '#d7dfd8', amber: '#785014', amberPale: '#fff0d6', red: '#993d37', redPale: '#fbece8' };
export function Copy({ children, muted, style, ...props }: TextProps & { muted?: boolean }) { return <Text {...props} style={[styles.copy, muted && { color: colors.muted }, style]}>{children}</Text>; }
export function Title({ children }: {children: React.ReactNode}) { return <Copy accessibilityRole="header" style={styles.title}>{children}</Copy>; }
export function Heading({ children }: {children: React.ReactNode}) { return <Copy accessibilityRole="header" style={styles.heading}>{children}</Copy>; }
export function Button({ label, accessibilityLabel, onPress, disabled, secondary, danger, icon }: {label: string; accessibilityLabel?:string; onPress: () => void; disabled?: boolean; secondary?: boolean; danger?: boolean; icon?: React.ComponentProps<typeof Feather>['name']}) {
  const [focused, setFocused] = React.useState(false);
  const [hovered, setHovered] = React.useState(false);
  return <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel||label} accessibilityState={{ disabled: !!disabled }} disabled={disabled} onPress={onPress} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} onHoverIn={() => setHovered(true)} onHoverOut={() => setHovered(false)} style={({pressed}) => [styles.button, secondary && styles.secondary, danger && { backgroundColor: secondary ? colors.redPale : colors.red }, (pressed || hovered) && { opacity: .85 }, disabled && { opacity: .48 }, focused && { outlineColor: colors.brand, outlineWidth: 3, outlineOffset: 3 }]}>
    {icon && <Feather name={icon} size={18} color={secondary ? (danger ? colors.red : colors.brand) : colors.white} />}
    <Copy style={[styles.buttonText, secondary && { color: danger ? colors.red : colors.brand }]}>{label}</Copy>
  </Pressable>;
}
export function Panel({children, tone = 'white', style}: {children: React.ReactNode; tone?: 'white'|'green'|'amber'; style?: ViewStyle}) {
  return <View style={[styles.panel, { backgroundColor: tone === 'green' ? colors.brandPale : tone === 'amber' ? colors.amberPale : colors.white }, style]}>{children}</View>;
}
export function Row({label, value}: {label: string; value: string}) { return <View style={styles.infoRow}><Copy muted style={{flex: 1}}>{label}</Copy><Copy style={{flex: 1.7, fontWeight: '600', textAlign: 'right'}}>{value}</Copy></View>; }
export function Banner({message, warning = false}: {message: string; warning?: boolean}) { return <View accessibilityRole="alert" style={[styles.banner, {backgroundColor: warning ? colors.amberPale : colors.brandPale}]}><Feather name={warning ? 'alert-circle' : 'check-circle'} size={19} color={warning ? colors.amber : colors.brand}/><Copy style={{flex:1, color: warning ? colors.amber : colors.ink}}>{message}</Copy></View>; }
export function Screen({children,scrollRef,...scrollProps}: {children: React.ReactNode;scrollRef?:React.Ref<ScrollView>} & ScrollViewProps) {
  const {width} = useWindowDimensions();
  const {session, connected, lastRefresh, snapshot, paused, error, notice, pending, client} = useDemo();
  return <ScrollView ref={scrollRef} contentInsetAdjustmentBehavior="automatic" {...scrollProps} contentContainerStyle={styles.scroll} style={{backgroundColor: colors.paper}}><View style={[styles.page, {paddingHorizontal: width < 600 ? 20 : 40}]}>
    <View style={styles.masthead}><View style={styles.brand}><View style={styles.brandMark}><Feather name="check" size={22} color="white"/></View><Copy style={styles.wordmark}>PICK</Copy><Copy style={styles.demo}>Demo</Copy></View>{session && <View style={{alignItems:'flex-end', flexShrink:1}}><Copy style={{fontWeight:'600'}}>{session.account.name}</Copy><Copy muted style={{fontSize:13}}>{session.account.description}</Copy></View>}</View>
    {session && <View style={styles.freshness}><Feather name={connected ? 'wifi' : 'wifi-off'} size={15} color={connected ? colors.brand : colors.amber}/><Copy style={{fontSize:13, flex:1, color: connected ? colors.muted : colors.amber}}>{connected ? `Connected · refreshed ${new Date(lastRefresh).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit',second:'2-digit'})}` : `${paused ? 'Demo connection paused' : 'Disconnected or waiting for server'}${snapshot ? ' · displayed state may be out of date' : ''}`}</Copy></View>}
    {session && !connected && <Banner warning message={`Custody actions are unavailable. ${paused ? 'Resume the connection in Demo tools.' : `Check the API at ${client.url}, then refresh.`}`}/>}
    {error && <Banner warning message={error}/>}{notice && <Banner message={notice}/>}
    {pending && <Panel tone="amber"><Heading>Check the handoff before continuing</Heading><Copy>No action will be replayed. Confirm the recorded result first.</Copy><Button label="Check server receipt" onPress={() => { void client.resolveReceipt(); }}/><Button label="I checked custody · clear pending request" secondary onPress={() => client.clearPendingAfterReview()} disabled={!connected}/></Panel>}
    {children}
    <Copy muted style={styles.footer}>Synthetic journeys. Device location only when you request it. No background tracking or real transport.</Copy>
  </View></ScrollView>;
}
export const styles = StyleSheet.create({
  copy: {fontSize:16,lineHeight:24,color:colors.ink}, title:{fontSize:34,lineHeight:40,fontWeight:'700',letterSpacing:-.8}, heading:{fontSize:20,lineHeight:27,fontWeight:'600'},
  scroll:{flexGrow:1},page:{width:'100%',maxWidth:1120,alignSelf:'center',paddingBottom:24,gap:20}, masthead:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',gap:16,paddingTop:24,paddingBottom:2},
  brand:{flexDirection:'row',alignItems:'center',gap:10},brandMark:{width:32,height:36,borderRadius:10,backgroundColor:colors.brand,alignItems:'center',justifyContent:'center'},wordmark:{fontSize:25,fontWeight:'800',letterSpacing:-.8},demo:{fontSize:12,color:colors.muted,backgroundColor:'#e8ece6',paddingHorizontal:8,paddingVertical:1,borderRadius:5},
  freshness:{flexDirection:'row',alignItems:'center',gap:8},panel:{borderRadius:16,padding:24,gap:16},
  button:{minHeight:50,borderRadius:12,backgroundColor:colors.brand,paddingVertical:13,paddingHorizontal:18,alignItems:'center',justifyContent:'center',flexDirection:'row',gap:10},secondary:{backgroundColor:colors.brandPale},buttonText:{color:'white',fontSize:16,lineHeight:22,fontWeight:'600',flexShrink:1,textAlign:'center'},
  infoRow:{flexDirection:'row',gap:16,paddingVertical:13,borderBottomWidth:StyleSheet.hairlineWidth,borderBottomColor:colors.line},banner:{padding:16,borderRadius:12,flexDirection:'row',alignItems:'flex-start',gap:10},footer:{fontSize:12,textAlign:'center',paddingTop:12},
});
