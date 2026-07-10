// @ts-nocheck
// Standard Search Bar — single block (standard/search-bar).
import { registerBlockType } from 'gutenberg-block-kit/wp/blocks';
import { useState, useEffect } from 'gutenberg-block-kit/wp/element';
import {
  useBlockProps,
  InspectorControls,
  PanelColorSettings,
  MediaUpload,
  MediaUploadCheck,
} from 'gutenberg-block-kit/wp/block-editor';
import { PanelBody, TextControl, Button } from 'gutenberg-block-kit/wp/components';
import { ActionBuilder } from 'gutenberg-block-kit/actions';
import { contentTabStyle } from '../inspector-shared';
import { STANDARD_SEARCH_BAR_BLOCK, RIYASAT_CATEGORY } from '../constants';

const DEFAULT_BACKGROUND = '#ffffff';
const DEFAULT_BORDER = '#00000';
const DEFAULT_INPUT_BACKGROUND = '#FFFFFF';

const DEFAULT_PLACEHOLDERS = [
  { text: 'Search for Lehenga Cholis' },
  { text: 'Search for साड़ी' },
  { text: 'Search for Men Sherwani' },
];

const TYPE_SPEED_MS = 70;
const DELETE_SPEED_MS = 45;
const PAUSE_FULL_MS = 1800;
const PAUSE_EMPTY_MS = 250;

function placeholderTexts(placeholders) {
  const items = Array.isArray(placeholders) ? placeholders : [];
  return items
    .map((item) => (typeof item?.text === 'string' ? item.text.trim() : ''))
    .filter(Boolean);
}

function useTypewriterPlaceholders(placeholders) {
  const texts = placeholderTexts(placeholders);
  const [textIndex, setTextIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setTextIndex(0);
    setCharIndex(0);
    setIsDeleting(false);
  }, [JSON.stringify(texts)]);

  useEffect(() => {
    if (texts.length === 0) return undefined;

    const safeIndex = textIndex % texts.length;
    const currentText = texts[safeIndex] ?? '';
    let delay = TYPE_SPEED_MS;

    if (!isDeleting) {
      if (charIndex < currentText.length) {
        delay = TYPE_SPEED_MS;
      } else {
        delay = PAUSE_FULL_MS;
      }
    } else if (charIndex > 0) {
      delay = DELETE_SPEED_MS;
    } else {
      delay = PAUSE_EMPTY_MS;
    }

    const timer = window.setTimeout(() => {
      if (!isDeleting) {
        if (charIndex < currentText.length) {
          setCharIndex(charIndex + 1);
          return;
        }
        setIsDeleting(true);
        return;
      }

      if (charIndex > 0) {
        setCharIndex(charIndex - 1);
        return;
      }

      setIsDeleting(false);
      setTextIndex((safeIndex + 1) % texts.length);
    }, delay);

    return () => window.clearTimeout(timer);
  }, [texts, textIndex, charIndex, isDeleting]);

  if (texts.length === 0) return 'Search';

  const safeIndex = textIndex % texts.length;
  return texts[safeIndex].slice(0, charIndex);
}

function SearchBarIcon() {
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
        d="M10.5 3a7.5 7.5 0 0 1 5.92 12.09l4.1 4.1-1.41 1.41-4.1-4.1A7.5 7.5 0 1 1 10.5 3zm0 2a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11z"
      />
    </svg>
  );
}

function PlaceholdersRepeater({ placeholders, onChange }) {
  const items = Array.isArray(placeholders) ? placeholders : [];

  function updatePlaceholder(index, patch) {
    const next = items.map((item, i) =>
      i === index ? { ...(item || {}), ...patch } : { ...(item || {}) },
    );
    onChange(next);
  }

  function addPlaceholder() {
    onChange([...items.map((item) => ({ ...(item || {}) })), { text: '' }]);
  }

  function removePlaceholder(index) {
    onChange(items.filter((_, i) => i !== index).map((item) => ({ ...(item || {}) })));
  }

  return (
    <PanelBody title="Placeholders" initialOpen={true}>
      {items.map((placeholder, index) => (
        <div
          key={`placeholder-${index}`}
          style={{
            marginBottom: '16px',
            paddingBottom: '12px',
            borderBottom: '1px solid #e5e7eb',
          }}
        >
          <p
            style={{
              margin: '0 0 10px',
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              color: '#6b7280',
            }}
          >
            Placeholder {index + 1}
          </p>
          <TextControl
            id={`search-bar-placeholder-${index}-text`}
            label="Text"
            value={placeholder?.text ?? ''}
            onChange={(value) => updatePlaceholder(index, { text: value })}
          />
          <Button
            onClick={() => removePlaceholder(index)}
            variant="link"
            isDestructive
            style={{ marginTop: '4px' }}
          >
            Remove placeholder
          </Button>
        </div>
      ))}
      <Button
        variant="secondary"
        onClick={addPlaceholder}
        style={{ width: '100%', justifyContent: 'center' }}
      >
        Add placeholder
      </Button>
    </PanelBody>
  );
}

function SearchBarPreview({
  backgroundColor,
  borderColor,
  inputBackgroundColor,
  icon,
  placeholders,
}) {
  const animatedText = useTypewriterPlaceholders(placeholders);

  return (
    <div
      className="riyasat-search-bar__shell"
      style={{
        background: backgroundColor || DEFAULT_BACKGROUND,
        border: `1px solid ${borderColor || DEFAULT_BORDER}`,
      }}
    >
      {icon ? (
        <img src={icon} alt="" className="riyasat-search-bar__icon" />
      ) : (
        <span className="riyasat-search-bar__icon-placeholder" aria-hidden="true">
          <SearchBarIcon />
        </span>
      )}
      <div
        className="riyasat-search-bar__input"
        style={{ background: inputBackgroundColor || DEFAULT_INPUT_BACKGROUND }}
      >
        <span className="riyasat-search-bar__placeholder-text">{animatedText}</span>
      </div>
    </div>
  );
}

export function registerStandardSearchBar() {
  registerBlockType(STANDARD_SEARCH_BAR_BLOCK, {
    apiVersion: 3,
    title: 'Search Bar',
    description: 'Search bar with icon, rotating placeholders, and action.',
    category: RIYASAT_CATEGORY,
    icon: SearchBarIcon,
    keywords: ['search', 'bar', 'input', 'placeholder'],
    supports: { html: false, align: ['wide', 'full'] },
    attributes: {
      backgroundColor: { type: 'string', default: DEFAULT_BACKGROUND },
      borderColor: { type: 'string', default: DEFAULT_BORDER },
      inputBackgroundColor: { type: 'string', default: DEFAULT_INPUT_BACKGROUND },
      icon: { type: 'string', default: '' },
      placeholders: {
        type: 'array',
        default: DEFAULT_PLACEHOLDERS.map((item) => ({ ...item })),
      },
      action: { type: 'object', default: {} },
    },

    edit: ({ attributes, setAttributes }) => {
      const {
        backgroundColor,
        borderColor,
        inputBackgroundColor,
        icon,
        placeholders,
        action,
      } = attributes;
      const placeholderItems = Array.isArray(placeholders) ? placeholders : [];
      const blockProps = useBlockProps({ className: 'riyasat-search-bar-editor' });

      return (
        <>
          <InspectorControls group="content">
            <div style={contentTabStyle}>
              <PanelBody title="Search bar" initialOpen={true}>
                <MediaUploadCheck>
                  <MediaUpload
                    onSelect={(media) => setAttributes({ icon: media?.url ?? '' })}
                    allowedTypes={['image']}
                    render={({ open }) => (
                      <div>
                        <Button
                          onClick={open}
                          variant="secondary"
                          style={{ width: '100%', justifyContent: 'center' }}
                        >
                          {icon ? 'Change icon' : 'Add icon'}
                        </Button>
                        {icon ? (
                          <Button
                            onClick={() => setAttributes({ icon: '' })}
                            variant="link"
                            isDestructive
                            style={{ marginTop: '4px' }}
                          >
                            Remove icon
                          </Button>
                        ) : null}
                      </div>
                    )}
                  />
                </MediaUploadCheck>
                <ActionBuilder
                  label="Search bar action"
                  value={action ?? {}}
                  onChange={(next) => setAttributes({ action: next })}
                />
              </PanelBody>

              <PlaceholdersRepeater
                placeholders={placeholderItems}
                onChange={(next) => setAttributes({ placeholders: next })}
              />
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
                  {
                    label: 'Border color',
                    value: borderColor,
                    onChange: (value) =>
                      setAttributes({ borderColor: value || DEFAULT_BORDER }),
                  },
                  {
                    label: 'Input background color',
                    value: inputBackgroundColor,
                    onChange: (value) =>
                      setAttributes({
                        inputBackgroundColor: value || DEFAULT_INPUT_BACKGROUND,
                      }),
                  },
                ]}
              />
            </PanelBody>
          </InspectorControls>

          <div {...blockProps}>
            <SearchBarPreview
              backgroundColor={backgroundColor}
              borderColor={borderColor}
              inputBackgroundColor={inputBackgroundColor}
              icon={icon}
              placeholders={placeholderItems}
            />
          </div>
        </>
      );
    },

    save: ({ attributes }) => {
      const {
        backgroundColor,
        borderColor,
        inputBackgroundColor,
        icon,
        placeholders,
        action,
      } = attributes;
      const placeholderItems = Array.isArray(placeholders) ? placeholders : [];

      const blockProps = useBlockProps.save({
        className: 'riyasat-search-bar',
        'data-background-color': backgroundColor || DEFAULT_BACKGROUND,
        'data-border-color': borderColor || DEFAULT_BORDER,
        'data-input-background-color': inputBackgroundColor || DEFAULT_INPUT_BACKGROUND,
        'data-icon': icon || '',
        'data-placeholders': JSON.stringify(placeholderItems),
        'data-action': JSON.stringify(action ?? {}),
        style: {
          '--riyasat-search-bar-bg': backgroundColor || DEFAULT_BACKGROUND,
          '--riyasat-search-bar-border': borderColor || DEFAULT_BORDER,
          '--riyasat-search-bar-input-bg': inputBackgroundColor || DEFAULT_INPUT_BACKGROUND,
        },
      });

      const firstPlaceholder =
        placeholderItems.find((item) => item?.text)?.text ?? '';

      return (
        <div {...blockProps}>
          <div
            className="riyasat-search-bar__shell"
            style={{
              background: backgroundColor || DEFAULT_BACKGROUND,
              border: `1px solid ${borderColor || DEFAULT_BORDER}`,
            }}
          >
            {icon ? (
              <img src={icon} alt="" className="riyasat-search-bar__icon" />
            ) : null}
            <div
              className="riyasat-search-bar__input"
              style={{ background: inputBackgroundColor || DEFAULT_INPUT_BACKGROUND }}
            >
              <span className="riyasat-search-bar__placeholder-text">
                {firstPlaceholder}
              </span>
            </div>
            {placeholderItems.map((placeholder, index) => (
              <span
                key={`placeholder-${index}`}
                className="riyasat-search-bar__placeholder"
                data-text={placeholder?.text ?? ''}
              />
            ))}
          </div>
        </div>
      );
    },
  });
}
