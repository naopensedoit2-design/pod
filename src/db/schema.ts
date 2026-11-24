import { relations, sql } from "drizzle-orm";
import {
  boolean,
  customType,
  index,
  integer,
  jsonb,
  pgSequence,
  pgTable,
  serial,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType() {
    return "bytea";
  },
});

const createdAt = () =>
  timestamp("created_at", { withTimezone: true }).defaultNow().notNull();
const updatedAt = () =>
  timestamp("updated_at", { withTimezone: true }).defaultNow().notNull();

/** Configurações da loja (marca, cores, barras, vendas, integrações...). Uma linha com id "store". */
export const settings = pgTable("settings", {
  id: text("id").primaryKey(),
  data: jsonb("data").$type<Record<string, unknown>>().notNull(),
  updatedAt: updatedAt(),
});

export const adminUsers = pgTable("admin_users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull().default(""),
  passwordHash: text("password_hash").notNull(),
  createdAt: createdAt(),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
});

/** Imagens enviadas pelo painel, guardadas no próprio banco e servidas em /media/{id}. */
export const media = pgTable("media", {
  id: uuid("id").primaryKey().defaultRandom(),
  mime: text("mime").notNull(),
  data: bytea("data").notNull(),
  width: integer("width"),
  height: integer("height"),
  size: integer("size").notNull(),
  name: text("name"),
  createdAt: createdAt(),
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull().default(""),
  imageUrl: text("image_url"),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: createdAt(),
});

export const products = pgTable(
  "products",
  {
    id: serial("id").primaryKey(),
    title: text("title").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description").notNull().default(""),
    categoryId: integer("category_id").references(() => categories.id, {
      onDelete: "set null",
    }),
    /** draft | active | archived */
    status: text("status").notNull().default("draft"),
    priceCents: integer("price_cents").notNull().default(0),
    compareAtCents: integer("compare_at_cents"),
    tags: text("tags").array().notNull().default(sql`'{}'::text[]`),
    isNew: boolean("is_new").notNull().default(false),
    isFeatured: boolean("is_featured").notNull().default(false),
    option1Name: text("option1_name").notNull().default("Cor"),
    option2Name: text("option2_name").notNull().default("Tamanho"),
    sizeChart: text("size_chart").notNull().default(""),
    seoTitle: text("seo_title").notNull().default(""),
    seoDescription: text("seo_description").notNull().default(""),
    ydProductId: text("yd_product_id"),
    ydSyncedAt: timestamp("yd_synced_at", { withTimezone: true }),
    sortOrder: integer("sort_order").notNull().default(0),
    salesCount: integer("sales_count").notNull().default(0),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("products_status_idx").on(t.status), index("products_category_idx").on(t.categoryId)],
);

export const productImages = pgTable(
  "product_images",
  {
    id: serial("id").primaryKey(),
    productId: integer("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    alt: text("alt").notNull().default(""),
    /** Valor da opção 1 (ex.: cor) a que a foto pertence; vazio = todas. */
    color: text("color").notNull().default(""),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [index("product_images_product_idx").on(t.productId)],
);

export const variants = pgTable(
  "variants",
  {
    id: serial("id").primaryKey(),
    productId: integer("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    option1: text("option1").notNull().default(""),
    option1Hex: text("option1_hex"),
    option2: text("option2").notNull().default(""),
    sku: text("sku").notNull().default(""),
    /** Preço próprio da variação; nulo = usa o preço do produto. */
    priceCents: integer("price_cents"),
    /** Estoque; nulo = ilimitado (sob demanda). */
    stock: integer("stock"),
    ydSku: text("yd_sku"),
    productionCostCents: integer("production_cost_cents"),
    weightGrams: integer("weight_grams"),
    isActive: boolean("is_active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [index("variants_product_idx").on(t.productId)],
);

export const coupons = pgTable("coupons", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  /** percent | fixed | free_shipping */
  type: text("type").notNull().default("percent"),
  /** Percentual (ex.: 10) ou valor em centavos. */
  value: integer("value").notNull().default(0),
  minSubtotalCents: integer("min_subtotal_cents").notNull().default(0),
  maxUses: integer("max_uses"),
  usedCount: integer("used_count").notNull().default(0),
  startsAt: timestamp("starts_at", { withTimezone: true }),
  endsAt: timestamp("ends_at", { withTimezone: true }),
  isActive: boolean("is_active").notNull().default(true),
  description: text("description").notNull().default(""),
  createdAt: createdAt(),
});

export const banners = pgTable("banners", {
  id: serial("id").primaryKey(),
  eyebrow: text("eyebrow").notNull().default(""),
  title: text("title").notNull().default(""),
  subtitle: text("subtitle").notNull().default(""),
  ctaLabel: text("cta_label").notNull().default(""),
  href: text("href").notNull().default(""),
  imageDesktop: text("image_desktop"),
  imageMobile: text("image_mobile"),
  bgColor: text("bg_color").notNull().default("#C4252F"),
  textColor: text("text_color").notNull().default("#FFFFFF"),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: createdAt(),
});

export const pages = pgTable("pages", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  body: text("body").notNull().default(""),
  isPublished: boolean("is_published").notNull().default(true),
  showInFooter: boolean("show_in_footer").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  updatedAt: updatedAt(),
});

export const orderNumberSeq = pgSequence("order_number_seq", { startWith: 1001 });

export const orders = pgTable(
  "orders",
  {
    id: serial("id").primaryKey(),
    number: integer("number")
      .notNull()
      .unique()
      .default(sql`nextval('order_number_seq')`),
    token: text("token").notNull().unique(),
    /** pending_payment | paid | in_production | shipped | delivered | canceled | refunded */
    status: text("status").notNull().default("pending_payment"),
    /** pending | paid | refunded | canceled */
    paymentStatus: text("payment_status").notNull().default("pending"),

    email: text("email").notNull(),
    name: text("name").notNull(),
    phone: text("phone").notNull().default(""),
    document: text("document").notNull().default(""),

    cep: text("cep").notNull(),
    street: text("street").notNull(),
    streetNumber: text("street_number").notNull(),
    complement: text("complement").notNull().default(""),
    neighborhood: text("neighborhood").notNull(),
    city: text("city").notNull(),
    state: text("state").notNull(),

    subtotalCents: integer("subtotal_cents").notNull(),
    discountCents: integer("discount_cents").notNull().default(0),
    shippingCents: integer("shipping_cents").notNull().default(0),
    totalCents: integer("total_cents").notNull(),
    couponCode: text("coupon_code"),
    shippingService: text("shipping_service").notNull().default(""),
    shippingDays: integer("shipping_days"),

    paymentProvider: text("payment_provider").notNull().default("infinitepay"),
    checkoutUrl: text("checkout_url"),
    invoiceSlug: text("invoice_slug"),
    transactionNsu: text("transaction_nsu"),
    captureMethod: text("capture_method"),
    installments: integer("installments"),
    paidAmountCents: integer("paid_amount_cents"),
    receiptUrl: text("receipt_url"),
    paidAt: timestamp("paid_at", { withTimezone: true }),

    ydOrderId: text("yd_order_id"),
    ydPublicCode: text("yd_public_code"),
    ydStatus: text("yd_status"),
    ydIdempotencyKey: text("yd_idempotency_key"),
    ydError: text("yd_error"),
    ydSubmittedAt: timestamp("yd_submitted_at", { withTimezone: true }),
    ydCostCents: integer("yd_cost_cents"),
    ydPaymentId: text("yd_payment_id"),
    ydPaymentKey: text("yd_payment_key"),
    ydPixCopyPaste: text("yd_pix_copy_paste"),
    ydPixQrUrl: text("yd_pix_qr_url"),
    ydPixExpiresAt: timestamp("yd_pix_expires_at", { withTimezone: true }),
    ydSyncedAt: timestamp("yd_synced_at", { withTimezone: true }),

    trackingCode: text("tracking_code"),
    trackingUrl: text("tracking_url"),
    carrier: text("carrier"),
    shippedAt: timestamp("shipped_at", { withTimezone: true }),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
    canceledAt: timestamp("canceled_at", { withTimezone: true }),

    customerNote: text("customer_note").notNull().default(""),
    adminNote: text("admin_note").notNull().default(""),
    utm: jsonb("utm").$type<Record<string, string>>(),

    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("orders_status_idx").on(t.status),
    index("orders_email_idx").on(t.email),
    index("orders_created_idx").on(t.createdAt),
  ],
);

export const orderItems = pgTable(
  "order_items",
  {
    id: serial("id").primaryKey(),
    orderId: integer("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: integer("product_id").references(() => products.id, { onDelete: "set null" }),
    variantId: integer("variant_id").references(() => variants.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    variantLabel: text("variant_label").notNull().default(""),
    sku: text("sku").notNull().default(""),
    ydSku: text("yd_sku"),
    imageUrl: text("image_url"),
    unitPriceCents: integer("unit_price_cents").notNull(),
    quantity: integer("quantity").notNull(),
    totalCents: integer("total_cents").notNull(),
  },
  (t) => [index("order_items_order_idx").on(t.orderId)],
);

export const orderEvents = pgTable(
  "order_events",
  {
    id: serial("id").primaryKey(),
    orderId: integer("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    message: text("message").notNull(),
    data: jsonb("data"),
    createdAt: createdAt(),
  },
  (t) => [index("order_events_order_idx").on(t.orderId)],
);

/** Entregas de webhook já processadas (evita processar a mesma duas vezes). */
export const webhookEvents = pgTable("webhook_events", {
  id: text("id").primaryKey(),
  source: text("source").notNull(),
  createdAt: createdAt(),
});

export const subscribers = pgTable("subscribers", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull().default(""),
  source: text("source").notNull().default("newsletter"),
  createdAt: createdAt(),
});

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, { fields: [products.categoryId], references: [categories.id] }),
  images: many(productImages),
  variants: many(variants),
}));

export const productImagesRelations = relations(productImages, ({ one }) => ({
  product: one(products, { fields: [productImages.productId], references: [products.id] }),
}));

export const variantsRelations = relations(variants, ({ one }) => ({
  product: one(products, { fields: [variants.productId], references: [products.id] }),
}));

export const ordersRelations = relations(orders, ({ many }) => ({
  items: many(orderItems),
  events: many(orderEvents),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
}));

export const orderEventsRelations = relations(orderEvents, ({ one }) => ({
  order: one(orders, { fields: [orderEvents.orderId], references: [orders.id] }),
}));

export type Product = typeof products.$inferSelect;
export type Variant = typeof variants.$inferSelect;
export type ProductImage = typeof productImages.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type OrderEvent = typeof orderEvents.$inferSelect;
export type Coupon = typeof coupons.$inferSelect;
export type Banner = typeof banners.$inferSelect;
export type Page = typeof pages.$inferSelect;
