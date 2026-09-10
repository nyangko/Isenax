import { produce } from 'immer';
import { Model, ModelStore, View } from 'src/types';
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
