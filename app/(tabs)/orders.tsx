import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchOverview } from '@/src/services/api';
import { connectSocket } from '@/src/services/socket';
import { OverviewData, Vertical } from '@/src/types/operations';
import { colors } from '@/src/theme/colors';

const statuses = ['All','pending','confirmed','preparing','ready','assigned','picked_up','delivered','at_risk'];

export default function OrdersScreen() {
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [vertical, setVertical] = useState<Vertical>('All');
  const [status, setStatus] = useState('All');
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try { setError(null); const o = await fetchOverview(); setOverview(o); }
    catch (e) { setError(e instanceof Error ? e.message : 'Unable to load orders.'); }
  };

  useEffect(() => { void load(); const socket = connectSocket(); const events=['order.created','order.updated','order.assigned']; events.forEach((e)=>socket.on(e, load)); return () => events.forEach((e)=>socket.off(e, load)); }, []);

  const refresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  return <SafeAreaView style={styles.safe} edges={['top']}>
    <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />} contentContainerStyle={styles.content}>
      <View style={styles.header}><View><Text style={styles.eyebrow}>OPERATIONS</Text><Text style={styles.title}>Orders & Dispatch</Text></View><View style={styles.live}><View style={styles.dot}/><Text style={styles.liveText}>LIVE</Text></View></View>
      {error && <Text style={styles.error}>{error}</Text>}

      {overview && (
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>ORDERS TODAY</Text>
            <Text style={styles.statValue}>{overview.orders.totalToday}</Text>
            <Text style={styles.statSub}>{overview.orders.pending} pending · {overview.orders.inProgress} in progress</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>COMPLETED</Text>
            <Text style={styles.statValue}>{overview.orders.completed}</Text>
            <Text style={styles.statSub}>{overview.orders.cancelled} cancelled</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>RIDERS</Text>
            <Text style={styles.statValue}>{overview.riders.total}</Text>
            <Text style={styles.statSub}>{overview.riders.online} online · {overview.riders.active} active</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>STORES</Text>
            <Text style={styles.statValue}>{overview.stores.total}</Text>
            <Text style={styles.statSub}>{overview.stores.active} active · {overview.stores.suspended} suspended</Text>
          </View>
        </View>
      )}

      <View style={styles.infoCard}>
        <Ionicons name="information-circle-outline" size={20} color={colors.purple600} />
        <Text style={styles.infoText}>Order management is now handled through the overview API. Individual order details are not available in this view.</Text>
      </View>
    </ScrollView>
  </SafeAreaView>;
}

const styles=StyleSheet.create({safe:{flex:1,backgroundColor:colors.canvas},content:{padding:16,paddingBottom:40},header:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:20},eyebrow:{fontSize:10,fontWeight:'800',color:colors.primary,letterSpacing:1.2},title:{fontSize:24,fontWeight:'900',color:colors.ink,marginTop:4},live:{flexDirection:'row',alignItems:'center',gap:5},dot:{width:7,height:7,borderRadius:4,backgroundColor:colors.success},liveText:{fontSize:10,fontWeight:'800',color:colors.success},statsGrid:{flexDirection:'row',flexWrap:'wrap',gap:10},statCard:{width:'48%',backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border,borderRadius:16,padding:14,marginBottom:4},statLabel:{fontSize:9,fontWeight:'900',letterSpacing:0.9,color:colors.slate},statValue:{marginTop:8,fontSize:24,fontWeight:'900',color:colors.ink},statSub:{marginTop:4,fontSize:9,fontWeight:'600',color:colors.muted},infoCard:{marginTop:16,backgroundColor:colors.purple50,borderRadius:16,padding:14,flexDirection:'row',gap:10,alignItems:'flex-start'},infoText:{flex:1,fontSize:11,color:colors.slate,lineHeight:16},error:{marginTop:10,color:colors.danger,fontSize:10,fontWeight:'700'}});
