import { createEventDispatcher } from 'svelte';
import codemirror from 'codemirror';
import 'codemirror/mode/markdown/markdown.js';
import { EditorProps } from 'bytemd';

export function initEditor(
  textarea: HTMLTextAreaElement,
  editorConfig: any,
  value: string,
  viewer: HTMLElement,
  fileHandler: NonNullable<EditorProps['fileHandler']>
) {
  const dispatch = createEventDispatcher();

  const cm = codemirror.fromTextArea(textarea, {
    mode: 'markdown',
    lineNumbers: true,
    lineWrapping: true,
    ...editorConfig,
  });
  cm.setValue(value);
  cm.on('change', (doc, change) => {
    if (change.origin !== 'setValue') {
      dispatch('change', { value: cm.getValue() });
    }
  });
  cm.on('scroll', (cm) => {
    requestAnimationFrame(() => {
      const editorInfo = cm.getScrollInfo();
      const ratio =
        editorInfo.top / (editorInfo.height - editorInfo.clientHeight);
      viewer.scrollTo(0, ratio * (viewer.scrollHeight - viewer.clientHeight));
    });
  });
  cm.on('paste', async (_, e) => {
    const { items } = e.clipboardData;
    for (let i = 0; i < items.length; i++) {
      // console.log(items[i]);
      if (!items[i].type.startsWith('image/')) continue;

      e.preventDefault();
      const url = await fileHandler(items[i].getAsFile());
      const text = cm.getSelection();
      cm.replaceSelection(`![${text}](${url})`);
      cm.focus();
      return;
    }
  });
  cm.on('drop', async (_, e) => {
    const { items } = e.dataTransfer;
    for (let i = 0; i < items.length; i++) {
      if (!items[i].type.startsWith('image/')) continue;

      e.preventDefault();
      const url = await fileHandler(items[i].getAsFile());
      const text = cm.getSelection();
      cm.replaceSelection(`![${text}](${url})`);
      cm.focus();
      return;
    }
  });

  return cm;
}

export const dataUrlFileHandler: Exclude<
  EditorProps['fileHandler'],
  undefined
> = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('load', (e) => {
      resolve(e.target!.result as string);
    });
    reader.addEventListener('error', (e) => {
      reject(new Error('readAsDataURL error'));
    });
    reader.readAsDataURL(file);
  });
};
