import { pgTable, text, timestamp, index, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { organisations } from "./organisation.schema.js";
import { users } from "../auth/user.schema.js";

// A manager's invitation for someone to join their organisation as a teacher. The link in the email carries a random token;
// only its hash is stored here, so reading this table never gives anyone a working link.
export const organisationInvites = pgTable(
    "organisation_invites",
    {
        id: text("id").primaryKey().$defaultFn(() => createId()),
        organisationId: text("organisation_id").references(() => organisations.id, { onDelete: "cascade" }).notNull(),
        // The address the invitation was sent to, lower-case. Only an account with this email can accept it.
        email: text("email").notNull(),
        tokenHash: text("token_hash").notNull().unique(),
        // "pending" until answered. An invitation that is still "pending" after expiresAt counts as expired.
        status: text("status").$type<"pending" | "accepted" | "declined" | "revoked">().default("pending").notNull(),
        invitedBy: text("invited_by").references(() => users.id, { onDelete: "set null" }),
        expiresAt: timestamp("expires_at").notNull(),
        respondedAt: timestamp("responded_at"),
        createdAt: timestamp("created_at").defaultNow().notNull(),
    },
    (table) => [
        index("organisation_invites_org_idx").on(table.organisationId),
        // One open invitation per person per organisation: inviting again resends it.
        uniqueIndex("organisation_invites_pending_idx").on(table.organisationId, table.email).where(sql`${table.status} = 'pending'`),
    ]
);

export type OrganisationInvite = typeof organisationInvites.$inferSelect;
