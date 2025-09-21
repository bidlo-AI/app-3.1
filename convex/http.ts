import { httpRouter } from 'convex/server';
import { httpAction } from './_generated/server';
import { internal, api } from './_generated/api';

const http = httpRouter();

// --------------------------------
// ROUTES
// --------------------------------
http.route({
  path: '/workos-webhook',
  method: 'POST',
  handler: httpAction(async (ctx, request) => {
    const bodyText = await request.text();
    const sigHeader = String(request.headers.get('workos-signature'));

    try {
      await ctx.runAction(internal.workos.verifyWebhook, {
        payload: bodyText,
        signature: sigHeader,
      });

      const { data, event } = JSON.parse(bodyText);

      switch (event) {
        case 'user.created': {
          await ctx.runMutation(internal.users.create, {
            email: data.email,
            workos_id: data.id,
            first_name: data.first_name,
            last_name: data.last_name,
            ...(data.profile_picture_url && { profile_picture: data.profile_picture_url }),
            theme: 'light',
            color: 'blue',
          });
          break;
        }
        case 'user.deleted': {
          const user = await ctx.runQuery(internal.users.getByWorkOSId, {
            workos_id: data.id,
          });

          if (!user?._id) {
            throw new Error(`Unhandled event type: User not found: ${data.id}.`);
          }

          // Get all organization memberships for this user
          const memberships = await ctx.runQuery(internal.organization_members.getAllByUserId, {
            workos_user_id: data.id,
          });

          // Delete all memberships first
          for (const membership of memberships) {
            await ctx.runMutation(internal.organization_members.destroy, {
              id: membership._id,
            });
          }

          // Then delete the user
          await ctx.runMutation(internal.users.destroy, {
            id: user._id,
          });

          break;
        }
        case 'user.updated': {
          const user = await ctx.runQuery(internal.users.getByWorkOSId, {
            workos_id: data.id,
          });

          if (!user?._id) {
            // TODO: compose more sophisticated error messaging?
            throw new Error(`Unhandled event type: User not found: ${data.id}.`);
          }

          await ctx.runMutation(internal.users.update, {
            id: user._id,
            patch: {
              email: data.email,
              first_name: data.first_name,
              last_name: data.last_name,
              ...(data.profile_picture_url && { profile_picture: data.profile_picture_url }),
            },
          });

          break;
        }
        case 'organization.created': {
          await ctx.runMutation(internal.organizations.create, {
            name: data.name,
            workos_id: data.id,
          });
          break;
        }
        case 'organization.deleted': {
          const organization = await ctx.runQuery(internal.organizations.getByWorkOSId, {
            workos_id: data.id,
          });

          if (!organization?._id) {
            // TODO: compose more sophisticated error messaging?
            throw new Error(`Unhandled event type: organization not found: ${data.id}.`);
          }

          await ctx.runMutation(internal.organizations.destroy, {
            id: organization._id,
          });

          break;
        }
        case 'organization.updated': {
          const organization = await ctx.runQuery(internal.organizations.getByWorkOSId, {
            workos_id: data.id,
          });

          if (!organization?._id) {
            // TODO: compose more sophisticated error messaging?
            throw new Error(`Unhandled event type: organization not found: ${data.id}.`);
          }

          await ctx.runMutation(internal.organizations.update, {
            id: organization._id,
            patch: { name: data.name },
          });

          break;
        }
        case 'organization_membership.created': {
          await ctx.runMutation(internal.organization_members.create, {
            role: data.role.slug,
            status: data.status,
            workos_org_id: data.organization_id,
            workos_user_id: data.user_id,
            workos_membership_id: data.id,
          });
          break;
        }
        case 'organization_membership.deleted': {
          const member = await ctx.runQuery(internal.organization_members.getByWorkOSIds, {
            workos_org_id: data.organization_id,
            workos_user_id: data.user_id,
          });

          if (!member?._id) {
            throw new Error(
              `Unhandled event type: Organization membership not found: org=${data.organization_id}, user=${data.user_id}.`,
            );
          }

          await ctx.runMutation(internal.organization_members.destroy, {
            id: member._id,
          });

          break;
        }
        case 'organization_membership.updated': {
          const member = await ctx.runQuery(internal.organization_members.getByWorkOSIds, {
            workos_org_id: data.organization_id,
            workos_user_id: data.user_id,
          });

          if (!member?._id) {
            // If the membership doesn't exist, create it instead of throwing an error
            // This can happen when the membership was created outside of the webhook flow
            // or if the creation webhook wasn't processed
            await ctx.runMutation(internal.organization_members.create, {
              role: data.role.slug,
              status: data.status,
              workos_org_id: data.organization_id,
              workos_user_id: data.user_id,
              workos_membership_id: data.id,
            });
          } else {
            // Update the existing membership
            await ctx.runMutation(internal.organization_members.update, {
              id: member._id,
              patch: {
                role: data.role.slug,
                status: data.status,
              },
            });
          }

          break;
        }
        case 'role.created': {
          await ctx.runMutation(internal.organization_members.create, {
            role: data.slug,
            status: data.status || 'active',
            workos_org_id: data.organization_id,
            workos_user_id: data.user_id,
            workos_membership_id: data.id,
          });
          break;
        }
        case 'role.deleted': {
          const member = await ctx.runQuery(internal.organization_members.getByWorkOSIds, {
            workos_org_id: data.organization_id,
            workos_user_id: data.user_id,
          });

          if (!member?._id) {
            throw new Error(
              `Unhandled event type: Role/membership not found: org=${data.organization_id}, user=${data.user_id}.`,
            );
          }

          await ctx.runMutation(internal.organization_members.destroy, {
            id: member._id,
          });

          break;
        }
        case 'role.updated': {
          const member = await ctx.runQuery(internal.organization_members.getByWorkOSIds, {
            workos_org_id: data.organization_id,
            workos_user_id: data.user_id,
          });

          if (!member?._id) {
            // If the membership doesn't exist, create it instead of throwing an error
            // This can happen when the membership was created outside of the webhook flow
            await ctx.runMutation(internal.organization_members.create, {
              role: data.slug,
              status: data.status || 'active',
              workos_org_id: data.organization_id,
              workos_user_id: data.user_id,
              workos_membership_id: data.id,
            });
          } else {
            // Update the existing membership
            await ctx.runMutation(internal.organization_members.update, {
              id: member._id,
              patch: { role: data.slug },
            });
          }

          break;
        }
        case 'invitation.created': {
          await ctx.runMutation(internal.organization_invites.create, {
            email: data.email,
            workos_org_id: data.organization_id,
            workos_invite_id: data.id,
            // workos_user_id: data.user_id,
            expires_at: data.expires_at ? new Date(data.expires_at).getTime() : Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days default
          });
          break;
        }
        case 'invitation.accepted': {
          // Remove the invite once it's accepted
          await ctx.runAction(api.organization_invites.removeInviteByWorkOSId, { workos_invite_id: data.id });
          break;
        }
        case 'invitation.revoked': {
          // Remove the invite if it was revoked
          await ctx.runAction(api.organization_invites.removeInviteByWorkOSId, { workos_invite_id: data.id });
          break;
        }
        default: {
          throw new Error(`Unhandled event type: ${event}`);
        }
      }

      return new Response(JSON.stringify({ status: 'success' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (e) {
      if (e instanceof Error) {
        if (e.message.includes('Unhandled event type')) {
          return new Response(
            JSON.stringify({
              status: 'error',
              message: e.message,
            }),
            {
              status: 422,
              headers: { 'Content-Type': 'application/json' },
            },
          );
        }
      }

      return new Response(
        JSON.stringify({
          status: 'error',
          message: 'Internal server error',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }
  }),
});

export default http;
