import React from 'react';
import { Button } from '@mui/material';

interface ControlsComponentProps {
  hasPoints: boolean;
  hasLines: boolean;
  setIsAddingPoint: (value: boolean) => void;
  toggleVisibility: (layerId: 'points' | 'lines') => void;
  getButtonText: (layerId: 'points' | 'lines') => string;
  handleDeleteElements: (sourceId: 'points' | 'lines') => void;
  handleAddLine: () => void;
}

const ControlsComponent: React.FC<ControlsComponentProps> = ({
  hasPoints,
  hasLines,
  setIsAddingPoint,
  toggleVisibility,
  getButtonText,
  handleDeleteElements,
  handleAddLine
}) => {
  return (
    <div className="controls">
      <Button variant="contained" color="primary" onClick={() => setIsAddingPoint(true)}>
        Add Point
      </Button>
      <Button variant="outlined" onClick={() => toggleVisibility('points')} disabled={!hasPoints}>
        {getButtonText('points')}
      </Button>
      <Button variant="outlined" onClick={() => handleDeleteElements('points')} disabled={!hasPoints}>
        Delete Points
      </Button>
      <Button variant="contained" color="primary" onClick={handleAddLine}>
        Add Line
      </Button>
      <Button variant="outlined" onClick={() => toggleVisibility('lines')} disabled={!hasLines}>
        {getButtonText('lines')}
      </Button>
      <Button variant="outlined" onClick={() => handleDeleteElements('lines')} disabled={!hasLines}>
        Delete Lines
      </Button>
    </div>
  );
};

export default ControlsComponent;
