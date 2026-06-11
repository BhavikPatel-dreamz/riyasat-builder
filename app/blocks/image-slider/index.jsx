// @ts-nocheck
// Image slider — parent (core/image-slider) + child slide
// (core/image-slider-item) using InnerBlocks. Authored against the kit's shared
// @wordpress runtime. Registered from ../index.ts inside registerBlocks().
import { useState, useEffect } from 'gutenberg-block-kit/wp/element';
import { registerBlockType } from 'gutenberg-block-kit/wp/blocks';
import {
  useBlockProps,
  InnerBlocks,
  InspectorControls,
  MediaUpload,
  MediaUploadCheck,
} from 'gutenberg-block-kit/wp/block-editor';
import {
  PanelBody,
  TextControl,
  ToggleControl,
  Button,
} from 'gutenberg-block-kit/wp/components';
import { useSelect } from 'gutenberg-block-kit/wp/data';
import { ActionBuilder } from 'gutenberg-block-kit/actions';
import {
  IMAGE_SLIDER_BLOCK,
  IMAGE_SLIDER_ITEM_BLOCK,
  RIYASAT_CATEGORY,
} from '../constants';

function ImageSliderIcon() {
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
        d="M3 6h4v12H3V6zm5 1h8v10H8V7zm9-1h4v12h-4V6z"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Child: core/image-slider-item — one slide (image + label + tap action)
// ---------------------------------------------------------------------------
function registerImageSliderItem() {
  registerBlockType(IMAGE_SLIDER_ITEM_BLOCK, {
    apiVersion: 3,
    title: 'Slider Item',
    description: 'A single slide: image, label and optional tap action.',
    category: RIYASAT_CATEGORY,
    parent: [IMAGE_SLIDER_BLOCK],
    icon: 'format-image',
    supports: { html: false, reusable: false },
    attributes: {
      imageUrl: { type: 'string', default: '' },
      label: { type: 'string', default: '' },
      action: { type: 'object', default: {} },
    },

    edit: ({ attributes, setAttributes }) => {
      const { imageUrl, label, action } = attributes;
      const blockProps = useBlockProps({
        className: 'riyasat-image-slider-item-editor',
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

            <PanelBody title="Label" initialOpen={true}>
              <TextControl
                label="Label"
                value={label}
                onChange={(value) => setAttributes({ label: value })}
              />
            </PanelBody>

            <PanelBody title="Action" initialOpen={true}>
              <ActionBuilder
                label="Tap action"
                value={action}
                onChange={(next) => setAttributes({ action: next })}
              />
            </PanelBody>
          </InspectorControls>

          <div {...blockProps}>
            {imageUrl ? (
              <MediaUploadCheck>
                <MediaUpload
                  onSelect={(media) => setAttributes({ imageUrl: media?.url ?? '' })}
                  allowedTypes={['image']}
                  render={({ open }) => (
                    <img
                      src={imageUrl}
                      alt=""
                      className="riyasat-image-slider-item-editor__image"
                      onClick={open}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') open();
                      }}
                      role="button"
                      tabIndex={0}
                    />
                  )}
                />
              </MediaUploadCheck>
            ) : (
              <MediaUploadCheck>
                <MediaUpload
                  onSelect={(media) => setAttributes({ imageUrl: media?.url ?? '' })}
                  allowedTypes={['image']}
                  render={({ open }) => (
                    <button
                      type="button"
                      className="riyasat-image-slider-item-editor__image-btn"
                      onClick={open}
                    >
                      Add image
                    </button>
                  )}
                />
              </MediaUploadCheck>
            )}
            <input
              type="text"
              className="riyasat-image-slider-item-editor__label"
              value={label}
              placeholder="Label…"
              onChange={(event) => setAttributes({ label: event.target.value })}
            />
          </div>
        </>
      );
    },

    save: ({ attributes }) => {
      const { imageUrl, label, action } = attributes;
      const blockProps = useBlockProps.save({
        className: 'riyasat-image-slider__slide',
        'data-action': JSON.stringify(action ?? {}),
      });
      return (
        <div {...blockProps}>
          {imageUrl ? (
            <img src={imageUrl} alt="" className="riyasat-image-slider__image" />
          ) : null}
          {label ? (
            <span className="riyasat-image-slider__label">{label}</span>
          ) : null}
        </div>
      );
    },
  });
}

// ---------------------------------------------------------------------------
// Parent: core/image-slider — title/subtitle + horizontal slides
// ---------------------------------------------------------------------------
function registerImageSliderParent() {
  registerBlockType(IMAGE_SLIDER_BLOCK, {
    apiVersion: 3,
    title: 'Image Slider',
    description: 'A titled, horizontally scrolling row of image slides.',
    category: RIYASAT_CATEGORY,
    icon: ImageSliderIcon,
    keywords: ['slider', 'scroller', 'images', 'products'],
    supports: { html: false, align: ['wide', 'full'] },
    attributes: {
      title: { type: 'string', default: '' },
      subTitle: { type: 'string', default: '' },
      showPagination: { type: 'boolean', default: true },
    },

    edit: ({ attributes, setAttributes, clientId }) => {
      const { title, subTitle, showPagination } = attributes;
      const blockProps = useBlockProps({ className: 'riyasat-image-slider-editor' });
      const [activeIndex, setActiveIndex] = useState(0);
      const slideCount = useSelect(
        (select) => select('core/block-editor').getBlockCount(clientId),
        [clientId],
      );

      useEffect(() => {
        if (slideCount <= 0) {
          setActiveIndex(0);
          return;
        }
        if (activeIndex > slideCount - 1) setActiveIndex(slideCount - 1);
      }, [activeIndex, slideCount]);

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
            <PanelBody title="Slider settings" initialOpen={true}>
              <ToggleControl
                label="Show pagination"
                checked={showPagination}
                onChange={(value) => setAttributes({ showPagination: value })}
              />
            </PanelBody>
          </InspectorControls>

          <div {...blockProps}>
            <div className="riyasat-image-slider">
              {(title || subTitle) && (
                <div className="riyasat-image-slider__heading">
                  {title ? (
                    <h3 className="riyasat-image-slider__title">{title}</h3>
                  ) : null}
                  {subTitle ? (
                    <p className="riyasat-image-slider__subtitle">{subTitle}</p>
                  ) : null}
                </div>
              )}

              <div className="riyasat-image-slider__track">
                <InnerBlocks
                  allowedBlocks={[IMAGE_SLIDER_ITEM_BLOCK]}
                  template={[
                    [IMAGE_SLIDER_ITEM_BLOCK, {}],
                    [IMAGE_SLIDER_ITEM_BLOCK, {}],
                  ]}
                  templateLock={false}
                  renderAppender={InnerBlocks.ButtonBlockAppender}
                  orientation="horizontal"
                />
              </div>

              {showPagination && slideCount > 1 ? (
                <div className="riyasat-image-slider__pagination">
                  {Array.from({ length: slideCount }).map((_, index) => (
                    <button
                      key={index}
                      type="button"
                      className={`riyasat-image-slider__dot${
                        index === activeIndex ? ' is-active' : ''
                      }`}
                      aria-label={`Go to slide ${index + 1}`}
                      onClick={() => setActiveIndex(index)}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </>
      );
    },

    save: ({ attributes }) => {
      const { title, subTitle, showPagination } = attributes;
      const blockProps = useBlockProps.save({
        className: 'riyasat-image-slider',
        'data-show-pagination': showPagination ? 'true' : 'false',
      });
      return (
        <div {...blockProps}>
          {(title || subTitle) && (
            <div className="riyasat-image-slider__heading">
              {title ? (
                <h3 className="riyasat-image-slider__title">{title}</h3>
              ) : null}
              {subTitle ? (
                <p className="riyasat-image-slider__subtitle">{subTitle}</p>
              ) : null}
            </div>
          )}
          <div className="riyasat-image-slider__track">
            <InnerBlocks.Content />
          </div>
          {showPagination ? (
            <div
              className="riyasat-image-slider__pagination"
              aria-hidden="true"
            />
          ) : null}
        </div>
      );
    },
  });
}

/**
 * Register the image-slider parent + slide child. Child registers first so the
 * parent's InnerBlocks template can reference it.
 */
export function registerImageSlider() {
  registerImageSliderItem();
  registerImageSliderParent();
}
