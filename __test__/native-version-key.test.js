const mongoose = require('mongoose');

const MONGO_URL = 'mongodb://127.0.0.1:27017/tests';

beforeAll(async () => {
  await mongoose.connect(MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: true,
    useCreateIndex: true,
  });
  try {
    await mongoose.connection.dropCollection('blogs');
    await mongoose.connection.dropCollection('users');
  } catch (e) {
    //
  }
});

afterAll(async () => {
  await mongoose.connection.close();
});

test('version key should operates on arrays', async () => {
  const BlogSchema = new mongoose.Schema({
    comments: [{ body: 'string' }],
  });
  const Model = mongoose.model('blog', BlogSchema);

  const { _id } = await Model.create({
    comments: [{ body: 'aaa' }, { body: 'bbb' }, { body: 'ccc' }],
  });
  const doc1 = await Model.findOne({ _id });
  const doc2 = await Model.findOne({ _id });

  // Delete first 3 comments from `doc1`, now doc1.comments should be empty array
  doc1.comments.splice(0, 3);
  await doc1.save();

  // The below `save()` will throw a VersionError, because you're trying to
  // modify the comment at index 1, and the above `splice()` removed that comment.
  doc2.set('comments.1.body', 'new comment');
  try {
    await doc2.save();
  } catch (e) {
    expect(e.name).toBe('VersionError');
  }
  expect(doc1.toObject()).toEqual(
    expect.objectContaining({
      comments: [],
    }),
  );
});

test('version key not work on update', async () => {
  const UserSchema = new mongoose.Schema({ name: String });
  const Model = mongoose.model('User', UserSchema);

  const doc = await Model.create({
    name: 'aaa',
  });

  const doc1 = await Model.findById(doc._id);
  const doc2 = await Model.findById(doc._id);

  const update1 = await Model.updateOne(
    { _id: doc._id, __v: doc1.__v },
    { name: 'bbb' },
  );
  const update2 = await Model.updateOne(
    { _id: doc._id, __v: doc2.__v },
    { name: 'ccc' },
  );

  expect(update1.nModified).toBe(1);
  expect(update2.nModified).toBe(1);

  const newDoc = await Model.findById(doc._id);

  expect(newDoc.toObject()).toEqual(expect.objectContaining({ name: 'ccc' }));
  expect(doc.__v).toEqual(0);
});
