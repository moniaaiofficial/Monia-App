
import { clerkClient } from '@clerk/nextjs/server';

export type SessionClaims = {
  metadata: {
  };
  email_addresses?: { email_address: string; verification: { strategy: string } }[];
};

export async function getSessionClaims(userId: string): Promise<SessionClaims | null> {
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    return user.publicMetadata as SessionClaims;
  } catch (error) {
    console.error('Error fetching session claims:', error);
    return null;
  }
}
