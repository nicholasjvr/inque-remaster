'use client';

import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent, KeyboardEvent } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface PersonalInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type FormState = {
  name: string;
  email: string;
  company: string;
  projectType: string;
  timeline: string;
  budget: string;
  message: string;
  referral: string;
};

type SubmissionStatus = 'idle' | 'success' | 'error';

const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? 'studio@inqu.studio';

const DEFAULT_FORM_STATE: FormState = {
  name: '',
  email: '',
  company: '',
  projectType: '',
  timeline: '',
  budget: '',
  message: '',
  referral: '',
};

const PROJECT_TYPES = [
  'Marketing website',
  'SaaS or multi-tenant app',
  'Internal dashboard',
  'E-commerce experience',
  'Interactive installation',
  'Something else',
];

const TIMELINE_OPTIONS = ['ASAP (1-2 weeks)', 'Fast track (2-4 weeks)', 'Standard (1-2 months)', 'Exploring options'];

const BUDGET_OPTIONS = ['<$10K', '$10K - $25K', '$25K - $50K', '$50K+'];

export default function PersonalInfoModal({ isOpen, onClose }: PersonalInfoModalProps) {
  const [isClosing, setIsClosing] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [formData, setFormData] = useState<FormState>({ ...DEFAULT_FORM_STATE });
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitStatus, setSubmitStatus] = useState<SubmissionStatus>('idle');
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedName, setSubmittedName] = useState<string>('');
  const formRef = useRef<HTMLDivElement | null>(null);
  const nameInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setIsClosing(false);
      document.body.classList.add('no-scroll');
    } else {
      document.body.classList.remove('no-scroll');
    }

    return () => {
      document.body.classList.remove('no-scroll');
    };
  }, [isOpen]);

  useEffect(() => {
    if (showContactForm) {
      requestAnimationFrame(() => {
        formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        nameInputRef.current?.focus();
      });
    }
  }, [showContactForm]);

  useEffect(() => {
    if (!isOpen) {
      setShowContactForm(false);
      setFormData({ ...DEFAULT_FORM_STATE });
      setFieldErrors({});
      setSubmitStatus('idle');
      setSubmissionError(null);
      setIsSubmitting(false);
      setSubmittedName('');
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 200);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') handleClose();
  };

  const handleInputChange = (field: keyof FormState) => (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { value } = event.target;
    setFormData((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    if (!showContactForm) {
      setShowContactForm(true);
    }
  };

  const handleCtaClick = () => {
    setShowContactForm(true);
  };

  const handleEmailUs = () => {
    if (typeof window === 'undefined') return;
    const subject = encodeURIComponent('Project inquiry from inQu Studio');
    const body = encodeURIComponent('Hi inQu team,\n\nI would love to collaborate on a new project. Let\'s talk!');
    window.open(`mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`, '_blank');
  };

  const validateForm = () => {
    const errors: Partial<Record<keyof FormState, string>> = {};
    const emailPattern = /\S+@\S+\.\S+/;

    if (!formData.name.trim()) errors.name = 'Please share your name.';
    if (!formData.email.trim() || !emailPattern.test(formData.email.trim())) {
      errors.email = 'Add a valid email so we can reply.';
    }
    if (!formData.projectType) errors.projectType = 'Select a project focus.';
    if (!formData.timeline) errors.timeline = 'Let us know your timeline.';
    if (!formData.budget) errors.budget = 'Choose the budget range that fits best.';
    if (!formData.message.trim()) errors.message = 'Share a quick note about what you need.';

    return errors;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const errors = validateForm();

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setSubmissionError(null);
      setSubmitStatus('idle');
      return;
    }

    setIsSubmitting(true);
    setSubmissionError(null);

    try {
      if (db) {
        await addDoc(collection(db, 'contactRequests'), {
          ...formData,
          createdAt: serverTimestamp(),
          status: 'new',
          source: 'personal-info-modal',
        });
      } else if (typeof window !== 'undefined') {
        const subject = encodeURIComponent(`New project inquiry – ${formData.name.trim() || 'inQu lead'}`);
        const bodyLines = [
          `Name: ${formData.name}`,
          `Email: ${formData.email}`,
          `Company: ${formData.company || 'N/A'}`,
          `Project type: ${formData.projectType}`,
          `Timeline: ${formData.timeline}`,
          `Budget: ${formData.budget}`,
          formData.referral ? `Referral: ${formData.referral}` : null,
          '',
          formData.message,
        ].filter(Boolean);
        const body = encodeURIComponent(bodyLines.join('\n'));
        window.open(`mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`, '_blank');
      }

      setSubmittedName(formData.name.trim() || 'there');
      setSubmitStatus('success');
      setFormData({ ...DEFAULT_FORM_STATE });
      setFieldErrors({});
    } catch (error) {
      console.error('Contact form submission failed:', error);
      setSubmissionError('We hit a snag sending your brief. Try again or email us directly.');
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendAnother = () => {
    setSubmitStatus('idle');
    setFormData({ ...DEFAULT_FORM_STATE });
    setFieldErrors({});
    setShowContactForm(true);
    setSubmissionError(null);
    setSubmittedName('');
    requestAnimationFrame(() => {
      nameInputRef.current?.focus();
    });
  };

  if (!isOpen) return null;

  return (
    <div
      className={`personal-info-modal-overlay ${isClosing ? 'closing' : ''}`}
      onClick={handleClose}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div
        className="personal-info-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="personal-info-title"
      >
        <div className="personal-info-modal-header">
          <div className="personal-info-header-text">
            <span className="personal-info-eyebrow">Fractional product team</span>
            <h2 id="personal-info-title" className="personal-info-title">
              Custom Web App Development Studio
            </h2>
            <p className="personal-info-subtitle">
              inQu Studio helps founders and marketing teams launch high-impact web experiences with the speed of a startup and the polish of an agency.
            </p>
          </div>
          <button
            className="personal-info-close-btn"
            onClick={handleClose}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        <div className="personal-info-modal-content personal-info-layout">
          <section className="personal-info-overview" aria-label="Service overview">
            <div className="personal-info-highlight-grid">
              <div className="personal-info-highlight-card">
                <span className="personal-info-highlight-icon">⚡</span>
                <h3>Launch quickly</h3>
                <p>Clickable prototypes in 7 days and production-ready builds in as little as 3 weeks.</p>
              </div>
              <div className="personal-info-highlight-card">
                <span className="personal-info-highlight-icon">🎯</span>
                <h3>Conversion focused</h3>
                <p>We pair motion-rich UX with analytics-ready funnels so every launch is measurable.</p>
              </div>
              <div className="personal-info-highlight-card">
                <span className="personal-info-highlight-icon">🤝</span>
                <h3>Strategic partners</h3>
                <p>Weekly strategy calls, async Loom updates, and shared delivery boards keep you in the loop.</p>
              </div>
            </div>

            <div className="personal-info-capabilities">
              <h4>Core capabilities</h4>
              <ul className="personal-info-chip-group">
                <li>Next.js & React engineering</li>
                <li>Custom UI systems</li>
                <li>Realtime collaboration tools</li>
                <li>Firebase & Supabase backends</li>
                <li>Product strategy sprints</li>
                <li>Interactive marketing sites</li>
              </ul>
            </div>

            <div className="personal-info-metrics">
              <div>
                <span className="personal-info-metric-number">24h</span>
                <span className="personal-info-metric-label">Average first reply</span>
              </div>
              <div>
                <span className="personal-info-metric-number">90%</span>
                <span className="personal-info-metric-label">Repeat collaborator rate</span>
              </div>
              <div>
                <span className="personal-info-metric-number">$10k+</span>
                <span className="personal-info-metric-label">Typical project starting point</span>
              </div>
            </div>

            <div className="personal-info-cta-group">
              <button className="personal-info-primary-cta" onClick={handleCtaClick} type="button">
                Start your project brief
              </button>
              <button className="personal-info-secondary-cta" onClick={handleEmailUs} type="button">
                Email us directly
              </button>
            </div>

            <p className="personal-info-disclaimer">
              Prefer a discovery call? Include times in the form and we&apos;ll send a calendar invite.
            </p>
          </section>

          <section
            className={`personal-info-form-container ${showContactForm ? 'active' : ''}`}
            ref={formRef}
            aria-live="polite"
            aria-hidden={!showContactForm && submitStatus !== 'success'}
          >
            {submitStatus === 'success' ? (
              <div className="personal-info-success">
                <div className="personal-info-success-icon">✨</div>
                <h3>Brief received!</h3>
                <p>
                  Thanks {submittedName || 'there'}—we&apos;ll review and respond within 24 hours with next steps and a tailored proposal.
                </p>
                <div className="personal-info-success-actions">
                  <button className="personal-info-primary-cta" type="button" onClick={handleSendAnother}>
                    Submit another project
                  </button>
                  <button className="personal-info-secondary-cta" type="button" onClick={handleClose}>
                    Close modal
                  </button>
                </div>
              </div>
            ) : (
              <>
                <header className="personal-info-form-header">
                  <span className="personal-info-form-badge">Project intake</span>
                  <h3>Tell us about your build</h3>
                  <p>
                    A quick brief helps us prep accurate timelines and pricing before we hop on a call.
                  </p>
                </header>
                <form className="personal-info-form" onSubmit={handleSubmit}>
                  <div className="personal-info-field">
                    <label htmlFor="personal-info-name">Full name *</label>
                    <input
                      id="personal-info-name"
                      ref={nameInputRef}
                      type="text"
                      value={formData.name}
                      onChange={handleInputChange('name')}
                      placeholder="Jane Doe"
                      autoComplete="name"
                    />
                    {fieldErrors.name && <span className="personal-info-field-error">{fieldErrors.name}</span>}
                  </div>

                  <div className="personal-info-field">
                    <label htmlFor="personal-info-email">Work email *</label>
                    <input
                      id="personal-info-email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange('email')}
                      placeholder="you@company.com"
                      autoComplete="email"
                    />
                    {fieldErrors.email && <span className="personal-info-field-error">{fieldErrors.email}</span>}
                  </div>

                  <div className="personal-info-field">
                    <label htmlFor="personal-info-company">Company or project name</label>
                    <input
                      id="personal-info-company"
                      type="text"
                      value={formData.company}
                      onChange={handleInputChange('company')}
                      placeholder="inQu Labs"
                    />
                  </div>

                  <div className="personal-info-field">
                    <label htmlFor="personal-info-project-type">What are we building? *</label>
                    <select
                      id="personal-info-project-type"
                      value={formData.projectType}
                      onChange={handleInputChange('projectType')}
                    >
                      <option value="" disabled>
                        Select an option
                      </option>
                      {PROJECT_TYPES.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    {fieldErrors.projectType && (
                      <span className="personal-info-field-error">{fieldErrors.projectType}</span>
                    )}
                  </div>

                  <div className="personal-info-field-group">
                    <div className="personal-info-field">
                      <label htmlFor="personal-info-timeline">Target launch *</label>
                      <select
                        id="personal-info-timeline"
                        value={formData.timeline}
                        onChange={handleInputChange('timeline')}
                      >
                        <option value="" disabled>
                          Choose a timeline
                        </option>
                        {TIMELINE_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                      {fieldErrors.timeline && (
                        <span className="personal-info-field-error">{fieldErrors.timeline}</span>
                      )}
                    </div>

                    <div className="personal-info-field">
                      <label htmlFor="personal-info-budget">Budget range *</label>
                      <select
                        id="personal-info-budget"
                        value={formData.budget}
                        onChange={handleInputChange('budget')}
                      >
                        <option value="" disabled>
                          Share an estimate
                        </option>
                        {BUDGET_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                      {fieldErrors.budget && (
                        <span className="personal-info-field-error">{fieldErrors.budget}</span>
                      )}
                    </div>
                  </div>

                  <div className="personal-info-field">
                    <label htmlFor="personal-info-referral">How did you hear about us?</label>
                    <input
                      id="personal-info-referral"
                      type="text"
                      value={formData.referral}
                      onChange={handleInputChange('referral')}
                      placeholder="Search, referral, social, event..."
                    />
                  </div>

                  <div className="personal-info-field">
                    <label htmlFor="personal-info-message">Project goals *</label>
                    <textarea
                      id="personal-info-message"
                      value={formData.message}
                      onChange={handleInputChange('message')}
                      placeholder="Share problem statements, must-have features, success metrics, or links for inspiration."
                      rows={5}
                    />
                    {fieldErrors.message && (
                      <span className="personal-info-field-error">{fieldErrors.message}</span>
                    )}
                  </div>

                  {submissionError && <div className="personal-info-form-error">{submissionError}</div>}

                  <button className="personal-info-primary-cta" type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Sending...' : 'Submit project brief'}
                  </button>

                  <p className="personal-info-privacy">
                    We respect your inbox. No spam—just a thoughtful response tailored to your project.
                  </p>
                </form>
              </>
            )}
          </section>
        </div>

        <div className="personal-info-modal-footer">
          <span className="personal-info-footer-text">
            Prefer a quick email? <button type="button" onClick={handleEmailUs} className="personal-info-footer-link">{CONTACT_EMAIL}</button>
          </span>
          <button className="personal-info-btn" onClick={handleClose} type="button">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
