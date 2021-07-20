import { FieldSchema, ValueType } from '@ephox/boulder';
import { Fun } from '@ephox/katamari';

import AnchorSchema from '../../positioning/mode/AnchorSchema';

export const PositionSchema = [
  FieldSchema.defaulted('useFixed', Fun.never),
  FieldSchema.option('getBounds')
];

export const PlacementSchema = [
  FieldSchema.requiredOf('anchor', AnchorSchema),
  FieldSchema.optionObjOf('transition', [
    FieldSchema.requiredArrayOf('classes', ValueType.string),
    FieldSchema.defaultedArrayOf('properties', [ 'top', 'bottom', 'left', 'right' ], ValueType.string)
  ])
];
