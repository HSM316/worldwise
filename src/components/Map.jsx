import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef, useCallback } from "react";
import styles from "./Map.module.css";
import { useUrlPosition } from "../hooks/useUrlPosition";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  useMapEvents,
} from "react-leaflet";
import { useCities } from "../contexts/CitiesContext";
import { useGeolocation } from "../hooks/useGeolocation";
import Button from "./Button";

function Map() {
  const { cities } = useCities();
  const [mapPosition, setMapPosition] = useState([40, 0]);
  const {
    isLoading: isLoadingPosition,
    position: geolocationPosition,
    getPosition,
  } = useGeolocation();

  const [mapLat, mapLng] = useUrlPosition();

  useEffect(
    function () {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (mapLat && mapLng) setMapPosition([mapLat, mapLng]);
    },
    [mapLat, mapLng],
  );

  useEffect(
    function () {
      if (geolocationPosition)
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMapPosition([geolocationPosition.lat, geolocationPosition.lng]);
    },
    [geolocationPosition],
  );

  return (
    <div className={styles.mapContainer}>
      {!geolocationPosition && (
        <Button type="position" onClick={getPosition}>
          {isLoadingPosition ? "Loading..." : "Use your position"}
        </Button>
      )}
      <MapContainer
        center={mapPosition}
        zoom={13}
        scrollWheelZoom={false}
        className={styles.map}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.fr/hot/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {cities.map((city) => (
          <Marker
            position={[city.position.lat, city.position.lng]}
            key={city.id}
          >
            <Popup>
              <span>{city.emoji}</span>
              <span>{city.cityName}</span>
            </Popup>
          </Marker>
        ))}

        <ChangeCenter position={mapPosition} />
        <DetectClick />
      </MapContainer>
    </div>
  );
}

function ChangeCenter({ position }) {
  const map = useMap();
  map.setView(position);
  return null;
}

function DetectClick() {
  const navigate = useNavigate();

  const debouncedNavigate = useDebouncedCallback((lat, lng) => {
    navigate(`form?lat=${lat}&lng=${lng}`);
  }, 300);

  useMapEvents({
    click: (e) => debouncedNavigate(e.latlng.lat, e.latlng.lng),
  });

  return null;
}

function useDebouncedCallback(callback, delay = 300) {
  const callbackRef = useRef(callback);
  const timerRef = useRef(null);

  // 保证拿到最新的 callback（避免闭包拿旧值）
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const debounced = useCallback(
    (...args) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay],
  );

  // 组件卸载时清理定时器，避免潜在的内存泄漏/卸载后执行
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return debounced;
}
export default Map;
