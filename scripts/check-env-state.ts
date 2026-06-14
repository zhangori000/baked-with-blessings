import { loadScriptEnv } from './lib/load-script-env'

loadScriptEnv()

/**
 * READ-ONLY diagnostic. Prints what a target environment actually contains so
 * we can tell whether it is ready for the menu sync scripts. Writes nothing.
 *
 *   pnpm check:env-state
 *   vercel env run -e preview -- pnpm check:env-state
 */

const KEY_SLUGS = [
  'red-velvet-cheesecake',
  'smores',
  'brookie',
  'biscoff',
  'strawberry-cheesecake',
  'toasted-and-tasseled',
  'sticky-mango-rice-krispy-treats',
  'freshly-baked-dirty-chai-cookie',
  'cookie-tray',
  'mini-cookie-tray',
  'build-your-own-mini-box',
  'build-your-own-cookie-box',
]

const destroyWithTimeout = async (destroy: () => Promise<void>) => {
  await Promise.race([
    destroy(),
    new Promise<void>((resolve) => {
      setTimeout(() => resolve(), 2000)
    }),
  ])
}

const run = async () => {
  const { getPayload } = await import('payload')
  const { default: config } = await import('../src/payload.config')
  const { SIZE_VARIANT_TYPE } = await import('../src/features/products/sizeVariants')
  const payload = await getPayload({ config })

  const count = async (
    collection: string,
    where?: import('payload').Where,
  ): Promise<number | string> => {
    try {
      const result = await payload.find({
        collection: collection as Parameters<typeof payload.find>[0]['collection'],
        depth: 0,
        limit: 0,
        overrideAccess: true,
        pagination: false,
        ...(where ? { where } : {}),
      })
      return result.totalDocs
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      // A missing column means this env hasn't been migrated yet.
      if (/column .* does not exist/i.test(message)) {
        return 'ERROR: table is behind migrations (run sync-db for this env)'
      }
      return `ERROR: ${message.slice(0, 80)}`
    }
  }

  try {
    const dbUrl = process.env.DATABASE_URI || process.env.POSTGRES_URL || '(unset)'
    const host = dbUrl.replace(/\/\/[^@]*@/, '//***@').slice(0, 70)
    console.log(`\n=== ENV STATE CHECK ===`)
    console.log(`DATABASE host (masked): ${host}...`)

    console.log(`\nadmins:            ${await count('admins')}`)
    console.log(`media:             ${await count('media')}`)
    console.log(`products (total):  ${await count('products')}`)
    console.log(`variantTypes:      ${await count('variantTypes')}`)
    console.log(`variantOptions:    ${await count('variantOptions')}`)
    console.log(`variants:          ${await count('variants')}`)
    console.log(`flavor-rotations:  ${await count('flavor-rotations')}`)
    console.log(
      `active rotation:   ${await count('flavor-rotations', { status: { equals: 'active' } })}`,
    )

    const sizeType = await payload.find({
      collection: 'variantTypes',
      depth: 0,
      limit: 1,
      overrideAccess: true,
      pagination: false,
      where: { name: { equals: SIZE_VARIANT_TYPE.name } },
    })
    console.log(`\nsize variantType '${SIZE_VARIANT_TYPE.name}' exists: ${Boolean(sizeType.docs[0])}`)

    console.log(`\nkey product slugs (✓ present): slug  $price  avail  behavior  status  #variants`)
    for (const slug of KEY_SLUGS) {
      let found
      try {
        found = await payload.find({
          collection: 'products',
          depth: 0,
          limit: 1,
          overrideAccess: true,
          pagination: false,
          select: {
            _status: true,
            individualAvailability: true,
            menuBehavior: true,
            priceInUSD: true,
            slug: true,
          },
          where: { slug: { equals: slug } },
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        console.log(`  ? ${slug} (query failed: ${message.slice(0, 60)})`)
        continue
      }
      const doc = found.docs[0] as Record<string, unknown> | undefined
      if (!doc) {
        console.log(`  — ${slug}`)
        continue
      }
      const variantCount = await count('variants', { product: { equals: doc.id } })
      console.log(
        `  ✓ ${slug}  $${(((doc.priceInUSD as number) ?? 0) / 100).toFixed(2)}  avail=${doc.individualAvailability ?? 'null'}  behavior=${doc.menuBehavior ?? 'null'}  status=${doc._status ?? 'null'}  variants=${variantCount}`,
      )
    }
    console.log(`\n=== END ===\n`)
  } finally {
    await destroyWithTimeout(() => payload.destroy())
  }
}

void run()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
