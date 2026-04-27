import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const forbiddenRouteDir = path.join(root, 'src', 'app', '(app)', 'shop')
const sourceRoot = path.join(root, 'src')

const forbiddenSourceMarkers = ['@/app/(app)/shop', '../shop', './shop', '/shop', 'shopHref']

const sourceExtensions = new Set(['.css', '.scss', '.ts', '.tsx'])

const walkFiles = (dir: string): string[] => {
  if (!fs.existsSync(dir)) return []

  const files: string[] = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.next') continue
      files.push(...walkFiles(fullPath))
      continue
    }

    if (entry.isFile() && sourceExtensions.has(path.extname(entry.name))) {
      files.push(fullPath)
    }
  }

  return files
}

const failures: string[] = []

if (fs.existsSync(forbiddenRouteDir)) {
  failures.push(`Remove forbidden route directory: ${path.relative(root, forbiddenRouteDir)}`)
}

for (const file of walkFiles(sourceRoot)) {
  const source = fs.readFileSync(file, 'utf8')
  const marker = forbiddenSourceMarkers.find((candidate) => source.includes(candidate))

  if (marker) {
    failures.push(`${path.relative(root, file)} contains legacy shop marker: ${marker}`)
  }
}

if (failures.length) {
  console.error('The legacy /shop route must not be reintroduced.')
  for (const failure of failures) {
    console.error(`- ${failure}`)
  }
  process.exit(1)
}

console.log('No legacy /shop route or imports found.')
