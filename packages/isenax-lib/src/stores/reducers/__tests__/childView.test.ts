import { createChildView, pruneEmptyChildView } from '../childView';
import { State } from '../types';
import { View, ModelItem, Model } from 'src/types';

const scene = { connectors: {}, textBoxes: {} };

const buildState = (items: ModelItem[], views: View[]): State => ({
  model: {
    version: '1.0',
    title: 'Test Model',
    description: '',
    colors: [],
    icons: [],
    items,
    views
  },
  scene
});

describe('createChildView', () => {
  it('creates a new view anchored to the item at its existing tile/label and links childViewId', () => {
    const rootView: View = {
      id: 'root',
      name: 'Root',
      items: [
        {
          id: 'item1',
          tile: { x: 3, y: -2 },
          labelHeight: 120,
          labelDisplayMode: 'HOVER'
        }
      ]
    };
    const modelItem: ModelItem = { id: 'item1', name: 'Payment Service' };
    const state = buildState([modelItem], [rootView]);

    const { state: newState, newViewId } = createChildView('item1', {
      viewId: 'root',
      state
    });

    const newView = newState.model.views.find((v) => v.id === newViewId);
    expect(newView).toBeDefined();
    expect(newView?.parentViewId).toBe('root');
    expect(newView?.anchorItemId).toBe('item1');
    expect(newView?.items).toEqual([
      {
        id: 'item1',
        tile: { x: 3, y: -2 },
        labelHeight: 120,
        labelDisplayMode: 'HOVER',
        anchor: true
      }
    ]);

    const updatedItem = newState.model.items.find((i) => i.id === 'item1');
    expect(updatedItem?.childViewId).toBe(newViewId);
  });

  it('falls back to the origin tile and default label height when the item has no existing placement', () => {
    const rootView: View = { id: 'root', name: 'Root', items: [] };
    const modelItem: ModelItem = { id: 'item1', name: 'Payment Service' };
    const state = buildState([modelItem], [rootView]);

    const { state: newState, newViewId } = createChildView('item1', {
      viewId: 'root',
      state
    });

    const newView = newState.model.views.find((v) => v.id === newViewId);
    expect(newView?.items).toEqual([
      {
        id: 'item1',
        tile: { x: 0, y: 0 },
        labelHeight: 80,
        labelDisplayMode: 'ALWAYS',
        anchor: true
      }
    ]);
  });

  it('throws when the item already anchors a direct ancestor view', () => {
    const rootView: View = {
      id: 'root',
      name: 'Root',
      items: [],
      anchorItemId: 'item1'
    };
    const modelItem: ModelItem = { id: 'item1', name: 'Payment Service' };
    const state = buildState([modelItem], [rootView]);

    expect(() =>
      createChildView('item1', { viewId: 'root', state })
    ).toThrow(/circular/i);
  });

  it('throws when the item anchors a view further up a multi-level chain', () => {
    const rootView: View = {
      id: 'root',
      name: 'Root',
      items: [],
      anchorItemId: 'item1'
    };
    const midView: View = {
      id: 'mid',
      name: 'Mid',
      items: [],
      parentViewId: 'root',
      anchorItemId: 'item2'
    };
    const leafView: View = {
      id: 'leaf',
      name: 'Leaf',
      items: [],
      parentViewId: 'mid'
    };
    const items: ModelItem[] = [
      { id: 'item1', name: 'Payment Service' },
      { id: 'item2', name: 'Order Service' }
    ];
    const state = buildState(items, [rootView, midView, leafView]);

    expect(() =>
      createChildView('item1', { viewId: 'leaf', state })
    ).toThrow(/circular/i);

    // A sibling item not in the chain is still fine.
    const otherItem: ModelItem = { id: 'item3', name: 'Cart Service' };
    const stateWithOther = buildState([...items, otherItem], [
      rootView,
      midView,
      leafView
    ]);

    expect(() =>
      createChildView('item3', { viewId: 'leaf', state: stateWithOther })
    ).not.toThrow();
  });
});

const buildModel = (items: ModelItem[], views: View[]): Model => ({
  version: '1.0',
  title: 'Test Model',
  description: '',
  colors: [],
  icons: [],
  items,
  views
});

describe('pruneEmptyChildView', () => {
  it('removes an anchored view left with only its anchor, and clears childViewId', () => {
    const rootView: View = {
      id: 'root',
      name: 'Root',
      items: [{ id: 'item1', tile: { x: 0, y: 0 } }]
    };
    const childView: View = {
      id: 'child',
      name: 'Item 1 Detail',
      parentViewId: 'root',
      anchorItemId: 'item1',
      items: [{ id: 'item1', tile: { x: 0, y: 0 }, anchor: true }],
      rectangles: [],
      connectors: [],
      textBoxes: []
    };
    const modelItem: ModelItem = { id: 'item1', name: 'Payment Service', childViewId: 'child' };
    const model = buildModel([modelItem], [rootView, childView]);

    const result = pruneEmptyChildView(model, 'child');

    expect(result.views.find((v) => v.id === 'child')).toBeUndefined();
    expect(result.items.find((i) => i.id === 'item1')?.childViewId).toBeUndefined();
  });

  it('keeps an anchored view that has additional content', () => {
    const childView: View = {
      id: 'child',
      name: 'Item 1 Detail',
      parentViewId: 'root',
      anchorItemId: 'item1',
      items: [
        { id: 'item1', tile: { x: 0, y: 0 }, anchor: true },
        { id: 'item2', tile: { x: 1, y: 0 } }
      ],
      rectangles: [],
      connectors: [],
      textBoxes: []
    };
    const items: ModelItem[] = [
      { id: 'item1', name: 'Payment Service', childViewId: 'child' },
      { id: 'item2', name: 'DB' }
    ];
    const model = buildModel(items, [childView]);

    const result = pruneEmptyChildView(model, 'child');

    expect(result).toBe(model);
    expect(result.views.find((v) => v.id === 'child')).toBeDefined();
  });

  it('leaves a non-anchored view (a plain root/independent view) alone even when empty', () => {
    const rootView: View = { id: 'root', name: 'Root', items: [] };
    const model = buildModel([], [rootView]);

    const result = pruneEmptyChildView(model, 'root');

    expect(result).toBe(model);
    expect(result.views.find((v) => v.id === 'root')).toBeDefined();
  });
});
