const express = require('express');
const mongoose = require('mongoose');
const autocannon = require('autocannon');
const versionPlugin = require('./index');

const CONCURRENCY = 5;
const REQUEST_AMOUNT = 100;
const MONGO_URL = 'mongodb://127.0.0.1:27017/tests';
// plugin must load before .model(), referrence: https://mongoosejs.com/docs/models.html#compiling
mongoose.plugin(versionPlugin);

const TestSchema = new mongoose.Schema({ name: String });
const Model = mongoose.model('Test', TestSchema);

async function runServer() {
  await mongoose.connect(MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true,
  });

  const { _id } = await Model.create({ name: 'aaa' });

  const app = express();

  app.get('/', async function handleReq(req, res) {
    const doc = await Model.findById(_id);
    await Model.updateOne({ _id, __v: doc.__v }, { name: 'bbb' });

    res.send('ok');
  });

  app.listen(3000, () => {
    console.log('Using optimistic lock...');
  });
}

async function runLoadTest() {
  await autocannon({
    url: 'http://localhost:3000',
    connections: 5,
    pipelining: 1,
    amount: 100,
  });
}

async function runResult() {
  const { __v } = await Model.findOne(
    {},
    { __v: 1, _id: 0 },
    { sort: { _id: -1 } },
  );
  console.log(`
Request amount: ${REQUEST_AMOUNT}
Concurrency: ${CONCURRENCY}
Success amount: ${__v}
  `);
}

async function main() {
  await runServer();
  await runLoadTest();
  await runResult();
  process.exit(0);
}

main();
