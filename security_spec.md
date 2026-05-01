# Security Specification - Digital Marketplace

## Data Invariants
1. A User cannot change their own role once set (unless they are an Admin).
2. A Product's `deliveryContent` is ONLY visible to the `sellerId` and the `buyerId` of a completed Order for that product.
3. An Order cannot be created for a product with 0 stock.
4. Affiliate earnings are calculated as a percentage of the amount.
5. Users can only read their own messages or chats they are participants of.

## The "Dirty Dozen" Payloads (Denial Expected)
1. **Role Spoofing**: `{ "uid": "xyz", "role": "admin" }` sent by a non-admin.
2. **Ghost Product**: `{ "name": "Fake Game", "sellerId": "victim_id" }` sent by another user.
3. **Price Manipulation**: Creating an order with `amount: 0.01` for a $60 game.
4. **Delivery Theft**: Reading `products/{id}` and attempting to see `deliveryContent` without buying.
5. **Stock Poisoning**: Updating stock to a negative number.
6. **Chat Eavesdropping**: Listing all chats without being a participant.
7. **Identity Hijack**: Updating another user's balance.
8. **Invalid ID**: Creating a document with a 2MB string as ID.
9. **Timestamp Cheat**: Sending a `createdAt` from 2020.
10. **Review Spam**: Creating 100 reviews for the same product without owning it.
11. **Affiliate Fraud**: Setting self as affiliate and getting a 99% cut.
12. **Status Skipping**: Skipping from `pending` to `delivered` without payment confirmation.

## Test Runner (Draft)
A `firestore.rules.test.ts` will be implemented to verify these constraints.
