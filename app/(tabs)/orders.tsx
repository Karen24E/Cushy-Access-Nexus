import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { assignOrder, fetchOrders, fetchRiders, updateOrderStatus } from '@/src/services/api';
import { connectSocket } from '@/src/services/socket';
import { Order, Rider, Vertical } from '@/src/types/operations';
import { colors } from '@/src/theme/colors';

const statuses = ['All','pending','confirmed','preparing','ready','assigned','picked_up','delivered','at_risk'];

export default function OrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [riders, setRiders] = useState<Rider[]>([]);
  const [vertical, setVertical] = useState<Vertical>('All');
  const [status, setStatus] = useState('All');
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try { setError(null); const [o,r] = await Promise.all([fetchOrders({ vertical, status: status === 'All' || status === 'at_risk' ? undefined : status }), fetchRiders()]); setOrders(o); setRiders(r); }
    catch (e) { setError(e instanceof Error ? e.message : 'Unable to load orders.'); }
  };

  useEffect(() => { void load(); const socket = connectSocket(); const events=['order.created','order.updated','order.assigned']; events.forEach((e)=>socket.on(e, load)); return () => events.forEach((e)=>socket.off(e, load)); }, [vertical,status]);

  const shownOrders = useMemo(() => status === 'at_risk' ? orders.filter((o) => !['delivered','cancelled','failed'].includes(o.status) && (Date.now()-new Date(o.created_at).getTime())/60000 > o.sla_minutes) : orders, [orders,status]);
  const availableRiders = riders.filter((r) => r.status === 'available');

  const assign = async (order: Order) => {
    const rider = availableRiders[0]; if (!rider) return; setBusy(order.id);
    try { await assignOrder(order.id, rider.id); await load(); } catch (e) { setError(e instanceof Error ? e.message : 'Assignment failed.'); } finally { setBusy(null); }
  };
  const advance = async (order: Order) => {
    const flow: Record<string,string> = { pending:'confirmed', confirmed:'preparing', preparing:'ready', ready:'assigned', assigned:'picked_up', picked_up:'delivered' };
    const next = flow[order.status]; if (!next) return; setBusy(order.id); try { await updateOrderStatus(order.id, next); await load(); } catch (e) { setError(e instanceof Error ? e.message : 'Status update failed.'); } finally { setBusy(null); }
  };

  return <SafeAreaView style={styles.safe} edges={['top']}>
    <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async()=>{setRefreshing(true); await load(); setRefreshing(false);}} />} contentContainerStyle={styles.content}>
      <View style={styles.header}><View><Text style={styles.eyebrow}>OPERATIONS</Text><Text style={styles.title}>Orders & Dispatch</Text></View><View style={styles.live}><View style={styles.dot}/><Text style={styles.liveText}>LIVE</Text></View></View>
      {error && <Text style={styles.error}>{error}</Text>}
      <Text style={styles.label}>Vertical</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>{(['All','Q-Commerce','Healthtech','Foodtech','Logistics'] as Vertical[]).map(v=><Pressable key={v} onPress={()=>setVertical(v)} style={[styles.chip,vertical===v&&styles.chipActive]}><Text style={[styles.chipText,vertical===v&&styles.chipTextActive]}>{v}</Text></Pressable>)}</ScrollView>
      <Text style={styles.label}>Queue</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>{statuses.map(s=><Pressable key={s} onPress={()=>setStatus(s)} style={[styles.chip, status===s&&styles.chipActive]}><Text style={[styles.chipText,status===s&&styles.chipTextActive]}>{s.replace('_',' ')}</Text></Pressable>)}</ScrollView>

      {shownOrders.map(order => { const isBusy=busy===order.id; const atRisk=!['delivered','cancelled','failed'].includes(order.status) && (Date.now()-new Date(order.created_at).getTime())/60000 > order.sla_minutes; return <View key={order.id} style={styles.card}>
        <View style={styles.row}><Text style={styles.ref}>{order.reference}</Text><View style={[styles.badge, atRisk || order.priority==='critical' ? styles.badgeDanger : styles.badgeNeutral]}><Text style={styles.badgeText}>{atRisk?'AT RISK':order.priority.toUpperCase()}</Text></View></View>
        <Text style={styles.customer}>{order.customer_name}</Text><Text style={styles.route}>{order.pickup_name} → {order.dropoff_address}</Text>
        <View style={styles.meta}><Text style={styles.metaText}>{order.vertical}</Text><Text style={styles.metaText}>{order.status.replace('_',' ')}</Text><Text style={styles.metaText}>{order.rider_name ? `Rider: ${order.rider_name}` : 'Unassigned'}</Text></View>
        <View style={styles.actions}>
          {!order.rider_id && <Pressable disabled={isBusy || availableRiders.length===0} onPress={()=>assign(order)} style={[styles.action, styles.primaryAction, (isBusy||availableRiders.length===0)&&styles.disabled]}><Ionicons name="person-add-outline" size={15} color="white"/><Text style={styles.primaryText}>{isBusy?'Assigning…':'Assign rider'}</Text></Pressable>}
          {order.rider_id && !['delivered','cancelled','failed'].includes(order.status) && <Pressable disabled={isBusy} onPress={()=>advance(order)} style={[styles.action,styles.secondaryAction,isBusy&&styles.disabled]}><Text style={styles.secondaryText}>{isBusy?'Updating…':'Advance status'}</Text></Pressable>}
        </View>
      </View> })}
      {shownOrders.length===0 && <View style={styles.empty}><ActivityIndicator size="small" color={colors.primary}/><Text style={styles.emptyText}>No orders in this queue.</Text></View>}
    </ScrollView>
  </SafeAreaView>;
}

const styles=StyleSheet.create({safe:{flex:1,backgroundColor:colors.canvas},content:{padding:16,paddingBottom:40},header:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:20},eyebrow:{fontSize:10,fontWeight:'800',color:colors.primary,letterSpacing:1.2},title:{fontSize:24,fontWeight:'900',color:colors.ink,marginTop:4},live:{flexDirection:'row',alignItems:'center',gap:5},dot:{width:7,height:7,borderRadius:4,backgroundColor:colors.success},liveText:{fontSize:10,fontWeight:'800',color:colors.success},label:{fontSize:11,fontWeight:'800',color:colors.slate,marginTop:5,marginBottom:8,textTransform:'uppercase'},chips:{gap:8,paddingBottom:12},chip:{paddingHorizontal:12,paddingVertical:8,borderRadius:999,borderWidth:1,borderColor:colors.border,backgroundColor:colors.surface},chipActive:{backgroundColor:colors.ink,borderColor:colors.ink},chipText:{fontSize:11,fontWeight:'700',color:colors.slate},chipTextActive:{color:colors.surface},card:{backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border,borderRadius:16,padding:14,marginTop:10},row:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},ref:{fontSize:12,fontWeight:'900',color:colors.ink},badge:{paddingHorizontal:8,paddingVertical:5,borderRadius:999},badgeDanger:{backgroundColor:'#FEE2E2'},badgeNeutral:{backgroundColor:'#E2E8F0'},badgeText:{fontSize:9,fontWeight:'900',color:colors.ink},customer:{fontSize:15,fontWeight:'800',color:colors.ink,marginTop:10},route:{fontSize:11,color:colors.slate,marginTop:5,lineHeight:16},meta:{flexDirection:'row',flexWrap:'wrap',gap:8,marginTop:12},metaText:{fontSize:10,fontWeight:'700',color:colors.slate},actions:{flexDirection:'row',gap:8,marginTop:14},action:{minHeight:38,paddingHorizontal:12,borderRadius:10,alignItems:'center',justifyContent:'center',flexDirection:'row',gap:6},primaryAction:{backgroundColor:colors.primary},secondaryAction:{backgroundColor:'#E2E8F0'},primaryText:{color:'#fff',fontSize:11,fontWeight:'800'},secondaryText:{color:colors.ink,fontSize:11,fontWeight:'800'},disabled:{opacity:0.45},error:{color:colors.danger,backgroundColor:'#FEF2F2',padding:10,borderRadius:10,fontSize:11,fontWeight:'700',marginBottom:10},empty:{alignItems:'center',padding:40,gap:12},emptyText:{fontSize:12,color:colors.slate}});
