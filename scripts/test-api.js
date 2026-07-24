const BASE = "https://homestock-app-five.vercel.app";

async function test() {
  // Login
  const loginRes = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ login: "testuser", password: "1234" }),
  });
  const loginData = await loginRes.json();
  const cookie = loginRes.headers.get("set-cookie");
  console.log("Login:", loginData.message);

  // Get groups
  const groupsRes = await fetch(`${BASE}/api/groups`, {
    headers: { cookie },
  });
  const groupsData = await groupsRes.json();
  const groupId = groupsData.groups[0].id;
  console.log("Group:", groupsData.groups[0].name, groupId);

  // Get active items
  const itemsRes = await fetch(`${BASE}/api/items?groupId=${groupId}&flag=ACTIVE`, {
    headers: { cookie },
  });
  const itemsData = await itemsRes.json();
  console.log("Active items:", itemsData.items.length);
  itemsData.items.forEach((i) => console.log(" -", i.name, i.status, i.flag));

  if (itemsData.items.length > 0) {
    const item = itemsData.items[0];
    console.log("\nMarking", item.name, "as BOUGHT...");
    const patchRes = await fetch(`${BASE}/api/items/${item.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", cookie },
      body: JSON.stringify({ status: "BOUGHT", boughtNotes: "test" }),
    });
    const patchData = await patchRes.json();
    console.log("PATCH result:", patchRes.status, patchData.item?.status, patchData.item?.flag);

    // Re-fetch active items
    const itemsRes2 = await fetch(`${BASE}/api/items?groupId=${groupId}&flag=ACTIVE`, {
      headers: { cookie },
    });
    const itemsData2 = await itemsRes2.json();
    console.log("Active items after:", itemsData2.items.length);
    itemsData2.items.forEach((i) => console.log(" -", i.name, i.status, i.flag));
  }
}

test().catch(console.error);
