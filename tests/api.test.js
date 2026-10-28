const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const { app } = require("../server");

test("health endpoint returns a JSON status", async () => {
  const response = await request(app).get("/api/health");
  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
  assert.equal(response.body.status, "ok");
});

test("unknown API routes return JSON 404", async () => {
  const response = await request(app).get("/api/does-not-exist");
  assert.equal(response.status, 404);
  assert.equal(response.body.success, false);
});

test("summary rejects invalid month", async () => {
  const response = await request(app).get("/api/summary?month=13");
  assert.equal(response.status, 400);
  assert.equal(response.body.success, false);
});