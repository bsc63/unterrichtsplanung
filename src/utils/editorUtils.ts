/**
 * Utility functions for robust contenteditable rich-text editing:
 * - Hierarchical lists (Unordered & Ordered)
 * - Tab / Shift+Tab indentation without cursor jumps
 * - Bulletproof caret placement preventing text insertion above lists
 */

export function findFirstTextNode(node: Node): Text | null {
  if (node.nodeType === Node.TEXT_NODE) {
    return node as Text;
  }
  for (let child = node.firstChild; child; child = child.nextSibling) {
    const found = findFirstTextNode(child);
    if (found) return found;
  }
  return null;
}

/**
 * Places the cursor cleanly inside an LI element inside an actual TextNode.
 * Uses a zero-width space (\u200B) if the LI is empty, which guarantees that typing
 * stays strictly inside the LI and never slips above or outside the list.
 */
export function setCaretInsideLi(li: HTMLElement, atStart = false) {
  let textNode = findFirstTextNode(li);
  if (!textNode || textNode.textContent === '') {
    // Clear out rogue <br> tags and inject invisible zero-width character
    li.innerHTML = '';
    textNode = document.createTextNode('\u200B');
    li.appendChild(textNode);
  }

  const sel = window.getSelection();
  if (sel) {
    const range = document.createRange();
    const offset = atStart ? (textNode.textContent?.startsWith('\u200B') ? 1 : 0) : textNode.length;
    range.setStart(textNode, offset);
    range.setEnd(textNode, offset);
    sel.removeAllRanges();
    sel.addRange(range);
  }
}

/**
 * Inserts a list (unordered or ordered) and ensures the caret is locked
 * inside the first LI item, preventing the browser from inserting a line above it.
 */
export function insertList(isOrdered: boolean, targetElement?: HTMLElement | null): boolean {
  let activeEl = document.activeElement as HTMLElement | null;
  const notesEl = document.getElementById('notes-editor-content');

  if (!activeEl || !activeEl.isContentEditable) {
    if (targetElement && targetElement.isContentEditable) {
      targetElement.focus();
      activeEl = targetElement;
    } else if (notesEl) {
      notesEl.focus();
      activeEl = notesEl;
    } else {
      return false;
    }
  }

  const tag = isOrdered ? 'ol' : 'ul';
  const textContent = (activeEl.innerText || '').replace(/[\u200B\s]/g, '');
  const isEssentiallyEmpty = textContent === '' || activeEl.innerHTML === '<br>' || activeEl.innerHTML === '';

  // If container is empty, construct a pristine list directly in DOM
  if (isEssentiallyEmpty) {
    activeEl.innerHTML = '';
    const list = document.createElement(tag);
    const li = document.createElement('li');
    const textNode = document.createTextNode('\u200B');
    li.appendChild(textNode);
    list.appendChild(li);
    activeEl.appendChild(list);

    setCaretInsideLi(li);
    return true;
  }

  // Check if currently inside an existing LI
  let currentLi: HTMLElement | null = null;
  const sel = window.getSelection();
  if (sel && sel.rangeCount > 0) {
    let node: Node | null = sel.getRangeAt(0).startContainer;
    while (node && node !== activeEl) {
      if (node.nodeType === Node.ELEMENT_NODE && (node as HTMLElement).tagName === 'LI') {
        currentLi = node as HTMLElement;
        break;
      }
      node = node.parentNode;
    }
  }

  if (currentLi) {
    const parentList = currentLi.parentElement;
    if (parentList && parentList.tagName.toLowerCase() !== tag) {
      // Toggle between UL and OL
      const newList = document.createElement(tag);
      while (parentList.firstChild) {
        newList.appendChild(parentList.firstChild);
      }
      parentList.parentNode?.replaceChild(newList, parentList);
      setCaretInsideLi(currentLi);
      return true;
    }
  }

  // Standard command fallback
  const cmd = isOrdered ? 'insertOrderedList' : 'insertUnorderedList';
  document.execCommand(cmd, false);

  // Lock cursor inside LI
  const s = window.getSelection();
  if (s && s.rangeCount > 0) {
    let n: Node | null = s.getRangeAt(0).startContainer;
    let targetLi: HTMLElement | null = null;
    while (n && n !== activeEl) {
      if (n.nodeType === Node.ELEMENT_NODE && (n as HTMLElement).tagName === 'LI') {
        targetLi = n as HTMLElement;
        break;
      }
      n = n.parentNode;
    }
    if (targetLi) {
      setCaretInsideLi(targetLi);
    } else {
      const firstLi = activeEl.querySelector('li');
      if (firstLi) setCaretInsideLi(firstLi);
    }
  }
  return true;
}

/**
 * Indents the current list item (moves it one level deeper into a nested sublist).
 * Safely keeps the caret inside the indented LI so writing continues directly
 * inside the sub-bullet, rather than creating an extra line above.
 */
export function indentListItem(container?: HTMLElement | null): boolean {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return false;
  const range = sel.getRangeAt(0);

  let currentLi: HTMLElement | null = null;
  let node: Node | null = range.startContainer;
  while (node) {
    if (node.nodeType === Node.ELEMENT_NODE && (node as HTMLElement).tagName === 'LI') {
      currentLi = node as HTMLElement;
      break;
    }
    if (container && node === container) break;
    node = node.parentNode;
  }

  if (!currentLi) {
    return false;
  }

  const parentList = currentLi.parentElement;
  if (!parentList) return false;

  const listTag = parentList.tagName.toLowerCase() === 'ol' ? 'ol' : 'ul';
  const prevSibling = currentLi.previousElementSibling as HTMLElement | null;

  if (prevSibling && prevSibling.tagName === 'LI') {
    // If the previous list item already has a sublist, append to it
    let subList = prevSibling.querySelector(':scope > ul, :scope > ol') as HTMLElement | null;
    if (!subList) {
      subList = document.createElement(listTag);
      prevSibling.appendChild(subList);
    }
    subList.appendChild(currentLi);
  } else {
    // First item in list: nest inside a new sublist at current position
    const subList = document.createElement(listTag);
    parentList.insertBefore(subList, currentLi);
    subList.appendChild(currentLi);
  }

  // Ensure cursor is placed inside the indented item
  setCaretInsideLi(currentLi);
  return true;
}

/**
 * Outdents the current list item (moves it one level up in the hierarchy).
 */
export function outdentListItem(container?: HTMLElement | null): boolean {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return false;
  const range = sel.getRangeAt(0);

  let currentLi: HTMLElement | null = null;
  let node: Node | null = range.startContainer;
  while (node) {
    if (node.nodeType === Node.ELEMENT_NODE && (node as HTMLElement).tagName === 'LI') {
      currentLi = node as HTMLElement;
      break;
    }
    if (container && node === container) break;
    node = node.parentNode;
  }

  if (!currentLi) return false;

  const parentList = currentLi.parentElement;
  if (!parentList) return false;

  // Check if parentList is inside a parent LI (nested list)
  const parentLi = parentList.closest('li');
  if (parentLi && parentLi.parentElement) {
    parentLi.parentElement.insertBefore(currentLi, parentLi.nextSibling);
    if (parentList.children.length === 0) {
      parentList.remove();
    }
    setCaretInsideLi(currentLi);
    return true;
  }

  // Check if parentList is directly inside another list
  const grandParentList = parentList.parentElement?.closest('ul, ol');
  if (grandParentList) {
    parentList.parentElement?.insertBefore(currentLi, parentList.nextSibling);
    if (parentList.children.length === 0) {
      parentList.remove();
    }
    setCaretInsideLi(currentLi);
    return true;
  }

  // At top level: standard execCommand outdent
  document.execCommand('outdent', false);
  return true;
}

/**
 * Handles the Enter key on an empty list item:
 * Outdents if nested, or exits list if at top-level (standard word-processor behavior).
 */
export function handleListEnter(container?: HTMLElement | null): boolean {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return false;
  const range = sel.getRangeAt(0);

  let currentLi: HTMLElement | null = null;
  let node: Node | null = range.startContainer;
  while (node) {
    if (node.nodeType === Node.ELEMENT_NODE && (node as HTMLElement).tagName === 'LI') {
      currentLi = node as HTMLElement;
      break;
    }
    if (container && node === container) break;
    node = node.parentNode;
  }

  if (!currentLi) return false;

  const text = (currentLi.innerText || '').replace(/[\u200B\s]/g, '');
  if (text === '') {
    const parentList = currentLi.parentElement;
    const isNested = Boolean(parentList?.closest('li') || parentList?.parentElement?.closest('ul, ol'));
    if (isNested) {
      outdentListItem(container);
      return true;
    } else {
      document.execCommand('outdent', false);
      return true;
    }
  }

  return false;
}
