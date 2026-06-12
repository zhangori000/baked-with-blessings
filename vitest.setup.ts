// Any setup scripts you might need go here

// Load env files the same way Next does: .env.local first, then .env.
import { config } from 'dotenv'

config({ path: '.env.local' })
config()
