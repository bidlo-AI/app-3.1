/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as blocks from "../blocks.js";
import type * as helpers from "../helpers.js";
import type * as http from "../http.js";
import type * as organization_invites from "../organization_invites.js";
import type * as organization_members from "../organization_members.js";
import type * as organizations from "../organizations.js";
import type * as presence from "../presence.js";
import type * as teams from "../teams.js";
import type * as users from "../users.js";
import type * as workos from "../workos.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  blocks: typeof blocks;
  helpers: typeof helpers;
  http: typeof http;
  organization_invites: typeof organization_invites;
  organization_members: typeof organization_members;
  organizations: typeof organizations;
  presence: typeof presence;
  teams: typeof teams;
  users: typeof users;
  workos: typeof workos;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
