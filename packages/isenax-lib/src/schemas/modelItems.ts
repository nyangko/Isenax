import { z } from 'zod';
import { id, constrainedStrings } from './common';

export const modelItemSchema = z.object({
  id,
  name: constrainedStrings.name,
  description: constrainedStrings.description.optional(),
  icon: id.optional(),
  // Id of the View that shows this item's detail drill-down, if one was created.
  childViewId: id.optional()
});

export const modelItemsSchema = z.array(modelItemSchema);
