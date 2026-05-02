ALTER TABLE "products" ADD COLUMN "primary_image_asset_id" text REFERENCES "assets"("id") ON DELETE SET NULL;
ALTER TABLE "products" ADD COLUMN "base_price" integer NOT NULL DEFAULT 0;
ALTER TABLE "products" ADD COLUMN "production_days" integer NOT NULL DEFAULT 1;
ALTER TABLE "products" ADD COLUMN "min_quantity" integer NOT NULL DEFAULT 1;
ALTER TABLE "products" ADD COLUMN "max_quantity" integer;
