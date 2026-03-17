
import { clerkClient } from '@clerk/nextjs/server';

// Define a more specific type for the session claims
export type SessionClaims = {
  metadata: {
    // Define any metadata properties if you have them
  };
  // Add other claims as needed, for example:
  email_addresses?: { email_address: string; verification: { strategy: string } }[];
  // Add any other properties that you expect to be on sessionClaims
};

// A helper function to get the session claims with the correct type
export async function getSessionClaims(userId: string): Promise<SessionClaims | null> {
  try {
    const user = await clerkClient.users.getUser(userId);
    return user.publicMetadata as SessionClaims;
  } catch (error) {
    console.error('Error fetching session claims:', error);
    return null;
  }
}
