ALTER TYPE "public"."order_status" ADD VALUE 'failed';--> statement-breakpoint
CREATE TABLE "product_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"url" varchar(500) NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "avatar_url" varchar(500);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "phone" varchar(30);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "address" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "city" varchar(120);--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "image_url" varchar(500);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "shipping_address" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "payment_reference" varchar(60);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "card_last4" varchar(4);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "paid_at" timestamp;--> statement-breakpoint
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "image_url";