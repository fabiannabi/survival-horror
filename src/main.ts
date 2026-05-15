import { mount } from 'svelte';
import 'leaflet/dist/leaflet.css';
import './styles/global.css';
import App from './App.svelte';

const app = mount(App, {
  target: document.getElementById('app')!,
});

export default app;
