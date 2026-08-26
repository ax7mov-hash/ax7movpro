import "server-only";
import { ObjectId, type WithId } from "mongodb";
import type {
  AdminReview,
  PublicReview,
  ReviewInput,
} from "@/lib/admin/review-schema";
import { getMongoDb } from "./mongodb";

type ReviewDocument = ReviewInput & {
  createdAt: Date;
  updatedAt: Date;
  updatedBy: "admin";
};

function toAdminReview(row: WithId<ReviewDocument>): AdminReview {
  return {
    id: row._id.toHexString(),
    author: row.author,
    roleEn: row.roleEn,
    roleFr: row.roleFr,
    quoteEn: row.quoteEn,
    quoteFr: row.quoteFr,
    rating: row.rating,
    published: row.published,
    displayOrder: row.displayOrder,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toPublicReview(row: WithId<ReviewDocument>): PublicReview {
  return {
    id: row._id.toHexString(),
    author: row.author,
    role: { en: row.roleEn, fr: row.roleFr },
    quote: { en: row.quoteEn, fr: row.quoteFr },
    rating: row.rating,
  };
}

export async function listAdminReviews() {
  const db = await getMongoDb();
  const rows = await db
    .collection<ReviewDocument>("reviews")
    .find({})
    .sort({ displayOrder: 1, updatedAt: -1 })
    .limit(100)
    .toArray();
  return rows.map(toAdminReview);
}

export async function listPublishedReviews() {
  const db = await getMongoDb();
  const rows = await db
    .collection<ReviewDocument>("reviews")
    .find({ published: true })
    .sort({ displayOrder: 1, updatedAt: -1 })
    .limit(12)
    .toArray();
  return rows.map(toPublicReview);
}

export async function createReview(input: ReviewInput) {
  const db = await getMongoDb();
  const now = new Date();
  const result = await db.collection<ReviewDocument>("reviews").insertOne({
    ...input,
    createdAt: now,
    updatedAt: now,
    updatedBy: "admin",
  });
  const row = await db
    .collection<ReviewDocument>("reviews")
    .findOne({ _id: result.insertedId });
  if (!row) throw new Error("CREATE_FAILED");
  return toAdminReview(row);
}

export async function updateReview(id: string, input: ReviewInput) {
  if (!ObjectId.isValid(id)) return null;
  const db = await getMongoDb();
  const result = await db
    .collection<ReviewDocument>("reviews")
    .findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { ...input, updatedAt: new Date(), updatedBy: "admin" } },
      { returnDocument: "after" },
    );
  return result ? toAdminReview(result) : null;
}

export async function deleteReview(id: string) {
  if (!ObjectId.isValid(id)) return null;
  const db = await getMongoDb();
  const result = await db
    .collection<ReviewDocument>("reviews")
    .findOneAndDelete({ _id: new ObjectId(id) });
  return result ? toAdminReview(result) : null;
}
