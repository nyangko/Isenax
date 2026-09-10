import { buildViewTree } from '../model';
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
