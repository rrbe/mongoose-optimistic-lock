const mongoose = require('mongoose');
const versionPlugin = require('../index');

const MONGO_URL = 'mongodb://127.0.0.1:27017/tests';

beforeAll(async () => {
  await mongoose.connect(MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: true,
    useCreateIndex: true,
  });

  try {
    await mongoose.connection.dropCollection('foos');
    await mongoose.connection.dropCollection('bars');
  } catch (e) {
    //
  }
  // await mongoose.connection.deleteModel('Foo');
  // await mongoose.connection.deleteModel('Bar');

  mongoose.plugin(versionPlugin);
});

afterAll(async () => {
  await mongoose.connection.close();
});

test('version key should work on save()', async () => {
  const UserSchema = new mongoose.Schema({ name: String });
  const Model = mongoose.model('Foo', UserSchema);

  const doc = await Model.create({
    name: 'aaa',
  });
  const doc1 = await Model.findById(doc._id);
  const doc2 = await Model.findById(doc._id);

  doc1.name = 'bbb';
  await doc1.save();

  doc2.name = 'ccc';
  try {
    await doc2.save();
  } catch (e) {
    expect(e.name).toEqual('VersionError');
  }

  const newDoc = await Model.findById(doc._id);

  expect(newDoc.toObject()).toEqual(expect.objectContaining({ name: 'bbb' }));
  expect(newDoc.__v).toEqual(1);
});

test('version key should work on updateOne()', async () => {
  const UserSchema = new mongoose.Schema({ name: String });
  const Model = mongoose.model('Bar', UserSchema);

  const doc = await Model.create({
    name: 'aaa',
  });

  const doc1 = await Model.findById(doc._id);
  const doc2 = await Model.findById(doc._id);

  const result1 = await Model.updateOne(
    { _id: doc._id, __v: doc1.__v },
    { name: 'bbb' },
  );
  const result2 = await Model.updateOne(
    { _id: doc._id, __v: doc2.__v },
    { name: 'ccc' },
  );

  expect(result1.nModified).toBe(1);
  expect(result2.nModified).toBe(0);

  const newDoc = await Model.findById(doc._id);

  expect(newDoc.toObject()).toEqual(expect.objectContaining({ name: 'bbb' }));
  expect(newDoc.__v).toEqual(1);
});

test('version key should work on save subdocuments', async () => {
  const ChildFooSchema = new mongoose.Schema(
    { name: String },
    { _id: false, versionKey: false },
  );
  const ParentFooSchema = new mongoose.Schema({ sub: ChildFooSchema });

  const ParentModel = mongoose.model('Parent', ParentFooSchema);
  const p = new ParentModel({
    sub: { name: 'hello' },
  });
  await p.save();

  const p1 = await ParentModel.findById(p._id);
  const p2 = await ParentModel.findById(p._id);

  p1.sub.name = 'foo';
  await p1.save();
  p2.sub.name = 'bar';
  await expect(p2.save()).rejects.toBeInstanceOf(mongoose.Error.VersionError);
});
