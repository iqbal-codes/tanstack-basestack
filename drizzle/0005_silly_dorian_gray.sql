CREATE TABLE "addresses" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
	"area_id" text,
	"area_name" text,
	"street_address" text,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "biteship_areas" (
	"area_id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"subdistrict" text NOT NULL,
	"district" text NOT NULL,
	"city" text NOT NULL,
	"province" text NOT NULL,
	"postal_code" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "address_id" text;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "is_wni" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "shipping_address" json;--> statement-breakpoint
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_org_id_organization_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_area_id_biteship_areas_area_id_fk" FOREIGN KEY ("area_id") REFERENCES "public"."biteship_areas"("area_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_address_id_addresses_id_fk" FOREIGN KEY ("address_id") REFERENCES "public"."addresses"("id") ON DELETE set null ON UPDATE no action;