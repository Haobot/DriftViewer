import './style.css';
import type { ChannelKey } from './types';
import { createStore } from './store';
import { createUI } from './ui';
import { createChart } from './chart';
import { CHANNELS } from './channels';

function initApp() {
  const store = createStore();
  const canvas = document.getElementById('chartCanvas') as HTMLCanvasElement;
  const chart = createChart(canvas, {
    width: canvas.clientWidth || 800,
    height: 360,
    padding: { top: 20, right: 20, bottom: 30, left: 44 },
  });

  const render = () => {
    const state = store.getState();
    const visible = new Map<ChannelKey, { color: string; min: number; max: number }>();
    state.filter.visibleChannels.forEach((key) => {
      const ch = CHANNELS.find((c) => c.key === key);
      if (!ch) return;
      const values = state.samples.map((s) => Number(s[key] ?? 0));
      const min = Math.min(...values);
      const max = Math.max(...values);
      visible.set(key, { color: ch.color, min, max });
    });
    chart.draw(state.filteredSamples, visible);
    ui.renderChannelList();
    ui.renderStatusCards();
    ui.renderConditions();
    ui.updateRangeValues(state.filter.timeStartMs, state.filter.timeEndMs);
  };

  const ui = createUI(store, render);
  chart.onRangeSelect((startMs, endMs) => {
    store.setTimeRange(Math.min(startMs, endMs), Math.max(startMs, endMs));
  });
  store.subscribe(render);
  window.addEventListener('resize', () => { chart.resize(); render(); });
}

initApp();
