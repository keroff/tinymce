/**
 * Copyright (c) Tiny Technologies, Inc. All rights reserved.
 * Licensed under the LGPL or a commercial license.
 * For LGPL see License.txt in the project root for license information.
 * For commercial licenses see https://www.tiny.cloud/
 */

import { Unicode } from '@ephox/katamari';

import Editor from 'tinymce/core/api/Editor';
import DomParser from 'tinymce/core/api/html/DomParser';
import Schema from 'tinymce/core/api/html/Schema';
import Tools from 'tinymce/core/api/util/Tools';

import * as Settings from '../api/Settings';

/**
 * This class contails various utility functions for the paste plugin.
 *
 * @class tinymce.pasteplugin.Utils
 */

const filter = (content, items) => {
  Tools.each(items, (v) => {
    if (v.constructor === RegExp) {
      content = content.replace(v, '');
    } else {
      content = content.replace(v[0], v[1]);
    }
  });

  return content;
};

/**
 * Gets the innerText of the specified element. It will handle edge cases
 * and works better than textContent on Gecko.
 *
 * @param {String} html HTML string to get text from.
 * @return {String} String of text with line feeds.
 */
const innerText = (html: string) => {
  const schema = Schema();
  const domParser = DomParser({}, schema);
  let text = '';
  const shortEndedElements = schema.getShortEndedElements();
  const ignoreElements = Tools.makeMap('script noscript style textarea video audio iframe object', ' ');
  const blockElements = schema.getBlockElements();

  const walk = (node) => {
    const name = node.name, currentNode = node;

    if (name === 'br') {
      text += '\n';
      return;
    }

    // Ignore wbr, to replicate innerText on Chrome/Firefox
    if (name === 'wbr') {
      return;
    }

    // img/input/hr but ignore wbr as it's just a potential word break
    if (shortEndedElements[name]) {
      text += ' ';
    }

    // Ignore script, video contents
    if (ignoreElements[name]) {
      text += ' ';
      return;
    }

    if (node.type === 3) {
      text += node.value;
    }

    // Walk all children
    if (!node.shortEnded) {
      if ((node = node.firstChild)) {
        do {
          walk(node);
        } while ((node = node.next));
      }
    }

    // Add \n or \n\n for blocks or P
    if (blockElements[name] && currentNode.next) {
      text += '\n';

      if (name === 'p') {
        text += '\n';
      }
    }
  };

  html = filter(html, [
    /<!\[[^\]]+\]>/g // Conditional comments
  ]);

  walk(domParser.parse(html));

  return text;
};

const ExcelParser = () => {

  const commentStart = '<!--';
  const commentEnd = '-->';
  const styleRegExp = /^(\.?[a-zA-Z0-9_-]+?)\s*?{([\s\S]+?)}/gm;

  const isExcelSheet = (container: Element) => {
    return !!container.querySelector('meta[name="ProgId"][content="Excel.Sheet"]');
  };

  const appendFromClassName = (container: Element, className: string, style: any) => {
    const nodeList = container.querySelectorAll<HTMLElement>(className);
    for (let i = 0; i < nodeList.length; i++) {
      const node = nodeList[i];
      const newStyle = nodeList[i].style.cssText + style;
      node.setAttribute('data-mce-style', newStyle);
      node.style.cssText = newStyle;
      node.classList.remove(className.substring(1));
      if (node.classList.length === 0) {
        node.removeAttribute('class');
      }
    }
  };

  const appendFromTagName = (container: Element, tagName: string, style: any) => {
    const nodeList = container.querySelectorAll<HTMLElement>(tagName);
    for (let i = 0; i < nodeList.length; i++) {
      const node = nodeList[i];
      const newStyle = nodeList[i].style.cssText + style;
      node.style.cssText = newStyle;
      node.setAttribute('data-mce-style', newStyle);
    }
  };

  const parseStyle = (text: string) => {
    const styles = {};
    let match = styleRegExp.exec(text);
    while (match) {
      if (match.length === 3) {
        styles[match[1]] = match[2]; // (1) selector (2) style
      }
      match = styleRegExp.exec(text);
    }

    return styles;
  };

  // only class and element selectors should be selected by regexp
  const appendStyle = (container: Element, styles: any) => {
    for (const selector in styles) {
      if (selector.startsWith('.')) {
        appendFromClassName(container, selector, styles[selector]);
      } else {
        appendFromTagName(container, selector, styles[selector]);
      }
    }
  };

  return (editor: Editor, html: string) => {
    if (!Settings.isExcelParseEnabled(editor)) {
      return html;
    }

    const div = document.createElement('div');
    div.innerHTML = html;
    if (!isExcelSheet(div)) {
      return html;
    }

    const styleTags = div.querySelectorAll('style');
    for (let i = 0; i < styleTags.length; i++) {
      const tagText = styleTags[i].innerText.trim();
      if (tagText.startsWith(commentStart) && tagText.endsWith(commentEnd)) {
        const text = tagText.substring(commentStart.length, tagText.length - commentEnd.length);
        const parsedStyle = parseStyle(text);
        appendStyle(div, parsedStyle);
      }
    }

    return div.innerHTML;
  };
};

const parseExcel = ExcelParser();

const keepStyles = (editor: Editor, html: string) => {
  const keepStyleElements = Settings.getKeepStyleElements(editor);
  if (!keepStyleElements) {
    return html;
  }

  const div = document.createElement('div');
  div.innerHTML = html;

  const elements = keepStyleElements.split('|');
  for (let i = 0; i < elements.length; i++) {
    const nodeList = div.querySelectorAll<HTMLElement>(elements[i]);
    for (let j = 0; j < nodeList.length; j++) {
      nodeList[j].setAttribute('data-mce-style', nodeList[j].style.cssText);
    }
  }

  return div.innerHTML;
};

/**
 * Trims the specified HTML by removing all WebKit fragments, all elements wrapping the body trailing BR elements etc.
 *
 * @param {String} html Html string to trim contents on.
 * @return {String} Html contents that got trimmed.
 */
const trimHtml = (html: string) => {
  const trimSpaces = (all, s1, s2) => {
    // WebKit &nbsp; meant to preserve multiple spaces but instead inserted around all inline tags,
    // including the spans with inline styles created on paste
    if (!s1 && !s2) {
      return ' ';
    }

    return Unicode.nbsp;
  };

  html = filter(html, [
    /^[\s\S]*<body[^>]*>\s*|\s*<\/body[^>]*>[\s\S]*$/ig, // Remove anything but the contents within the BODY element
    /<!--StartFragment-->|<!--EndFragment-->/g, // Inner fragments (tables from excel on mac)
    [ /( ?)<span class="Apple-converted-space">\u00a0<\/span>( ?)/g, trimSpaces ],
    /<br class="Apple-interchange-newline">/g,
    /<br>$/i // Trailing BR elements
  ]);

  return html;
};

// TODO: Should be in some global class
const createIdGenerator = (prefix: string) => {
  let count = 0;

  return () => {
    return prefix + (count++);
  };
};

const getImageMimeType = (ext: string): string => {
  const lowerExt = ext.toLowerCase();
  const mimeOverrides = {
    jpg: 'jpeg',
    jpe: 'jpeg',
    jfi: 'jpeg',
    jif: 'jpeg',
    jfif: 'jpeg',
    pjpeg: 'jpeg',
    pjp: 'jpeg',
    svg: 'svg+xml'
  };
  return Tools.hasOwn(mimeOverrides, lowerExt) ? 'image/' + mimeOverrides[lowerExt] : 'image/' + lowerExt;
};

export {
  filter,
  innerText,
  trimHtml,
  createIdGenerator,
  getImageMimeType,
  keepStyles,
  parseExcel
};
