// Generates a large, realistic dataset so the pagination/filtering/virtualization
// claims in the README are actually true, not just theoretical.
//
// Usage: npm run seed            (defaults to 100,000 orders)
//        npm run seed -- 250000  (custom count)

require("dotenv").config();
const mongoose = require("mongoose");
const { faker } = require("@faker-js/faker");
const Order = require("../models/Order");

const TOTAL = parseInt(process.argv[2]) || 100000;
const BATCH_SIZE = 2000;

const STATUSES = ["pending", "processing", "shipped", "delivered", "cancelled", "refunded"];
const PAYMENT_METHODS = ["card", "upi", "paypal", "netbanking", "cod"];

function randomOrder(i) {
  const placedAt = faker.date.between({ from: "2024-01-01", to: new Date() });
  return {
    orderNumber: `ORD-${String(i).padStart(7, "0")}`,
    customerName: faker.person.fullName(),
    customerEmail: faker.internet.email().toLowerCase(),
    country: faker.location.country(),
    itemCount: faker.number.int({ min: 1, max: 8 }),
    amount: Number(faker.commerce.price({ min: 5, max: 2000 })),
    currency: "USD",
    status: faker.helpers.arrayElement(STATUSES),
    paymentMethod: faker.helpers.arrayElement(PAYMENT_METHODS),
    placedAt,
  };
}

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log(`Connected. Seeding ${TOTAL.toLocaleString()} orders in batches of ${BATCH_SIZE}...`);

  await Order.deleteMany({});
  console.log("Cleared existing orders.");

  let inserted = 0;
  for (let start = 0; start < TOTAL; start += BATCH_SIZE) {
    const batchCount = Math.min(BATCH_SIZE, TOTAL - start);
    const batch = Array.from({ length: batchCount }, (_, j) => randomOrder(start + j + 1));
    await Order.insertMany(batch, { ordered: false });
    inserted += batchCount;
    process.stdout.write(`\r  ${inserted.toLocaleString()} / ${TOTAL.toLocaleString()} inserted`);
  }

  console.log("\nDone. Ensuring indexes are built...");
  await Order.ensureIndexes();

  console.log("Seed complete.");
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
