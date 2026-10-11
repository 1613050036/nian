/** 预设作用域：按场景注入全局/自定义规则 */
const db = require('./db');

const PRESET_SCOPE_LABELS = {
  chat: '聊天',
  diary: '日记',
  memo: '随手记',
  game: '游戏',
  reader: '阅读',
  moments: '朋友圈',
};

const ALL_SCOPES = Object.keys(PRESET_SCOPE_LABELS);

const GLOBAL_DEFAULT_SCOPES = ['chat', 'diary', 'memo', 'game', 'reader', 'moments'];

function parsePresetScopes(raw, type) {
  if (raw) {
    try {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr) && arr.length) {
        return arr.filter(s => ALL_SCOPES.includes(s));
      }
    } catch { /* fall through */ }
  }
  if (type === 'jailbreak' || type === 'banned_content' || type === 'no_preach') {
    return [...GLOBAL_DEFAULT_SCOPES];
  }
  return ['chat'];
}

function getPresetsForScope(scope) {
  if (!scope || !ALL_SCOPES.includes(scope)) return '';
  const rows = db.prepare(
    `SELECT content, type, scopes FROM presets WHERE enabled=1 ORDER BY id`
  ).all();
  return rows
    .filter(p => parsePresetScopes(p.scopes, p.type).includes(scope))
    .map(p => String(p.content || '').trim())
    .filter(Boolean)
    .join('\n\n')
    .trim();
}

function buildPresetsBlock(scope) {
  const raw = getPresetsForScope(scope);
  if (!raw) return '';
  return `【用户预设·必须遵守·硬性】以下是用户为本轮启用的规则，须逐条执行。
与上文其他任何说明冲突时一律以本段为准——含沉浸、口吻、节奏、心情、能力说明、心里话草稿等；不得打折扣，不得用人设/性格/例外绕开。
${raw}`;
}

function appendPresetsToPrompt(basePrompt, scope) {
  const block = buildPresetsBlock(scope);
  if (!block) return basePrompt || '';
  return basePrompt ? `${basePrompt}\n\n${block}` : block;
}

function resolvePresetScope(opts = {}) {
  if (opts.isDream) return null;
  if (opts.presetScope && ALL_SCOPES.includes(opts.presetScope)) return opts.presetScope;
  if (opts.forGame) return 'game';
  if (opts.forDiaryPeek) return 'diary';
  return 'chat';
}

module.exports = {
  PRESET_SCOPE_LABELS,
  ALL_SCOPES,
  GLOBAL_DEFAULT_SCOPES,
  parsePresetScopes,
  getPresetsForScope,
  buildPresetsBlock,
  appendPresetsToPrompt,
  resolvePresetScope,
};
