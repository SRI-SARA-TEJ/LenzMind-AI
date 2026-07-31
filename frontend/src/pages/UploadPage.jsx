/**
 * pages/UploadPage.jsx — Content Upload
 *
 * Allows creators to:
 *  1. Select or create a project to attach the file to
 *  2. Drag-and-drop or browse for a photo/video file
 *  3. Upload the file to the backend
 *
 * Design decision: We do not pretend AI is analyzing files here.
 * The upload page is a clean, honest utility page.
 */

import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import * as api from '../services/api';
import styles from './UploadPage.module.css';

export default function UploadPage() {
  const { state, fetchProjects, notify } = useApp();
  const navigate = useNavigate();

  const [selectedProject, setSelectedProject] = useState('');
  const [file,            setFile]            = useState(null);
  const [dragOver,        setDragOver]        = useState(false);
  const [uploading,       setUploading]       = useState(false);
  const [progress,        setProgress]        = useState(0);
  const fileInputRef = useRef();

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  function handleFileDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  }

  function handleFileSelect(e) {
    const selected = e.target.files[0];
    if (selected) setFile(selected);
  }

  async function handleUpload() {
    if (!file || !selectedProject) return;
    setUploading(true);
    setProgress(0);

    // Simulate progress feedback while the upload runs
    const interval = setInterval(() => {
      setProgress((p) => Math.min(p + 10, 85));
    }, 200);

    try {
      await api.uploadFile(selectedProject, file);
      clearInterval(interval);
      setProgress(100);
      notify('success', `"${file.name}" uploaded successfully!`);
      setTimeout(() => navigate(`/workspace/${selectedProject}`), 800);
    } catch (err) {
      clearInterval(interval);
      notify('error', err.message);
      setUploading(false);
      setProgress(0);
    }
  }

  const { projects } = state;
  const fileSizeMB = file ? (file.size / 1_048_576).toFixed(1) : null;

  return (
    <div className={styles.page}>
      <div className={styles.card}>

        {/* Step 1: Project selection */}
        <div className={styles.step}>
          <div className={styles.stepNum}>1</div>
          <div className={styles.stepContent}>
            <h3 className={styles.stepTitle}>Select a Project</h3>
            <p className={styles.stepDesc}>Choose which project this content belongs to</p>

            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className={styles.select}
            >
              <option value="">— Choose a project —</option>
              {projects.map((p) => (
                <option key={p._id} value={p._id}>{p.title}</option>
              ))}
            </select>

            {projects.length === 0 && (
              <p className={styles.hint}>
                No projects found.{' '}
                <span className={styles.link} onClick={() => navigate('/dashboard')}>
                  Create one on the Dashboard first.
                </span>
              </p>
            )}
          </div>
        </div>

        {/* Step 2: File drop zone */}
        <div className={styles.step}>
          <div className={styles.stepNum}>2</div>
          <div className={styles.stepContent}>
            <h3 className={styles.stepTitle}>Choose Your File</h3>
            <p className={styles.stepDesc}>Supports JPG, PNG, WebP, GIF, MP4, MOV, AVI — up to 100 MB</p>

            <div
              className={`${styles.dropZone} ${dragOver ? styles.dragActive : ''} ${file ? styles.fileSelected : ''}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                className={styles.hiddenInput}
                onChange={handleFileSelect}
              />

              {file ? (
                <div className={styles.filePreview}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="1.5">
                    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
                    <polyline points="13 2 13 9 20 9"/>
                  </svg>
                  <div>
                    <div className={styles.fileName}>{file.name}</div>
                    <div className={styles.fileMeta}>{fileSizeMB} MB · {file.type}</div>
                  </div>
                  <button
                    className={styles.clearBtn}
                    onClick={(e) => { e.stopPropagation(); setFile(null); }}
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className={styles.dropContent}>
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="1">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                  <p>Drag & drop your file here</p>
                  <span>or click to browse</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Step 3: Upload action */}
        <div className={styles.step}>
          <div className={styles.stepNum}>3</div>
          <div className={styles.stepContent}>
            <h3 className={styles.stepTitle}>Upload</h3>
            <p className={styles.stepDesc}>File will be attached to the selected project</p>

            {uploading && (
              <div className={styles.progressBar}>
                <div className={styles.progressFill} style={{ width: `${progress}%` }} />
              </div>
            )}

            <button
              className={styles.uploadBtn}
              onClick={handleUpload}
              disabled={!file || !selectedProject || uploading}
            >
              {uploading ? `Uploading... ${progress}%` : 'Upload File'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
