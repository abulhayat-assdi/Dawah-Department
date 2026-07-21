import type { Profile } from "@/lib/types";

/** A profile enriched with data that lives outside the `profiles` table. */
export interface MemberWithMeta extends Profile {
  /** From auth.users — profiles doesn't store email itself. */
  email: string;
  /** Campus IDs this member is currently assigned to (teacher_campuses). */
  campusIds: string[];
}
