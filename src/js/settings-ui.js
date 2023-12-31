import { appendNewChild } from './utils';
import { options, settings } from './settings';
import { updatePage } from './page-utils';

const pc = document.getElementById('pagesContainer');
const r = document.querySelector(':root');

function addSettingsToggle(parentElement, option, isVolume) {
  const div = appendNewChild(parentElement, 'div');
  div.classList.add('toggleOption');

  let values;
  let settings_key;
  if (isVolume) {
    values = [null, false, true];
    settings_key = 'volume';
  } else {
    values = [false, true];
    settings_key = 'global';
  }

  function listener() {
    let value;
    switch (this.value) {
      case 'false':
        value = false;
        break;
      case 'true':
        value = true;
        break;
      default:
        value = null;
        break;
    }
    settings[settings_key][option.id] = value;
    updateProperties();
    updatePage();
  }

  for (const value of values) {
    const input = appendNewChild(div, 'input');
    input.type = 'radio';
    input.name = `settings_${settings_key}_${option.id}`;
    input.id = `${input.name}_${value}`;
    input.value = value;

    if (settings[settings_key][option.id] === value) {
      input.checked = true;
    }

    input.addEventListener('change', listener, false);

    let labelText;
    switch (value) {
      case false:
        labelText = 'off';
        break;
      case true:
        labelText = 'on';
        break;
      default:
        labelText = 'default';
        break;
    }

    const label = appendNewChild(div, 'label', labelText);
    label.setAttribute('for', input.id);
  }
}

function addSettingsSelect(parentElement, option, isVolume) {
  const div = appendNewChild(parentElement, 'div');
  div.classList.add('selectOption');
  const label = appendNewChild(div, 'label');
  const select = appendNewChild(label, 'select');
  const settingsGroup = isVolume ? 'volume' : 'global';

  if (isVolume) {
    const selectOption = appendNewChild(select, 'option', 'default');
    selectOption.value = null;
  }

  for (const x of option.selectOptions) {
    const selectOption = appendNewChild(select, 'option', x);
    selectOption.value = x;
  }

  select.value = settings[settingsGroup][option.id];

  select.addEventListener('change', (e) => {
    const x = e.target.value;
    settings[settingsGroup][option.id] = x === 'null' ? null : x;
    updateProperties();
    updatePage();
  });
}

function addSettingsColor(parentElement, option, isVolume) {
  const div = appendNewChild(parentElement, 'div');
  div.classList.add('colorOption');
  const label = appendNewChild(div, 'label');
  const input = appendNewChild(label, 'input');
  input.type = 'color';
  const settingsGroup = isVolume ? 'volume' : 'global';
  input.value = settings[settingsGroup][option.id];

  input.addEventListener('change', (e) => {
    settings[settingsGroup][option.id] = e.target.value;
    updateProperties();
  });
}

function addSettingsOption(parentElement, option, isVolume) {
  if (option.inputType === 'toggle') {
    addSettingsToggle(parentElement, option, isVolume);
  } else if (option.inputType === 'select') {
    addSettingsSelect(parentElement, option, isVolume);
  } else if (option.inputType === 'color') {
    addSettingsColor(parentElement, option, isVolume);
  }
}

function addSettingsResetButton(parentElement, isVolume) {
  const div = appendNewChild(parentElement, 'div');
  div.classList.add('resetButton');
  const a = appendNewChild(div, 'a', 'reset');
  a.href = '#';
  a.addEventListener(
    'click',
    () => {
      if (isVolume) {
        settings.resetVolume();
      } else {
        settings.resetGlobal();
      }
      updateSettingsDisplay();
      updateProperties();
      updatePage();
    },
    false,
  );
}

export function updateSettingsDisplay() {
  const settingsDisplay = document.getElementById('settingsDisplay');
  settingsDisplay.replaceChildren();

  const settingsTable = appendNewChild(settingsDisplay, 'table');
  let tr;
  let td;

  tr = appendNewChild(settingsTable, 'tr');
  const left_col = appendNewChild(tr, 'th');
  left_col.classList.add('settingsLeftCol');
  let header = 'default settings';
  if (window.loadedVolume !== null) {
    header += ' / settings for loaded volume';
  }
  appendNewChild(tr, 'th', header);

  for (const option of options) {
    tr = appendNewChild(settingsTable, 'tr');
    const tdLabel = appendNewChild(tr, 'td', option.label);
    tdLabel.classList.add('alignright');
    td = appendNewChild(tr, 'td');
    addSettingsOption(td, option, false);

    if (window.loadedVolume !== null) {
      if (!option.isGlobal) {
        const divider = appendNewChild(td, 'div', ' / ');
        divider.classList.add('settingsDivider');
        addSettingsOption(td, option, true);
      }
    }
  }

  tr = appendNewChild(settingsTable, 'tr');
  appendNewChild(tr, 'td');
  td = appendNewChild(tr, 'td');
  addSettingsResetButton(td, false);
  if (window.loadedVolume !== null) {
    const divider = appendNewChild(td, 'div', ' / ');
    divider.classList.add('settingsDivider');
    addSettingsResetButton(td, true);
  }
}

export function updateProperties() {
  if (settings.textBoxBorders) {
    r.style.setProperty('--textBoxBorderHoverColor', 'rgba(237, 28, 36, 0.3)');
  } else {
    r.style.setProperty('--textBoxBorderHoverColor', 'rgba(0, 0, 0, 0)');
  }

  pc.contentEditable = settings.editableText;

  if (settings.displayOCR) {
    r.style.setProperty('--textBoxDisplay', 'initial');
  } else {
    r.style.setProperty('--textBoxDisplay', 'none');
  }

  if (settings.fontSize === 'auto') {
    pc.classList.remove('textBoxFontSizeOverride');
  } else {
    r.style.setProperty('--textBoxFontSize', `${settings.fontSize}pt`);
    pc.classList.add('textBoxFontSizeOverride');
  }

  if (settings.eInkMode) {
    document.getElementById('topMenu').classList.add('notransition');
  } else {
    document.getElementById('topMenu').classList.remove('notransition');
  }

  r.style.setProperty('--colorBackground', settings.backgroundColor);
}

export function modifySettingsValue(settings_key, option_id, value) {
  if (settings_key === 'volume' && window.loadedVolume === null) {
    return;
  }

  settings[settings_key][option_id] = value;
  updateSettingsDisplay();
  updateProperties();
  updatePage();
}
