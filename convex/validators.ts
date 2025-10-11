import { v } from 'convex/values';

// Shared hue validator for UI color tokens used by icons and user preferences
export const hueValidator = v.union(
  v.literal('default'),
  v.literal('gray'),
  v.literal('brown'),
  v.literal('orange'),
  v.literal('yellow'),
  v.literal('green'),
  v.literal('blue'),
  v.literal('purple'),
  v.literal('pink'),
  v.literal('red'),
);

// Shared style validator for Lucide preset icon style
export const iconStyleValidator = v.union(v.literal('line'), v.literal('solid'));

// --------------------------------
// Common Id validators
// --------------------------------
// Prefer importing these over repeating v.id('...') to keep arg and schema usage consistent
export const blockIdValidator = v.id('blocks');
export const teamIdValidator = v.id('teams');
export const fileIdValidator = v.id('files');

// --------------------------------
// Icon related validators
// --------------------------------
// Optional crop rectangle used when uploading icons
export const imageCropValidator = v.object({ x: v.number(), y: v.number(), size: v.number() });

// When storing thumbnails for uploaded icons
export const iconImageVariantValidator = v.union(v.literal('original'), v.literal('512'), v.literal('128'));

// Discriminated union for all supported icon kinds
export const iconValidator = v.union(
  v.object({
    kind: v.literal('emoji'),
    emoji: v.string(),
    shortcode: v.optional(v.string()),
    version: v.optional(v.string()),
  }),
  v.object({
    kind: v.literal('preset'),
    key: v.string(),
    style: v.optional(iconStyleValidator),
    color: v.optional(hueValidator),
  }),
  v.object({
    kind: v.literal('image'),
    file_id: fileIdValidator,
    crop: v.optional(imageCropValidator),
    variant: v.optional(iconImageVariantValidator),
  }),
);

// --------------------------------
// App-specific enums used across schema and mutations
// --------------------------------
export const scopePrivateTeamValidator = v.union(v.literal('private'), v.literal('team'));
export const agentPanelPageValidator = v.union(
  v.literal('chat'),
  v.literal('memory'),
  v.literal('tasks'),
  v.literal('history'),
  v.literal('new'),
);
export const sidebarSectionKeyValidator = v.union(v.literal('teams'), v.literal('private'));

export const layoutWidthTargetValidator = v.union(v.literal('agent_panel_width'), v.literal('sidebar_width'));
export const layoutHiddenTargetValidator = v.union(v.literal('agent_panel_hidden'), v.literal('sidebar_hidden'));

export const permissionLevelValidator = v.union(v.literal('read'), v.literal('write'), v.literal('admin'));
export const shareLevelValidator = v.union(v.literal('read'), v.literal('write'));
export const threadStatusValidator = v.union(v.literal('open'), v.literal('closed'));
export const messageRoleValidator = v.union(v.literal('user'), v.literal('assistant'), v.literal('system'));
