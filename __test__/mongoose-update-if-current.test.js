const mongoose = require('mongoose');
const { updateIfCurrentPlugin } = require('mongoose-update-if-current');

const MONGO_URL = 'mongodb://127.0.0.1:27017/tests';

beforeAll(async () => {
  await mongoose.connect(MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: true,
    useCreateIndex: true,
  });

  try {
    await mongoose.connection.dropCollection('parents');
  } catch (e) {
    //
  }

  mongoose.plugin(updateIfCurrentPlugin);
});

afterAll(async () => {
  await mongoose.connection.close();
});

test('save subdocuments should throw this.increment bug', async () => {
  const ChildSchema = new mongoose.Schema({ name: String });
  const ParentSchema = new mongoose.Schema({ sub: ChildSchema });

  const ParentModel = mongoose.model('Parent', ParentSchema);
  const p = new ParentModel({
    sub: { name: 'hello' },
  });
  await expect(p.save()).rejects.toThrow(
    new TypeError('this.increment is not a function'),
  );
});
