// Fires 5 transfers of Rs 60 at the same time from a wallet holding Rs 100.
// With proper locking only ONE should go through.
// Run it with the API already running:  npm run race-test

const API = "http://localhost:4000/api";

async function call(path, method, body, token) {
  const res = await fetch(API + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify(body),
  });
  return { ok: res.ok, data: await res.json() };
}

async function balanceOf(token) {
  const res = await fetch(API + "/wallet/balance", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return (await res.json()).balance;
}

async function main() {
  const stamp = Date.now();
  const alice = (await call("/auth/register", "POST", { name: "Alice", email: `alice${stamp}@test.com`, password: "secret123" })).data;
  const bob = (await call("/auth/register", "POST", { name: "Bob", email: `bob${stamp}@test.com`, password: "secret123" })).data;

  await call("/wallet/topup", "POST", { amount: 100 }, alice.token);

  const attempts = Array.from({ length: 5 }, () =>
    call("/wallet/transfer", "POST", { toEmail: bob.user.email, amount: 60 }, alice.token)
  );
  const results = await Promise.all(attempts);

  const passed = results.filter((r) => r.ok).length;
  console.log(`${passed} of 5 transfers went through (should be 1)`);
  console.log("Alice balance:", await balanceOf(alice.token), "(should be 40)");
  console.log("Bob balance:  ", await balanceOf(bob.token), "(should be 60)");
}

main().catch((err) => console.error("Test failed:", err.message));
