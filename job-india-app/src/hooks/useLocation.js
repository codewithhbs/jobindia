import { useState, useCallback } from 'react';
import * as Location from 'expo-location';

export function useLocation() {
  const [coords, setCoords] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const request = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') throw new Error('Location permission denied');
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };

      // reverse geocode for city/state
      try {
        const [place] = await Location.reverseGeocodeAsync({ latitude: c.lat, longitude: c.lng });
        if (place) {
          c.city = place.city || place.subregion;
          c.state = place.region;
          c.pincode = place.postalCode;
          c.country = place.country;
        }
      } catch (_e) {
        /* ignore geocode failure */
      }

      setCoords(c);
      return c;
    } catch (e) {
      setError(e);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  return { coords, loading, error, request };
}
