import React, { useState } from "react";
import { useSelector } from 'react-redux';
import "./Settings.css";

function Settings() {
  const Shop = useSelector((state) => state.store.storeDetail);
  const [timerEnabled, setTimerEnabled] = useState(true);
  const [editLimit, setEditLimit] = useState("30");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [timeUnit, setTimeUnit] = useState("minutes");
  const [isHovered, setIsHovered] = useState(false);
  const [pulseAnimation, setPulseAnimation] = useState(false);

  // Handle save with visual feedback
  const handleSave = async () => {
    setError("");
    setSaved(false);
    setPulseAnimation(true);

    // Validate input
    if (!editLimit || isNaN(editLimit) || Number(editLimit) <= 0) {
      setError("Please enter a valid positive number.");
      setPulseAnimation(false);
      return;
    }

    setSaving(true);

    // Simulate API call with visual feedback
    try {
      await new Promise(resolve => setTimeout(resolve, 800)); // Simulated delay
      console.log("Saving settings...", editLimit);
      const response = await fetch("/api/store/add-edit-timer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orderEditTime: Number(editLimit), domain: Shop.domain }),
      });

      const data = await response.json();
      console.log(data);

      setSaving(false);
      setSaved(true);

      // Reset pulse animation
      setTimeout(() => setPulseAnimation(false), 300);

      // Auto-hide success message after 3 seconds
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setSaving(false);
      setError("Something went wrong while saving.");
      setPulseAnimation(false);
    }
  };

  // Calculate total seconds for preview
  const getPreviewSeconds = () => {
    const limit = Number(editLimit);
    switch (timeUnit) {
      case "minutes": return limit * 60;
      case "hours": return limit * 3600;
      default: return limit * 60;
    }
  };

  // Format time preview
  const formatTimePreview = () => {
    const totalSeconds = getPreviewSeconds();
    if (totalSeconds < 60) {
      return `${totalSeconds} seconds`;
    } else if (totalSeconds < 3600) {
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      return `${minutes}m ${seconds}s`;
    } else {
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      return `${hours}h ${minutes}m`;
    }
  };

  // Toggle timer enabled
  const handleToggle = () => {
    const newValue = !timerEnabled;
    setTimerEnabled(newValue);
    if (newValue) setPulseAnimation(true);
  };

  return (
    <div className="custom-settings-container">
      {/* Success Banner */}
      {saved && (
        <div className="success-banner slide-in">
          <div className="success-content">
            <span className="success-icon">✓</span>
            <span className="success-message">Settings saved successfully!</span>
            <button className="banner-close" onClick={() => setSaved(false)}>×</button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="custom-settings-wrapper">
        <header className="page-header">
          <h1 className="page-title">Order Edit Timer Settings</h1>
          <p className="page-subtitle">
            Configure how long customers can edit their order after placing it.
          </p>
        </header>

        {/* Main Settings Card */}
        <div
          className={`custom-settings-card ${pulseAnimation ? 'pulse-effect' : ''} ${isHovered ? 'card-hovered' : ''}`}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Card Header */}
          <div className="custom-card-header">
            <div className="custom-icon-wrapper">
              <div className="custom-timer-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" />
                  <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
            </div>
            <h2 className="custom-card-title">Edit Timer Configuration</h2>
            <p className="custom-card-subtitle">
              Control when customers can modify their orders after purchase
            </p>
          </div>

          {/* Settings Form */}
          <div className="custom-form-layout">
            {/* Toggle Section */}
            <div className={`custom-toggle-section ${timerEnabled ? 'enabled' : 'disabled'}`}>
              <div className="custom-toggle-header">
                <div className="custom-checkbox-container">
                  <label className="custom-checkbox-label">
                    <div className="checkbox-input-wrapper">
                      <input
                        type="checkbox"
                        checked={timerEnabled}
                        onChange={handleToggle}
                        className="custom-checkbox"
                      />
                      <span className="checkbox-custom"></span>
                    </div>
                    <div className="checkbox-text">
                      <span className="checkbox-label-text">Enable Edit Window</span>
                      <span className={`custom-status-badge ${timerEnabled ? 'active' : 'inactive'}`}>
                        {timerEnabled ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="toggle-description">
                <p>
                  When enabled, customers receive an order-edit link via email and can modify their order within the configured time limit.
                </p>
              </div>

              {/* Time Settings Panel */}
              {timerEnabled && (
                <div className="custom-time-settings slide-down">
                  <div className="time-input-group">
                    <div className="custom-input-with-unit">
                      <div className="custom-input-container">
                        <label className="custom-input-label">
                          Edit time limit
                        </label>
                        <input
                          type="number"
                          value={editLimit}
                          onChange={(e) => {
                            const value = e.target.value;
                            setEditLimit(value);
                            if (value && !isNaN(value) && Number(value) > 0) {
                              setPulseAnimation(true);
                              setTimeout(() => setPulseAnimation(false), 150);
                            }
                          }}
                          min="1"
                          step="1"
                          className="custom-number-input"
                          placeholder="Enter time limit"
                        />
                      </div>

                      <div className="custom-unit-selector">
                        <label className="unit-label">Unit</label>
                        <select
                          value={timeUnit}
                          onChange={(e) => {
                            setTimeUnit(e.target.value);
                            setPulseAnimation(true);
                            setTimeout(() => setPulseAnimation(false), 150);
                          }}
                          className="custom-unit-dropdown"
                        >
                          {/* <option value="seconds">Seconds</option> */}
                          <option value="minutes">Minutes</option>
                          {/* <option value="hours">Hours</option> */}
                        </select>
                      </div>
                    </div>

                    {/* Time Preview */}
                    <div className="custom-time-preview">
                      <div className="preview-label">Total time:</div>
                      <div className="preview-value">{formatTimePreview()}</div>
                      <div className="preview-visual">
                        <div
                          className="custom-time-bar"
                          style={{
                            width: `${Math.min(100, (getPreviewSeconds() / 86400) * 100)}%`,
                            backgroundColor: getPreviewSeconds() > 3600 ? '#fef2f2' :
                              getPreviewSeconds() > 600 ? '#fffbeb' :
                                '#f0fdf4'
                          }}
                        />
                      </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                      <div className="custom-error-message shake">
                        <span className="error-icon">!</span>
                        <span className="error-text">{error}</span>
                      </div>
                    )}

                    {/* Help Text */}
                    <div className="custom-help-text">
                      <p>
                        Example: 30 minutes = Customers can edit their order for 30 minutes after purchase.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="custom-action-buttons">
              <button
                onClick={handleSave}
                disabled={saving}
                className={`custom-save-button ${saving ? 'saving' : ''}`}
              >
                {saving ? (
                  <>
                    <span className="custom-spinner"></span>
                    Saving Settings...
                  </>
                ) : (
                  'Save Settings'
                )}
              </button>

              {/* Preview Card */}
              {timerEnabled && editLimit && !error && (
                <div className="custom-preview-card">
                  <div className="preview-icon">⏱️</div>
                  <div className="preview-content">
                    <p className="preview-title">Edit window preview</p>
                    <p className="preview-description">
                      Customers will have {editLimit} {timeUnit} to make changes
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="custom-info-card">
          <div className="custom-info-grid">
            <div className="custom-info-item">
              <div className="info-icon">📧</div>
              <div>
                <p className="info-title">Email Notification</p>
                <p className="info-description">Edit links are sent automatically via email</p>
              </div>
            </div>
            <div className="custom-info-item">
              <div className="info-icon">🔄</div>
              <div>
                <p className="info-title">One-time Use</p>
                <p className="info-description">Each edit link can only be used once</p>
              </div>
            </div>
            <div className="custom-info-item">
              <div className="info-icon">⏰</div>
              <div>
                <p className="info-title">Timer Starts Immediately</p>
                <p className="info-description">Countdown begins when order is placed</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;