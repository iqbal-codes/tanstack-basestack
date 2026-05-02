ALTER TABLE "addresses" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "biteship_areas" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "organization_profiles" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "addresses" CASCADE;--> statement-breakpoint
DROP TABLE "biteship_areas" CASCADE;--> statement-breakpoint
DROP TABLE "organization_profiles" CASCADE;--> statement-breakpoint
DROP INDEX "idx_orders_org_quote";--> statement-breakpoint
ALTER TABLE "customers" DROP COLUMN "address_id";--> statement-breakpoint
ALTER TABLE "customers" DROP COLUMN "is_wni";--> statement-breakpoint
ALTER TABLE "orders" DROP COLUMN "shipping_address";--> statement-breakpoint
ALTER TABLE "orders" DROP COLUMN "quote_number";--> statement-breakpoint
ALTER TABLE "orders" DROP COLUMN "valid_until";--> statement-breakpoint
ALTER TABLE "organization" DROP COLUMN "address_id";