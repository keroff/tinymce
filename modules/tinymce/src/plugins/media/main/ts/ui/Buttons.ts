/**
 * Copyright (c) Tiny Technologies, Inc. All rights reserved.
 * Licensed under the LGPL or a commercial license.
 * For LGPL see License.txt in the project root for license information.
 * For commercial licenses see https://www.tiny.cloud/
 */

import Editor from 'tinymce/core/api/Editor';

import { isMediaElement } from '../core/Selection';

const register = (editor: Editor): void => {
  const onAction = () => editor.execCommand('mceMedia');

  editor.ui.registry.addToggleButton('media', {
    tooltip: 'Insert/edit media',
    icon: 'embed',
    onAction,
    onSetup: (buttonApi) => {
      const selection = editor.selection;
      buttonApi.setActive(isMediaElement(selection.getNode()));
      return selection.selectorChangedWithUnbind('img[data-mce-object],span[data-mce-object],div[data-ephox-embed-iri]', buttonApi.setActive).unbind;
    }
  });

  editor.ui.registry.addMenuItem('media', {
    icon: 'embed',
    text: 'Media...',
    onAction
  });
};

export {
  register
};
