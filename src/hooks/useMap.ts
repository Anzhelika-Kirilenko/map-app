import { useState, useRef, useEffect, useCallback } from 'react';
import maplibregl, { MapMouseEvent, GeoJSONSource, Map, LayerSpecification } from 'maplibre-gl';

interface PopupState {
  id: string;
  popup: maplibregl.Popup;
  isOpen: boolean;
}

export const useMap = (mapContainerRef: React.RefObject<HTMLDivElement>) => {
  const mapRef = useRef<Map | null>(null);
  const [isAddingPoint, setIsAddingPoint] = useState(false);
  const [isAddingLine, setIsAddingLine] = useState(false);
  const [lineCoordinates, setLineCoordinates] = useState<[number, number][]>([]);
  const [hasPoints, setHasPoints] = useState(false);
  const [hasLines, setHasLines] = useState(false);
  const [pointPopups, setPointPopups] = useState<PopupState[]>([]);
  const [linePopups, setLinePopups] = useState<PopupState[]>([]);
  const [visibility, setVisibility] = useState({
    points: true,
    lines: true,
  });

  const toggleVisibility = (layerId: 'points' | 'lines') => {
    setVisibility((prev) => ({
      ...prev,
      [layerId]: !prev[layerId],
    }));
  };

  const getButtonText = (layerId: 'points' | 'lines') => {
    return visibility[layerId] ? `Hide ${capitalize(layerId)}` : `Show ${capitalize(layerId)}`;
  };

  const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

  useEffect(() => {
    if (mapRef.current) return;

    if (mapContainerRef.current) {
      mapRef.current = new maplibregl.Map({
        container: mapContainerRef.current!,
        style: 'https://demotiles.maplibre.org/style.json',
        center: [0, 0],
        zoom: 2,
      });

      mapRef.current.on('load', () => {
        ['points', 'lines'].forEach((layerId) => {
          mapRef.current!.addSource(layerId, {
            type: 'geojson',
            data: { type: 'FeatureCollection', features: [] },
          });

          const layerType = layerId === 'points' ? 'circle' : 'line';
          const paint = layerId === 'points' ? {
            'circle-radius': 6,
            'circle-color': '#007cbf',
            'circle-stroke-width': 1,
            'circle-stroke-color': '#000000',
          } : {
            'line-color': '#007cbf',
            'line-width': 4,
          };

          const layout = layerId === 'lines' ? {
            'line-join': 'round' as 'round',
            'line-cap': 'round' as 'round',
          } : {};

          mapRef.current!.addLayer({
            id: layerId,
            type: layerType as 'circle' | 'line',
            source: layerId,
            paint,
            layout,
          } as LayerSpecification);
        });

        ['points', 'lines'].forEach((layerId) => {
          mapRef.current!.on('click', layerId, handleLayerClick(layerId as 'points' | 'lines'));
          mapRef.current!.on('mouseenter', layerId, () => {
            mapRef.current!.getCanvas().style.cursor = 'pointer';
          });
          mapRef.current!.on('mouseleave', layerId, () => {
            mapRef.current!.getCanvas().style.cursor = '';
          });
        });
      });
    }
  }, []);

  const handleLayerClick = (layerId: 'points' | 'lines') => (e: maplibregl.MapLayerMouseEvent) => {
    if (e.features && e.features[0]) {
      const coordinates = layerId === 'points' ?
        (e.features[0].geometry as GeoJSON.Point).coordinates.slice() as [number, number] :
        [e.lngLat.lng, e.lngLat.lat] as [number, number];
      const description = e.features[0].properties?.date;
      const id = e.features[0].id as string;
      const popup = new maplibregl.Popup({ closeOnClick: false, className: 'custom-popup' })
        .setLngLat(coordinates)
        .setHTML(`<div style="padding: 5px; position: relative;">Date: ${description}</div>`)
        .on('close', () => handlePopupClose(layerId, id))
        .addTo(mapRef.current!);

      const popupState = { id, popup, isOpen: true };

      if (layerId === 'points') {
        setPointPopups(popups => [...popups, popupState]);
      } else {
        setLinePopups(popups => [...popups, popupState]);
      }
    }
  };

  const handlePopupClose = (layerId: 'points' | 'lines', id: string) => {
    if (layerId === 'points') {
      setPointPopups((popups) => popups.map(p => p.id === id ? { ...p, isOpen: false } : p));
    } else {
      setLinePopups((popups) => popups.map(p => p.id === id ? { ...p, isOpen: false } : p));
    }
  };

  const handleMapClick = useCallback((e: MapMouseEvent) => {
    if (isAddingPoint) {
      addPoint(e.lngLat.lng, e.lngLat.lat);
    } else if (isAddingLine) {
      addLineCoordinate(e.lngLat.lng, e.lngLat.lat);
    }
  }, [isAddingPoint, isAddingLine]);

  const addPoint = (lng: number, lat: number) => {
    const newPoint: GeoJSON.Feature<GeoJSON.Point> = {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [lng, lat],
      },
      properties: {
        date: new Date().toLocaleDateString('ru-RU'),
      },
    };

    const source = mapRef.current!.getSource('points') as GeoJSONSource;
    const data = source._data as GeoJSON.FeatureCollection<GeoJSON.Geometry>;
    data.features.push(newPoint);
    source.setData(data);

    setIsAddingPoint(false);
    setHasPoints(true);
  };

  const addLineCoordinate = (lng: number, lat: number) => {
    setLineCoordinates(coords => [...coords, [lng, lat]]);
  };

  useEffect(() => {
    if (lineCoordinates.length >= 2) {
      const newLine: GeoJSON.Feature<GeoJSON.LineString> = {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: lineCoordinates,
        },
        properties: {
          date: new Date().toLocaleDateString('ru-RU'),
        },
      };

      const source = mapRef.current!.getSource('lines') as GeoJSONSource;
      const data = source._data as GeoJSON.FeatureCollection<GeoJSON.Geometry>;
      data.features.push(newLine);
      source.setData(data);

      setIsAddingLine(false);
      setHasLines(true);
    }
  }, [lineCoordinates]);

  const handleAddLine = () => {
    setIsAddingLine(true);
    setLineCoordinates([]);
  };

  const updateLayerVisibility = (layerId: 'points' | 'lines', visible: boolean, popups: PopupState[]) => {
    if (visible) {
      mapRef.current!.setLayoutProperty(layerId, 'visibility', 'visible');
      popups.filter(popup => popup.isOpen).forEach(popup => popup.popup.addTo(mapRef.current!));
    } else {
      mapRef.current!.setLayoutProperty(layerId, 'visibility', 'none');
      popups.forEach(popup => popup.popup.remove());
    }
  };

  const handleDeleteElements = (sourceId: 'points' | 'lines') => {
    const source = mapRef.current!.getSource(sourceId) as GeoJSONSource;
    source.setData({ type: 'FeatureCollection', features: [] });

    if (sourceId === 'points') {
      pointPopups.forEach(popup => popup.popup.remove());
      setPointPopups([]);
      setHasPoints(false);
    } else if (sourceId === 'lines') {
      linePopups.forEach(popup => popup.popup.remove());
      setLinePopups([]);
      setHasLines(false);
    }
  };

  return {
    mapRef,
    isAddingPoint,
    setIsAddingPoint,
    isAddingLine,
    setIsAddingLine,
    lineCoordinates,
    setLineCoordinates,
    hasPoints,
    setHasPoints,
    hasLines,
    setHasLines,
    pointPopups,
    setPointPopups,
    linePopups,
    setLinePopups,
    visibility,
    toggleVisibility,
    getButtonText,
    handleLayerClick,
    handleMapClick,
    handleAddLine,
    handleDeleteElements,
    updateLayerVisibility,
  };
};
