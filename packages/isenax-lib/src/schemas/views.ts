import { z } from 'zod';
import { id, constrainedStrings, coords } from './common';
import { rectangleSchema } from './rectangle';
import { connectorSchema } from './connector';
import { textBoxSchema } from './textBox';

export const viewItemSchema = z.object({
  id,
  tile: coords,
  labelHeight: z.number().optional(),
  // ALWAYS (default when unset) matches existing behavior -- the name/
  // description label always shows when present. HOVER only shows it while
  // the node is moused over; HIDDEN never renders it regardless of content.
  labelDisplayMode: z.enum(['ALWAYS', 'HOVER', 'HIDDEN']).optional(),
  // true for the item that anchors a drill-down view to its parent item --
  // undeletable, marks "this view is the detail of that item".
  anchor: z.boolean().optional()
});

export const viewSchema = z.object({
  id,
  lastUpdated: z.string().datetime().optional(),
  name: constrainedStrings.name,
  description: constrainedStrings.description.optional(),
  items: z.array(viewItemSchema),
  rectangles: z.array(rectangleSchema).optional(),
  connectors: z.array(connectorSchema).optional(),
  textBoxes: z.array(textBoxSchema).optional(),
  // Set together: parentViewId is the view this was drilled down from,
  // anchorItemId is the ModelItem id whose detail this view represents.
  parentViewId: id.optional(),
  anchorItemId: id.optional()
});

export const viewsSchema = z.array(viewSchema);
