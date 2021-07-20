import { Fun, Obj, Optional, Type } from '@ephox/katamari';

import { nuState } from '../common/BehaviourState';
import { PlaceeState, PositioningState } from './PositioningTypes';

export const init = (): PositioningState => {
  let state: Record<string, PlaceeState> = {};

  const set = (id: string, data: PlaceeState) => {
    state[id] = data;
  };

  const get = (id: string): Optional<PlaceeState> =>
    Obj.get(state, id);

  const clear = (id?: string) => {
    if (Type.isNonNullable(id)) {
      delete state[id];
    } else {
      state = {};
    }
  };

  return nuState({
    readState: Fun.constant(state),
    clear,
    set,
    get
  });
};
