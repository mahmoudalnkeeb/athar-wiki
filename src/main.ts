import './styles/global.css'
import './components/components.css'

import { mountApp } from './app/createApp.ts'

const app = document.querySelector<HTMLDivElement>('#app')
if (!app) throw new Error('App root not found')

mountApp(app)
