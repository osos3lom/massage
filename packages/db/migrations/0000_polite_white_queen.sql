CREATE TYPE "public"."appt_status" AS ENUM('booked', 'confirmed', 'checked_in', 'completed', 'no_show', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."card_scheme" AS ENUM('mada', 'visa', 'mastercard', 'apple_pay', 'stc_pay');--> statement-breakpoint
CREATE TYPE "public"."discount_kind" AS ENUM('percent', 'amount');--> statement-breakpoint
CREATE TYPE "public"."document_type" AS ENUM('388', '381');--> statement-breakpoint
CREATE TYPE "public"."party_kind" AS ENUM('customer', 'supplier');--> statement-breakpoint
CREATE TYPE "public"."payment_kind" AS ENUM('cash', 'card', 'wallet', 'transfer', 'package');--> statement-breakpoint
CREATE TYPE "public"."payment_provider" AS ENUM('hala', 'cash', 'bank');--> statement-breakpoint
CREATE TYPE "public"."sale_status" AS ENUM('completed', 'voided');--> statement-breakpoint
CREATE TYPE "public"."service_kind" AS ENUM('massage', 'moroccan_bath', 'pedicure', 'other');--> statement-breakpoint
CREATE TYPE "public"."supply_category" AS ENUM('oils', 'scrubs', 'towels', 'hygiene', 'other');--> statement-breakpoint
CREATE TYPE "public"."zatca_status" AS ENUM('pending', 'reported', 'cleared', 'rejected');--> statement-breakpoint
CREATE TABLE "appointments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"branch_id" uuid NOT NULL,
	"customer_id" uuid,
	"service_id" uuid,
	"package_id" uuid,
	"therapist_id" uuid,
	"room_id" uuid,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"status" "appt_status" DEFAULT 'booked' NOT NULL,
	"source" text DEFAULT 'walk_in' NOT NULL,
	"paid" boolean DEFAULT false NOT NULL,
	"notes" text,
	"sale_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "branches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"code" text DEFAULT 'JED01' NOT NULL,
	"name_en" text NOT NULL,
	"name_ar" text NOT NULL,
	"phone" text,
	"address" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "branches_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "company" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name_en" text NOT NULL,
	"name_ar" text NOT NULL,
	"vat_number" text,
	"cr_number" text,
	"currency" text DEFAULT 'SAR' NOT NULL,
	"logo_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "discounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text,
	"name_en" text NOT NULL,
	"name_ar" text NOT NULL,
	"kind" "discount_kind" NOT NULL,
	"value" integer NOT NULL,
	"starts_at" date,
	"ends_at" date,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "discounts_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "package_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"branch_id" uuid,
	"package_id" uuid,
	"customer_id" uuid,
	"service_id" uuid,
	"total_qty" integer NOT NULL,
	"used_qty" integer DEFAULT 0 NOT NULL,
	"expires_at" date,
	"sold_sale_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "packages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text,
	"name_en" text NOT NULL,
	"name_ar" text NOT NULL,
	"description_en" text,
	"description_ar" text,
	"price_halalas" bigint NOT NULL,
	"duration_min" integer DEFAULT 60 NOT NULL,
	"contents" jsonb DEFAULT '[]' NOT NULL,
	"valid_days" integer DEFAULT 365 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "packages_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "parties" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"branch_id" uuid,
	"kind" "party_kind" DEFAULT 'customer' NOT NULL,
	"name_en" text,
	"name_ar" text NOT NULL,
	"phone" text,
	"email" text,
	"notes" text,
	"balance_halalas" bigint DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"branch_id" uuid NOT NULL,
	"sale_id" uuid NOT NULL,
	"kind" "payment_kind" NOT NULL,
	"provider" "payment_provider" DEFAULT 'hala' NOT NULL,
	"amount_halalas" bigint NOT NULL,
	"card_scheme" "card_scheme",
	"approval_code" text,
	"rrn" text,
	"terminal_tid" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"permissions" jsonb DEFAULT '[]' NOT NULL,
	CONSTRAINT "roles_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "rooms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"branch_id" uuid,
	"code" text,
	"name_en" text NOT NULL,
	"name_ar" text NOT NULL,
	"floor_en" text,
	"floor_ar" text,
	"for_kind" "service_kind",
	"buffer_minutes" integer DEFAULT 15 NOT NULL,
	"live_state" text DEFAULT 'available' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sale_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"branch_id" uuid NOT NULL,
	"sale_id" uuid NOT NULL,
	"service_id" uuid,
	"package_session_id" uuid,
	"therapist_id" uuid,
	"description_ar" text NOT NULL,
	"description_en" text NOT NULL,
	"qty" integer DEFAULT 1 NOT NULL,
	"unit_price_halalas" bigint NOT NULL,
	"discount_halalas" bigint DEFAULT 0 NOT NULL,
	"tax_rate" integer DEFAULT 15 NOT NULL,
	"line_total_halalas" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sales" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"branch_id" uuid NOT NULL,
	"terminal_id" text DEFAULT 'T1' NOT NULL,
	"shift_id" uuid,
	"document_type" "document_type" DEFAULT '388' NOT NULL,
	"receipt_no" text NOT NULL,
	"customer_id" uuid,
	"cashier_id" uuid,
	"status" "sale_status" DEFAULT 'completed' NOT NULL,
	"subtotal_halalas" bigint DEFAULT 0 NOT NULL,
	"discount_halalas" bigint DEFAULT 0 NOT NULL,
	"tax_halalas" bigint DEFAULT 0 NOT NULL,
	"grand_total_halalas" bigint DEFAULT 0 NOT NULL,
	"change_halalas" bigint DEFAULT 0 NOT NULL,
	"zatca_uuid" text,
	"zatca_icv" integer,
	"zatca_prev_hash" text,
	"zatca_hash" text,
	"zatca_signature" text,
	"zatca_qr" text,
	"zatca_status" "zatca_status" DEFAULT 'pending' NOT NULL,
	"corrects_sale_id" uuid,
	"void_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name_en" text NOT NULL,
	"name_ar" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "services" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text,
	"category_id" uuid,
	"kind" "service_kind" DEFAULT 'massage' NOT NULL,
	"name_en" text NOT NULL,
	"name_ar" text NOT NULL,
	"description_en" text,
	"description_ar" text,
	"duration_min" integer DEFAULT 60 NOT NULL,
	"price_halalas" bigint NOT NULL,
	"tax_rate" integer DEFAULT 15 NOT NULL,
	"taxable" boolean DEFAULT true NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "services_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"branch_id" uuid,
	"key" text NOT NULL,
	"value" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shifts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"branch_id" uuid NOT NULL,
	"terminal_id" text NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"opened_by" uuid,
	"opened_at" timestamp with time zone DEFAULT now() NOT NULL,
	"opening_float_halalas" bigint DEFAULT 0 NOT NULL,
	"cash_drops_halalas" bigint DEFAULT 0 NOT NULL,
	"closed_by" uuid,
	"closed_at" timestamp with time zone,
	"closing_count_halalas" bigint,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "supplies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"branch_id" uuid,
	"sku" text,
	"category" "supply_category" DEFAULT 'oils' NOT NULL,
	"name_en" text NOT NULL,
	"name_ar" text NOT NULL,
	"unit_en" text,
	"unit_ar" text,
	"cost_halalas" bigint DEFAULT 0 NOT NULL,
	"stock_qty" integer DEFAULT 0 NOT NULL,
	"reorder_level" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "supplies_sku_unique" UNIQUE("sku")
);
--> statement-breakpoint
CREATE TABLE "sync_quarantine" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payload" jsonb NOT NULL,
	"error_code" text,
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "therapist_availability" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"branch_id" uuid,
	"therapist_id" uuid NOT NULL,
	"weekday" integer NOT NULL,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL
);
--> statement-breakpoint
CREATE TABLE "therapists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"branch_id" uuid,
	"user_id" uuid,
	"name_en" text,
	"name_ar" text NOT NULL,
	"phone" text,
	"skills" jsonb DEFAULT '[]' NOT NULL,
	"commission_percent" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"auth_user_id" uuid,
	"branch_id" uuid,
	"role_id" uuid,
	"full_name_ar" text NOT NULL,
	"full_name_en" text NOT NULL,
	"pin_hash" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_customer_id_parties_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."parties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_package_id_packages_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."packages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_therapist_id_therapists_id_fk" FOREIGN KEY ("therapist_id") REFERENCES "public"."therapists"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "branches" ADD CONSTRAINT "branches_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "package_sessions" ADD CONSTRAINT "package_sessions_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "package_sessions" ADD CONSTRAINT "package_sessions_package_id_packages_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."packages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "package_sessions" ADD CONSTRAINT "package_sessions_customer_id_parties_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."parties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "package_sessions" ADD CONSTRAINT "package_sessions_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parties" ADD CONSTRAINT "parties_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_sale_id_sales_id_fk" FOREIGN KEY ("sale_id") REFERENCES "public"."sales"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_sale_id_sales_id_fk" FOREIGN KEY ("sale_id") REFERENCES "public"."sales"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_package_session_id_package_sessions_id_fk" FOREIGN KEY ("package_session_id") REFERENCES "public"."package_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_therapist_id_therapists_id_fk" FOREIGN KEY ("therapist_id") REFERENCES "public"."therapists"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales" ADD CONSTRAINT "sales_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales" ADD CONSTRAINT "sales_shift_id_shifts_id_fk" FOREIGN KEY ("shift_id") REFERENCES "public"."shifts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales" ADD CONSTRAINT "sales_customer_id_parties_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."parties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales" ADD CONSTRAINT "sales_cashier_id_users_id_fk" FOREIGN KEY ("cashier_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "services" ADD CONSTRAINT "services_category_id_service_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."service_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settings" ADD CONSTRAINT "settings_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_opened_by_users_id_fk" FOREIGN KEY ("opened_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_closed_by_users_id_fk" FOREIGN KEY ("closed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplies" ADD CONSTRAINT "supplies_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "therapist_availability" ADD CONSTRAINT "therapist_availability_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "therapist_availability" ADD CONSTRAINT "therapist_availability_therapist_id_therapists_id_fk" FOREIGN KEY ("therapist_id") REFERENCES "public"."therapists"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "therapists" ADD CONSTRAINT "therapists_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "therapists" ADD CONSTRAINT "therapists_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "appt_start_idx" ON "appointments" USING btree ("branch_id","starts_at");--> statement-breakpoint
CREATE INDEX "appt_therapist_idx" ON "appointments" USING btree ("therapist_id","starts_at");--> statement-breakpoint
CREATE INDEX "pkg_sess_customer_idx" ON "package_sessions" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "pkg_sess_branch_idx" ON "package_sessions" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX "parties_phone_idx" ON "parties" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "payments_sale_idx" ON "payments" USING btree ("sale_id");--> statement-breakpoint
CREATE INDEX "payments_branch_idx" ON "payments" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX "sale_items_sale_idx" ON "sale_items" USING btree ("sale_id");--> statement-breakpoint
CREATE INDEX "sale_items_branch_idx" ON "sale_items" USING btree ("branch_id");--> statement-breakpoint
CREATE UNIQUE INDEX "sales_receipt_uq" ON "sales" USING btree ("branch_id","receipt_no");--> statement-breakpoint
CREATE INDEX "sales_created_idx" ON "sales" USING btree ("branch_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "settings_branch_key_uq" ON "settings" USING btree ("branch_id","key");--> statement-breakpoint
CREATE INDEX "therapist_avail_therapist_idx" ON "therapist_availability" USING btree ("therapist_id");--> statement-breakpoint
CREATE INDEX "therapist_avail_branch_idx" ON "therapist_availability" USING btree ("branch_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_auth_user_uq" ON "users" USING btree ("auth_user_id");--> statement-breakpoint
CREATE INDEX "users_branch_idx" ON "users" USING btree ("branch_id");