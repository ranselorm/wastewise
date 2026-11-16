import Feather from "@expo/vector-icons/Feather";
import * as Location from "expo-location";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE, type Region } from "react-native-maps";

type Coordinates = { latitude: number; longitude: number };
type RecyclingCentre = Coordinates & { id: string; name: string; area: string };

// The finder stays inside Wastewise. Selecting a centre simply focuses this map.
const recyclingCentres: readonly RecyclingCentre[] = [
  { id: "milton", name: "Milton Recycling Centre", area: "Milton, Cambridge", latitude: 52.2588, longitude: 0.1767 },
  { id: "thriplow", name: "Thriplow Recycling Centre", area: "Near Royston", latitude: 52.0601, longitude: 0.1158 },
  { id: "witchford", name: "Witchford Recycling Centre", area: "Near Ely", latitude: 52.3936, longitude: 0.1832 },
];

const cambridgeRegion: Region = { latitude: 52.2053, longitude: 0.1218, latitudeDelta: 0.42, longitudeDelta: 0.42 };

function distanceInMiles(from: Coordinates, to: Coordinates) {
  const radians = (degrees: number) => (degrees * Math.PI) / 180;
  const latitudeChange = radians(to.latitude - from.latitude);
  const longitudeChange = radians(to.longitude - from.longitude);
  const a = Math.sin(latitudeChange / 2) ** 2 + Math.cos(radians(from.latitude)) * Math.cos(radians(to.latitude)) * Math.sin(longitudeChange / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 0.621371;
}

export default function RecyclingFinder({ onClose }: { onClose: () => void }) {
  const mapRef = useRef<MapView>(null);
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [isFindingLocation, setIsFindingLocation] = useState(true);
  const [message, setMessage] = useState("Finding recycling centres near you...");

  useEffect(() => {
    const findLocation = async () => {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== "granted") {
        setMessage("Location is off. Showing Cambridge-area centres.");
        setIsFindingLocation(false);
        return;
      }
      try {
        const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const current = { latitude: location.coords.latitude, longitude: location.coords.longitude };
        setUserLocation(current);
        setMessage("Centres are ordered by distance from you.");
        mapRef.current?.animateToRegion({ ...current, latitudeDelta: 0.12, longitudeDelta: 0.12 }, 600);
      } catch {
        setMessage("Could not get your location. Showing Cambridge-area centres.");
      } finally {
        setIsFindingLocation(false);
      }
    };
    void findLocation();
  }, []);

  const centres = [...recyclingCentres].sort((a, b) => userLocation ? distanceInMiles(userLocation, a) - distanceInMiles(userLocation, b) : 0);
  const focusCentre = (centre: RecyclingCentre) => mapRef.current?.animateToRegion({ ...centre, latitudeDelta: 0.055, longitudeDelta: 0.055 }, 450);

  return (
    <View className="flex-1 pt-5">
      <View className="mb-4 flex-row items-center justify-between">
        <View className="flex-1 pr-4">
          <Text className="text-[11px] font-extrabold tracking-[1.4px] text-forest-muted">LIVE LOCAL FINDER</Text>
          <Text className="mt-2 text-[29px] font-extrabold tracking-tight text-ink">Recycling centres near you</Text>
        </View>
        <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Back to your recycling result" className="h-11 w-11 items-center justify-center rounded-full bg-sage">
          <Feather name="x" size={21} color="#244A3C" />
        </Pressable>
      </View>
      <View className="overflow-hidden rounded-[24px] border border-[#DCE6DC] bg-white">
        <MapView ref={mapRef} provider={PROVIDER_GOOGLE} initialRegion={cambridgeRegion} style={styles.map} showsUserLocation={userLocation !== null} showsMyLocationButton accessibilityLabel="Map of nearby recycling centres">
          {recyclingCentres.map((centre) => <Marker key={centre.id} coordinate={centre} title={centre.name} description={centre.area} pinColor="#244A3C" />)}
        </MapView>
      </View>
      <View className="mt-4 flex-row items-center rounded-2xl bg-sage px-4 py-3">
        {isFindingLocation ? <ActivityIndicator size="small" color="#244A3C" /> : <Feather name="navigation" size={17} color="#244A3C" />}
        <Text className="ml-3 flex-1 text-sm font-semibold leading-5 text-forest">{message}</Text>
      </View>
      <ScrollView className="mt-4" showsVerticalScrollIndicator={false}>
        <Text className="mb-2 text-[11px] font-extrabold tracking-[1.2px] text-forest-muted">CAMBRIDGE-AREA CENTRES</Text>
        {centres.map((centre) => (
          <Pressable key={centre.id} onPress={() => focusCentre(centre)} accessibilityRole="button" accessibilityLabel={`Show ${centre.name} on the map`} className="mb-3 flex-row items-center rounded-[20px] border border-[#E2E9E1] bg-white p-4 active:bg-sage">
            <View className="h-10 w-10 items-center justify-center rounded-[14px] bg-card"><Feather name="map-pin" size={19} color="#244A3C" /></View>
            <View className="ml-3 flex-1"><Text className="text-[15px] font-extrabold text-ink">{centre.name}</Text><Text className="mt-1 text-sm text-copy">{userLocation ? `${distanceInMiles(userLocation, centre).toFixed(1)} miles away` : centre.area}</Text></View>
            <Feather name="chevron-right" size={20} color="#627A6D" />
          </Pressable>
        ))}
        <Text className="mb-5 px-1 text-xs leading-4 text-footer">Check accepted materials and opening hours before travelling.</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({ map: { height: 270, width: "100%" } });
