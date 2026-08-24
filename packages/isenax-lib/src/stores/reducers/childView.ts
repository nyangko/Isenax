import { produce } from 'immer';
import { generateId, getItemByIdOrThrow } from 'src/utils';
import { Model, View } from 'src/types';
import { VIEW_ITEM_DEFAULTS } from 'src/config';
import { State, ViewReducerContext } from './types';
import { updateModelItem } from './modelItem';

// Walks the parentViewId chain from `viewId` up to the root, collecting the
// anchorItemId of every view along the way (including `viewId` itself). Used
// to guard against creating a drill-down that loops back into its own chain.
// A visited-set guards against an already-corrupt chain looping forever.
const collectAncestorAnchorItemIds = (
  viewId: string,
  views: View[]
): Set<string> => {
  const anchorItemIds = new Set<string>();
  const visitedViewIds = new Set<string>();
  let currentId: string | undefined = viewId;

  while (currentId && !visitedViewIds.has(currentId)) {
    visitedViewIds.add(currentId);
    const view: View = getItemByIdOrThrow(views, currentId).value;

    if (view.anchorItemId) anchorItemIds.add(view.anchorItemId);
    currentId = view.parentViewId;
  }

  return anchorItemIds;
};

export const createChildView = (
  modelItemId: string,
  { viewId, state }: ViewReducerContext,
  // Caller supplies the translated name (this reducer has no i18n access) --
  // defaults to the plain item name if the caller doesn't care to localize it.
  viewName?: string
): { state: State; newViewId: string } => {
  const modelItem = getItemByIdOrThrow(state.model.items, modelItemId).value;
  const currentView = getItemByIdOrThrow(state.model.views, viewId).value;

  // Anchor the new view's item off the item's existing placement in the view
  // it's being drilled down from -- tile, label height/mode -- so it doesn't
  // jump to the origin or lose its label offset (labelHeight undefined
  // renders as 0, collapsing the label onto the node).
  const existingViewItem = currentView.items.find(
    (item) => item.id === modelItemId
  );
  const anchorTile = existingViewItem?.tile ?? { x: 0, y: 0 };
  const anchorLabelHeight =
    existingViewItem?.labelHeight ?? VIEW_ITEM_DEFAULTS.labelHeight;
  const anchorLabelDisplayMode =
    existingViewItem?.labelDisplayMode ?? VIEW_ITEM_DEFAULTS.labelDisplayMode;

  const ancestorAnchorItemIds = collectAncestorAnchorItemIds(
    viewId,
    state.model.views
  );

  if (ancestorAnchorItemIds.has(modelItemId)) {
    throw new Error(
      'Cannot create a child view for an item that already anchors one of the ancestor views (circular reference).'
    );
  }

  const newViewId = generateId();

  const newView: View = {
    id: newViewId,
    name: viewName ?? modelItem.name,
    parentViewId: viewId,
    anchorItemId: modelItemId,
    items: [
      {
        id: modelItemId,
        tile: anchorTile,
        labelHeight: anchorLabelHeight,
        labelDisplayMode: anchorLabelDisplayMode,
        anchor: true
      }
    ],
    rectangles: [],
    connectors: [],
    textBoxes: []
  };

  const stateWithNewView = produce(state, (draft) => {
    draft.model.views.push(newView);
  });

  const finalState = updateModelItem(
    modelItemId,
    { childViewId: newViewId },
    stateWithNewView
  );

  return { state: finalState, newViewId };
};

// A drill-down that the user never actually added anything to (still just
// the undeletable anchor, no other items/connectors/rectangles/textboxes) is
// discarded when navigating away from it -- otherwise every "create child
// view" click that goes nowhere leaves a permanent empty view + a childViewId
// link behind. Returns `model` unchanged (same reference) when there's
// nothing to prune, so callers can cheaply check `result === model`.
export const pruneEmptyChildView = (model: Model, viewId: string): Model => {
  const view = model.views.find((v) => v.id === viewId);

  if (!view || !view.anchorItemId) return model;

  const isEmpty =
    view.items.length === 1 &&
    view.items[0].anchor === true &&
    !view.connectors?.length &&
    !view.rectangles?.length &&
    !view.textBoxes?.length;

  if (!isEmpty) return model;

  return produce(model, (draft) => {
    const viewIndex = draft.views.findIndex((v) => v.id === viewId);
    if (viewIndex !== -1) draft.views.splice(viewIndex, 1);

    const modelItem = draft.items.find((i) => i.id === view.anchorItemId);
    if (modelItem) delete modelItem.childViewId;
  });
};
