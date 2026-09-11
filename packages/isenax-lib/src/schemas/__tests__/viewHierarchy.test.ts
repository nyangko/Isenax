import { validateModel } from '../validation';
import { Model, ModelItem, View } from 'src/types';

const model = (items: ModelItem[], views: View[]): Model => ({
  version: '1.0',
  title: 'Test',
  description: '',
  colors: [],
  icons: [],
  items,
  views
});

const anchoredChild = (): Model =>
  model(
    [
      { id: 'payment', name: 'Payment', childViewId: 'detail' },
      { id: 'ledger', name: 'Ledger' }
    ],
    [
      { id: 'root', name: 'Root', items: [{ id: 'payment', tile: { x: 0, y: 0 } }] },
      {
        id: 'detail',
        name: 'Detail',
        parentViewId: 'root',
        anchorItemId: 'payment',
        items: [
          { id: 'payment', tile: { x: 0, y: 0 }, anchor: true },
          { id: 'ledger', tile: { x: 1, y: 0 } }
        ]
      }
    ]
  );

const typesOf = (m: Model) => validateModel(m).map((issue) => issue.type);

describe('view hierarchy validation', () => {
  it('accepts a correctly linked drill-down', () => {
    expect(validateModel(anchoredChild())).toEqual([]);
  });

  it('accepts a model with no child views at all', () => {
    expect(
      validateModel(
        model([{ id: 'a', name: 'A' }], [{ id: 'root', name: 'Root', items: [{ id: 'a', tile: { x: 0, y: 0 } }] }])
      )
    ).toEqual([]);
  });

  it('rejects a childViewId pointing at a view that is not there', () => {
    const m = anchoredChild();
    m.views = m.views.filter((view) => view.id !== 'detail');

    expect(typesOf(m)).toContain('INVALID_ITEM_TO_CHILD_VIEW_REF');
  });

  it('rejects a one-way link from the item', () => {
    const m = anchoredChild();
    m.views[1].anchorItemId = undefined;

    expect(typesOf(m)).toContain('INVALID_ITEM_TO_CHILD_VIEW_REF');
  });

  it('rejects a one-way link from the view', () => {
    const m = anchoredChild();
    m.items[0].childViewId = undefined;

    expect(typesOf(m)).toContain('INVALID_VIEW_TO_ANCHOR_ITEM_REF');
  });

  it('rejects a parentViewId pointing at a view that is not there', () => {
    const m = anchoredChild();
    m.views[1].parentViewId = 'gone';

    expect(typesOf(m)).toContain('INVALID_VIEW_TO_PARENT_VIEW_REF');
  });

  it('rejects an anchorItemId pointing at an item that is not there', () => {
    const m = anchoredChild();
    m.views[1].anchorItemId = 'ghost';

    expect(typesOf(m)).toContain('INVALID_VIEW_TO_ANCHOR_ITEM_REF');
  });

  it('rejects a child view that does not contain its anchor item', () => {
    const m = anchoredChild();
    m.views[1].items = m.views[1].items.filter((item) => item.id !== 'payment');

    expect(typesOf(m)).toContain('INVALID_VIEW_TO_ANCHOR_ITEM_REF');
  });

  it('rejects a child view whose anchor item is not flagged as the anchor', () => {
    const m = anchoredChild();
    m.views[1].items[0] = { id: 'payment', tile: { x: 0, y: 0 } };

    expect(typesOf(m)).toContain('INVALID_VIEW_TO_ANCHOR_ITEM_REF');
  });

  it('rejects a parentViewId loop', () => {
    const m = model(
      [],
      [
        { id: 'a', name: 'A', parentViewId: 'b', items: [] },
        { id: 'b', name: 'B', parentViewId: 'a', items: [] }
      ]
    );

    expect(typesOf(m)).toContain('CIRCULAR_VIEW_HIERARCHY');
  });

  it('rejects a view that is its own parent', () => {
    const m = model([], [{ id: 'a', name: 'A', parentViewId: 'a', items: [] }]);

    expect(typesOf(m)).toContain('CIRCULAR_VIEW_HIERARCHY');
  });
});

describe('id uniqueness validation', () => {
  it('rejects two model items with the same id', () => {
    const m = model(
      [
        { id: 'live_sync_node', name: 'Live Sync Test Node' },
        { id: 'live_sync_node', name: 'Live Sync Test Node' }
      ],
      [{ id: 'root', name: 'Root', items: [{ id: 'live_sync_node', tile: { x: 8, y: 8 } }] }]
    );

    expect(typesOf(m)).toContain('DUPLICATE_ID');
  });

  it('rejects the same item placed twice in one view', () => {
    const m = model(
      [{ id: 'a', name: 'A' }],
      [
        {
          id: 'root',
          name: 'Root',
          items: [
            { id: 'a', tile: { x: 0, y: 0 } },
            { id: 'a', tile: { x: 1, y: 1 } }
          ]
        }
      ]
    );

    const issue = validateModel(m).find((i) => i.type === 'DUPLICATE_ID');
    expect(issue?.params).toEqual({ collection: 'items', id: 'a', view: 'root' });
  });

  it('rejects two views with the same id', () => {
    const m = model([], [{ id: 'v', name: 'One', items: [] }, { id: 'v', name: 'Two', items: [] }]);

    expect(typesOf(m)).toContain('DUPLICATE_ID');
  });

  it('allows the same item to appear in different views', () => {
    expect(validateModel(anchoredChild())).toEqual([]);
  });
});
