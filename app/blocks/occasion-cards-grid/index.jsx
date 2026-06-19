// @ts-nocheck
// Occasion Cards Grid — parent (core/occasion-cards-grid) + child card
// (core/occasion-card-item) using InnerBlocks.
import { registerBlockType, createBlock } from 'gutenberg-block-kit/wp/blocks';
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
  SelectControl,
  Button,
} from 'gutenberg-block-kit/wp/components';
import { ActionBuilder } from 'gutenberg-block-kit/actions';
import { contentTabStyle, ImagePicker, useChildBlocks } from '../inspector-shared';
import {
  OCCASION_CARDS_GRID_BLOCK,
  OCCASION_CARD_ITEM_BLOCK,
  RIYASAT_CATEGORY,
} from '../constants';

const DEFAULT_BACKGROUND = '#F5F2EE';

const IMAGE_POSITION_OPTIONS = [
  { label: 'Left', value: 'left' },
  { label: 'Right', value: 'right' },
];

function OccasionCardsGridIcon() {
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
        d="M3 4h8v8H3V4zm10 0h8v5h-8V4zM3 14h8v6H3v-6zm10 3h8v3h-8v-3z"
      />
    </svg>
  );
}

function OccasionCardFields({ attributes, onChange }) {
  const {
    imageUrl,
    title,
    description,
    buttonText,
    action,
    imagePosition,
  } = attributes;

  return (
    <>
      <ImagePicker
        imageUrl={imageUrl}
        onSelect={(url) => onChange({ imageUrl: url })}
        onClear={() => onChange({ imageUrl: '' })}
      />
      <TextControl
        label="Title"
        value={title}
        onChange={(value) => onChange({ title: value })}
      />
      <TextareaControl
        label="Description"
        value={description}
        rows={3}
        onChange={(value) => onChange({ description: value })}
      />
      <TextControl
        label="Button text"
        value={buttonText}
        onChange={(value) => onChange({ buttonText: value })}
      />
      <SelectControl
        label="Image position"
        value={imagePosition || 'right'}
        options={IMAGE_POSITION_OPTIONS}
        onChange={(value) => onChange({ imagePosition: value })}
      />
      <ActionBuilder
        label="Button action"
        value={action ?? {}}
        onChange={(next) => onChange({ action: next })}
      />
    </>
  );
}

function OccasionCardPreview({ attributes, setAttributes }) {
  const {
    imageUrl,
    title,
    description,
    buttonText,
    imagePosition,
  } = attributes;
  const position = imagePosition || 'right';

  return (
    <div
      className="riyasat-occasion-card-item-editor__card"
      data-image-position={position}
    >
      <div className="riyasat-occasion-card-item-editor__media">
        {imageUrl ? (
          <MediaUploadCheck>
            <MediaUpload
              onSelect={(media) => setAttributes({ imageUrl: media?.url ?? '' })}
              allowedTypes={['image']}
              render={({ open }) => (
                <img
                  src={imageUrl}
                  alt=""
                  className="riyasat-occasion-card-item-editor__image"
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
                  className="riyasat-occasion-card-item-editor__image-btn"
                  onClick={open}
                >
                  Add image
                </button>
              )}
            />
          </MediaUploadCheck>
        )}
      </div>

      <div className="riyasat-occasion-card-item-editor__body">
        <input
          type="text"
          className="riyasat-occasion-card-item-editor__field"
          value={title}
          placeholder="Card title…"
          onChange={(event) => setAttributes({ title: event.target.value })}
        />
        <textarea
          className="riyasat-occasion-card-item-editor__field riyasat-occasion-card-item-editor__field--description"
          value={description}
          placeholder="Description…"
          rows={3}
          onChange={(event) => setAttributes({ description: event.target.value })}
        />
        <input
          type="text"
          className="riyasat-occasion-card-item-editor__field riyasat-occasion-card-item-editor__field--button"
          value={buttonText}
          placeholder="Button text…"
          onChange={(event) => setAttributes({ buttonText: event.target.value })}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Child: core/occasion-card-item
// ---------------------------------------------------------------------------
function registerOccasionCardItem() {
  registerBlockType(OCCASION_CARD_ITEM_BLOCK, {
    apiVersion: 3,
    title: 'Occasion Card',
    description: 'A card with image, copy, CTA and alternating image position.',
    category: RIYASAT_CATEGORY,
    parent: [OCCASION_CARDS_GRID_BLOCK],
    icon: 'format-image',
    supports: { html: false, reusable: false },
    attributes: {
      imageUrl: { type: 'string', default: '' },
      title: { type: 'string', default: '' },
      description: { type: 'string', default: '' },
      buttonText: { type: 'string', default: '' },
      action: { type: 'object', default: {} },
      imagePosition: { type: 'string', default: 'right' },
    },

    edit: ({ attributes, setAttributes }) => {
      const blockProps = useBlockProps({
        className: 'riyasat-occasion-card-item-editor',
      });

      return (
        <>
          <InspectorControls group="content">
            <div style={contentTabStyle}>
              <PanelBody title="Card" initialOpen={true}>
                <OccasionCardFields
                  attributes={attributes}
                  onChange={(next) => setAttributes(next)}
                />
              </PanelBody>
            </div>
          </InspectorControls>

          <div {...blockProps}>
            <OccasionCardPreview attributes={attributes} setAttributes={setAttributes} />
          </div>
        </>
      );
    },

    save: ({ attributes }) => {
      const {
        imageUrl,
        title,
        description,
        buttonText,
        action,
        imagePosition,
      } = attributes;
      const position = imagePosition || 'right';

      const blockProps = useBlockProps.save({
        className: 'riyasat-occasion-cards-grid__card',
        'data-image-position': position,
        'data-action': JSON.stringify(action ?? {}),
      });

      return (
        <div {...blockProps}>
          {imageUrl ? (
            <img
              src={imageUrl}
              alt=""
              className="riyasat-occasion-cards-grid__image"
            />
          ) : null}
          <div className="riyasat-occasion-cards-grid__body">
            {title ? (
              <h3 className="riyasat-occasion-cards-grid__card-title">{title}</h3>
            ) : null}
            {description ? (
              <p className="riyasat-occasion-cards-grid__description">{description}</p>
            ) : null}
            {buttonText ? (
              <span className="riyasat-occasion-cards-grid__button">{buttonText}</span>
            ) : null}
          </div>
        </div>
      );
    },
  });
}

// ---------------------------------------------------------------------------
// Parent: core/occasion-cards-grid
// ---------------------------------------------------------------------------
function registerOccasionCardsGridParent() {
  registerBlockType(OCCASION_CARDS_GRID_BLOCK, {
    apiVersion: 3,
    title: 'Occasion Cards Grid',
    description: 'Stacked occasion cards with alternating image left/right layout.',
    category: RIYASAT_CATEGORY,
    icon: OccasionCardsGridIcon,
    keywords: ['occasion', 'cards', 'grid', 'wedding'],
    supports: { html: false, align: ['wide', 'full'] },
    attributes: {
      title: { type: 'string', default: '' },
      subTitle: { type: 'string', default: '' },
      backgroundColor: { type: 'string', default: DEFAULT_BACKGROUND },
    },

    edit: ({ attributes, setAttributes, clientId }) => {
      const { title, subTitle, backgroundColor } = attributes;
      const blockProps = useBlockProps({ className: 'riyasat-occasion-cards-grid-editor' });
      const { childBlocks, childCount, insertBlock, removeBlock, updateBlockAttributes } =
        useChildBlocks(clientId);

      return (
        <>
          <InspectorControls group="content">
            <div style={contentTabStyle}>
              <PanelBody title="Heading" initialOpen={true}>
                <TextControl
                  label="Main Title"
                  value={title}
                  onChange={(value) => setAttributes({ title: value })}
                />
                <TextControl
                  label="Sub Title"
                  value={subTitle}
                  onChange={(value) => setAttributes({ subTitle: value })}
                />
              </PanelBody>

              {childBlocks.map((block, index) => {
                const cardTitle = block.attributes.title;
                return (
                  <PanelBody
                    key={block.clientId}
                    title={`Card ${index + 1}${cardTitle ? `: ${cardTitle}` : ''}`}
                    initialOpen={false}
                  >
                    <OccasionCardFields
                      attributes={block.attributes}
                      onChange={(next) => updateBlockAttributes(block.clientId, next)}
                    />
                    {childCount > 1 ? (
                      <Button
                        onClick={() => removeBlock(block.clientId)}
                        variant="link"
                        isDestructive
                        style={{ marginTop: '8px' }}
                      >
                        Remove card
                      </Button>
                    ) : null}
                  </PanelBody>
                );
              })}

              <Button
                variant="primary"
                onClick={() =>
                  insertBlock(
                    createBlock(OCCASION_CARD_ITEM_BLOCK, {
                      imagePosition: childCount % 2 === 0 ? 'right' : 'left',
                    }),
                    childCount,
                    clientId,
                  )
                }
                style={{ width: '100%', justifyContent: 'center' }}
              >
                Add card
              </Button>
            </div>
          </InspectorControls>

          <InspectorControls>
            <PanelBody title="Settings" initialOpen={true}>
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
            </PanelBody>
          </InspectorControls>

          <div {...blockProps}>
            <div
              className="riyasat-occasion-cards-grid"
              style={{ background: backgroundColor }}
            >
              <header className="riyasat-occasion-cards-grid__heading">
                  {title ? (
                  <h2 className="riyasat-occasion-cards-grid__title">{title}</h2>
                ) : null}
                {subTitle ? (
                  <p className="riyasat-occasion-cards-grid__subtitle">{subTitle}</p>
                ) : null}
              </header>

              <div className="riyasat-occasion-cards-grid__list">
                <InnerBlocks
                  allowedBlocks={[OCCASION_CARD_ITEM_BLOCK]}
                  template={[
                    [OCCASION_CARD_ITEM_BLOCK, { imagePosition: 'right' }],
                    [OCCASION_CARD_ITEM_BLOCK, { imagePosition: 'left' }],
                    [OCCASION_CARD_ITEM_BLOCK, { imagePosition: 'right' }],
                  ]}
                  templateLock={false}
                  renderAppender={false}
                />
              </div>
            </div>
          </div>
        </>
      );
    },

    save: ({ attributes }) => {
      const { title, subTitle, backgroundColor } = attributes;
      const blockProps = useBlockProps.save({
        className: 'riyasat-occasion-cards-grid',
        style: { background: backgroundColor || DEFAULT_BACKGROUND },
      });

      return (
        <div {...blockProps}>
          <header className="riyasat-occasion-cards-grid__heading">
            {title ? <h2 className="riyasat-occasion-cards-grid__title">{title}</h2> : null}
            {subTitle ? (
              <p className="riyasat-occasion-cards-grid__subtitle">{subTitle}</p>
            ) : null}
          </header>
          <div className="riyasat-occasion-cards-grid__list">
            <InnerBlocks.Content />
          </div>
        </div>
      );
    },
  });
}

export function registerOccasionCardsGrid() {
  registerOccasionCardItem();
  registerOccasionCardsGridParent();
}
