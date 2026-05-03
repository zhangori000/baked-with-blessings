import * as migration_20260427_214127_initial_schema from './20260427_214127_initial_schema'
import * as migration_20260429_000000_add_customer_stripe_customer_id from './20260429_000000_add_customer_stripe_customer_id'
import * as migration_20260430_000000_add_blessings_network from './20260430_000000_add_blessings_network'
import * as migration_20260430_010000_add_blessings_network_owner_posts from './20260430_010000_add_blessings_network_owner_posts'
import * as migration_20260430_020000_add_order_owner_notification_sent_at from './20260430_020000_add_order_owner_notification_sent_at'
import * as migration_20260430_030000_add_flavor_rotations from './20260430_030000_add_flavor_rotations'
import * as migration_20260430_040000_add_product_poster_receipt_fields from './20260430_040000_add_product_poster_receipt_fields'
import * as migration_20260430_050000_add_email_verification_starts from './20260430_050000_add_email_verification_starts'
import * as migration_20260501_120000_optimistic_reviews_and_rotation_copy from './20260501_120000_optimistic_reviews_and_rotation_copy'
import * as migration_20260501_130000_add_manual_order_payments from './20260501_130000_add_manual_order_payments'
import * as migration_20260501_140000_remove_review_ratings from './20260501_140000_remove_review_ratings'
import * as migration_20260501_150000_add_review_social_visibility from './20260501_150000_add_review_social_visibility'
import * as migration_20260501_160000_add_review_extra_socials from './20260501_160000_add_review_extra_socials'
import * as migration_20260501_212728_add_page_content_globals from './20260501_212728_add_page_content_globals'
import * as migration_20260501_220000_add_community_notes from './20260501_220000_add_community_notes'
import * as migration_20260502_000000_add_site_pages from './20260502_000000_add_site_pages'
import * as migration_20260503_000000_add_feature_requests from './20260503_000000_add_feature_requests'

export const migrations = [
  {
    up: migration_20260427_214127_initial_schema.up,
    down: migration_20260427_214127_initial_schema.down,
    name: '20260427_214127_initial_schema',
  },
  {
    up: migration_20260429_000000_add_customer_stripe_customer_id.up,
    down: migration_20260429_000000_add_customer_stripe_customer_id.down,
    name: '20260429_000000_add_customer_stripe_customer_id',
  },
  {
    up: migration_20260430_000000_add_blessings_network.up,
    down: migration_20260430_000000_add_blessings_network.down,
    name: '20260430_000000_add_blessings_network',
  },
  {
    up: migration_20260430_010000_add_blessings_network_owner_posts.up,
    down: migration_20260430_010000_add_blessings_network_owner_posts.down,
    name: '20260430_010000_add_blessings_network_owner_posts',
  },
  {
    up: migration_20260430_020000_add_order_owner_notification_sent_at.up,
    down: migration_20260430_020000_add_order_owner_notification_sent_at.down,
    name: '20260430_020000_add_order_owner_notification_sent_at',
  },
  {
    up: migration_20260430_030000_add_flavor_rotations.up,
    down: migration_20260430_030000_add_flavor_rotations.down,
    name: '20260430_030000_add_flavor_rotations',
  },
  {
    up: migration_20260430_040000_add_product_poster_receipt_fields.up,
    down: migration_20260430_040000_add_product_poster_receipt_fields.down,
    name: '20260430_040000_add_product_poster_receipt_fields',
  },
  {
    up: migration_20260430_050000_add_email_verification_starts.up,
    down: migration_20260430_050000_add_email_verification_starts.down,
    name: '20260430_050000_add_email_verification_starts',
  },
  {
    up: migration_20260501_120000_optimistic_reviews_and_rotation_copy.up,
    down: migration_20260501_120000_optimistic_reviews_and_rotation_copy.down,
    name: '20260501_120000_optimistic_reviews_and_rotation_copy',
  },
  {
    up: migration_20260501_130000_add_manual_order_payments.up,
    down: migration_20260501_130000_add_manual_order_payments.down,
    name: '20260501_130000_add_manual_order_payments',
  },
  {
    up: migration_20260501_140000_remove_review_ratings.up,
    down: migration_20260501_140000_remove_review_ratings.down,
    name: '20260501_140000_remove_review_ratings',
  },
  {
    up: migration_20260501_150000_add_review_social_visibility.up,
    down: migration_20260501_150000_add_review_social_visibility.down,
    name: '20260501_150000_add_review_social_visibility',
  },
  {
    up: migration_20260501_160000_add_review_extra_socials.up,
    down: migration_20260501_160000_add_review_extra_socials.down,
    name: '20260501_160000_add_review_extra_socials',
  },
  {
    up: migration_20260501_212728_add_page_content_globals.up,
    down: migration_20260501_212728_add_page_content_globals.down,
    name: '20260501_212728_add_page_content_globals',
  },
  {
    up: migration_20260501_220000_add_community_notes.up,
    down: migration_20260501_220000_add_community_notes.down,
    name: '20260501_220000_add_community_notes',
  },
  {
    up: migration_20260502_000000_add_site_pages.up,
    down: migration_20260502_000000_add_site_pages.down,
    name: '20260502_000000_add_site_pages',
  },
  {
    up: migration_20260503_000000_add_feature_requests.up,
    down: migration_20260503_000000_add_feature_requests.down,
    name: '20260503_000000_add_feature_requests',
  },
]
