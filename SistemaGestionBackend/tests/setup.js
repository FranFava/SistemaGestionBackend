const mongoose = require('mongoose');

beforeAll(async () => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/test_sistema_gestion';
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

global.mockRequest = {
  params: {},
  query: {},
  body: {},
  user: {
    id: '507f1f77bcf86cd799439011',
    username: 'testuser',
    nombre: 'Test User',
    rol: 'admin',
    empresa: '507f1f77bcf86cd799439011'
  },
  ip: '127.0.0.1',
  headers: { 'user-agent': 'test' }
};

global.mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};