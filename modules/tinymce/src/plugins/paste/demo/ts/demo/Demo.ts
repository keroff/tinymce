/* eslint-disable no-console */
declare let tinymce: any;

tinymce.init({
  selector: 'textarea.tinymce',
  theme: 'silver',
  skin_url: '../../../../../js/tinymce/skins/ui/oxide',
  plugins: 'paste code image',
  paste_data_images: true,
  toolbar: 'undo redo | pastetext code | image',
  init_instance_callback: (editor) => {
    editor.on('PastePreProcess', (evt) => {
      console.log(evt);
    });

    editor.on('PastePostProcess', (evt) => {
      console.log(evt);
    });
  },
  height: 600
});

export {};
