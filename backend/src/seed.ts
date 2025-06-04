import { PrismaClient } from '@prisma/client';
import { AuthUtils } from './utils/auth';

async function seedDatabase() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🌱 Seeding database...');
    
    // Create admin user
    const hashedPassword = await AuthUtils.hashPassword('admin123');
    
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@admin.com' },
      update: {
        password: hashedPassword,
        name: 'Admin User',
        isActive: true
      },
      create: {
        email: 'admin@admin.com',
        password: hashedPassword,
        name: 'Admin User',
        isActive: true
      }
    });
    
    console.log('✅ Admin user created/updated:', adminUser.email);
    console.log('📧 Email: admin@admin.com');
    console.log('🔑 Password: admin123');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if this file is executed directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('✅ Database seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Database seeding failed:', error);
      process.exit(1);
    });
}

export { seedDatabase };