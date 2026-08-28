import { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AlertRow } from '@/src/components/AlertRow';
import { fetchDashboard } from '@/src/services/api';
import { connectSocket } from '@/src/services/socket';
import { AlertItem } from '@/src/types/operations';
import { colors } from '@/src/theme/colors';

export default function AlertsScreen() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const load = async () => { try { setAlerts((await fetchDashboard('All')).alerts); } catch {} };
  useEffect(() => { void load(); const socket=connectSocket(); const refresh=()=>load(); socket.on('alert.updated', refresh); socket.on('alert.created', refresh); return ()=>{socket.off('alert.updated',refresh);socket.off('alert.created',refresh)}; }, []);
  return <SafeAreaView style={styles.safe} edges={['top']}><ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async()=>{setRefreshing(true);await load();setRefreshing(false)}} />} contentContainerStyle={styles.content}><Text style={styles.eyebrow}>MONITORING</Text><Text style={styles.title}>Alerts</Text><Text style={styles.subtitle}>Live operational incidents across every vertical.</Text><View style={styles.card}>{alerts.map(alert=><AlertRow key={alert.id} alert={{...alert,time:alert.time??`${Math.round(alert.age_minutes??0)}m ago`}} />)}{alerts.length===0&&<Text style={styles.empty}>No active alerts.</Text>}</View></ScrollView></SafeAreaView>;
}
const styles=StyleSheet.create({safe:{flex:1,backgroundColor:colors.canvas},content:{padding:16,paddingBottom:40},eyebrow:{fontSize:10,fontWeight:'800',color:colors.primary,letterSpacing:1.2},title:{fontSize:26,fontWeight:'900',color:colors.ink,marginTop:4},subtitle:{fontSize:12,color:colors.slate,marginTop:6,marginBottom:18},card:{backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border,borderRadius:18,paddingHorizontal:15},empty:{padding:30,textAlign:'center',fontSize:12,color:colors.slate}});
