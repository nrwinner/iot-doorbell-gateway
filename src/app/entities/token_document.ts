export interface TokenDocument {
  token: string;
  username: string;
  waitingSince?: Date;
  activeSince?: Date;
}
