import './style.css';
import type { ChannelKey } from './types';
import { createStore } from './store';
import { createUI } from './ui';
import { createChart } from './chart';
import { CHANNELS } from './channels';
import { buildExportPackage, downloadExport } from './exporter';

function isTypingTarget(e: KeyboardEvent): boolean {
  const target = e.target as HTMLElement;
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    target.isContentEditable
  );
}

function initApp() {
  const store = createStore();
  const canvas = document.getElementById('chartCanvas') as HTMLCanvasElement;
  const chartEmpty = document.getElementById('chartEmpty') as HTMLDivElement;
  const chart = createChart(canvas, {
    width: canvas.clientWidth || 800,
    height: 360,
    padding: { top: 20, right: 20, bottom: 30, left: 44 },
  });
  const exportBtn = document.getElementById('exportBtn') as HTMLButtonElement;

  let lastConditionsJson = JSON.stringify(store.getState().filter.conditions);

  const render = () => {
    const state = store.getState();
    chartEmpty.hidden = state.samples.length > 0;
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

    const conditionsJson = JSON.stringify(state.filter.conditions);
    if (conditionsJson !== lastConditionsJson) {
      ui.renderConditions();
      lastConditionsJson = conditionsJson;
    }

    ui.updateRangeValues(state.filter.timeStartMs, state.filter.timeEndMs);
  };

  function doExport() {
    const state = store.getState();
    if (!state.original || state.filteredSamples.length === 0) return;
    const data = buildExportPackage(state.original, state.filteredSamples);
    downloadExport(data);
  }

  const ui = createUI(store, render);
  chart.onRangeSelect((startMs, endMs) => {
    store.setTimeRange(Math.min(startMs, endMs), Math.max(startMs, endMs));
  });
  store.subscribe(render);
  exportBtn.addEventListener('click', doExport);
  window.addEventListener('keydown', (e) => {
    if ((e.key === 'r' || e.key === 'R') && !isTypingTarget(e) && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      const state = store.getState();
      if (state.samples.length === 0) return;
      store.setTimeRange(state.samples[0].t, state.samples[state.samples.length - 1].t);
      ui.updateRangeInputs(state.samples);
    }

    if ((e.ctrlKey || e.metaKey) && (e.key === 'e' || e.key === 'E')) {
      e.preventDefault();
      doExport();
    }

    if (e.key === 'Escape') {
      chart.cancelDrag();
    }
  });
  window.addEventListener('resize', () => { chart.resize(); render(); });
}

initApp();
