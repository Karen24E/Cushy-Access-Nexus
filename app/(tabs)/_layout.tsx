import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { colors } from '@/src/theme/colors';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: colors.purple600,
      tabBarInactiveTintColor: colors.muted,
      tabBarStyle: { height: 72, paddingTop: 7, paddingBottom: 7, borderTopColor: colors.border, backgroundColor: colors.surface },
      tabBarLabelStyle: { fontSize: 9, fontWeight: '800' },
    }}>
      <Tabs.Screen name="index" options={{ title: 'Command', tabBarIcon: ({ color, size }) => <Ionicons name="grid" color={color} size={size} /> }} />
      <Tabs.Screen name="operations" options={{ title: 'Operations', tabBarIcon: ({ color, size }) => <Ionicons name="pulse" color={color} size={size} /> }} />
      <Tabs.Screen name="orders" options={{ title: 'Orders', tabBarIcon: ({ color, size }) => <Ionicons name="list" size={size} color={color} /> }} />
      <Tabs.Screen name="incidents" options={{ title: 'Incidents', tabBarIcon: ({ color, size }) => <Ionicons name="warning" color={color} size={size} /> }} />
      <Tabs.Screen name="alerts" options={{ title: 'Alerts', tabBarIcon: ({ color, size }) => <Ionicons name="notifications" color={color} size={size} /> }} />
      <Tabs.Screen name="more" options={{ title: 'More', tabBarIcon: ({ color, size }) => <Ionicons name="menu" color={color} size={size} /> }} />
    </Tabs>
  );
}
