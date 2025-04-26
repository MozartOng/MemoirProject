// prisma/seed.js
const { PrismaClient, Role } = require('@prisma/client');
// Make sure the path to your utils is correct relative to the prisma folder
const { hashPassword } = require('../src/utils/password.util'); // Adjust path if needed

const prisma = new PrismaClient();

async function main() {
  console.log(`Start seeding ...`);

  // --- Define Admin User ---
  const adminEmail = 'admin@example.com'; // Choose admin email
  const plainAdminPassword = 'adminpassword123'; // CHOOSE A STRONG PASSWORD
  const adminFullName = 'Administrator';
  const adminCompanyName = 'Control Center';
  // ---

  if (!plainAdminPassword) {
      throw new Error("Admin password cannot be empty in seed script.");
  }

  const hashedPassword = await hashPassword(plainAdminPassword);
  console.log(`Password for ${adminEmail} hashed.`);

  // Use upsert: Creates user if email doesn't exist, updates if it does.
  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail }, // Unique identifier to find user
    update: { // What fields to update if user exists (optional)
        password: hashedPassword,
        role: Role.ADMIN, // Ensure role is ADMIN
        fullName: adminFullName,
        companyName: adminCompanyName,
    },
    create: { // Data to use if creating a new user
      email: adminEmail,
      fullName: adminFullName,
      password: hashedPassword,
      role: Role.ADMIN, // Set the role explicitly
      companyName: adminCompanyName,
    },
  });
  console.log(`Upserted admin user: ${adminUser.email} (ID: ${adminUser.id})`);

  // --- Add other seed data if needed ---
  // Example: Create a regular user
  /*
  const userEmail = 'contractor@example.com';
  const plainUserPassword = 'password123';
  const userHashedPassword = await hashPassword(plainUserPassword);
  const regularUser = await prisma.user.upsert({
      where: { email: userEmail },
      update: {},
      create: {
          email: userEmail,
          fullName: 'Test Contractor',
          password: userHashedPassword,
          role: Role.CONTRACTOR,
          companyName: 'Build Inc.'
      }
  });
  console.log(`Upserted regular user: ${regularUser.email}`);
  */

  console.log(`Seeding finished.`);
}

main()
  .catch((e) => {
    console.error("Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    // Close Prisma Client connection
    await prisma.$disconnect();
  });