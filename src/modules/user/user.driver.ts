import { MongoDriver } from '../../app/providers/mongo.driver.ts';
import { UserDocument } from '../../app/entities/user_document.ts';

const COLLECTION = 'users';

export class UserDriver extends MongoDriver {
  public static fetchUser(username: string) {
    return this.getCollection<UserDocument>(COLLECTION).then((c) => {
      return c.findOne({ username });
    });
  }
}
