import prisma from '../db/prisma';
import bcrypt from 'bcryptjs';
import logger from '../utils/logger';

async function seed() {
  try {
    logger.info('Starting database seed...');

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const admin = await prisma.user.upsert({
      where: { email: 'admin@example.com' },
      update: {},
      create: {
        email: 'admin@example.com',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN',
        isActive: true,
      },
    });

    logger.info(`Admin user created: ${admin.email}`);

    // Create test user
    const testPassword = await bcrypt.hash('test123', 10);
    
    const testUser = await prisma.user.upsert({
      where: { email: 'test@example.com' },
      update: {},
      create: {
        email: 'test@example.com',
        password: testPassword,
        firstName: 'Test',
        lastName: 'User',
        role: 'USER',
        isActive: true,
      },
    });

    logger.info(`Test user created: ${testUser.email}`);

    logger.info('Database seed completed successfully!');
  } catch (error) {
    logger.error('Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seed();