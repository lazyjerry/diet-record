import { Hono } from 'hono'
import { serveStatic } from 'hono/cloudflare-workers'
import { auth } from './routes/auth'import { logs } from './routes/logs'


const app = new Hono()

app.use(
  '/static/*',
  serveStatic({ root: './public', rewriteRequestPath: (path) => path.replace(/^\/static/, '') })
)

app.route('/', auth)  // auth.ts
app.route('/', logs)  // logs.ts

app.get('/', (c) => c.redirect('/static/login.html'))

export default app