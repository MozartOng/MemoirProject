// prisma/seed.js
const { PrismaClient, Role } = require('@prisma/client'); // Assuming Role is an enum in your Prisma schema
// Make sure the path to your utils is correct relative to the prisma folder
// For example, if seed.js is in 'prisma/' and password.util.js is in 'src/utils/'
const { hashPassword } = require('../src/utils/password.util');

const prisma = new PrismaClient();

async function main() {
  console.log(`🚀 Starting seeding process for Admin user only...`);

  // --- Configuration for Admin User (Hardcoded) ---
  const adminEmail = 'admin1@example.com';
  const plainAdminPassword = 'admin123'; // IMPORTANT: Choose a strong password if this were a real scenario.
  const adminFullName = 'Administrator User';
  const adminCompanyName = 'Global Corp Admin';
  // ---

  if (!plainAdminPassword) {
    console.error("❌ Critical Error: Admin password is not defined in the script.");
    throw new Error("Admin password cannot be empty in seed script.");
  }
  // Ensure Role.ADMIN is valid
  if (Role.ADMIN === undefined) {
    console.error("❌ Critical Prerequisite Missing: 'Role.ADMIN' is undefined. Please ensure 'ADMIN' is defined in your 'Role' enum in 'prisma/schema.prisma' and run 'npx prisma generate'.");
    throw new Error("'Role.ADMIN' is not defined. Check your Prisma schema.");
  }

  const hashedAdminPassword = await hashPassword(plainAdminPassword);
  console.log(`🔑 Password for admin user ${adminEmail} has been hashed.`);

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      password: hashedAdminPassword,
      role: Role.ADMIN,
      fullName: adminFullName,
      companyName: adminCompanyName,
    },
    create: {
      email: adminEmail,
      fullName: adminFullName,
      password: hashedAdminPassword,
      role: Role.ADMIN,
      companyName: adminCompanyName,
    },
  });
  console.log(`👤 Admin user upserted: ${adminUser.email} (ID: ${adminUser.id})`);

  console.log(`✅ Seeding finished successfully. Only Admin user was processed.`);
}

main()
  .catch((e) => {
    console.error("❌ Error during seeding process:", e);
    process.exit(1);
  })
  .finally(async () => {
    console.log(`🔚 Disconnecting Prisma Client...`);
    await prisma.$disconnect();
    console.log(`🔌 Prisma Client disconnected.`);
  });

/*
To run this seed script:
1. Verify your `prisma/schema.prisma` has the correct `Role` enum (e.g., includes ADMIN).
   enum Role {
     ADMIN
     // Other roles if they exist, but this script only uses ADMIN
   }
   model User {
     // ...
     role Role
   }
2. Run `npx prisma generate` after any schema changes.
3. Run `npx prisma db push` (if you don't use migrations and want to sync schema) or `npx prisma migrate dev`.
4. Add a script to your package.json:
   "scripts": {
     "db:seed": "node prisma/seed.js"
   }
5. Run the seed: `npm run db:seed` or `yarn db:seed`
*/
