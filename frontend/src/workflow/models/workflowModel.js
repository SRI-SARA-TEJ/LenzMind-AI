/**
 * workflow/models/workflowModel.js
 *
 * Defines the canonical shape of a Workflow object.
 * All components, context, and mock data conform to this shape.
 * When a real backend is introduced, map API responses to this model here.
 */

/**
 * @typedef {Object} CameraSettings
 * @property {'1080p'|'4K'|'8K'} resolution
 * @property {24|30|60|120} fps
 * @property {boolean} hdr
 * @property {'off'|'auto'|'on'} flash
 * @property {'standard'|'cinematic'|'portrait'|'sport'} stabilization
 * @property {'auto'|'manual'} focusMode
 * @property {'auto'|'locked'} whiteBalance
 */

/**
 * @typedef {Object} AISettings
 * @property {boolean} sceneDetection
 * @property {boolean} autoSuggest
 * @property {boolean} noiseReduction
 * @property {boolean} autoColourGrade
 * @property {'none'|'mild'|'strong'} enhancementLevel
 */

/**
 * @typedef {Object} PrivacySettings
 * @property {boolean} blurFaces
 * @property {boolean} blurScreens
 * @property {boolean} muteSensitiveAudio
 * @property {'none'|'location'|'all'} metadataStrip
 */

/**
 * @typedef {Object} WorkflowVersion
 * @property {string} id
 * @property {string} versionLabel   e.g. "v1.0", "v2.3"
 * @property {string} createdAt      ISO date string
 * @property {string} notes
 * @property {Object} snapshot       Frozen copy of workflow fields at this version
 */

/**
 * @typedef {Object} Workflow
 * @property {string}          id
 * @property {string}          name
 * @property {string}          icon            Single emoji
 * @property {string}          category        e.g. 'Content' | 'Professional' | 'Commercial'
 * @property {string}          description
 * @property {string[]}        tags
 * @property {boolean}         isFavorite
 * @property {boolean}         isBuiltIn       Built-in = read-only
 * @property {boolean}         aiLearned       True if AI generated / adapted this workflow
 * @property {number}          usageCount
 * @property {string|null}     lastUsedAt      ISO date string or null
 * @property {string}          createdAt       ISO date string
 * @property {string}          updatedAt       ISO date string
 * @property {CameraSettings}  cameraSettings
 * @property {AISettings}      aiSettings
 * @property {PrivacySettings} privacySettings
 * @property {string}          styleSummary    Short prose description of look/feel
 * @property {string[]}        projectIds      IDs of projects using this workflow
 * @property {WorkflowVersion[]} versions
 */

/** Factory — creates a blank Workflow with safe defaults. */
export function createBlankWorkflow(overrides = {}) {
  const now = new Date().toISOString();
  return {
    id:           `wf-${Date.now()}`,
    name:         '',
    icon:         '🎬',
    category:     'My Workflows',
    description:  '',
    tags:         [],
    isFavorite:   false,
    isBuiltIn:    false,
    aiLearned:    false,
    usageCount:   0,
    lastUsedAt:   null,
    createdAt:    now,
    updatedAt:    now,
    cameraSettings: {
      resolution:    '4K',
      fps:           30,
      hdr:           true,
      flash:         'auto',
      stabilization: 'standard',
      focusMode:     'auto',
      whiteBalance:  'auto',
    },
    aiSettings: {
      sceneDetection:  true,
      autoSuggest:     true,
      noiseReduction:  false,
      autoColourGrade: false,
      enhancementLevel:'none',
    },
    privacySettings: {
      blurFaces:         false,
      blurScreens:       false,
      muteSensitiveAudio:false,
      metadataStrip:     'none',
    },
    styleSummary: '',
    projectIds:   [],
    versions:     [],
    ...overrides,
  };
}
