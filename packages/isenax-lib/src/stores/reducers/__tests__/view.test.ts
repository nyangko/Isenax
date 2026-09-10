import { deleteView, updateView } from '../view';
import { State } from '../types';
import { View, ModelItem } from 'src/types';

const view = (id: string, parentViewId?: string): View => ({
  id,
  name: id,
  items: [],
  ...(parentViewId ? { parentViewId } : {})
});

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
  scene: { connectors: {}, textBoxes: {} }
});

describe('deleteView', () => {
  it('deletes the view and every view nested under it', () => {
    const state = buildState(
      [],
      [view('root'), view('payment', 'root'), view('settlement', 'payment'), view('order', 'root')]
    );

    const result = deleteView({ viewId: 'payment', state });

    expect(result.model.views.map((v) => v.id)).toEqual(['root', 'order']);
  });

  it('clears childViewId on every anchor item of a deleted view', () => {
    const state = buildState(
      [
        { id: 'payment', name: 'Payment', childViewId: 'payment-view' },
        { id: 'batch', name: 'Batch', childViewId: 'batch-view' },
        { id: 'order', name: 'Order', childViewId: 'order-view' }
      ],
      [
        view('root'),
        view('payment-view', 'root'),
        view('batch-view', 'payment-view'),
        view('order-view', 'root')
      ]
    );

    const result = deleteView({ viewId: 'payment-view', state });

    expect(result.model.items.find((i) => i.id === 'payment')?.childViewId).toBeUndefined();
    expect(result.model.items.find((i) => i.id === 'batch')?.childViewId).toBeUndefined();
    // Untouched branch keeps its link.
    expect(result.model.items.find((i) => i.id === 'order')?.childViewId).toBe('order-view');
  });

  it('refuses to leave the model with no views at all', () => {
    const state = buildState([], [view('root'), view('child', 'root')]);

    const result = deleteView({ viewId: 'root', state });

    expect(result.model.views.map((v) => v.id)).toEqual(['root', 'child']);
  });
});

describe('updateView', () => {
  it('renames a view', () => {
    const state = buildState([], [view('root')]);

    const result = updateView({ name: 'Payments' }, { viewId: 'root', state });

    expect(result.model.views[0].name).toBe('Payments');
  });
});
