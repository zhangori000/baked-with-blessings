import type { PostgresAdapter } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'
import type { Payload } from 'payload'

import type { BakeryUpdateChannel } from './content'

/*
 * The three queries here need guarantees the Payload Local API does not give:
 * "insert unless it already exists" and "claim rows no other request has
 * claimed". Everything else goes through Payload.
 */

export type DeliveryStatus = 'failed' | 'queued' | 'sending' | 'sent' | 'skipped'

export type ChannelTally = Record<DeliveryStatus, number> & { total: number }

export type BakeryUpdateTally = Record<BakeryUpdateChannel, ChannelTally>

export type QueuedRecipient = {
  address: string
  customerID: number
}

export type ClaimedDelivery = QueuedRecipient & {
  channel: BakeryUpdateChannel
  id: number
}

const getDrizzle = (payload: Payload) => (payload.db as unknown as PostgresAdapter).drizzle

const insertChunkSize = 500

export const emptyChannelTally = (): ChannelTally => ({
  failed: 0,
  queued: 0,
  sending: 0,
  sent: 0,
  skipped: 0,
  total: 0,
})

/** Safe to call again for the same update: existing rows are left alone. */
export const queueDeliveries = async ({
  channel,
  payload,
  recipients,
  updateID,
}: {
  channel: BakeryUpdateChannel
  payload: Payload
  recipients: QueuedRecipient[]
  updateID: number
}) => {
  const drizzle = getDrizzle(payload)

  for (let index = 0; index < recipients.length; index += insertChunkSize) {
    const chunk = recipients.slice(index, index + insertChunkSize)
    const values = sql.join(
      chunk.map(
        (recipient) =>
          sql`(${updateID}, ${recipient.customerID}, ${channel}, ${recipient.address}, 'queued')`,
      ),
      sql`, `,
    )

    await drizzle.execute(sql`
      INSERT INTO "bakery_update_deliveries"
        ("bakery_update_id", "customer_id", "channel", "address", "status")
      VALUES ${values}
      ON CONFLICT ("bakery_update_id", "customer_id", "channel") DO NOTHING
    `)
  }
}

/**
 * Moves up to `limit` waiting rows to "sending" and returns them. SKIP LOCKED
 * means two overlapping requests never get the same row, so nobody is texted
 * twice even if the browser retries while an earlier request is still running.
 */
export const claimQueuedDeliveries = async ({
  limit,
  payload,
  updateID,
}: {
  limit: number
  payload: Payload
  updateID: number
}): Promise<ClaimedDelivery[]> => {
  const result = await getDrizzle(payload).execute(sql`
    UPDATE "bakery_update_deliveries"
    SET "status" = 'sending', "updated_at" = now()
    WHERE "id" IN (
      SELECT "id" FROM "bakery_update_deliveries"
      WHERE "bakery_update_id" = ${updateID} AND "status" = 'queued'
      ORDER BY "id"
      LIMIT ${limit}
      FOR UPDATE SKIP LOCKED
    )
    RETURNING "id", "customer_id", "channel", "address"
  `)

  return (result.rows as Array<Record<string, unknown>>)
    .map((row) => ({
      address: String(row.address),
      channel: row.channel === 'sms' ? ('sms' as const) : ('email' as const),
      customerID: Number(row.customer_id),
      id: Number(row.id),
    }))
    .sort((a, b) => a.id - b.id)
}

export const interruptedDeliveryError = 'Sending stopped partway. This one may not have gone out.'

/**
 * A request that died mid-send leaves rows in "sending". We cannot tell if
 * those went out, so they are marked failed rather than retried: a missed
 * text is better than a double text. Requests run under a minute, so any
 * claim older than `olderThanSeconds` belongs to a dead request.
 */
export const failInterruptedDeliveries = async ({
  olderThanSeconds = 180,
  payload,
  updateID,
}: {
  olderThanSeconds?: number
  payload: Payload
  updateID: number
}) => {
  await getDrizzle(payload).execute(sql`
    UPDATE "bakery_update_deliveries"
    SET "status" = 'failed', "error" = ${interruptedDeliveryError}, "updated_at" = now()
    WHERE "bakery_update_id" = ${updateID}
      AND "status" = 'sending'
      AND "updated_at" < now() - make_interval(secs => ${olderThanSeconds})
  `)
}

export const tallyDeliveries = async ({
  payload,
  updateIDs,
}: {
  payload: Payload
  updateIDs: number[]
}): Promise<Map<number, BakeryUpdateTally>> => {
  const tallies = new Map<number, BakeryUpdateTally>()

  for (const id of updateIDs) {
    tallies.set(id, { email: emptyChannelTally(), sms: emptyChannelTally() })
  }

  if (!updateIDs.length) {
    return tallies
  }

  const result = await getDrizzle(payload).execute(sql`
    SELECT "bakery_update_id", "channel", "status", count(*)::int AS "count"
    FROM "bakery_update_deliveries"
    WHERE "bakery_update_id" IN (${sql.join(
      updateIDs.map((id) => sql`${id}`),
      sql`, `,
    )})
    GROUP BY 1, 2, 3
  `)

  for (const row of result.rows as Array<Record<string, unknown>>) {
    const tally = tallies.get(Number(row.bakery_update_id))
    const channel = row.channel === 'sms' ? 'sms' : 'email'
    const status = String(row.status) as DeliveryStatus
    const count = Number(row.count)

    if (!tally || !(status in tally[channel])) {
      continue
    }

    tally[channel][status] += count
    tally[channel].total += count
  }

  return tallies
}
