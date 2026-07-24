const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();
p.user.findMany()
  .then((r) => {
    console.log("OK, users:", r.length);
    return p.$disconnect();
  })
  .catch((e) => {
    console.error("FAIL:", e.message);
    return p.$disconnect();
  });