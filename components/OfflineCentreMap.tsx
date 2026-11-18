import Feather from "@expo/vector-icons/Feather";
import { Pressable, StyleSheet, Text, View, type ViewStyle } from "react-native";
import type { Coordinates, RecyclingCentre } from "../services/offlineRecyclingCentres";

type OfflineCentreMapProps = {
  centres: RecyclingCentre[];
  selectedCentreId?: string;
  userLocation: Coordinates | null;
  onSelectCentre: (centre: RecyclingCentre) => void;
};

type Bounds = { north: number; south: number; east: number; west: number };

function makeBounds(centres: RecyclingCentre[], userLocation: Coordinates | null): Bounds {
  const points = userLocation ? [...centres, userLocation] : centres;
  const latitudes = points.map((point) => point.latitude);
  const longitudes = points.map((point) => point.longitude);
  const minLatitude = Math.min(...latitudes);
  const maxLatitude = Math.max(...latitudes);
  const minLongitude = Math.min(...longitudes);
  const maxLongitude = Math.max(...longitudes);
  const latitudePadding = Math.max(0.035, (maxLatitude - minLatitude) * 0.18);
  const longitudePadding = Math.max(0.035, (maxLongitude - minLongitude) * 0.24);

  return {
    north: maxLatitude + latitudePadding,
    south: minLatitude - latitudePadding,
    east: maxLongitude + longitudePadding,
    west: minLongitude - longitudePadding,
  };
}

function position(point: Coordinates, bounds: Bounds): Pick<ViewStyle, "left" | "top"> {
  const left = ((point.longitude - bounds.west) / (bounds.east - bounds.west)) * 100;
  const top = ((bounds.north - point.latitude) / (bounds.north - bounds.south)) * 100;
  return {
    left: `${Math.max(7, Math.min(93, left))}%` as `${number}%`,
    top: `${Math.max(9, Math.min(88, top))}%` as `${number}%`,
  };
}

/** A small, bundled geographic overview used when live Google map tiles are unavailable. */
export default function OfflineCentreMap({
  centres,
  selectedCentreId,
  userLocation,
  onSelectCentre,
}: OfflineCentreMapProps) {
  const bounds = makeBounds(centres, userLocation);

  return (
    <View accessibilityLabel="Offline map of saved Cambridge-area recycling centres" style={styles.wrapper}>
      <View style={styles.map}>
        <View style={[styles.road, styles.roadOne]} />
        <View style={[styles.road, styles.roadTwo]} />
        <View style={[styles.road, styles.roadThree]} />
        <Text style={styles.north}>↑ N</Text>
        <Text style={styles.city}>CAMBRIDGE AREA</Text>

        {userLocation ? (
          <View accessibilityLabel="Your last saved location" style={[styles.userPin, position(userLocation, bounds)]}>
            <Feather name="navigation" size={13} color="#FFFFFF" />
          </View>
        ) : null}

        {centres.map((centre, index) => {
          const selected = centre.id === selectedCentreId;
          return (
            <Pressable
              key={centre.id}
              onPress={() => onSelectCentre(centre)}
              accessibilityRole="button"
              accessibilityLabel={`Select ${centre.name}`}
              accessibilityState={{ selected }}
              style={[styles.centrePin, position(centre, bounds), selected && styles.selectedPin]}
            >
              <Text style={styles.pinLabel}>{index + 1}</Text>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={styles.legendCentre} />
          <Text style={styles.legendText}>Recycling centre</Text>
        </View>
        {userLocation ? (
          <View style={styles.legendItem}>
            <View style={styles.legendYou} />
            <Text style={styles.legendText}>Last saved location</Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.caption}>Offline overview only. Connect to the internet for street maps and directions.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { padding: 12 },
  map: {
    backgroundColor: "#DCEDE0",
    borderColor: "#C8DBC9",
    borderRadius: 18,
    borderWidth: 1,
    height: 246,
    overflow: "hidden",
    position: "relative",
  },
  road: { backgroundColor: "#F8F7EF", borderColor: "#CBD8CC", borderWidth: 1, opacity: 0.95, position: "absolute" },
  roadOne: { height: 18, left: "-10%", top: "45%", transform: [{ rotate: "-17deg" }], width: "120%" },
  roadTwo: { height: 14, left: "-6%", top: "20%", transform: [{ rotate: "28deg" }], width: "112%" },
  roadThree: { height: "120%", left: "53%", top: "-10%", transform: [{ rotate: "9deg" }], width: 12 },
  north: { color: "#244A3C", fontSize: 12, fontWeight: "800", position: "absolute", right: 12, top: 10 },
  city: { color: "#567A66", fontSize: 11, fontWeight: "800", left: 14, letterSpacing: 1.1, position: "absolute", top: 12 },
  centrePin: {
    alignItems: "center",
    backgroundColor: "#244A3C",
    borderColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 3,
    height: 36,
    justifyContent: "center",
    position: "absolute",
    transform: [{ translateX: -18 }, { translateY: -18 }],
    width: 36,
  },
  selectedPin: { backgroundColor: "#146CBB", transform: [{ translateX: -20 }, { translateY: -20 }], height: 40, width: 40, borderRadius: 20 },
  pinLabel: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" },
  userPin: {
    alignItems: "center",
    backgroundColor: "#B86635",
    borderColor: "#FFFFFF",
    borderRadius: 15,
    borderWidth: 3,
    height: 30,
    justifyContent: "center",
    position: "absolute",
    transform: [{ translateX: -15 }, { translateY: -15 }],
    width: 30,
  },
  legend: { flexDirection: "row", flexWrap: "wrap", gap: 14, paddingHorizontal: 3, paddingTop: 10 },
  legendItem: { alignItems: "center", flexDirection: "row" },
  legendCentre: { backgroundColor: "#244A3C", borderRadius: 5, height: 10, marginRight: 6, width: 10 },
  legendYou: { backgroundColor: "#B86635", borderRadius: 5, height: 10, marginRight: 6, width: 10 },
  legendText: { color: "#527061", fontSize: 12, fontWeight: "600" },
  caption: { color: "#65776D", fontSize: 12, lineHeight: 17, paddingHorizontal: 3, paddingTop: 8 },
});
