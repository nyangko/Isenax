import type {
  Model,
  ModelItem,
  Connector,
  ConnectorAnchor,
  View,
  Rectangle
} from 'src/types';
import { getAllAnchors, getItemByIdOrThrow } from 'src/utils';

type IssueType =
  | {
      type: 'INVALID_ANCHOR_TO_VIEW_ITEM_REF';
      params: {
        anchor: string;
        viewItem: string;
        view: string;
        connector: string;
      };
    }
  | {
      type: 'INVALID_CONNECTOR_COLOR_REF';
      params: {
        connector: string;
        view: string;
        color: string;
      };
    }
  | {
      type: 'INVALID_RECTANGLE_COLOR_REF';
      params: {
        rectangle: string;
        view: string;
        color: string;
      };
    }
  | {
      type: 'INVALID_ANCHOR_TO_ANCHOR_REF';
      params: {
        srcAnchor: string;
        destAnchor: string;
        view: string;
        connector: string;
      };
    }
  | {
      type: 'INVALID_VIEW_ITEM_TO_MODEL_ITEM_REF';
      params: {
        view: string;
        modelItem: string;
      };
    }
  | {
      type: 'INVALID_ANCHOR_REF';
      params: {
        anchor: string;
        view: string;
        connector: string;
      };
    }
  | {
      type: 'INVALID_MODEL_TO_ICON_REF';
      params: {
        modelItem: string;
        icon: string;
      };
    }
  | {
      type: 'INVALID_ITEM_TO_CHILD_VIEW_REF';
      params: {
        modelItem: string;
        view: string;
      };
    }
  | {
      type: 'INVALID_VIEW_TO_PARENT_VIEW_REF';
      params: {
        view: string;
        parentView: string;
      };
    }
  | {
      type: 'INVALID_VIEW_TO_ANCHOR_ITEM_REF';
      params: {
        view: string;
        modelItem: string;
      };
    }
  | {
      type: 'CIRCULAR_VIEW_HIERARCHY';
      params: {
        view: string;
      };
    }
  | {
      type: 'CONNECTOR_TOO_FEW_ANCHORS';
      params: {
        connector: string;
        view: string;
      };
    };

type Issue = IssueType & {
  message: string;
};

export const validateConnectorAnchor = (
  anchor: ConnectorAnchor,
  ctx: {
    view: View;
    connector: Connector;
    allAnchors: ConnectorAnchor[];
  }
): Issue[] => {
  const issues: Issue[] = [];

  if (Object.keys(anchor.ref).length !== 1) {
    issues.push({
      type: 'INVALID_ANCHOR_REF',
      params: {
        anchor: anchor.id,
        view: ctx.view.id,
        connector: ctx.connector.id
      },
      message:
        'Connector includes an anchor that references more than one item.  An anchor can only reference one item.'
    });
  }

  if (anchor.ref.item) {
    try {
      getItemByIdOrThrow(ctx.view.items, anchor.ref.item);
    } catch (e) {
      issues.push({
        type: 'INVALID_ANCHOR_TO_VIEW_ITEM_REF',
        params: {
          anchor: anchor.id,
          viewItem: anchor.ref.item,
          view: ctx.view.id,
          connector: ctx.connector.id
        },
        message:
          'Connector includes an anchor that references an item that does not exist in this view.'
      });
    }
  }

  if (anchor.ref.anchor) {
    const targetAnchorId = ctx.allAnchors
      .map(({ id }) => {
        return id;
      })
      .includes(anchor.ref.anchor);

    if (!targetAnchorId) {
      issues.push({
        type: 'INVALID_ANCHOR_TO_ANCHOR_REF',
        params: {
          destAnchor: anchor.id,
          srcAnchor: anchor.ref.anchor,
          view: ctx.view.id,
          connector: ctx.connector.id
        },
        message:
          'Connector includes an anchor that references another connector anchor that does not exist in this view.'
      });
    }
  }

  return issues;
};

export const validateConnector = (
  connector: Connector,
  ctx: {
    view: View;
    model: Model;
    allAnchors: ConnectorAnchor[];
  }
): Issue[] => {
  const issues: Issue[] = [];

  if (connector.color) {
    try {
      getItemByIdOrThrow(ctx.model.colors, connector.color);
    } catch (e) {
      issues.push({
        type: 'INVALID_CONNECTOR_COLOR_REF',
        params: {
          connector: connector.id,
          view: ctx.view.id,
          color: connector.color
        },
        message:
          'Connector references a color that does not exist in the model.'
      });
    }
  }

  if (connector.anchors.length < 2) {
    issues.push({
      type: 'CONNECTOR_TOO_FEW_ANCHORS',
      params: {
        connector: connector.id,
        view: ctx.view.id
      },
      message:
        'Connector must have at least two anchors.  One for the source and one for the target.'
    });
  }

  const { anchors } = connector;

  anchors.forEach((anchor) => {
    const anchorIssues = validateConnectorAnchor(anchor, {
      view: ctx.view,
      connector,
      allAnchors: ctx.allAnchors
    });

    issues.push(...anchorIssues);
  });

  return issues;
};

export const validateRectangle = (
  rectangle: Rectangle,
  ctx: { view: View; model: Model }
): Issue[] => {
  const issues: Issue[] = [];

  if (rectangle.color) {
    try {
      getItemByIdOrThrow(ctx.model.colors, rectangle.color);
    } catch (e) {
      issues.push({
        type: 'INVALID_RECTANGLE_COLOR_REF',
        params: {
          rectangle: rectangle.id,
          view: ctx.view.id,
          color: rectangle.color
        },
        message:
          'Rectangle references a color that does not exist in the model.'
      });
    }
  }

  return issues;
};

export const validateView = (view: View, ctx: { model: Model }): Issue[] => {
  const issues: Issue[] = [];

  if (view.connectors) {
    const allAnchors = getAllAnchors(view.connectors);

    view.connectors.forEach((connector) => {
      issues.push(
        ...validateConnector(connector, {
          view,
          model: ctx.model,
          allAnchors
        })
      );
    });
  }

  if (view.rectangles) {
    view.rectangles.forEach((rectangle) => {
      issues.push(
        ...validateRectangle(rectangle, {
          view,
          model: ctx.model
        })
      );
    });
  }

  view.items.forEach((viewItem) => {
    try {
      getItemByIdOrThrow(ctx.model.items, viewItem.id);
    } catch (e) {
      issues.push({
        type: 'INVALID_VIEW_ITEM_TO_MODEL_ITEM_REF',
        params: {
          modelItem: viewItem.id,
          view: view.id
        },
        message:
          'Invalid item in view.  The item references a non-existent item in the model.'
      });
    }
  });

  return issues;
};

export const validateModelItem = (
  modelItem: ModelItem,
  ctx: {
    model: Model;
  }
): Issue[] => {
  const issues: Issue[] = [];

  if (!modelItem.icon) return issues;

  try {
    getItemByIdOrThrow(ctx.model.icons, modelItem.icon);
  } catch (e) {
    issues.push({
      type: 'INVALID_MODEL_TO_ICON_REF',
      params: {
        modelItem: modelItem.id,
        icon: modelItem.icon
      },
      message:
        'Invalid item found in the model.  The item references an icon that does not exist.'
    });
  }

  return issues;
};

// A drill-down view is held together by four references that have to agree:
// the item's childViewId, the view's parentViewId and anchorItemId, and the
// anchor ViewItem inside the view. Nothing checked any of them, so a model
// arriving over MCP could name a view that isn't there, link one way only, or
// describe a loop -- and the app has no storage-level validation to catch it
// afterwards (see #45 for the same class of hole with icon references).
//
// Deliberately checked here at the model level rather than inside
// validateView: that one runs inside updateViewItem and throws on any issue,
// so a rule added there would fire on the transient states normal editing goes
// through.
const validateViewHierarchy = (model: Model): Issue[] => {
  const issues: Issue[] = [];
  const viewsById = new Map(model.views.map((view) => [view.id, view]));
  const itemsById = new Map(model.items.map((item) => [item.id, item]));

  model.items.forEach((modelItem) => {
    if (!modelItem.childViewId) return;

    const childView = viewsById.get(modelItem.childViewId);

    if (!childView) {
      issues.push({
        type: 'INVALID_ITEM_TO_CHILD_VIEW_REF',
        params: { modelItem: modelItem.id, view: modelItem.childViewId },
        message:
          'Invalid item found in the model.  The item references a child view that does not exist.'
      });
      return;
    }

    if (childView.anchorItemId !== modelItem.id) {
      issues.push({
        type: 'INVALID_ITEM_TO_CHILD_VIEW_REF',
        params: { modelItem: modelItem.id, view: childView.id },
        message:
          'Invalid item found in the model.  The item references a child view that is not anchored back to it.'
      });
    }
  });

  model.views.forEach((view) => {
    if (view.parentViewId && !viewsById.has(view.parentViewId)) {
      issues.push({
        type: 'INVALID_VIEW_TO_PARENT_VIEW_REF',
        params: { view: view.id, parentView: view.parentViewId },
        message:
          'Invalid view found in the model.  The view references a parent view that does not exist.'
      });
    }

    if (!view.anchorItemId) return;

    const anchorItem = itemsById.get(view.anchorItemId);

    if (!anchorItem) {
      issues.push({
        type: 'INVALID_VIEW_TO_ANCHOR_ITEM_REF',
        params: { view: view.id, modelItem: view.anchorItemId },
        message:
          'Invalid view found in the model.  The view is anchored to an item that does not exist.'
      });
      return;
    }

    if (anchorItem.childViewId !== view.id) {
      issues.push({
        type: 'INVALID_VIEW_TO_ANCHOR_ITEM_REF',
        params: { view: view.id, modelItem: anchorItem.id },
        message:
          'Invalid view found in the model.  The item this view is anchored to does not point back at it.'
      });
    }

    // Without the anchor ViewItem there is nothing in the view to say whose
    // detail it is, and nothing to navigate back from.
    const hasAnchorViewItem = view.items.some(
      (viewItem) => viewItem.id === view.anchorItemId && viewItem.anchor
    );

    if (!hasAnchorViewItem) {
      issues.push({
        type: 'INVALID_VIEW_TO_ANCHOR_ITEM_REF',
        params: { view: view.id, modelItem: view.anchorItemId },
        message:
          'Invalid view found in the model.  The view does not contain the anchor item it is the detail of.'
      });
    }
  });

  // createChildView refuses to build a loop at runtime, but a model handed
  // straight to the schema has never been through it.
  model.views.forEach((view) => {
    const seen = new Set<string>([view.id]);
    let current = view.parentViewId ? viewsById.get(view.parentViewId) : undefined;

    while (current) {
      if (seen.has(current.id)) {
        issues.push({
          type: 'CIRCULAR_VIEW_HIERARCHY',
          params: { view: view.id },
          message:
            'Invalid view found in the model.  The view is its own ancestor via parentViewId.'
        });
        return;
      }

      seen.add(current.id);
      current = current.parentViewId ? viewsById.get(current.parentViewId) : undefined;
    }
  });

  return issues;
};

export const validateModel = (model: Model): Issue[] => {
  const issues: Issue[] = [];

  model.items.forEach((modelItem) => {
    issues.push(...validateModelItem(modelItem, { model }));
  });

  model.views.forEach((view) => {
    issues.push(...validateView(view, { model }));
  });

  issues.push(...validateViewHierarchy(model));

  return issues;
};
