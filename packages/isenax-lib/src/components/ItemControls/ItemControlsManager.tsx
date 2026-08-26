import React, { useMemo } from 'react';
import { Box } from '@mui/material';
import { useUiStateStore } from 'src/stores/uiStateStore';
import { IconSelectionControls } from 'src/components/ItemControls/IconSelectionControls/IconSelectionControls';
import { NodeControls } from './NodeControls/NodeControls';
import { ConnectorControls } from './ConnectorControls/ConnectorControls';
import { ConnectorGroupControls } from './ConnectorControls/ConnectorGroupControls';
import { TextBoxControls } from './TextBoxControls/TextBoxControls';
import { RectangleControls } from './RectangleControls/RectangleControls';

interface Props {
  embedded?: boolean;
}

export const ItemControlsManager = ({ embedded }: Props) => {
  const itemControls = useUiStateStore((state) => {
    return state.itemControls;
  });

  const Controls = useMemo(() => {
    switch (itemControls?.type) {
      case 'ITEM':
        return <NodeControls id={itemControls.id} embedded={embedded} />;
      case 'CONNECTOR':
        return <ConnectorControls key={itemControls.id} id={itemControls.id} embedded={embedded} />;
      case 'CONNECTOR_GROUP':
        return <ConnectorGroupControls key={itemControls.ids.join(',')} controls={itemControls} embedded={embedded} />;
      case 'TEXTBOX':
        return <TextBoxControls key={itemControls.id} id={itemControls.id} embedded={embedded} />;
      case 'RECTANGLE':
        return <RectangleControls key={itemControls.id} id={itemControls.id} embedded={embedded} />;
      case 'ADD_ITEM':
        return <IconSelectionControls />;
      default:
        return null;
    }
  }, [itemControls, embedded]);

  return (
    <Box
      sx={{
        width: '100%'
      }}
    >
      {Controls}
    </Box>
  );
};
