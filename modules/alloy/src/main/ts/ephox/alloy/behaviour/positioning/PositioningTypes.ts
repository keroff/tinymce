import { Optional } from '@ephox/katamari';
import { SugarElement } from '@ephox/sugar';

import { Bounds } from '../../alien/Boxes';
import * as Behaviour from '../../api/behaviour/Behaviour';
import { AlloyComponent } from '../../api/component/ComponentApi';
import { AnchorDetail, AnchorSpec } from '../../positioning/mode/Anchoring';

type TransitionProp = 'top' | 'bottom' | 'left' | 'right';

interface TransitionSpec {
  readonly classes: string[];
  readonly properties?: TransitionProp[];
}

interface TransitionDetail {
  readonly classes: string[];
  readonly properties: TransitionProp[];
}

export interface PlacementSpec {
  readonly anchor: AnchorSpec;
  readonly transition?: TransitionSpec;
}

export interface PlacementDetail {
  readonly anchor: AnchorDetail<any>;
  readonly transition: Optional<TransitionDetail>;
}

export interface PositioningBehaviour extends Behaviour.AlloyBehaviour<PositioningConfigSpec, PositioningConfig> {
  config: (config: PositioningConfigSpec) => Behaviour.NamedConfiguredBehaviour<PositioningConfigSpec, PositioningConfig>;
  position: (component: AlloyComponent, placee: AlloyComponent, spec: PlacementSpec) => void;
  positionWithin: (component: AlloyComponent, placee: AlloyComponent, spec: PlacementSpec, boxElement: Optional<SugarElement>) => void;
  positionWithinBounds: (component: AlloyComponent, placee: AlloyComponent, spec: PlacementSpec, bounds: Optional<Bounds>) => void;
  getMode: (component: AlloyComponent) => string;
  reset: (component: AlloyComponent, placee: AlloyComponent) => void;
}

export interface PositioningConfigSpec extends Behaviour.BehaviourConfigSpec {
  useFixed?: () => boolean;
  getBounds?: () => Bounds;
}

export interface PositioningConfig extends Behaviour.BehaviourConfigDetail {
  useFixed: () => boolean;
  getBounds: Optional<() => Bounds>; // TODO: Strengthen types
}
