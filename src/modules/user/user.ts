import { UserDriver } from './user.driver.ts';

/**
 * Fetch a user by username
 * @param username
 */
export function fetchUser(username: string) {
  return UserDriver.fetchUser(username);
}
