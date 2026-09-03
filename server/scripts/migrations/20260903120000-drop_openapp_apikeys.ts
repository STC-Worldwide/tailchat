import type { Db, MongoClient } from 'mongodb';

/**
 * Personal access tokens replaced app-scoped API keys, so `openappapikeys` is
 * no longer read or written by anything. What is left in it is orphaned
 * credential material (hashed secrets tied to app ids that no longer resolve),
 * which is worth removing rather than leaving to age in a backup.
 *
 * Existing app keys stop working when this ships either way: nothing resolves
 * them. Owners create a token from Settings -> API keys instead.
 *
 * There is no `down`: the documents are unrecoverable once dropped, and an
 * empty collection would not restore any of them.
 */
module.exports = {
  async up(db: Db, client: MongoClient) {
    const collectionNames = (await db.collections()).map(
      (c) => c.collectionName
    );
    if (!collectionNames.includes('openappapikeys')) {
      console.log('`openappapikeys` not present, nothing to drop.');
      return;
    }

    const collection = db.collection('openappapikeys');
    const count = await collection.countDocuments();
    console.log(`dropping \`openappapikeys\` (${count} document(s))`);
    await collection.drop();
    console.log('dropped `openappapikeys`');
  },

  async down(db: Db, client: MongoClient) {
    console.log(
      'irreversible: dropped app-scoped API keys cannot be restored, and are replaced by personal access tokens.'
    );
  },
};
