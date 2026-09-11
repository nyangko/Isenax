import { produce } from 'immer';
import { Model, ModelStore, ModelItem, View } from 'src/types';
import { validateModel } from 'src/schemas/validation';
import { getItemByIdOrThrow } from './common';

export const fixModel = (model: Model): Model => {
  const issues = validateModel(model);

  return issues.reduce((acc, issue) => {
    if (issue.type === 'INVALID_MODEL_TO_ICON_REF') {
      return produce(acc, (draft) => {
        const { index: itemIndex } = getItemByIdOrThrow(
          draft.items,
          issue.params.modelItem
        );

        draft.items[itemIndex].icon = undefined;
      });
    }

    if (issue.type === 'CONNECTOR_TOO_FEW_ANCHORS') {
      return produce(acc, (draft) => {
        const view = getItemByIdOrThrow(draft.views, issue.params.view);

        const connector = getItemByIdOrThrow(
          view.value.connectors ?? [],
          issue.params.connector
        );

        draft.views[view.index].connectors?.splice(connector.index, 1);
      });
    }

    if (issue.type === 'INVALID_ANCHOR_TO_ANCHOR_REF') {
      return produce(acc, (draft) => {
        const view = getItemByIdOrThrow(draft.views, issue.params.view);

        const connector = getItemByIdOrThrow(
          view.value.connectors ?? [],
          issue.params.connector
        );

        const anchor = getItemByIdOrThrow(
          connector.value.anchors,
          issue.params.srcAnchor
        );

        connector.value.anchors.splice(anchor.index, 1);
      });
    }

    return acc;
  }, model);
};

export const modelFromModelStore = (modelStore: ModelStore): Model => {
  return {
    version: modelStore.version,
    title: modelStore.title,
    description: modelStore.description,
    colors: modelStore.colors,
    icons: modelStore.icons,
    items: modelStore.items,
    views: modelStore.views
  };
};

// views[] is flat; parentViewId is what makes it a tree. Returned depth-first
// with a depth per row, so a list UI can render the hierarchy by indentation
// alone -- diagrams have a handful of views, not hundreds.
//
// A parentViewId pointing at a view that isn't there (nothing validates that
// yet) is treated as a root so the view still appears somewhere, and a
// parentViewId cycle -- impossible through createChildView, but nothing stops
// one arriving over MCP -- stops rather than recursing forever.
export const buildViewTree = (views: View[]): { view: View; depth: number }[] => {
  const childrenOf = new Map<string | undefined, View[]>();

  views.forEach((view) => {
    const parentId =
      view.parentViewId && views.some((v) => v.id === view.parentViewId)
        ? view.parentViewId
        : undefined;

    childrenOf.set(parentId, [...(childrenOf.get(parentId) ?? []), view]);
  });

  const rows: { view: View; depth: number }[] = [];
  const seen = new Set<string>();

  const walk = (parentId: string | undefined, depth: number) => {
    (childrenOf.get(parentId) ?? []).forEach((view) => {
      if (seen.has(view.id)) return;

      seen.add(view.id);
      rows.push({ view, depth });
      walk(view.id, depth + 1);
    });
  };

  walk(undefined, 0);

  // Anything the walk never reached is in a parentViewId cycle -- every view
  // in it points at another one, so none of them is a root. Surface them at
  // the top level rather than dropping them off the list entirely.
  views.forEach((view) => {
    if (seen.has(view.id)) return;

    seen.add(view.id);
    rows.push({ view, depth: 0 });
    walk(view.id, 1);
  });

  return rows;
};

// Root-first chain of views from the diagram's root down to viewId, for a
// breadcrumb. Stops on a parentViewId cycle (see buildViewTree) so a bad chain
// yields a short path instead of hanging.
export const getViewPath = (views: View[], viewId: string): View[] => {
  const path: View[] = [];
  const seen = new Set<string>();

  let current = views.find((view) => view.id === viewId);

  while (current && !seen.has(current.id)) {
    seen.add(current.id);
    path.unshift(current);

    const parentId: string | undefined = current.parentViewId;
    current = parentId ? views.find((view) => view.id === parentId) : undefined;
  }

  return path;
};

// What the child-view affordance on a node should do right now. Inside a view,
// the node that view hangs off is still carrying childViewId -- pointing it at
// its own view again is a no-op, so there it means "back out to where this
// lives" instead. Every entry point (context menu, Layers panel row, canvas
// double-click) asks this so they can't drift apart.
export type ChildViewAction =
  | { type: 'ENTER'; viewId: string }
  | { type: 'BACK'; viewId: string }
  | { type: 'CREATE' }
  | null;

export const getChildViewAction = (
  modelItem: Pick<ModelItem, 'id' | 'childViewId'>,
  currentView: Pick<View, 'anchorItemId' | 'parentViewId'>
): ChildViewAction => {
  if (currentView.anchorItemId === modelItem.id) {
    // A child view always has a parent; guard anyway rather than offer a
    // navigation that goes nowhere.
    return currentView.parentViewId ? { type: 'BACK', viewId: currentView.parentViewId } : null;
  }

  if (modelItem.childViewId) return { type: 'ENTER', viewId: modelItem.childViewId };

  return { type: 'CREATE' };
};

// Load-time repair for the things validateModel now rejects that a stored
// diagram can already contain. The MCP boundary should refuse them -- that's
// where they come from -- but refusing to *open* a diagram over them locks a
// user out of their own data with nothing they can do about it from the UI
// (an alert and a blank canvas). So on load: keep the first of any repeated
// id, and drop hierarchy links that point at nothing or only go one way. Each
// repair is logged, the way the connector cleanup below it already does.
export const repairModel = <T extends Model>(model: T): T => {
  const warn = (msg: string) => console.warn(`repairModel: ${msg}`);

  const dedupe = <I extends { id: string }>(list: I[], what: string): I[] => {
    const seen = new Set<string>();

    return list.filter((entry) => {
      if (seen.has(entry.id)) {
        warn(`dropped duplicate ${what} "${entry.id}"`);
        return false;
      }

      seen.add(entry.id);
      return true;
    });
  };

  const views = dedupe(model.views, 'view').map((view) => ({
    ...view,
    items: dedupe(view.items, `item in view "${view.id}"`),
    ...(view.connectors ? { connectors: dedupe(view.connectors, `connector in view "${view.id}"`) } : {}),
    ...(view.rectangles ? { rectangles: dedupe(view.rectangles, `rectangle in view "${view.id}"`) } : {}),
    ...(view.textBoxes ? { textBoxes: dedupe(view.textBoxes, `text box in view "${view.id}"`) } : {})
  }));
  const items = dedupe(model.items, 'item');

  const viewsById = new Map(views.map((view) => [view.id, view]));
  const itemsById = new Map(items.map((item) => [item.id, item]));

  const repairedViews = views.map((view) => {
    let next = view;

    if (next.parentViewId && !viewsById.has(next.parentViewId)) {
      warn(`view "${view.id}" pointed at missing parent "${next.parentViewId}"`);
      next = { ...next, parentViewId: undefined };
    }

    if (next.anchorItemId) {
      const anchor = itemsById.get(next.anchorItemId);
      const hasAnchorViewItem = next.items.some((vi) => vi.id === next.anchorItemId && vi.anchor);

      if (!anchor || anchor.childViewId !== view.id || !hasAnchorViewItem) {
        warn(`view "${view.id}" had a broken anchor link to item "${next.anchorItemId}"`);
        next = { ...next, anchorItemId: undefined };
      }
    }

    return next;
  });

  // A parentViewId loop: cut it at the first view we come back around to.
  const finalViews = repairedViews.map((view) => {
    const seen = new Set<string>([view.id]);
    let cursor = view.parentViewId ? repairedViews.find((v) => v.id === view.parentViewId) : undefined;

    while (cursor) {
      if (seen.has(cursor.id)) {
        warn(`view "${view.id}" was its own ancestor; detached it`);
        return { ...view, parentViewId: undefined };
      }

      seen.add(cursor.id);
      cursor = cursor.parentViewId ? repairedViews.find((v) => v.id === cursor!.parentViewId) : undefined;
    }

    return view;
  });

  const finalViewsById = new Map(finalViews.map((view) => [view.id, view]));

  const repairedItems = items.map((item) => {
    if (!item.childViewId) return item;

    const child = finalViewsById.get(item.childViewId);

    if (!child || child.anchorItemId !== item.id) {
      warn(`item "${item.id}" pointed at child view "${item.childViewId}" that does not link back`);
      return { ...item, childViewId: undefined };
    }

    return item;
  });

  return { ...model, items: repairedItems, views: finalViews };
};
