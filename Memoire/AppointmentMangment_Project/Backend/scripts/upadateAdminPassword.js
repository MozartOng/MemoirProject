// scripts/updateAdminPassword.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function updateAdminPassword() {
  try {
    const email = 'admin@example.com';
    const newPassword = 'admin123'; // The original password

    // Hash the password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the admin user's password
    const admin = await prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    });

    console.log('Admin password updated successfully:', admin.email);
  } catch (error) {
    console.error('Error updating admin password:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateAdminPassword();