import { useCallback } from 'react';
import { useUiStateStore } from 'src/stores/uiStateStore';
import { useSceneStore } from 'src/stores/sceneStore';
import { useModelStoreApi } from 'src/stores/modelStore';
import * as reducers from 'src/stores/reducers';
import { Model } from 'src/types';
import { INITIAL_SCENE_STATE } from 'src/config';

export const useView = () => {
  const uiStateActions = useUiStateStore((state) => {
    return state.actions;
  });
  const currentViewId = useUiStateStore((state) => {
    return state.view;
  });

  const sceneActions = useSceneStore((state) => {
    return state.actions;
  });

  const modelStoreApi = useModelStoreApi();

  const changeView = useCallback(
    (viewId: string, model: Model) => {
      // A drill-down the user left empty (still just its anchor, nothing
      // added) is discarded on the way out, rather than leaving a permanent
      // dead view + childViewId link behind.
      const prunedModel =
        currentViewId && currentViewId !== viewId
          ? reducers.pruneEmptyChildView(model, currentViewId)
          : model;

      if (prunedModel !== model) {
        modelStoreApi.getState().actions.set(prunedModel, true);
      }

      const newState = reducers.view({
        action: 'SYNC_SCENE',
        payload: undefined,
        ctx: { viewId, state: { model: prunedModel, scene: INITIAL_SCENE_STATE } }
      });

      sceneActions.set(newState.scene, true);
      uiStateActions.setView(viewId);
    },
    [uiStateActions, sceneActions, currentViewId, modelStoreApi]
  );

  return {
    changeView
  };
};
