import { assertConfig, config } from './config.mjs'
import { createApp } from './app.mjs'

assertConfig()
const { server, store } = createApp()
server.listen(config.port, () => console.log(`Atelier API на порту ${config.port} (${config.dev ? 'разработка' : 'прод'}), AI: ${config.ai.provider}`))
for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => { store.flush(); process.exit(0) })
