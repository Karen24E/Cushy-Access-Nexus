import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker } from 'react-native-maps';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Rider } from '@/src/types/operations';
import { colors } from '@/src/theme/colors';

export function LogisticsMap({ riders }: { riders: Rider[] }) {
  const active = riders.filter((r) => r.status === 'active').length;
  const available = riders.filter((r) => r.status === 'available').length;
  const delayed = riders.filter((r) => r.status === 'delayed').length;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View>
          <View style={styles.titleRow}><Text style={styles.title}>Live logistics map</Text><View style={styles.livePill}><View style={styles.liveDot} /><Text style={styles.liveText}>LIVE</Text></View></View>
          <Text style={styles.subtitle}>Fleet visibility across Cushy Access operations</Text>
        </View>
        <TouchableOpacity style={styles.expand}><Ionicons name="expand-outline" size={17} color={colors.ink} /></TouchableOpacity>
      </View>
      <MapView
        style={styles.map}
        initialRegion={{ latitude: 6.4474, longitude: 3.4225, latitudeDelta: 0.09, longitudeDelta: 0.09 }}
        showsCompass={false}
        showsUserLocation={false}
        customMapStyle={mapStyle}
      >
        {riders.map((rider) => {
          const bg = rider.status === 'delayed' ? colors.yellowDeep : rider.status === 'available' ? colors.purple400 : colors.purple700;
          return (
            <Marker key={rider.id} coordinate={{ latitude: rider.lat, longitude: rider.lng }} title={rider.name} description={rider.orderId ?? 'Available'}>
              <View style={[styles.marker, { backgroundColor: bg }]}><Ionicons name="bicycle" size={14} color={colors.surface} /></View>
            </Marker>
          );
        })}
      </MapView>
      <View style={styles.legend}>
        <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: colors.purple700 }]} /><Text style={styles.legendText}>Active {active}</Text></View>
        <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: colors.purple400 }]} /><Text style={styles.legendText}>Available {available}</Text></View>
        <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: colors.yellowDeep }]} /><Text style={styles.legendText}>Delayed {delayed}</Text></View>
      </View>
    </View>
  );
}

const mapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#f3edf8' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#75697f' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#f3edf8' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#e6dff0' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#ddd1ec' }] },
];

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: 20, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  header: { padding: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  title: { fontSize: 15, fontWeight: '900', color: colors.ink },
  livePill: { paddingHorizontal: 6, paddingVertical: 3, borderRadius: 999, backgroundColor: colors.successSoft, flexDirection: 'row', alignItems: 'center', gap: 4 },
  liveDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.success },
  liveText: { fontSize: 7, fontWeight: '900', color: colors.success, letterSpacing: 0.7 },
  subtitle: { marginTop: 4, fontSize: 10, color: colors.slate },
  expand: { width: 34, height: 34, borderRadius: 11, backgroundColor: colors.purple50, alignItems: 'center', justifyContent: 'center' },
  map: { width: '100%', height: 250 },
  marker: { width: 31, height: 31, borderRadius: 16, borderWidth: 3, borderColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  legend: { padding: 12, flexDirection: 'row', gap: 18, borderTopWidth: 1, borderTopColor: colors.border },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 7, height: 7, borderRadius: 4 },
  legendText: { fontSize: 9, fontWeight: '800', color: colors.slate },
});
