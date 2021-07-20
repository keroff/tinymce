/**
 * Copyright (c) Tiny Technologies, Inc. All rights reserved.
 * Licensed under the LGPL or a commercial license.
 * For LGPL see License.txt in the project root for license information.
 * For commercial licenses see https://www.tiny.cloud/
 */

import Editor from 'tinymce/core/api/Editor';
import Env from 'tinymce/core/api/Env';

const isIE = Env.browser.isIE();

const setPrint = (frame: HTMLIFrameElement, html: string) => {

  let contentWindow : Window = frame.contentWindow;
  let contentDoc: Document = frame.contentWindow.document;

  if (isIE) {
    (contentDoc.firstChild as Element).innerHTML = html;
  } else {
    contentDoc.open("text/html", "replace");
    contentDoc.write(html);
    contentDoc.close();
  }

  contentWindow.onbeforeunload = () => document.body.removeChild(frame);
  contentWindow.onafterprint = () => document.body.removeChild(frame);

  if (isIE) {
    contentDoc.execCommand('print', false, null);
  } else {
    contentWindow.print();
  }
};

const printFragment = function (html: string) {
  let hiddenFrame: HTMLIFrameElement = document.createElement("iframe");
  hiddenFrame.onload = function () {
    setPrint(hiddenFrame, html);
  };
  hiddenFrame.style.visibility = 'hidden';
  hiddenFrame.style.position = 'absolute';
  hiddenFrame.style.width = '0';
  hiddenFrame.style.height = '0';
  document.body.appendChild(hiddenFrame);
};

const printIframeMode = (editor: Editor) => {
  if (isIE) {
    editor.getDoc().execCommand('print', false, null);
  } else {
    editor.getWin().print();
  }
};

const register = (editor: Editor) => {
  editor.addCommand('mcePrint', () => {
    if(editor.inline) {
      printFragment(editor.getBody().innerHTML);
    } else {
      printIframeMode(editor);
    }
  });
};

export {
  register
};
