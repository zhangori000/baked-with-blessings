import * as migration_20260427_214127_initial_schema from './20260427_214127_initial_schema'
import * as migration_20260429_000000_add_customer_stripe_customer_id from './20260429_000000_add_customer_stripe_customer_id'
import * as migration_20260430_000000_add_blessings_network from './20260430_000000_add_blessings_network'
import * as migration_20260430_010000_add_blessings_network_owner_posts from './20260430_010000_add_blessings_network_owner_posts'
import * as migration_20260430_020000_add_order_owner_notification_sent_at from './20260430_020000_add_order_owner_notification_sent_at'
import * as migration_20260430_030000_add_flavor_rotations from './20260430_030000_add_flavor_rotations'

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
]
