// @ts-nocheck
// Editor's Pick — parent (core/editors-pick) + child card
// (core/editors-pick-item) using InnerBlocks. Authored against the kit's shared
// @wordpress runtime; registered from ../index.ts.
import { registerBlockType } from 'gutenberg-block-kit/wp/blocks';
import {
  useBlockProps,
  InnerBlocks,
  InspectorControls,
  PanelColorSettings,
  MediaUpload,
  MediaUploadCheck,
} from 'gutenberg-block-kit/wp/block-editor';
import {
  PanelBody,
  TextControl,
  TextareaControl,
  Button,
} from 'gutenberg-block-kit/wp/components';
import { ActionBuilder } from 'gutenberg-block-kit/actions';
import {
  EDITORS_PICK_BLOCK,
  EDITORS_PICK_ITEM_BLOCK,
  RIYASAT_CATEGORY,
} from '../constants';

const DEFAULT_BACKGROUND = '#f5f5f5';

function EditorsPickIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width="24"
      height="24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="currentColor"
        d="M12 2l2.9 6 6.6.5-5 4.3 1.5 6.4L12 16.9 5.9 19.2 7.4 12.8l-5-4.3L9 8z"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Child: core/editors-pick-item — one card (image + title + desc + CTA)
// ---------------------------------------------------------------------------
function registerEditorsPickItem() {
  registerBlockType(EDITORS_PICK_ITEM_BLOCK, {
    apiVersion: 3,
    title: "Editor's Pick Card",
    description: 'A single card: image, title, description and a call-to-action.',
    category: RIYASAT_CATEGORY,
    parent: [EDITORS_PICK_BLOCK],
    icon: 'format-image',
    supports: { html: false, reusable: false },
    attributes: {
      title: { type: 'string', default: '' },
      description: { type: 'string', default: '' },
      imageUrl: { type: 'string', default: '' },
      buttonText: { type: 'string', default: '' },
      action: { type: 'object', default: {} },
    },

    edit: ({ attributes, setAttributes }) => {
      const { title, description, imageUrl, buttonText, action } = attributes;
      const blockProps = useBlockProps({
        className: 'riyasat-editors-pick-item-editor',
      });

      return (
        <>
          <InspectorControls>
            <PanelBody title="Image" initialOpen={true}>
              <MediaUploadCheck>
                <MediaUpload
                  onSelect={(media) => setAttributes({ imageUrl: media?.url ?? '' })}
                  allowedTypes={['image']}
                  render={({ open }) => (
                    <div>
                      {imageUrl ? (
                        <div
                          onClick={open}
                          style={{
                            marginBottom: '8px',
                            borderRadius: '6px',
                            overflow: 'hidden',
                            cursor: 'pointer',
                            border: '1px solid #ddd',
                          }}
                        >
                          <img
                            src={imageUrl}
                            alt=""
                            style={{
                              width: '100%',
                              height: '80px',
                              objectFit: 'cover',
                              display: 'block',
                            }}
                          />
                        </div>
                      ) : null}
                      <Button
                        onClick={open}
                        variant="secondary"
                        style={{ width: '100%', justifyContent: 'center' }}
                      >
                        {imageUrl ? 'Change Image' : 'Add Image'}
                      </Button>
                      {imageUrl ? (
                        <Button
                          onClick={() => setAttributes({ imageUrl: '' })}
                          variant="link"
                          isDestructive
                          style={{ marginTop: '4px' }}
                        >
                          Remove Image
                        </Button>
                      ) : null}
                    </div>
                  )}
                />
              </MediaUploadCheck>
            </PanelBody>

            <PanelBody title="Content" initialOpen={true}>
              <TextControl
                label="Title"
                value={title}
                onChange={(value) => setAttributes({ title: value })}
              />
              <TextareaControl
                label="Description"
                value={description}
                rows={3}
                onChange={(value) => setAttributes({ description: value })}
              />
              <TextControl
                label="Button text"
                value={buttonText}
                onChange={(value) => setAttributes({ buttonText: value })}
              />
              <ActionBuilder
                label="Button action"
                value={action}
                onChange={(next) => setAttributes({ action: next })}
              />
            </PanelBody>
          </InspectorControls>

          <div
            {...blockProps}
            style={{
              width: '220px',
              flexShrink: 0,
              background: '#fff',
              borderRadius: '8px',
              overflow: 'hidden',
              border: '1px solid rgba(0,0,0,0.08)',
            }}
          >
            {imageUrl ? (
              <img
                src={imageUrl}
                alt=""
                style={{
                  width: '100%',
                  height: '200px',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
            ) : (
              <MediaUploadCheck>
                <MediaUpload
                  onSelect={(media) => setAttributes({ imageUrl: media?.url ?? '' })}
                  allowedTypes={['image']}
                  render={({ open }) => (
                    <button
                      type="button"
                      onClick={open}
                      style={{
                        width: '100%',
                        height: '200px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: '#fff',
                        background: '#2a2a4a',
                        border: 'none',
                      }}
                    >
                      Add image
                    </button>
                  )}
                />
              </MediaUploadCheck>
            )}
            <div style={{ padding: '12px' }}>
              <TextControl
                label=""
                value={title}
                placeholder="Title…"
                onChange={(value) => setAttributes({ title: value })}
              />
              <TextareaControl
                label=""
                value={description}
                rows={2}
                placeholder="Description…"
                onChange={(value) => setAttributes({ description: value })}
              />
              {buttonText ? (
                <span
                  style={{
                    display: 'inline-block',
                    marginTop: '8px',
                    padding: '8px 18px',
                    background: '#1a1a2e',
                    color: '#fff',
                    borderRadius: '6px',
                    fontWeight: 600,
                    fontSize: '13px',
                  }}
                >
                  {buttonText}
                </span>
              ) : null}
            </div>
          </div>
        </>
      );
    },

    save: ({ attributes }) => {
      const { title, description, imageUrl, buttonText, action } = attributes;
      const blockProps = useBlockProps.save({
        className: 'riyasat-editors-pick__item',
        'data-action': JSON.stringify(action ?? {}),
      });
      return (
        <div {...blockProps}>
          {imageUrl ? (
            <img src={imageUrl} alt="" className="riyasat-editors-pick__image" />
          ) : null}
          {title ? (
            <h4 className="riyasat-editors-pick__item-title">{title}</h4>
          ) : null}
          {description ? (
            <p className="riyasat-editors-pick__item-description">{description}</p>
          ) : null}
          {buttonText ? (
            <span className="riyasat-editors-pick__item-button">{buttonText}</span>
          ) : null}
        </div>
      );
    },
  });
}

// ---------------------------------------------------------------------------
// Parent: core/editors-pick — heading + row of cards
// ---------------------------------------------------------------------------
function registerEditorsPickParent() {
  registerBlockType(EDITORS_PICK_BLOCK, {
    apiVersion: 3,
    title: "Editor's Pick",
    description: 'A titled row of editorial cards on a colored background.',
    category: RIYASAT_CATEGORY,
    icon: EditorsPickIcon,
    keywords: ['editors', 'pick', 'curated', 'cards'],
    supports: { html: false, align: ['wide', 'full'] },
    attributes: {
      title: { type: 'string', default: '' },
      subTitle: { type: 'string', default: '' },
      backgroundColor: { type: 'string', default: DEFAULT_BACKGROUND },
      action: { type: 'object', default: {} },
    },

    edit: ({ attributes, setAttributes }) => {
      const { title, subTitle, backgroundColor, action } = attributes;
      const blockProps = useBlockProps({ className: 'riyasat-editors-pick-editor' });

      return (
        <>
          <InspectorControls>
            <PanelBody title="Heading" initialOpen={true}>
              <TextControl
                label="Title"
                value={title}
                onChange={(value) => setAttributes({ title: value })}
              />
              <TextControl
                label="Subtitle"
                value={subTitle}
                onChange={(value) => setAttributes({ subTitle: value })}
              />
            </PanelBody>

            <PanelBody title="Section action" initialOpen={false}>
              <ActionBuilder
                label="Action"
                value={action}
                onChange={(next) => setAttributes({ action: next })}
              />
            </PanelBody>

            <PanelColorSettings
              title="Colors"
              colorSettings={[
                {
                  label: 'Background color',
                  value: backgroundColor,
                  onChange: (value) =>
                    setAttributes({ backgroundColor: value || DEFAULT_BACKGROUND }),
                },
              ]}
            />
          </InspectorControls>

          <div {...blockProps}>
            <div
              className="riyasat-editors-pick"
              style={{
                background: backgroundColor,
                padding: '24px',
                borderRadius: '8px',
              }}
            >
              <div className="riyasat-editors-pick__heading">
                {subTitle ? (
                  <p
                    className="riyasat-editors-pick__subtitle"
                    style={{ margin: '0 0 4px', color: '#888', fontSize: '13px' }}
                  >
                    {subTitle}
                  </p>
                ) : null}
                {title ? (
                  <h3
                    className="riyasat-editors-pick__title"
                    style={{ margin: '0 0 16px', fontSize: '22px', fontWeight: 700 }}
                  >
                    {title}
                  </h3>
                ) : null}
              </div>

              <div
                className="riyasat-editors-pick__track"
                style={{ display: 'flex', gap: '16px', overflowX: 'auto' }}
              >
                <InnerBlocks
                  allowedBlocks={[EDITORS_PICK_ITEM_BLOCK]}
                  template={[
                    [EDITORS_PICK_ITEM_BLOCK, {}],
                    [EDITORS_PICK_ITEM_BLOCK, {}],
                  ]}
                  templateLock={false}
                  renderAppender={InnerBlocks.ButtonBlockAppender}
                  orientation="horizontal"
                />
              </div>
            </div>
          </div>
        </>
      );
    },

    save: ({ attributes }) => {
      const { title, subTitle, backgroundColor, action } = attributes;
      const blockProps = useBlockProps.save({
        className: 'riyasat-editors-pick',
        'data-background-color': backgroundColor,
        'data-action': JSON.stringify(action ?? {}),
        style: { background: backgroundColor },
      });
      return (
        <div {...blockProps}>
          <div className="riyasat-editors-pick__heading">
            {subTitle ? (
              <p className="riyasat-editors-pick__subtitle">{subTitle}</p>
            ) : null}
            {title ? (
              <h3 className="riyasat-editors-pick__title">{title}</h3>
            ) : null}
          </div>
          <div className="riyasat-editors-pick__track">
            <InnerBlocks.Content />
          </div>
        </div>
      );
    },
  });
}

/**
 * Register the editor's-pick parent + card child. Child registers first so the
 * parent's InnerBlocks template can reference it.
 */
export function registerEditorsPick() {
  registerEditorsPickItem();
  registerEditorsPickParent();
}
