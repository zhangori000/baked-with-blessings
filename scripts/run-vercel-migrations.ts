import { spawn } from 'node:child_process'

if (!process.env.VERCEL) {
  console.log('Skipping Payload migrations outside Vercel.')
  process.exit(0)
}

const command = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm'

const child = spawn(command, ['payload', 'migrate'], {
  env: {
    ...process.env,
    NODE_OPTIONS: '--no-deprecation',
  },
  shell: false,
  stdio: 'inherit',
})

child.on('exit', (code, signal) => {
  if (signal) {
    console.error(`Payload migrations were interrupted by ${signal}.`)
    process.exit(1)
  }

  process.exit(code ?? 1)
})

child.on('error', (error) => {
  console.error('Could not run Payload migrations.', error)
  process.exit(1)
})
