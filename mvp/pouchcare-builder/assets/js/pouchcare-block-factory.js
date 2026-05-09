(function (wp) {
  if (!wp || !wp.blocks || !wp.blockEditor || !wp.components || !wp.element) {
    return;
  }

  var el = wp.element.createElement;
  var __ = wp.i18n.__;
  var useBlockProps = wp.blockEditor.useBlockProps;
  var RichText = wp.blockEditor.RichText;
  var InspectorControls = wp.blockEditor.InspectorControls;
  var PanelBody = wp.components.PanelBody;
  var SelectControl = wp.components.SelectControl;
  var TextControl = wp.components.TextControl;
  var ToggleControl = wp.components.ToggleControl;

  function getClassNames(attributes, baseClass) {
    var classes = [baseClass || 'pouchcare-section'];

    if (attributes.hideMobile) classes.push('pc-hide-mobile');
    if (attributes.hideTablet) classes.push('pc-hide-tablet');
    if (attributes.hideDesktop) classes.push('pc-hide-desktop');

    return classes.join(' ');
  }

  function getStyles(attributes) {
    return {
      backgroundColor: attributes.backgroundColor || '#f8fafc',
      color: attributes.textColor || '#0f172a',
      textAlign: attributes.contentAlign || 'left',
      paddingTop: attributes.paddingTop || '48px',
      paddingBottom: attributes.paddingBottom || '48px'
    };
  }

  function blockEdit(props, config) {
    var attributes = props.attributes;
    var blockProps = useBlockProps({
      className: getClassNames(attributes, config.baseClass || 'pouchcare-section'),
      style: getStyles(attributes)
    });

    var hasButton = config.hasButton !== false;

    return el('div', {}, [
      el(InspectorControls, {},
        el('div', {}, [
          el(PanelBody, { title: __('Content', 'pouchcare-builder'), initialOpen: true }, [
            el(TextControl, {
              label: __('Title', 'pouchcare-builder'),
              value: attributes.title || '',
              onChange: function (value) { props.setAttributes({ title: value }); }
            }),
            el(TextControl, {
              label: __('Description', 'pouchcare-builder'),
              value: attributes.description || '',
              onChange: function (value) { props.setAttributes({ description: value }); }
            }),
            hasButton ? el(TextControl, {
              label: __('Button Text', 'pouchcare-builder'),
              value: attributes.ctaText || '',
              onChange: function (value) { props.setAttributes({ ctaText: value }); }
            }) : null
          ]),
          el(PanelBody, { title: __('Style', 'pouchcare-builder'), initialOpen: false }, [
            el(SelectControl, {
              label: __('Content Align', 'pouchcare-builder'),
              value: attributes.contentAlign || 'left',
              options: [
                { label: 'Left', value: 'left' },
                { label: 'Center', value: 'center' },
                { label: 'Right', value: 'right' }
              ],
              onChange: function (value) { props.setAttributes({ contentAlign: value }); }
            }),
            el(TextControl, {
              label: __('Background Color', 'pouchcare-builder'),
              help: __('Use HEX format like #f8fafc', 'pouchcare-builder'),
              value: attributes.backgroundColor || '#f8fafc',
              onChange: function (value) { props.setAttributes({ backgroundColor: value }); }
            }),
            el(TextControl, {
              label: __('Text Color', 'pouchcare-builder'),
              help: __('Use HEX format like #0f172a', 'pouchcare-builder'),
              value: attributes.textColor || '#0f172a',
              onChange: function (value) { props.setAttributes({ textColor: value }); }
            }),
            el(TextControl, {
              label: __('Padding Top', 'pouchcare-builder'),
              help: __('Examples: 48px, 4rem', 'pouchcare-builder'),
              value: attributes.paddingTop || '48px',
              onChange: function (value) { props.setAttributes({ paddingTop: value }); }
            }),
            el(TextControl, {
              label: __('Padding Bottom', 'pouchcare-builder'),
              help: __('Examples: 48px, 4rem', 'pouchcare-builder'),
              value: attributes.paddingBottom || '48px',
              onChange: function (value) { props.setAttributes({ paddingBottom: value }); }
            })
          ]),
          el(PanelBody, { title: __('Responsive Visibility', 'pouchcare-builder'), initialOpen: false }, [
            el(ToggleControl, {
              label: __('Hide on Mobile', 'pouchcare-builder'),
              checked: !!attributes.hideMobile,
              onChange: function (value) { props.setAttributes({ hideMobile: value }); }
            }),
            el(ToggleControl, {
              label: __('Hide on Tablet', 'pouchcare-builder'),
              checked: !!attributes.hideTablet,
              onChange: function (value) { props.setAttributes({ hideTablet: value }); }
            }),
            el(ToggleControl, {
              label: __('Hide on Desktop', 'pouchcare-builder'),
              checked: !!attributes.hideDesktop,
              onChange: function (value) { props.setAttributes({ hideDesktop: value }); }
            })
          ])
        ])
      ),
      el('section', blockProps, [
        el(RichText, {
          tagName: 'h2',
          value: attributes.title,
          placeholder: __('Section title', 'pouchcare-builder'),
          allowedFormats: [],
          onChange: function (value) { props.setAttributes({ title: value }); }
        }),
        el(RichText, {
          tagName: 'p',
          value: attributes.description,
          placeholder: __('Section description', 'pouchcare-builder'),
          onChange: function (value) { props.setAttributes({ description: value }); }
        }),
        hasButton ? el(RichText, {
          tagName: 'a',
          className: 'wp-element-button',
          value: attributes.ctaText,
          placeholder: __('Button text', 'pouchcare-builder'),
          allowedFormats: [],
          onChange: function (value) { props.setAttributes({ ctaText: value }); }
        }) : null
      ])
    ]);
  }

  function blockSave(props, config) {
    var attributes = props.attributes;
    var styles = getStyles(attributes);
    var hasButton = config.hasButton !== false;

    return el('section', {
      className: getClassNames(attributes, config.baseClass || 'pouchcare-section'),
      style: styles
    }, [
      el(RichText.Content, { tagName: 'h2', value: attributes.title }),
      el(RichText.Content, { tagName: 'p', value: attributes.description }),
      hasButton ? el(RichText.Content, { tagName: 'a', className: 'wp-element-button', value: attributes.ctaText }) : null
    ]);
  }

  window.PouchCareBlockFactory = {
    register: function (name, config) {
      wp.blocks.registerBlockType(name, {
        edit: function (props) { return blockEdit(props, config || {}); },
        save: function (props) { return blockSave(props, config || {}); }
      });
    }
  };
})(window.wp);
