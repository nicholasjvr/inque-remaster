'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/hooks/useFirestore';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface BugReportFormData {
    title: string;
    description: string;
    stepsToReproduce: string;
    severity: string;
    browser: string;
    url: string;
}

interface FormErrors {
    [key: string]: string;
}

// Version constant - update this when deploying new versions
const APP_VERSION = '0.1.0';

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
    const { user } = useAuth();
    const { profile, saveProfile } = useUserProfile(user?.uid);
    const [isClosing, setIsClosing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSavingSettings, setIsSavingSettings] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [settingsSaveStatus, setSettingsSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

    // Bug report form data
    const [formData, setFormData] = useState<BugReportFormData>({
        title: '',
        description: '',
        stepsToReproduce: '',
        severity: 'medium',
        browser: '',
        url: '',
    });

    // User settings data
    const [userSettings, setUserSettings] = useState({
        displayName: '',
        bio: '',
        email: '',
        theme: 'neo' as 'neo' | 'minimal' | 'cyber',
        isPublic: true,
        emailNotifications: true,
        pushNotifications: false,
    });

    const [errors, setErrors] = useState<FormErrors>({});

    // Load user data when modal opens
    useEffect(() => {
        const loadUserData = async () => {
            if (!user?.uid || !db) return;

            try {
                const userDoc = await getDoc(doc(db, 'users', user.uid));
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    setUserSettings({
                        displayName: userData.displayName || user.displayName || '',
                        bio: userData.bio || profile?.bio || '',
                        email: userData.email || user.email || '',
                        theme: profile?.theme?.mode || 'neo',
                        isPublic: userData.isPublic !== undefined ? userData.isPublic : true,
                        emailNotifications: userData.emailNotifications !== undefined ? userData.emailNotifications : true,
                        pushNotifications: userData.pushNotifications !== undefined ? userData.pushNotifications : false,
                    });
                } else {
                    // Set defaults from auth user
                    setUserSettings(prev => ({
                        ...prev,
                        displayName: user.displayName || user.email?.split('@')[0] || '',
                        email: user.email || '',
                    }));
                }
            } catch (error) {
                console.error('Error loading user data:', error);
            }
        };

        if (isOpen && user) {
            loadUserData();
        }
    }, [isOpen, user, profile]);

    useEffect(() => {
        if (isOpen) {
            setIsClosing(false);
            setSubmitStatus('idle');
            setSettingsSaveStatus('idle');
            setErrors({});
            // Auto-detect browser info
            const userAgent = navigator.userAgent;
            let browserName = 'Unknown';
            if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) browserName = 'Chrome';
            else if (userAgent.includes('Firefox')) browserName = 'Firefox';
            else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) browserName = 'Safari';
            else if (userAgent.includes('Edg')) browserName = 'Edge';
            else if (userAgent.includes('Opera') || userAgent.includes('OPR')) browserName = 'Opera';

            setFormData(prev => ({
                ...prev,
                browser: browserName,
                url: window.location.href,
            }));
            document.body.classList.add('no-scroll');
        } else {
            document.body.classList.remove('no-scroll');
        }

        return () => {
            document.body.classList.remove('no-scroll');
        };
    }, [isOpen]);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            onClose();
            setIsClosing(false);
            setFormData({
                title: '',
                description: '',
                stepsToReproduce: '',
                severity: 'medium',
                browser: '',
                url: '',
            });
            setErrors({});
            setSubmitStatus('idle');
        }, 200);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') handleClose();
    };

    const validateForm = (): boolean => {
        const newErrors: FormErrors = {};

        if (!formData.title.trim()) {
            newErrors.title = 'Title is required';
        } else if (formData.title.trim().length < 5) {
            newErrors.title = 'Title must be at least 5 characters';
        }

        if (!formData.description.trim()) {
            newErrors.description = 'Description is required';
        } else if (formData.description.trim().length < 20) {
            newErrors.description = 'Please provide more details (at least 20 characters)';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);
        setSubmitStatus('idle');

        try {
            // Save to Firestore
            if (db) {
                await addDoc(collection(db, 'bugReports'), {
                    ...formData,
                    userId: user?.uid || 'anonymous',
                    userEmail: user?.email || 'anonymous',
                    version: APP_VERSION,
                    timestamp: serverTimestamp(),
                    status: 'new',
                });
            }

            setSubmitStatus('success');

            // Reset form after a delay
            setTimeout(() => {
                setFormData({
                    title: '',
                    description: '',
                    stepsToReproduce: '',
                    severity: 'medium',
                    browser: '',
                    url: '',
                });
                setTimeout(() => {
                    handleClose();
                }, 1500);
            }, 2000);
        } catch (error) {
            console.error('Error submitting bug report:', error);
            setSubmitStatus('error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const handleSettingsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;

        setUserSettings(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleSaveSettings = async () => {
        if (!user?.uid || !db) return;

        setIsSavingSettings(true);
        setSettingsSaveStatus('idle');

        try {
            const userRef = doc(db, 'users', user.uid);

            // Update user document
            await updateDoc(userRef, {
                displayName: userSettings.displayName,
                bio: userSettings.bio,
                isPublic: userSettings.isPublic,
                emailNotifications: userSettings.emailNotifications,
                pushNotifications: userSettings.pushNotifications,
                updatedAt: serverTimestamp(),
            });

            // Update profile theme if changed
            if (profile && userSettings.theme !== profile.theme?.mode) {
                await saveProfile(user.uid, {
                    theme: {
                        ...profile.theme,
                        mode: userSettings.theme,
                    },
                });
            }

            setSettingsSaveStatus('success');
            setTimeout(() => {
                setSettingsSaveStatus('idle');
            }, 2000);
        } catch (error) {
            console.error('Error saving settings:', error);
            setSettingsSaveStatus('error');
        } finally {
            setIsSavingSettings(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className={`settings-modal-overlay ${isClosing ? 'closing' : ''}`}
            onClick={handleClose}
            onKeyDown={handleKeyDown}
            tabIndex={-1}
        >
            <div
                className="settings-modal"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="settings-title"
            >
                <div className="settings-modal-header">
                    <div>
                        <h2 id="settings-title" className="settings-title">
                            Settings
                        </h2>
                        <p className="settings-subtitle">
                            Manage your preferences and report issues
                        </p>
                    </div>
                    <button
                        className="settings-close-btn"
                        onClick={handleClose}
                        aria-label="Close modal"
                    >
                        ×
                    </button>
                </div>

                <div className="settings-modal-content">
                    {/* Version Display */}
                    <div className="settings-version-section">
                        <div className="settings-version-label">App Version</div>
                        <div className="settings-version-value">{APP_VERSION}</div>
                    </div>

                    {/* User Settings Sections */}
                    {user && (
                        <>
                            {/* Account Settings */}
                            <div className="settings-section">
                                <h3 className="settings-section-title">
                                    <span className="settings-section-icon">👤</span>
                                    Account Settings
                                </h3>
                                <p className="settings-section-description">
                                    Manage your account information and profile details
                                </p>
                                <div className="settings-form">
                                    <div className="settings-form-group">
                                        <label htmlFor="displayName" className="settings-label">
                                            Display Name
                                        </label>
                                        <input
                                            type="text"
                                            id="displayName"
                                            name="displayName"
                                            value={userSettings.displayName}
                                            onChange={handleSettingsChange}
                                            className="settings-input"
                                            placeholder="Your display name"
                                        />
                                    </div>
                                    <div className="settings-form-group">
                                        <label htmlFor="email" className="settings-label">
                                            Email
                                        </label>
                                        <input
                                            type="email"
                                            id="email"
                                            name="email"
                                            value={userSettings.email}
                                            className="settings-input"
                                            placeholder="your.email@example.com"
                                            readOnly
                                        />
                                        <small className="settings-hint">Email cannot be changed here</small>
                                    </div>
                                    <div className="settings-form-group">
                                        <label htmlFor="bio" className="settings-label">
                                            Bio
                                        </label>
                                        <textarea
                                            id="bio"
                                            name="bio"
                                            value={userSettings.bio}
                                            onChange={handleSettingsChange}
                                            className="settings-textarea"
                                            placeholder="Tell us about yourself..."
                                            rows={3}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Profile Preferences */}
                            <div className="settings-section">
                                <h3 className="settings-section-title">
                                    <span className="settings-section-icon">🎨</span>
                                    Profile Preferences
                                </h3>
                                <p className="settings-section-description">
                                    Customize your profile appearance and visibility
                                </p>
                                <div className="settings-form">
                                    <div className="settings-form-group">
                                        <label htmlFor="theme" className="settings-label">
                                            Theme
                                        </label>
                                        <select
                                            id="theme"
                                            name="theme"
                                            value={userSettings.theme}
                                            onChange={handleSettingsChange}
                                            className="settings-select"
                                        >
                                            <option value="neo">Neo - Default</option>
                                            <option value="minimal">Minimal - Clean</option>
                                            <option value="cyber">Cyber - Futuristic</option>
                                        </select>
                                    </div>
                                    <div className="settings-form-group">
                                        <label className="settings-checkbox-label">
                                            <input
                                                type="checkbox"
                                                name="isPublic"
                                                checked={userSettings.isPublic}
                                                onChange={handleSettingsChange}
                                                className="settings-checkbox"
                                            />
                                            <span>Make my profile public</span>
                                        </label>
                                        <small className="settings-hint">
                                            When enabled, your profile will be visible to other users
                                        </small>
                                    </div>
                                </div>
                            </div>

                            {/* Notification Preferences */}
                            <div className="settings-section">
                                <h3 className="settings-section-title">
                                    <span className="settings-section-icon">🔔</span>
                                    Notifications
                                </h3>
                                <p className="settings-section-description">
                                    Control how you receive updates and alerts
                                </p>
                                <div className="settings-form">
                                    <div className="settings-form-group">
                                        <label className="settings-checkbox-label">
                                            <input
                                                type="checkbox"
                                                name="emailNotifications"
                                                checked={userSettings.emailNotifications}
                                                onChange={handleSettingsChange}
                                                className="settings-checkbox"
                                            />
                                            <span>Email Notifications</span>
                                        </label>
                                        <small className="settings-hint">
                                            Receive updates via email
                                        </small>
                                    </div>
                                    <div className="settings-form-group">
                                        <label className="settings-checkbox-label">
                                            <input
                                                type="checkbox"
                                                name="pushNotifications"
                                                checked={userSettings.pushNotifications}
                                                onChange={handleSettingsChange}
                                                className="settings-checkbox"
                                            />
                                            <span>Push Notifications</span>
                                        </label>
                                        <small className="settings-hint">
                                            Receive browser push notifications (requires permission)
                                        </small>
                                    </div>
                                </div>
                            </div>

                            {/* Save Settings Button */}
                            <div className="settings-save-section">
                                {settingsSaveStatus === 'success' ? (
                                    <div className="settings-save-success">
                                        <span className="settings-save-icon">✓</span>
                                        Settings saved successfully!
                                    </div>
                                ) : settingsSaveStatus === 'error' ? (
                                    <div className="settings-save-error">
                                        <span className="settings-save-icon">⚠</span>
                                        Failed to save settings. Please try again.
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        className="settings-btn settings-btn-primary settings-save-btn"
                                        onClick={handleSaveSettings}
                                        disabled={isSavingSettings}
                                    >
                                        {isSavingSettings ? 'Saving...' : 'Save Settings'}
                                    </button>
                                )}
                            </div>
                        </>
                    )}

                    {/* Bug Report Form */}
                    <div className="settings-bug-section">
                        <h3 className="settings-section-title">
                            <span className="settings-section-icon">🐛</span>
                            Report a Bug
                        </h3>
                        <p className="settings-section-description">
                            Found something that's not working? Let us know and we'll fix it!
                        </p>

                        {submitStatus === 'success' ? (
                            <div className="settings-success">
                                <div className="settings-success-icon">✓</div>
                                <h4 className="settings-success-title">Thanks for Reporting!</h4>
                                <p className="settings-success-message">
                                    We've received your bug report and will look into it soon.
                                </p>
                            </div>
                        ) : submitStatus === 'error' ? (
                            <div className="settings-error">
                                <div className="settings-error-icon">⚠</div>
                                <h4 className="settings-error-title">Oops! Something went wrong</h4>
                                <p className="settings-error-message">
                                    Please try again or contact support directly.
                                </p>
                                <button className="settings-retry-btn" onClick={() => setSubmitStatus('idle')}>
                                    Try Again
                                </button>
                            </div>
                        ) : (
                            <form className="settings-bug-form" onSubmit={handleSubmit}>
                                <div className="settings-form-group">
                                    <label htmlFor="bug-title" className="settings-label">
                                        Bug Title <span className="settings-required">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="bug-title"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleChange}
                                        className={`settings-input ${errors.title ? 'settings-input-error' : ''}`}
                                        placeholder="Brief description of the issue"
                                        required
                                    />
                                    {errors.title && <span className="settings-error-text">{errors.title}</span>}
                                </div>

                                <div className="settings-form-group">
                                    <label htmlFor="bug-description" className="settings-label">
                                        Description <span className="settings-required">*</span>
                                    </label>
                                    <textarea
                                        id="bug-description"
                                        name="description"
                                        value={formData.description}
                                        onChange={handleChange}
                                        className={`settings-textarea ${errors.description ? 'settings-input-error' : ''}`}
                                        placeholder="Describe what happened and what you expected to happen..."
                                        rows={4}
                                        required
                                    />
                                    {errors.description && (
                                        <span className="settings-error-text">{errors.description}</span>
                                    )}
                                </div>

                                <div className="settings-form-group">
                                    <label htmlFor="bug-steps" className="settings-label">
                                        Steps to Reproduce (Optional)
                                    </label>
                                    <textarea
                                        id="bug-steps"
                                        name="stepsToReproduce"
                                        value={formData.stepsToReproduce}
                                        onChange={handleChange}
                                        className="settings-textarea"
                                        placeholder="1. Go to...&#10;2. Click on...&#10;3. See error..."
                                        rows={3}
                                    />
                                </div>

                                <div className="settings-form-row">
                                    <div className="settings-form-group">
                                        <label htmlFor="bug-severity" className="settings-label">
                                            Severity
                                        </label>
                                        <select
                                            id="bug-severity"
                                            name="severity"
                                            value={formData.severity}
                                            onChange={handleChange}
                                            className="settings-select"
                                        >
                                            <option value="low">Low - Minor issue</option>
                                            <option value="medium">Medium - Some impact</option>
                                            <option value="high">High - Major impact</option>
                                            <option value="critical">Critical - Blocks usage</option>
                                        </select>
                                    </div>

                                    <div className="settings-form-group">
                                        <label htmlFor="bug-browser" className="settings-label">
                                            Browser
                                        </label>
                                        <input
                                            type="text"
                                            id="bug-browser"
                                            name="browser"
                                            value={formData.browser}
                                            onChange={handleChange}
                                            className="settings-input"
                                            placeholder="Auto-detected"
                                            readOnly
                                        />
                                    </div>
                                </div>

                                <div className="settings-form-group">
                                    <label htmlFor="bug-url" className="settings-label">
                                        Page URL
                                    </label>
                                    <input
                                        type="text"
                                        id="bug-url"
                                        name="url"
                                        value={formData.url}
                                        onChange={handleChange}
                                        className="settings-input"
                                        placeholder="Auto-detected"
                                        readOnly
                                    />
                                </div>

                                <div className="settings-modal-footer">
                                    <button
                                        type="button"
                                        className="settings-btn settings-btn-secondary"
                                        onClick={handleClose}
                                        disabled={isSubmitting}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="settings-btn settings-btn-primary"
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? 'Submitting...' : 'Submit Report →'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

