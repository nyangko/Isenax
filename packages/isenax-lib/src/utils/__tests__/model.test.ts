import { buildViewTree, getViewPath, getChildViewAction } from '../model';
import { View } from 'src/types';

const view = (id: string, parentViewId?: string): View => ({
  id,
  name: id,
  items: [],
  ...(parentViewId ? { parentViewId } : {})
});

describe('buildViewTree', () => {
  it('walks parent/child views depth-first with a depth per row', () => {
    const rows = buildViewTree([
      view('root'),
      view('payment', 'root'),
      view('settlement', 'payment'),
      view('order', 'root')
    ]);

    expect(rows.map((r) => [r.view.id, r.depth])).toEqual([
      ['root', 0],
      ['payment', 1],
      ['settlement', 2],
      ['order', 1]
    ]);
  });

  it('treats a parentViewId that points nowhere as a root', () => {
    const rows = buildViewTree([view('orphan', 'deleted'), view('root')]);

    expect(rows.map((r) => [r.view.id, r.depth])).toEqual([
      ['orphan', 0],
      ['root', 0]
    ]);
  });

  it('surfaces a parentViewId cycle at the top level instead of recursing forever', () => {
    const rows = buildViewTree([view('a', 'b'), view('b', 'a')]);

    expect(rows.map((r) => [r.view.id, r.depth])).toEqual([
      ['a', 0],
      ['b', 1]
    ]);
  });

  it('lists every view exactly once', () => {
    const views = [view('root'), view('a', 'root'), view('b', 'c'), view('c', 'b')];

    const rows = buildViewTree(views);

    expect(rows.map((r) => r.view.id).sort()).toEqual(['a', 'b', 'c', 'root']);
  });
});

describe('getViewPath', () => {
  const views = [
    view('root'),
    view('payment', 'root'),
    view('settlement', 'payment')
  ];

  it('returns the chain from the root down to the given view', () => {
    expect(getViewPath(views, 'settlement').map((v) => v.id)).toEqual([
      'root',
      'payment',
      'settlement'
    ]);
  });

  it('returns just the view itself for a root view', () => {
    expect(getViewPath(views, 'root').map((v) => v.id)).toEqual(['root']);
  });

  it('stops where the chain breaks instead of dropping the view', () => {
    expect(getViewPath([view('orphan', 'deleted')], 'orphan').map((v) => v.id)).toEqual([
      'orphan'
    ]);
  });

  it('stops on a parentViewId cycle instead of hanging', () => {
    expect(getViewPath([view('a', 'b'), view('b', 'a')], 'a').map((v) => v.id)).toEqual([
      'b',
      'a'
    ]);
  });

  it('returns nothing for a view id that is not there', () => {
    expect(getViewPath(views, 'missing')).toEqual([]);
  });
});

describe('getChildViewAction', () => {
  const rootView = { anchorItemId: undefined, parentViewId: undefined };
  const childView = { anchorItemId: 'payment', parentViewId: 'root' };

  it('enters the child view of a node that has one', () => {
    expect(getChildViewAction({ id: 'payment', childViewId: 'detail' }, rootView)).toEqual({
      type: 'ENTER',
      viewId: 'detail'
    });
  });

  it('offers to create one for a node that has none', () => {
    expect(getChildViewAction({ id: 'payment' }, rootView)).toEqual({ type: 'CREATE' });
  });

  it('goes back to the parent on the node the current view hangs off', () => {
    expect(getChildViewAction({ id: 'payment', childViewId: 'detail' }, childView)).toEqual({
      type: 'BACK',
      viewId: 'root'
    });
  });

  it('offers nothing on an anchor whose view has no parent', () => {
    expect(
      getChildViewAction({ id: 'payment', childViewId: 'detail' }, { anchorItemId: 'payment' })
    ).toBeNull();
  });
});
