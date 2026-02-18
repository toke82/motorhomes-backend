//Setup for tests - Global Mocks

//Prisma Client Mock
jest.mock('../db/prisma', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    refreshToken: {
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    $queryRaw: jest.fn(),
  },
}));

//Redis Client Mock
jest.mock('../db/redis', () => ({
  cache: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    exists: jest.fn(),
  },
  __esModule: true,
  default: {
    ping: jest.fn(),
    quit: jest.fn(),
  },
}));

//Logger Mock
jest.mock('../utils/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

//Clean mocks after each test
afterEach(() => {
  jest.clearAllMocks();
});