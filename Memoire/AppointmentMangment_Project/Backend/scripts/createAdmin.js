// scripts/createAdmin.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    // Admin user details
    const adminData = {
      full_name: 'Admin User',
      email: 'admin@example.com',
      password: 'admin123', // This will be hashed
      role: 'admin',
      company_name: 'Admin Company',
    };

    // Check if the admin user already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminData.email },
    });

    if (existingAdmin) {
      console.log('Admin user already exists:', existingAdmin.email);
      return;
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(adminData.password, 10);

    // Create the admin user
    const admin = await prisma.user.create({
      data: {
        full_name: adminData.full_name,
        email: adminData.email,
        password: hashedPassword,
        role: adminData.role,
        company_name: adminData.company_name,
      },
    });

    console.log('Admin user created successfully:', admin.email);
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();