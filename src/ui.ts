import type { Store } from './store';
import { CHANNELS } from './channels';
import { loadFile, type LoadResult } from './loader';

export function createUI(store: Store, render: () => void) {
  const fileInput = document.getElementById('fileInput') as HTMLInputElement;
  const dropZone = document.getElementById('dropZone') as HTMLDivElement;
  const workspace = document.getElementById('workspace') as HTMLDivElement;
  const timeStart = document.getElementById('timeStart') as HTMLInputElement;
  const timeEnd = document.getElementById('timeEnd') as HTMLInputElement;
  const resetRange = document.getElementById('resetRange') as HTMLButtonElement;
  const rangeInfo = document.getElementById('rangeInfo') as HTMLSpanElement;
  const channelList = document.getElementById('channelList') as HTMLDivElement;
  const statusCards = document.getElementById('statusCards') as HTMLDivElement;

  function handleFile(file: File) {
    loadFile(file).then((result: LoadResult) => {
      if (!result.ok) {
        alert(result.error);
        return;
      }
      store.setOriginal(result.data, result.samples);
      dropZone.hidden = true;
      workspace.hidden = false;
      updateRangeInputs(result.samples);
      render();
    });
  }

  fileInput.addEventListener('change', (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) handleFile(file);
  });

  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
  });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    const file = e.dataTransfer?.files[0];
    if (file) handleFile(file);
  });

  function updateRangeInputs(samples: { t: number }[]) {
    if (samples.length === 0) return;
    const min = samples[0].t;
    const max = samples[samples.length - 1].t;
    timeStart.min = timeEnd.min = String(min);
    timeStart.max = timeEnd.max = String(max);
    timeStart.value = String(min);
    timeEnd.value = String(max);
    timeStart.step = timeEnd.step = String(Math.max(1, Math.floor((max - min) / 200)));
  }

  function onRangeChange() {
    const start = Number(timeStart.value);
    const end = Number(timeEnd.value);
    store.setTimeRange(Math.min(start, end), Math.max(start, end));
    render();
  }

  timeStart.addEventListener('input', onRangeChange);
  timeEnd.addEventListener('input', onRangeChange);
  resetRange.addEventListener('click', () => {
    const state = store.getState();
    if (state.samples.length === 0) return;
    store.setTimeRange(state.samples[0].t, state.samples[state.samples.length - 1].t);
    updateRangeInputs(state.samples);
    render();
  });

  function renderChannelList() {
    channelList.innerHTML = '';
    const visible = store.getState().filter.visibleChannels;
    CHANNELS.forEach((ch) => {
      const tag = document.createElement('label');
      tag.className = 'channelTag' + (visible.has(ch.key) ? ' active' : '');
      tag.style.color = ch.color;
      tag.innerHTML = `<input type="checkbox" ${visible.has(ch.key) ? 'checked' : ''}> ${ch.label}`;
      tag.querySelector('input')!.addEventListener('change', (e) => {
        const next = new Set(store.getState().filter.visibleChannels);
        if ((e.target as HTMLInputElement).checked) next.add(ch.key);
        else next.delete(ch.key);
        store.setVisibleChannels(next);
        render();
      });
      channelList.appendChild(tag);
    });
  }

  function renderStatusCards() {
    const state = store.getState();
    const samples = state.samples;
    const filtered = state.samples;
    statusCards.innerHTML = '';
    const cards = [
      { label: 'Samples', value: String(samples.length) },
      { label: 'Duration', value: samples.length > 1 ? `${((samples[samples.length - 1].t - samples[0].t) / 1000).toFixed(1)}s` : '0s' },
      { label: 'Filtered', value: String(filtered.length) },
    ];
    cards.forEach((c) => {
      const div = document.createElement('div');
      div.className = 'statusCard';
      div.innerHTML = `<div class="label">${c.label}</div><div class="value">${c.value}</div>`;
      statusCards.appendChild(div);
    });
  }

  return { renderChannelList, renderStatusCards, rangeInfo };
}
