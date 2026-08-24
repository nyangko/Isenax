import React from 'react';
import { ViewItem } from 'src/types';
import { useUiStateStore } from 'src/stores/uiStateStore';
import { Node } from './Node/Node';

interface Props {
  nodes: ViewItem[];
}

export const Nodes = ({ nodes }: Props) => {
  const itemControls = useUiStateStore((state) => state.itemControls);
  const selectedNodeId = itemControls?.type === 'ITEM' ? itemControls.id : null;

  return (
    <>
      {[...nodes].reverse().map((node) => {
        return (
          <Node
            key={node.id}
            order={-node.tile.x - node.tile.y}
            node={node}
            dimmed={selectedNodeId !== null && node.id !== selectedNodeId}
          />
        );
      })}
    </>
  );
};
