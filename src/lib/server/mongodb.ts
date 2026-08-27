import "server-only";
import { MongoClient, ServerApiVersion, type Db } from "mongodb";
import { getMongoConfig } from "./env";

type MongoGlobal = typeof globalThis & {
  __ax7MongoClient?: Promise<MongoClient>;
  __ax7MongoIndexes?: Promise<void>;
};

const mongoGlobal = globalThis as MongoGlobal;

async function createClient() {
  const { uri } = getMongoConfig();
  const client = new MongoClient(uri, {
    appName: "ax7mov-admin",
    connectTimeoutMS: 8_000,
    maxIdleTimeMS: 30_000,
    maxPoolSize: 10,
    minPoolSize: 0,
    retryReads: true,
    retryWrites: true,
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
    serverSelectionTimeoutMS: 8_000,
    tls: true,
  });
  await client.connect();
  return client;
}

async function ensureIndexes(db: Db) {
  await Promise.all([
    db.collection("projects").createIndex({ slug: 1 }, { unique: true }),
    db.collection("projects").createIndex({ published: 1, displayOrder: 1 }),
    db.collection("reviews").createIndex({ published: 1, displayOrder: 1 }),
    db.collection("adminUsers").createIndex({ key: 1 }, { unique: true }),
    db.collection("adminUsers").createIndex({ email: 1 }, { unique: true }),
    db.collection("siteSettings").createIndex({ key: 1 }, { unique: true }),
    db
      .collection("mediaOverrides")
      .createIndex({ mediaId: 1 }, { unique: true }),
    db
      .collection("adminSessions")
      .createIndex({ sessionId: 1 }, { unique: true }),
    db
      .collection("adminSessions")
      .createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    db.collection("loginAttempts").createIndex({ key: 1 }, { unique: true }),
    db
      .collection("loginAttempts")
      .createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    db
      .collection("auditEvents")
      .createIndex({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 }),
  ]);
}

export async function getMongoDb() {
  const { dbName } = getMongoConfig();
  mongoGlobal.__ax7MongoClient ??= createClient();
  const client = await mongoGlobal.__ax7MongoClient;
  const db = client.db(dbName);
  mongoGlobal.__ax7MongoIndexes ??= ensureIndexes(db);
  await mongoGlobal.__ax7MongoIndexes;
  return db;
}
