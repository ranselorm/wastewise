import React, { useEffect, useRef, useState } from 'react';
import { Button, Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { cambridge, distanceKm, locations } from './locations';
import type { Category, Coordinate, RecyclingLocation } from './locations';

type Route = { points: Coordinate[]; steps: string[]; distanceMetres: number; seconds: number };
type Props = {
  category: Category;
  routesUrl?: string;
  getRouteHeaders?: () => Promise<Record<string, string>>;
};

export default function RecyclingFinder({ category, routesUrl, getRouteHeaders }: Props) {
  const map = useRef<MapView>(null);
  const request = useRef<AbortController | null>(null);
  const [position, setPosition] = useState<Coordinate>();
  const [hasPermission, setHasPermission] = useState(false);
  const [aroundCambridge, setAroundCambridge] = useState(false);
  const [selected, setSelected] = useState<RecyclingLocation>();
  const [route, setRoute] = useState<Route>();
  const [routing, setRouting] = useState(false);
  const [error, setError] = useState('');
  const [locationMessage, setLocationMessage] = useState('Finding your location… You can browse Cambridge now.');

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    async function locate() {
      try {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (!active) return;
        if (!permission.granted) {
          setLocationMessage('Location permission declined. Showing sites around Cambridge.');
          return;
        }
        setHasPermission(true);
        const fix = await Promise.race([
          Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }),
          new Promise<never>((_, reject) => {
            timer = setTimeout(() => reject(new Error('Location timed out')), 12000);
          }),
        ]);
        if (!active) return;
        if (fix.coords.accuracy == null || fix.coords.accuracy > 100) {
          setLocationMessage('Location is too approximate for routing. Showing sites around Cambridge.');
          return;
        }
        setPosition({ latitude: fix.coords.latitude, longitude: fix.coords.longitude });
        setLocationMessage('');
      } catch {
        if (active) setLocationMessage('Location unavailable. Showing sites around Cambridge.');
      } finally {
        if (timer) clearTimeout(timer);
      }
    }
    void locate();
    return () => {
      active = false;
      if (timer) clearTimeout(timer);
      request.current?.abort();
      request.current = null;
    };
  }, []);

  useEffect(() => {
    request.current?.abort();
    request.current = null;
    setSelected(undefined);
    setRoute(undefined);
    setError('');
    setRouting(false);
  }, [category]);

  const origin = (!aroundCambridge && position) || cambridge;
  const matches = locations.filter(site => Boolean(site.materials[category]))
    .sort((a, b) => distanceKm(origin, a.coordinate) - distanceKm(origin, b.coordinate));
  const site = selected && selected.materials[category] ? selected : undefined;

  function focusSites() {
    const points = [origin, ...matches.map(match => match.coordinate)];
    if (points.length === 1) {
      map.current?.animateToRegion({ ...origin, latitudeDelta: 0.14, longitudeDelta: 0.18 });
    } else {
      map.current?.fitToCoordinates(points, {
        edgePadding: { top: 45, right: 45, bottom: 45, left: 45 }, animated: true,
      });
    }
  }

  function resetRoute() {
    request.current?.abort();
    request.current = null;
    setRoute(undefined);
    setError('');
    setRouting(false);
  }

  async function showDirections(destination: RecyclingLocation) {
    if (!routesUrl || !routesUrl.startsWith('https://')) {
      setError('Directions require a configured HTTPS route service.');
      return;
    }
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setRouting(true);
    setError('');
    setRoute(undefined);
    const timer = setTimeout(() => controller.abort(), 15000);
    try {
      const headers = await getRouteHeaders?.();
      const response = await fetch(routesUrl, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ origin, destinationId: destination.id }),
        signal: controller.signal,
      });
      if (!response.ok) throw new Error('Route unavailable');
      const result: Route = await response.json();
      if (!Array.isArray(result.points) || result.points.length < 2 ||
          !Array.isArray(result.steps) || !Number.isFinite(result.distanceMetres) ||
          !Number.isFinite(result.seconds)) throw new Error('Invalid route');
      if (request.current !== controller) return;
      setRoute(result);
      map.current?.fitToCoordinates(result.points, {
        edgePadding: { top: 48, right: 48, bottom: 48, left: 48 }, animated: true,
      });
    } catch {
      if (request.current === controller) {
        setError('Directions are unavailable. Check your connection and try again.');
      }
    } finally {
      clearTimeout(timer);
      if (request.current === controller) {
        request.current = null;
        setRouting(false);
      }
    }
  }

  return (
    <View style={styles.screen}>
      <Text style={styles.notice}>Check accepted materials and opening hours before travelling.</Text>
      {locationMessage ? <Text style={styles.notice}>{locationMessage}</Text> : null}
      <Button title={position && !aroundCambridge ? 'Search around Cambridge' :
        position ? 'Search near me' : 'Show Cambridge sites'} onPress={() => {
        if (position) {
          resetRoute();
          const next = !aroundCambridge;
          setAroundCambridge(next);
          map.current?.animateToRegion({
            ...(next ? cambridge : position), latitudeDelta: 0.35, longitudeDelta: 0.45,
          });
        } else {
          focusSites();
        }
      }} />
      <MapView ref={map} style={styles.map} provider={PROVIDER_GOOGLE}
        showsUserLocation={hasPermission}
        initialRegion={{ ...cambridge, latitudeDelta: 0.35, longitudeDelta: 0.45 }}
        onMapReady={focusSites}>
        {matches.map(match => <Marker key={match.id} coordinate={match.coordinate}
          accessibilityLabel={match.name} onPress={() => {
            resetRoute();
            setSelected(match);
          }} />)}
        {route && <Polyline coordinates={route.points} strokeColor="#146cbb" strokeWidth={5} />}
      </MapView>
      <View style={styles.sheet}>
        <ScrollView contentContainerStyle={styles.details}>
          {site ? <>
            <Text style={styles.title}>{site.name}</Text>
            <Text>{site.address}</Text>
            <Text>Accepted materials for this category · {site.materials[category]}</Text>
            <Text>{site.hours}</Text>
            <Text>Household waste only. Pins indicate approximate site locations.</Text>
            <Text>Sources reviewed {site.reviewed}</Text>
            <Button title="Check council opening hours" onPress={() => {
              Linking.openURL(site.sources[2]).catch(() => setError('Council page could not be opened.'));
            }} />
            <Button title={routing ? 'Getting directions…' :
              position && !aroundCambridge ? 'Driving directions from my location' :
                'Preview driving directions from central Cambridge'}
              disabled={routing} onPress={() => void showDirections(site)} />
            {error ? <Text accessibilityLiveRegion="polite">{error}</Text> : null}
            {route && <>
              <Text style={styles.title}>
                {(route.distanceMetres / 1000).toFixed(1)} km · {Math.ceil(route.seconds / 60)} min
              </Text>
              {route.steps.map((step, index) => <Text key={index}>{index + 1}. {step}</Text>)}
            </>}
          </> : <>
            <Text style={styles.title}>Recycling locations</Text>
            {matches.length === 0
              ? <Text>No verified sites in this list for this category. Check the item-specific disposal advice.</Text>
              : matches.map(match => <Button key={match.id}
                title={match.name + ' · ' + distanceKm(origin, match.coordinate).toFixed(1) + ' km away'}
                onPress={() => {
                  resetRoute();
                  setSelected(match);
                  map.current?.animateToRegion({
                    ...match.coordinate, latitudeDelta: 0.025, longitudeDelta: 0.025,
                  });
                }} />)}
          </>}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff' },
  map: { flex: 1, minHeight: 120 },
  notice: { padding: 8, color: '#143b2c' },
  sheet: { maxHeight: '45%', backgroundColor: '#fff', borderTopLeftRadius: 18, borderTopRightRadius: 18, elevation: 5 },
  details: { padding: 16, gap: 8 },
  title: { fontSize: 17, fontWeight: '700' },
});
