import { Arr, Strings, Obj, Optional, Optionals, Type } from '@ephox/katamari';
import { Classes, Css, DomEvent, EventArgs, SugarElement } from '@ephox/sugar';

import * as Placement from '../layout/Placement';

export interface PositionCss {
  readonly position: string;
  readonly left: Optional<string>;
  readonly top: Optional<string>;
  readonly right: Optional<string>;
  readonly bottom: Optional<string>;
}

type Position = 'top' | 'left' | 'bottom' | 'right';

export interface Transition {
  readonly classes: string[];
  readonly properties: Position[];
}

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

const hasChanges = (element: SugarElement<HTMLElement>, position: PositionCss, transition: Transition): boolean => {
  // Round to 3 decimal points
  const round = (value: string) => parseFloat(value).toPrecision(3);

  return Obj.find(position, (value, key) => {
    if (Arr.contains(transition.properties, key)) {
      const valueOpt = (value as Optional<string>).map(round);
      const cssValue = Css.getRaw(element, key).map(round);
      return !Optionals.equals(valueOpt, cssValue);
    } else {
      return false;
    }
  }).isSome();
};

// Don't apply transitions if there was no previous placement as it's transitioning from offscreen
const shouldTransition = (element: SugarElement<HTMLElement>, position: PositionCss, transition: Transition) =>
  Placement.getPlacement(element).isSome() && hasChanges(element, position, transition);

const getTransitionDuration = (element: SugarElement<HTMLElement>): number => {
  const duration = Css.get(element, 'transition-duration');
  return Arr.foldl(duration.split(/\s*,\s*'/), (acc, dur) => {
    const d = parseFloat(dur);
    const time = Strings.endsWith(dur, 's') ? d * 1000 : d;
    return Math.max(acc, time);
  }, 0);
};

const applyTransitionCss = (element: SugarElement<HTMLElement>, position: PositionCss, transition: Transition): void => {
  if (shouldTransition(element, position, transition)) {
    // Set the new position first so we can calculate the computed position
    Css.set(element, 'position', position.position);

    // Get the computed positions for the current location based on the new styles being applied
    const intermediateCssOptions = Arr.mapToObject(transition.properties, (prop) => position[prop].map(() => Css.get(element, prop)));

    // Bind to the transitionend event to cleanup the transition classes
    const transitionDone = (e?: EventArgs<TransitionEvent>) => {
      const pseudoElement = e?.raw.pseudoElement;
      // Don't clean up if the pseudo element was the cause of the transitionend
      if (Type.isNullable(pseudoElement) || Strings.isEmpty(pseudoElement)) {
        transitionEnd.unbind();
        transitionCancel.unbind();
        clearTimeout(timer);
        Classes.remove(element, transition.classes);
      }
    };
    const transitionEnd = DomEvent.bind(element, 'transitionend', transitionDone);
    const transitionCancel = DomEvent.bind(element, 'transitioncancel', transitionDone);

    // Apply the intermediate styles and class to trigger the transition
    Css.setOptions(element, intermediateCssOptions);
    Classes.add(element, transition.classes);
    Css.reflow(element);

    // Ensure the transition is cleaned up (add 10ms to give time for the transitionend to fire)
    const duration = getTransitionDuration(element);
    const timer = setTimeout(transitionDone, duration * 4 + 10);
  } else {
    Classes.remove(element, transition.classes);
  }
};

export {
  NuPositionCss,
  applyPositionCss,
  applyTransitionCss
};
