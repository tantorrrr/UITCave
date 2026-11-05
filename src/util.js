/** Tạo DOM gọn: el('div', { className: 'x' }, child1, 'text'). */
export function el(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === 'style') node.style.cssText = v;
    else if (k.includes('-')) node.setAttribute(k, v);
    else node[k] = v;
  }
  for (const c of children) if (c != null) node.append(c);
  return node;
}

const PROFILE_KEY = 'hanguit.profile';

export function loadProfile() {
  try {
    return JSON.parse(localStorage.getItem(PROFILE_KEY)) || {};
  } catch {
    return {};
  }
}

export function saveProfile(profile) {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {
    // Trình duyệt chặn storage: bỏ qua, lần sau nhập lại tên.
  }
}
