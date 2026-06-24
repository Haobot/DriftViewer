import type { Store } from './store';
import type { Condition } from './types';
import { CHANNELS } from './channels';
import { loadFile, type LoadResult } from './loader';

export function createUI(store: Store, render: () => void) {
  void render; // used via store.subscribe(render) in main.ts
  const fileInput = document.getElementById('fileInput') as HTMLInputElement;
  const dropZone = document.getElementById('dropZone') as HTMLDivElement;
  const workspace = document.getElementById('workspace') as HTMLDivElement;
  const timeStart = document.getElementById('timeStart') as HTMLInputElement;
  const timeEnd = document.getElementById('timeEnd') as HTMLInputElement;
  const resetRange = document.getElementById('resetRange') as HTMLButtonElement;
  const rangeInfo = document.getElementById('rangeInfo') as HTMLSpanElement;
  const channelList = document.getElementById('channelList') as HTMLDivElement;
  const statusCards = document.getElementById('statusCards') as HTMLDivElement;
  const conditionList = document.getElementById('conditionList') as HTMLDivElement;
  const addCondition = document.getElementById('addCondition') as HTMLButtonElement;

  const OPS: Condition['op'][] = ['==', '!=', '<', '<=', '>', '>='];
  const COMBINES: Condition['combine'][] = ['AND', 'OR'];

  function readConditions(): Condition[] {
    const rows = conditionList.querySelectorAll('.conditionRow');
    const conditions: Condition[] = [];
    rows.forEach((row) => {
      const channel = (row.querySelector('.condChannel') as HTMLSelectElement).value as Condition['channel'];
      const op = (row.querySelector('.condOp') as HTMLSelectElement).value as Condition['op'];
      const value = Number((row.querySelector('.condValue') as HTMLInputElement).value);
      const combine = (row.querySelector('.condCombine') as HTMLSelectElement).value as Condition['combine'];
      conditions.push({ channel, op, value: Number.isNaN(value) ? 0 : value, combine });
    });
    return conditions;
  }

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
    timeStart.step = timeEnd.step = String(Math.max(1, Math.floor((max - min) / 200)));
    timeStart.value = String(min);
    timeEnd.value = String(max);
  }

  function updateRangeValues(startMs: number, endMs: number) {
    if (document.activeElement !== timeStart && timeStart.value !== String(startMs)) {
      timeStart.value = String(startMs);
    }
    if (document.activeElement !== timeEnd && timeEnd.value !== String(endMs)) {
      timeEnd.value = String(endMs);
    }
  }

  function onRangeChange() {
    const start = Number(timeStart.value);
    const end = Number(timeEnd.value);
    store.setTimeRange(Math.min(start, end), Math.max(start, end));
  }

  timeStart.addEventListener('input', onRangeChange);
  timeEnd.addEventListener('input', onRangeChange);
  resetRange.addEventListener('click', () => {
    const state = store.getState();
    if (state.samples.length === 0) return;
    store.setTimeRange(state.samples[0].t, state.samples[state.samples.length - 1].t);
    updateRangeInputs(state.samples);
  });
  addCondition.addEventListener('click', () => {
    const next = readConditions();
    next.push({ channel: 'thr', op: '>', value: 0, combine: 'AND' });
    store.setConditions(next);
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
      });
      channelList.appendChild(tag);
    });
  }

  function renderStatusCards() {
    const state = store.getState();
    const samples = state.filteredSamples;
    statusCards.innerHTML = '';

    let cards: { label: string; value: string }[];

    if (state.samples.length === 0) {
      cards = [{ label: 'Samples', value: '0' }];
    } else {
      const durationSeconds = samples.length > 1 ? (samples[samples.length - 1].t - samples[0].t) / 1000 : 0;
      const rate = durationSeconds > 0 ? (samples.length / durationSeconds).toFixed(1) : '-';
      const filteredPercent = state.samples.length > 0
        ? `${((samples.length / state.samples.length) * 100).toFixed(1)}%`
        : '0%';

      cards = [
        { label: 'Samples', value: String(samples.length) },
        { label: 'Duration', value: durationSeconds > 0 ? `${durationSeconds.toFixed(1)}s` : '0s' },
        { label: 'Rate', value: `${rate} Hz` },
        { label: 'Channels', value: String(state.filter.visibleChannels.size) },
        { label: 'Conditions', value: String(state.filter.conditions.length) },
        { label: 'Filtered', value: filteredPercent },
        { label: 'Raw', value: String(state.samples.length) },
      ];
    }

    cards.forEach((c) => {
      const div = document.createElement('div');
      div.className = 'statusCard';
      div.innerHTML = `<div class="label">${c.label}</div><div class="value">${c.value}</div>`;
      statusCards.appendChild(div);
    });

    if (rangeInfo) {
      const f = state.filteredSamples;
      rangeInfo.textContent = f.length > 0
        ? `${f.length} samples / ${((f[f.length - 1].t - f[0].t) / 1000).toFixed(1)}s`
        : '0 samples';
    }
  }

  function renderConditions() {
    const conditions = store.getState().filter.conditions;
    const existingRows = Array.from(conditionList.querySelectorAll('.conditionRow'));

    // Remove extra rows
    while (existingRows.length > conditions.length) {
      const row = existingRows.pop();
      if (row) row.remove();
    }

    conditions.forEach((cond, index) => {
      let row = existingRows[index] as HTMLElement | undefined;
      const channelChanged = !row || (row.querySelector('.condChannel') as HTMLSelectElement | null)?.value !== cond.channel;
      const opChanged = !row || (row.querySelector('.condOp') as HTMLSelectElement | null)?.value !== cond.op;
      const combineChanged = !row || (row.querySelector('.condCombine') as HTMLSelectElement | null)?.value !== cond.combine;

      if (channelChanged || opChanged || combineChanged) {
        if (row) row.remove();
        row = undefined;
      }

      if (!row) {
        row = document.createElement('div');
        row.className = 'conditionRow';

        const channelSelect = document.createElement('select');
        channelSelect.className = 'condChannel';
        CHANNELS.forEach((ch) => {
          const opt = document.createElement('option');
          opt.value = ch.key;
          opt.textContent = ch.label;
          if (ch.key === cond.channel) opt.selected = true;
          channelSelect.appendChild(opt);
        });

        const opSelect = document.createElement('select');
        opSelect.className = 'condOp';
        OPS.forEach((op) => {
          const opt = document.createElement('option');
          opt.value = op;
          opt.textContent = op;
          if (op === cond.op) opt.selected = true;
          opSelect.appendChild(opt);
        });

        const valueInput = document.createElement('input');
        valueInput.className = 'condValue';
        valueInput.type = 'number';
        valueInput.value = String(cond.value);

        const combineSelect = document.createElement('select');
        combineSelect.className = 'condCombine';
        COMBINES.forEach((c) => {
          const opt = document.createElement('option');
          opt.value = c;
          opt.textContent = c;
          if (c === cond.combine) opt.selected = true;
          combineSelect.appendChild(opt);
        });
        combineSelect.hidden = index === 0;

        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.textContent = '×';
        removeBtn.setAttribute('aria-label', '移除条件');
        removeBtn.addEventListener('click', () => {
          const next = readConditions();
          next.splice(index, 1);
          store.setConditions(next);
        });

        row.appendChild(channelSelect);
        row.appendChild(opSelect);
        row.appendChild(valueInput);
        row.appendChild(combineSelect);
        row.appendChild(removeBtn);

        const onChange = () => store.setConditions(readConditions());
        channelSelect.addEventListener('change', onChange);
        opSelect.addEventListener('change', onChange);
        valueInput.addEventListener('change', onChange);
        combineSelect.addEventListener('change', onChange);

        const before = conditionList.children[index];
        if (before) {
          conditionList.insertBefore(row, before);
        } else {
          conditionList.appendChild(row);
        }
      } else {
        // Update value only if not focused
        const valueInput = row.querySelector('.condValue') as HTMLInputElement;
        if (document.activeElement !== valueInput && valueInput.value !== String(cond.value)) {
          valueInput.value = String(cond.value);
        }
        const combineSelect = row.querySelector('.condCombine') as HTMLSelectElement;
        combineSelect.hidden = index === 0;
      }
    });
  }

  return { renderChannelList, renderStatusCards, renderConditions, rangeInfo, updateRangeInputs, updateRangeValues };
}
