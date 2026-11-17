import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Coordinate, RecyclingLocation } from './locations';

const bounds = { north: 52.28, south: 52.06, west: 0.005, east: 0.245 };
const cambridgeLabel = { latitude: 52.2053, longitude: 0.1218 };

function placement({ latitude, longitude }: Coordinate) {
  const x = (longitude - bounds.west) / (bounds.east - bounds.west);
  const y = (bounds.north - latitude) / (bounds.north - bounds.south);
  return { left: `${x * 100}%` as const, top: `${y * 100}%` as const };
}

type Props = {
  sites: RecyclingLocation[];
  selectedId?: string;
  onSelect: (site: RecyclingLocation) => void;
};

export default function OfflineCambridgeMap({ sites, selectedId, onSelect }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.map}>
        <Text style={styles.north} accessibilityLabel="North is up">↑ N</Text>
        <Text style={[styles.city, placement(cambridgeLabel)]}>Cambridge</Text>
        {sites.map((site, index) => (
          <Pressable
            key={site.id}
            accessibilityRole="button"
            accessibilityLabel={site.name}
            accessibilityState={{ selected: site.id === selectedId }}
            style={[
              styles.pin,
              placement(site.coordinate),
              site.id === selectedId && styles.selected,
            ]}
            onPress={() => onSelect(site)}
          >
            <Text style={styles.pinText}>{index + 1}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.caption}>Cambridge area overview. Connect to the internet for streets and driving directions.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, minHeight: 150, paddingHorizontal: 8 },
  map: { flex: 1, minHeight: 120, backgroundColor: '#e6f1e8', borderRadius: 12 },
  north: { position: 'absolute', top: 8, right: 10, color: '#143b2c', fontWeight: '700' },
  city: { position: 'absolute', transform: [{ translateX: -34 }], color: '#143b2c' },
  pin: {
    position: 'absolute',
    width: 36,
    height: 36,
    transform: [{ translateX: -18 }, { translateY: -18 }],
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#fff',
    backgroundColor: '#14634a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selected: { backgroundColor: '#165497' },
  pinText: { color: '#fff', fontWeight: '700' },
  caption: { paddingVertical: 4, color: '#143b2c' },
});
