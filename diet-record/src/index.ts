import { Hono } from 'hono'
import { auth } from './routes/auth'
import { logs } from './routes/logs'
import { stats } from './routes/stats'

const app = new Hono()

app.route('/', auth)  // auth.ts
app.route('/', logs)  // logs.ts
app.route('/', stats)

app.get('/', (c) => c.redirect('/login.html'))

export default app