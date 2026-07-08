export class PrismaClient {
  $connect = jest.fn();
  $disconnect = jest.fn();
  user = {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    findUniqueOrThrow: jest.fn(),
  };
  otpCode = { findFirst: jest.fn(), create: jest.fn(), update: jest.fn() };
  refreshToken = {
    create: jest.fn(),
    findUnique: jest.fn(),
    deleteMany: jest.fn(),
  };
  cycleEntry = { create: jest.fn(), findMany: jest.fn() };
  cyclePhase = {
    createMany: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
  };
}
