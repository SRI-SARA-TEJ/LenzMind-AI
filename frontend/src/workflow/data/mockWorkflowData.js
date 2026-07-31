/**
 * workflow/data/mockWorkflowData.js
 *
 * Full mock workflow library for Version 1.
 * Replace with real API calls without touching components.
 */

// ── Helper ────────────────────────────────────────────────────────────────────
const d = (offset = 0) => {
  const dt = new Date();
  dt.setDate(dt.getDate() - offset);
  return dt.toISOString();
};

// ── Workflow pool ─────────────────────────────────────────────────────────────
export const MOCK_WORKFLOW_LIBRARY = [
  // ── 1. Travel Vlog ─────────────────────────────────────────────────────────
  {
    id: 'wf-001',
    name: 'Travel Vlog',
    icon: '✈️',
    category: 'Content',
    description: 'Optimised for outdoor travel footage with natural colour grading and wide-angle stabilisation. Perfect for golden-hour shots, walking sequences, and landscape B-roll.',
    tags: ['travel', 'outdoor', 'vlog', 'landscape', 'colour-grade'],
    isFavorite: true,
    isBuiltIn: true,
    aiLearned: false,
    usageCount: 47,
    lastUsedAt: d(1),
    createdAt:  d(120),
    updatedAt:  d(1),
    cameraSettings: { resolution: '4K', fps: 30, hdr: true, flash: 'off', stabilization: 'cinematic', focusMode: 'auto', whiteBalance: 'auto' },
    aiSettings:     { sceneDetection: true, autoSuggest: true, noiseReduction: false, autoColourGrade: true, enhancementLevel: 'mild' },
    privacySettings:{ blurFaces: false, blurScreens: false, muteSensitiveAudio: false, metadataStrip: 'location' },
    styleSummary:   'Warm, cinematic tones. Smooth stabilisation. Wide framing preferred.',
    projectIds:     ['proj-001', 'proj-004', 'proj-007'],
    versions: [
      { id: 'v3', versionLabel: 'v3.0', createdAt: d(1),   notes: 'Added auto colour grade for golden hour.', snapshot: {} },
      { id: 'v2', versionLabel: 'v2.1', createdAt: d(30),  notes: 'Raised stabilisation to cinematic mode.', snapshot: {} },
      { id: 'v1', versionLabel: 'v1.0', createdAt: d(120), notes: 'Initial version.', snapshot: {} },
    ],
  },

  // ── 2. Short-Form Reel ─────────────────────────────────────────────────────
  {
    id: 'wf-002',
    name: 'Short-Form Reel',
    icon: '🎬',
    category: 'Content',
    description: 'High-energy vertical-first shooting for social reels. 60fps for smooth motion, punchy colour profile, and beat-sync ready clips.',
    tags: ['reel', 'social', 'vertical', 'short-form', 'tiktok', 'instagram'],
    isFavorite: true,
    isBuiltIn: true,
    aiLearned: false,
    usageCount: 83,
    lastUsedAt: d(0),
    createdAt:  d(90),
    updatedAt:  d(0),
    cameraSettings: { resolution: '4K', fps: 60, hdr: false, flash: 'auto', stabilization: 'sport', focusMode: 'auto', whiteBalance: 'auto' },
    aiSettings:     { sceneDetection: true, autoSuggest: true, noiseReduction: true, autoColourGrade: true, enhancementLevel: 'strong' },
    privacySettings:{ blurFaces: false, blurScreens: true, muteSensitiveAudio: false, metadataStrip: 'none' },
    styleSummary:   'High contrast, saturated look. Fast cuts. Vertical 9:16 framing.',
    projectIds:     ['proj-002', 'proj-005'],
    versions: [
      { id: 'v2', versionLabel: 'v2.0', createdAt: d(0),  notes: 'Enabled strong AI enhancement for social.', snapshot: {} },
      { id: 'v1', versionLabel: 'v1.0', createdAt: d(90), notes: 'Initial version.', snapshot: {} },
    ],
  },

  // ── 3. Interview / Talking Head ────────────────────────────────────────────
  {
    id: 'wf-003',
    name: 'Interview / Talking Head',
    icon: '🎙️',
    category: 'Professional',
    description: 'Clean, neutral settings for interviews and talking-head videos. Privacy-first with face blurring option. Optimised for low-light indoor environments.',
    tags: ['interview', 'talking-head', 'indoor', 'professional', 'corporate'],
    isFavorite: false,
    isBuiltIn: true,
    aiLearned: false,
    usageCount: 29,
    lastUsedAt: d(5),
    createdAt:  d(180),
    updatedAt:  d(5),
    cameraSettings: { resolution: '4K', fps: 24, hdr: false, flash: 'off', stabilization: 'standard', focusMode: 'manual', whiteBalance: 'locked' },
    aiSettings:     { sceneDetection: false, autoSuggest: false, noiseReduction: true, autoColourGrade: false, enhancementLevel: 'mild' },
    privacySettings:{ blurFaces: false, blurScreens: true, muteSensitiveAudio: true, metadataStrip: 'all' },
    styleSummary:   'Neutral colour, shallow depth, locked white balance. Cinematic 24fps.',
    projectIds:     ['proj-003'],
    versions: [
      { id: 'v1', versionLabel: 'v1.0', createdAt: d(180), notes: 'Initial version.', snapshot: {} },
    ],
  },

  // ── 4. Food Creator ────────────────────────────────────────────────────────
  {
    id: 'wf-004',
    name: 'Food Creator',
    icon: '🍽️',
    category: 'Content',
    description: 'Macro-optimised settings for food photography and cooking videos. Warm, appetite-enhancing colour science with macro stabilisation.',
    tags: ['food', 'macro', 'cooking', 'restaurant', 'warm-tones'],
    isFavorite: true,
    isBuiltIn: false,
    aiLearned: true,
    usageCount: 18,
    lastUsedAt: d(2),
    createdAt:  d(45),
    updatedAt:  d(2),
    cameraSettings: { resolution: '4K', fps: 30, hdr: true, flash: 'auto', stabilization: 'standard', focusMode: 'manual', whiteBalance: 'locked' },
    aiSettings:     { sceneDetection: true, autoSuggest: false, noiseReduction: false, autoColourGrade: true, enhancementLevel: 'mild' },
    privacySettings:{ blurFaces: false, blurScreens: false, muteSensitiveAudio: false, metadataStrip: 'none' },
    styleSummary:   'Warm amber tones, tight framing, HDR for texture detail.',
    projectIds:     ['proj-006'],
    versions: [
      { id: 'v2', versionLabel: 'v2.0', createdAt: d(2),  notes: 'AI-tuned warm colour grade for food.', snapshot: {} },
      { id: 'v1', versionLabel: 'v1.0', createdAt: d(45), notes: 'User-created baseline.', snapshot: {} },
    ],
  },

  // ── 5. Wedding Shoot ───────────────────────────────────────────────────────
  {
    id: 'wf-005',
    name: 'Wedding Shoot',
    icon: '💍',
    category: 'Professional',
    description: 'Soft, romantic visual style for wedding ceremonies and receptions. Automatic face privacy safeguards for guest protection. Film-emulation colour grade.',
    tags: ['wedding', 'ceremony', 'romantic', 'portrait', 'event'],
    isFavorite: false,
    isBuiltIn: false,
    aiLearned: false,
    usageCount: 11,
    lastUsedAt: d(14),
    createdAt:  d(60),
    updatedAt:  d(14),
    cameraSettings: { resolution: '4K', fps: 24, hdr: true, flash: 'off', stabilization: 'cinematic', focusMode: 'auto', whiteBalance: 'auto' },
    aiSettings:     { sceneDetection: true, autoSuggest: true, noiseReduction: true, autoColourGrade: true, enhancementLevel: 'mild' },
    privacySettings:{ blurFaces: false, blurScreens: false, muteSensitiveAudio: false, metadataStrip: 'none' },
    styleSummary:   'Soft film emulation, pastel highlights, 24fps cinematic motion.',
    projectIds:     [],
    versions: [
      { id: 'v1', versionLabel: 'v1.0', createdAt: d(60), notes: 'Initial version.', snapshot: {} },
    ],
  },

  // ── 6. Portrait Session ────────────────────────────────────────────────────
  {
    id: 'wf-006',
    name: 'Portrait Session',
    icon: '🪞',
    category: 'Professional',
    description: 'Flattering portrait settings with shallow depth of field, skin-tone optimised AI processing, and optional face-blur privacy mode.',
    tags: ['portrait', 'people', 'skin-tone', 'shallow-dof', 'photography'],
    isFavorite: false,
    isBuiltIn: true,
    aiLearned: false,
    usageCount: 34,
    lastUsedAt: d(7),
    createdAt:  d(200),
    updatedAt:  d(7),
    cameraSettings: { resolution: '4K', fps: 30, hdr: false, flash: 'auto', stabilization: 'standard', focusMode: 'auto', whiteBalance: 'auto' },
    aiSettings:     { sceneDetection: true, autoSuggest: false, noiseReduction: true, autoColourGrade: false, enhancementLevel: 'mild' },
    privacySettings:{ blurFaces: true, blurScreens: false, muteSensitiveAudio: false, metadataStrip: 'none' },
    styleSummary:   'Clean skin tones, natural light emphasis, portrait mode bokeh.',
    projectIds:     ['proj-008'],
    versions: [
      { id: 'v1', versionLabel: 'v1.0', createdAt: d(200), notes: 'Initial version.', snapshot: {} },
    ],
  },

  // ── 7. Product Photography ────────────────────────────────────────────────
  {
    id: 'wf-007',
    name: 'Product Photography',
    icon: '📦',
    category: 'Commercial',
    description: 'Sharp, accurate colour rendering for e-commerce and product showcase. Screen-blur privacy for unreleased products.',
    tags: ['product', 'ecommerce', 'commercial', 'sharp', 'colour-accurate'],
    isFavorite: false,
    isBuiltIn: true,
    aiLearned: false,
    usageCount: 22,
    lastUsedAt: d(3),
    createdAt:  d(150),
    updatedAt:  d(3),
    cameraSettings: { resolution: '8K', fps: 30, hdr: false, flash: 'off', stabilization: 'standard', focusMode: 'manual', whiteBalance: 'locked' },
    aiSettings:     { sceneDetection: false, autoSuggest: false, noiseReduction: false, autoColourGrade: false, enhancementLevel: 'none' },
    privacySettings:{ blurFaces: false, blurScreens: true, muteSensitiveAudio: false, metadataStrip: 'all' },
    styleSummary:   'Maximum fidelity, locked exposure, neutral colour profile.',
    projectIds:     ['proj-009'],
    versions: [
      { id: 'v1', versionLabel: 'v1.0', createdAt: d(150), notes: 'Initial version.', snapshot: {} },
    ],
  },

  // ── 8. Outdoor Reel ───────────────────────────────────────────────────────
  {
    id: 'wf-008',
    name: 'Outdoor Reel',
    icon: '🌿',
    category: 'Content',
    description: 'Fast-action outdoor content. 60fps with sport stabilisation. AI-enhanced dynamic range for mixed lighting environments.',
    tags: ['outdoor', 'action', 'sport', 'dynamic', 'reel'],
    isFavorite: false,
    isBuiltIn: false,
    aiLearned: false,
    usageCount: 9,
    lastUsedAt: d(10),
    createdAt:  d(30),
    updatedAt:  d(10),
    cameraSettings: { resolution: '4K', fps: 60, hdr: true, flash: 'off', stabilization: 'sport', focusMode: 'auto', whiteBalance: 'auto' },
    aiSettings:     { sceneDetection: true, autoSuggest: true, noiseReduction: false, autoColourGrade: true, enhancementLevel: 'strong' },
    privacySettings:{ blurFaces: false, blurScreens: false, muteSensitiveAudio: false, metadataStrip: 'location' },
    styleSummary:   'Vivid greens, dynamic exposure, sport motion freeze.',
    projectIds:     [],
    versions: [
      { id: 'v1', versionLabel: 'v1.0', createdAt: d(30), notes: 'Initial version.', snapshot: {} },
    ],
  },

  // ── 9. Cinematic Video ────────────────────────────────────────────────────
  {
    id: 'wf-009',
    name: 'Cinematic Video',
    icon: '🎥',
    category: 'Creative',
    description: 'Cinema-grade capture for short films and documentary. 24fps filmic motion, flat colour profile for post-grading, manual exposure control.',
    tags: ['cinematic', 'film', 'documentary', 'flat-profile', 'manual'],
    isFavorite: true,
    isBuiltIn: true,
    aiLearned: false,
    usageCount: 38,
    lastUsedAt: d(4),
    createdAt:  d(250),
    updatedAt:  d(4),
    cameraSettings: { resolution: '4K', fps: 24, hdr: false, flash: 'off', stabilization: 'cinematic', focusMode: 'manual', whiteBalance: 'locked' },
    aiSettings:     { sceneDetection: false, autoSuggest: false, noiseReduction: false, autoColourGrade: false, enhancementLevel: 'none' },
    privacySettings:{ blurFaces: false, blurScreens: false, muteSensitiveAudio: false, metadataStrip: 'none' },
    styleSummary:   'Flat LOG profile, 180° shutter rule, locked manual settings.',
    projectIds:     ['proj-010', 'proj-011'],
    versions: [
      { id: 'v2', versionLabel: 'v2.0', createdAt: d(4),   notes: 'Switched to manual white balance for consistency.', snapshot: {} },
      { id: 'v1', versionLabel: 'v1.0', createdAt: d(250), notes: 'Initial version.', snapshot: {} },
    ],
  },

  // ── 10. Sports Action ─────────────────────────────────────────────────────
  {
    id: 'wf-010',
    name: 'Sports Action',
    icon: '⚡',
    category: 'Sports',
    description: 'Optimised for fast movement capture. 120fps slow-motion capability, sport stabilisation, and AI motion prediction assist.',
    tags: ['sports', 'action', 'slow-motion', '120fps', 'fast-movement'],
    isFavorite: false,
    isBuiltIn: true,
    aiLearned: false,
    usageCount: 15,
    lastUsedAt: d(20),
    createdAt:  d(180),
    updatedAt:  d(20),
    cameraSettings: { resolution: '1080p', fps: 120, hdr: false, flash: 'off', stabilization: 'sport', focusMode: 'auto', whiteBalance: 'auto' },
    aiSettings:     { sceneDetection: true, autoSuggest: true, noiseReduction: false, autoColourGrade: false, enhancementLevel: 'mild' },
    privacySettings:{ blurFaces: false, blurScreens: false, muteSensitiveAudio: false, metadataStrip: 'none' },
    styleSummary:   'Motion-first. 120fps for 4× slow-motion. Sport tracking AI.',
    projectIds:     [],
    versions: [
      { id: 'v1', versionLabel: 'v1.0', createdAt: d(180), notes: 'Initial version.', snapshot: {} },
    ],
  },

  // ── 11. Live Event Highlights ─────────────────────────────────────────────
  {
    id: 'wf-011',
    name: 'Live Event Highlights',
    icon: '🎤',
    category: 'Events',
    description: 'Concert, conference, and live performance optimisation. High-ISO handling, stage-light compensation, and audio peak management.',
    tags: ['event', 'concert', 'live', 'stage', 'performance'],
    isFavorite: false,
    isBuiltIn: true,
    aiLearned: false,
    usageCount: 12,
    lastUsedAt: d(25),
    createdAt:  d(130),
    updatedAt:  d(25),
    cameraSettings: { resolution: '4K', fps: 30, hdr: true, flash: 'off', stabilization: 'standard', focusMode: 'auto', whiteBalance: 'auto' },
    aiSettings:     { sceneDetection: true, autoSuggest: true, noiseReduction: true, autoColourGrade: false, enhancementLevel: 'mild' },
    privacySettings:{ blurFaces: false, blurScreens: false, muteSensitiveAudio: false, metadataStrip: 'none' },
    styleSummary:   'Dynamic stage compensation, noise reduction, crowd energy.',
    projectIds:     [],
    versions: [
      { id: 'v1', versionLabel: 'v1.0', createdAt: d(130), notes: 'Initial version.', snapshot: {} },
    ],
  },

  // ── 12. Cooking Studio (AI Suggested) ─────────────────────────────────────
  {
    id: 'wf-012',
    name: 'Cooking Studio',
    icon: '👨‍🍳',
    category: 'AI Suggested',
    description: 'AI noticed you recorded 18 cooking videos with similar settings. This optimised workflow consolidates your cooking capture style with enhanced food-tone AI grading.',
    tags: ['cooking', 'food', 'studio', 'ai-generated', 'warm'],
    isFavorite: false,
    isBuiltIn: false,
    aiLearned: true,
    usageCount: 0,
    lastUsedAt: null,
    createdAt:  d(0),
    updatedAt:  d(0),
    cameraSettings: { resolution: '4K', fps: 30, hdr: true, flash: 'auto', stabilization: 'standard', focusMode: 'manual', whiteBalance: 'locked' },
    aiSettings:     { sceneDetection: true, autoSuggest: true, noiseReduction: false, autoColourGrade: true, enhancementLevel: 'mild' },
    privacySettings:{ blurFaces: false, blurScreens: false, muteSensitiveAudio: false, metadataStrip: 'none' },
    styleSummary:   'Based on your 18 cooking sessions — warm amber, macro sharp, HDR textures.',
    projectIds:     [],
    versions: [
      { id: 'v1', versionLabel: 'v1.0 (AI)', createdAt: d(0), notes: 'Auto-generated by AI from pattern analysis.', snapshot: {} },
    ],
  },

  // ── 13. Urban Street Photography (AI Suggested) ───────────────────────────
  {
    id: 'wf-013',
    name: 'Urban Street',
    icon: '🏙️',
    category: 'AI Suggested',
    description: 'AI detected recurring urban shooting patterns across 12 sessions. High-contrast street photography profile with automatic licence plate and face privacy.',
    tags: ['street', 'urban', 'documentary', 'ai-generated', 'high-contrast'],
    isFavorite: false,
    isBuiltIn: false,
    aiLearned: true,
    usageCount: 0,
    lastUsedAt: null,
    createdAt:  d(1),
    updatedAt:  d(1),
    cameraSettings: { resolution: '4K', fps: 30, hdr: false, flash: 'off', stabilization: 'standard', focusMode: 'auto', whiteBalance: 'auto' },
    aiSettings:     { sceneDetection: true, autoSuggest: true, noiseReduction: false, autoColourGrade: true, enhancementLevel: 'strong' },
    privacySettings:{ blurFaces: true, blurScreens: false, muteSensitiveAudio: false, metadataStrip: 'location' },
    styleSummary:   'High contrast monochrome-ready. Privacy-first street shooting.',
    projectIds:     [],
    versions: [
      { id: 'v1', versionLabel: 'v1.0 (AI)', createdAt: d(1), notes: 'Auto-generated from 12 urban sessions.', snapshot: {} },
    ],
  },
];

// ── Categories ────────────────────────────────────────────────────────────────
export const WORKFLOW_CATEGORIES = [
  { id: 'all',          label: 'All',           icon: '⬛' },
  { id: 'favorites',    label: 'Favorites',      icon: '⭐' },
  { id: 'recent',       label: 'Recent',         icon: '🕐' },
  { id: 'my',           label: 'My Workflows',   icon: '👤' },
  { id: 'builtin',      label: 'Built-in',       icon: '🔒' },
  { id: 'ai',           label: 'AI Suggested',   icon: '✦' },
  { id: 'Content',      label: 'Content',        icon: '🎬' },
  { id: 'Professional', label: 'Professional',   icon: '🎙️' },
  { id: 'Commercial',   label: 'Commercial',     icon: '📦' },
  { id: 'Creative',     label: 'Creative',       icon: '🎨' },
  { id: 'Sports',       label: 'Sports',         icon: '⚡' },
  { id: 'Events',       label: 'Events',         icon: '🎤' },
];

// ── Battery impact map (camera settings → rough estimate) ────────────────────
export function estimateBatteryImpact(cameraSettings) {
  let score = 0;
  if (cameraSettings.resolution === '8K') score += 3;
  else if (cameraSettings.resolution === '4K') score += 2;
  else score += 1;
  if (cameraSettings.fps >= 120) score += 3;
  else if (cameraSettings.fps >= 60) score += 2;
  else score += 1;
  if (cameraSettings.hdr) score += 1;
  if (score <= 3) return 'Low';
  if (score <= 5) return 'Medium';
  return 'High';
}
