import { Arr, Obj, Optional, Optionals } from '@ephox/katamari';
import { Classes, Css, DomEvent, EventArgs, SugarElement } from '@ephox/sugar';

import * as Placement from '../layout/Placement';

export interface PositionCss {
  readonly position: string;
  readonly left: Optional<string>;
  readonly top: Optional<string>;
  readonly right: Optional<string>;
  readonly bottom: Optional<string>;
}

export interface Transition {
  readonly classes: string[];
}

type Position = 'top' | 'left' | 'bottom' | 'right';
const positions: Position[] = [ 'top', 'bottom', 'left', 'right' ];

const NuPositionCss = (
  position: string,
  left: Optional<number>,
  top: Optional<number>,
  right: Optional<number>,
  bottom: Optional<number>
): PositionCss => {
  const toPx = (num: number) => num + 'px';
  return {
    position,
    left: left.map(toPx),
    top: top.map(toPx),
    right: right.map(toPx),
    bottom: bottom.map(toPx)
  };
};

const toOptions = (position: PositionCss): Record<string, Optional<string>> => ({
  ...position,
  position: Optional.some(position.position)
});

const applyPositionCss = (element: SugarElement, position: PositionCss): void => {
  Css.setOptions(element, toOptions(position));
};

const hasChanges = (element: SugarElement<HTMLElement>, position: PositionCss): boolean =>
  Obj.find(position, (value, key) => {
    // Ignore position, as positioning will always change it to "fixed"
    if (key !== 'position') {
      return !Optionals.equals(value as Optional<string>, Css.getRaw(element, key));
    } else {
      return false;
    }
  }).isSome();

const applyTransitionCss = (element: SugarElement<HTMLElement>, position: PositionCss, transition: Transition): void => {
  // Don't apply transitions if there was no previous placement as it's transitioning from offscreen
  if (Placement.getPlacement(element).isSome() && hasChanges(element, position)) {
    // Set the new position first so we can calculate the computed position
    Css.set(element, 'position', position.position);

    // Get the computed positions for the current location based on the new styles being applied
    const intermediateCssOptions = Arr.mapToObject(positions, (prop) => position[prop].map(() => Css.get(element, prop)));

    // Bind to the transitionend event to cleanup the transition classes
    const transitionDone = (e: EventArgs<TransitionEvent>) => {
      console.log(e.raw.type, e.raw);
      Classes.remove(element, transition.classes);
      transitionEnd.unbind();
      transitionCancel.unbind();
    };
    const transitionEnd = DomEvent.bind(element, 'transitionend', transitionDone);
    const transitionCancel = DomEvent.bind(element, 'transitioncancel', transitionDone);

    // Apply the intermediate styles and class to trigger the transition
    Css.setOptions(element, intermediateCssOptions);
    Classes.add(element, transition.classes);
    Css.reflow(element);
  }
};

export {
  NuPositionCss,
  applyPositionCss,
  applyTransitionCss
};
