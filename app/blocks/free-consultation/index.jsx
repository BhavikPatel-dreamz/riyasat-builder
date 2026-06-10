// @ts-nocheck
// Free consultation — a single block (no InnerBlocks) with an image/video media
// picker and a CTA. Authored against the kit's shared @wordpress runtime;
// registered from ../index.ts.
import { registerBlockType } from 'gutenberg-block-kit/wp/blocks';
import {
  useBlockProps,
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
import { FREE_CONSULTATION_BLOCK, RIYASAT_CATEGORY } from '../constants';

const DEFAULT_BACKGROUND = '#f5f5f5';

function FreeConsultationIcon() {
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
        d="M4 4h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H8l-4 4V6a2 2 0 0 1 2-2zm6.5 4.2v5.6L15 11l-4.5-2.8z"
      />
    </svg>
  );
}

const isVideo = (media) =>
  typeof media?.type === 'string' && media.type.startsWith('video');

export function registerFreeConsultation() {
  registerBlockType(FREE_CONSULTATION_BLOCK, {
    apiVersion: 3,
    title: 'Free Consultation',
    description: 'A promo panel with image/video, copy and a call-to-action.',
    category: RIYASAT_CATEGORY,
    icon: FreeConsultationIcon,
    keywords: ['consultation', 'cta', 'promo', 'video'],
    supports: { html: false, align: ['wide', 'full'] },
    attributes: {
      title: { type: 'string', default: '' },
      subTitle: { type: 'string', default: '' },
      description: { type: 'string', default: '' },
      media: { type: 'object', default: {} },
      buttonText: { type: 'string', default: '' },
      backgroundColor: { type: 'string', default: DEFAULT_BACKGROUND },
      action: { type: 'object', default: {} },
    },

    edit: ({ attributes, setAttributes }) => {
      const {
        title,
        subTitle,
        description,
        media,
        buttonText,
        backgroundColor,
        action,
      } = attributes;
      const blockProps = useBlockProps({
        className: 'riyasat-free-consultation-editor',
      });
      const hasMedia = media && media.url;

      function onSelectMedia(selected) {
        setAttributes({
          media: { url: selected?.url ?? '', type: selected?.mime ?? '' },
        });
      }

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
              <TextareaControl
                label="Description"
                value={description}
                rows={4}
                onChange={(value) => setAttributes({ description: value })}
              />
            </PanelBody>

            <PanelBody title="Media (image or video)" initialOpen={true}>
              <MediaUploadCheck>
                <MediaUpload
                  onSelect={onSelectMedia}
                  allowedTypes={['image', 'video']}
                  render={({ open }) => (
                    <div>
                      <Button
                        onClick={open}
                        variant="secondary"
                        style={{ width: '100%', justifyContent: 'center' }}
                      >
                        {hasMedia ? 'Change Media' : 'Add Media'}
                      </Button>
                      {hasMedia ? (
                        <>
                          <p
                            style={{
                              margin: '6px 0 0',
                              fontSize: '12px',
                              color: '#666',
                              wordBreak: 'break-all',
                            }}
                          >
                            {media.type || 'media'}
                          </p>
                          <Button
                            onClick={() => setAttributes({ media: {} })}
                            variant="link"
                            isDestructive
                            style={{ marginTop: '4px' }}
                          >
                            Remove Media
                          </Button>
                        </>
                      ) : null}
                    </div>
                  )}
                />
              </MediaUploadCheck>
            </PanelBody>

            <PanelBody title="Button" initialOpen={false}>
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
              className="riyasat-free-consultation"
              style={{
                background: backgroundColor,
                display: 'flex',
                gap: '24px',
                alignItems: 'center',
                flexWrap: 'wrap',
                padding: '24px',
                borderRadius: '8px',
              }}
            >
              <div style={{ flex: '1 1 240px', minWidth: '200px' }}>
                {hasMedia ? (
                  isVideo(media) ? (
                    <video
                      src={media.url}
                      controls
                      style={{
                        width: '100%',
                        borderRadius: '8px',
                        display: 'block',
                      }}
                    />
                  ) : (
                    <img
                      src={media.url}
                      alt=""
                      style={{
                        width: '100%',
                        borderRadius: '8px',
                        display: 'block',
                        objectFit: 'cover',
                      }}
                    />
                  )
                ) : (
                  <MediaUploadCheck>
                    <MediaUpload
                      onSelect={onSelectMedia}
                      allowedTypes={['image', 'video']}
                      render={({ open }) => (
                        <button
                          type="button"
                          onClick={open}
                          style={{
                            width: '100%',
                            minHeight: '200px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            color: '#fff',
                            background: '#2a2a4a',
                            border: 'none',
                            borderRadius: '8px',
                          }}
                        >
                          Add image or video
                        </button>
                      )}
                    />
                  </MediaUploadCheck>
                )}
              </div>

              <div style={{ flex: '1 1 240px', minWidth: '200px' }}>
                {subTitle ? (
                  <p
                    className="riyasat-free-consultation__subtitle"
                    style={{ margin: '0 0 4px', color: '#888', fontSize: '13px' }}
                  >
                    {subTitle}
                  </p>
                ) : null}
                {title ? (
                  <h3
                    className="riyasat-free-consultation__title"
                    style={{ margin: '0 0 12px', fontSize: '22px', fontWeight: 700 }}
                  >
                    {title}
                  </h3>
                ) : null}
                {description ? (
                  <p
                    className="riyasat-free-consultation__description"
                    style={{ margin: '0 0 16px', lineHeight: 1.6, color: '#444' }}
                  >
                    {description}
                  </p>
                ) : null}
                {buttonText ? (
                  <span
                    className="riyasat-free-consultation__button"
                    style={{
                      display: 'inline-block',
                      padding: '12px 28px',
                      background: '#1a1a2e',
                      color: '#fff',
                      borderRadius: '6px',
                      fontWeight: 600,
                      fontSize: '14px',
                    }}
                  >
                    {buttonText}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </>
      );
    },

    save: ({ attributes }) => {
      const {
        title,
        subTitle,
        description,
        media,
        buttonText,
        backgroundColor,
        action,
      } = attributes;
      const blockProps = useBlockProps.save({
        className: 'riyasat-free-consultation',
        'data-media': JSON.stringify(media ?? {}),
        'data-action': JSON.stringify(action ?? {}),
        'data-background-color': backgroundColor,
        style: { background: backgroundColor },
      });
      return (
        <div {...blockProps}>
          {subTitle ? (
            <p className="riyasat-free-consultation__subtitle">{subTitle}</p>
          ) : null}
          {title ? (
            <h3 className="riyasat-free-consultation__title">{title}</h3>
          ) : null}
          {description ? (
            <p className="riyasat-free-consultation__description">{description}</p>
          ) : null}
          {buttonText ? (
            <span className="riyasat-free-consultation__button">{buttonText}</span>
          ) : null}
        </div>
      );
    },
  });
}
