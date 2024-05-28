import React, { useEffect, useRef} from 'react';
import 'maplibre-gl/dist/maplibre-gl.css';
import '../../styles/App.css';
import ControlsComponent from '../ControlsComponent/ControlsComponent';
import { useMap } from '../../hooks/useMap';

const MapComponent: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const {
    mapRef,
    setIsAddingPoint,
    hasPoints,
    hasLines,
    pointPopups,
    linePopups,
    visibility,
    toggleVisibility,
    getButtonText,
    handleMapClick,
    handleAddLine,
    handleDeleteElements,
    updateLayerVisibility,
  } = useMap(mapContainerRef);

  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.on('click', handleMapClick);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.off('click', handleMapClick);
      }
    };
  }, [handleMapClick, mapRef]);

  useEffect(() => {
    if (mapRef.current && mapRef.current.isStyleLoaded()) {
      updateLayerVisibility('points', visibility.points, pointPopups);
    }
  }, [visibility.points, pointPopups, mapRef, updateLayerVisibility]);

  useEffect(() => {
    if (mapRef.current && mapRef.current.isStyleLoaded()) {
      updateLayerVisibility('lines', visibility.lines, linePopups);
    }
  }, [visibility.lines, linePopups, mapRef, updateLayerVisibility]);

  return (
    <div className="App">
      <div ref={mapContainerRef} className="map-container" />
      <ControlsComponent
        hasPoints={hasPoints}
        hasLines={hasLines}
        setIsAddingPoint={setIsAddingPoint}
        toggleVisibility={toggleVisibility}
        getButtonText={getButtonText}
        handleDeleteElements={handleDeleteElements}
        handleAddLine={handleAddLine}
      />
    </div>
  );
};

export default MapComponent;

