'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface ContactUsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FormData {
  name: string;
  email: string;
  company: string;
  projectType: string;
  projectDetails: string;
  budget: string;
  timeline: string;
}

interface FormErrors {
  [key: string]: string;
}

export default function ContactUsModal({ isOpen, onClose }: ContactUsModalProps) {
  const [isClosing, setIsClosing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    company: '',
    projectType: '',
    projectDetails: '',
    budget: '',
    timeline: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (isOpen) {
      setIsClosing(false);
      setSubmitStatus('idle');
      setErrors({});
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
        name: '',
        email: '',
        company: '',
        projectType: '',
        projectDetails: '',
        budget: '',
        timeline: '',
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

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.projectDetails.trim()) {
      newErrors.projectDetails = 'Project details are required';
    } else if (formData.projectDetails.trim().length < 20) {
      newErrors.projectDetails = 'Please provide more details (at least 20 characters)';
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
        await addDoc(collection(db, 'contactSubmissions'), {
          ...formData,
          timestamp: serverTimestamp(),
          status: 'new',
        });
      }

      setSubmitStatus('success');

      // Reset form after a delay
      setTimeout(() => {
        setFormData({
          name: '',
          email: '',
          company: '',
          projectType: '',
          projectDetails: '',
          budget: '',
          timeline: '',
        });
        setTimeout(() => {
          handleClose();
        }, 1500);
      }, 2000);
    } catch (error) {
      console.error('Error submitting form:', error);
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

  if (!isOpen) return null;

  return (
    <div
      className={`contact-us-modal-overlay ${isClosing ? 'closing' : ''}`}
      onClick={handleClose}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div
        className="contact-us-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="contact-us-title"
      >
        <div className="contact-us-modal-header">
          <div>
            <h2 id="contact-us-title" className="contact-us-title">
              Let's Connect
            </h2>
            <p className="contact-us-subtitle">
              Have questions about Inqu or want to know more about my work? I'd love to hear from you!
            </p>
          </div>
          <button
            className="contact-us-close-btn"
            onClick={handleClose}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        {submitStatus === 'success' ? (
          <div className="contact-us-success">
            <div className="contact-us-success-icon">✓</div>
            <h3 className="contact-us-success-title">Thanks for Reaching Out!</h3>
            <p className="contact-us-success-message">
              I've received your message and will get back to you soon.
              <br />
              Looking forward to connecting with you!
            </p>
          </div>
        ) : submitStatus === 'error' ? (
          <div className="contact-us-error">
            <div className="contact-us-error-icon">⚠</div>
            <h3 className="contact-us-error-title">Oops! Something went wrong</h3>
            <p className="contact-us-error-message">
              Please try again or reach out directly via email.
            </p>
            <button className="contact-us-retry-btn" onClick={() => setSubmitStatus('idle')}>
              Try Again
            </button>
          </div>
        ) : (
          <form className="contact-us-form" onSubmit={handleSubmit}>
            <div className="contact-us-form-content">
              {/* Value Proposition Section */}
              <div className="contact-us-value-prop">
                <div className="contact-us-value-icon">💬</div>
                <h3 className="contact-us-value-title">What You Can Reach Out About</h3>
                <ul className="contact-us-value-list">
                  <li>💡 Questions about Inqu and how it works</li>
                  <li>🤝 Collaboration opportunities</li>
                  <li>💭 Ideas or feedback you'd like to share</li>
                  <li>🎨 Interest in my projects and work</li>
                  <li>📚 General inquiries or just saying hello</li>
                </ul>
              </div>

              {/* Form Fields */}
              <div className="contact-us-form-fields">
                <div className="contact-us-form-row">
                  <div className="contact-us-form-group">
                    <label htmlFor="name" className="contact-us-label">
                      Your Name <span className="contact-us-required">*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className={`contact-us-input ${errors.name ? 'contact-us-input-error' : ''}`}
                      placeholder="Your name"
                      required
                    />
                    {errors.name && <span className="contact-us-error-text">{errors.name}</span>}
                  </div>

                  <div className="contact-us-form-group">
                    <label htmlFor="email" className="contact-us-label">
                      Email Address <span className="contact-us-required">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`contact-us-input ${errors.email ? 'contact-us-input-error' : ''}`}
                      placeholder="your.email@example.com"
                      required
                    />
                    {errors.email && <span className="contact-us-error-text">{errors.email}</span>}
                  </div>
                </div>

                <div className="contact-us-form-row">
                  <div className="contact-us-form-group">
                    <label htmlFor="company" className="contact-us-label">
                      Where You're From (Optional)
                    </label>
                    <input
                      type="text"
                      id="company"
                      name="company"
                      value={formData.company}
                      onChange={handleChange}
                      className="contact-us-input"
                      placeholder="City, Country, or Organization"
                    />
                  </div>

                  <div className="contact-us-form-group">
                    <label htmlFor="projectType" className="contact-us-label">
                      Topic
                    </label>
                    <select
                      id="projectType"
                      name="projectType"
                      value={formData.projectType}
                      onChange={handleChange}
                      className="contact-us-select"
                    >
                      <option value="">Select a topic</option>
                      <option value="inqu">Question about Inqu</option>
                      <option value="collaboration">Collaboration Opportunity</option>
                      <option value="feedback">Feedback or Ideas</option>
                      <option value="work">Interest in My Work</option>
                      <option value="general">General Inquiry</option>
                      <option value="other">Just Saying Hello</option>
                    </select>
                  </div>
                </div>

                <div className="contact-us-form-group">
                  <label htmlFor="projectDetails" className="contact-us-label">
                    Your Message <span className="contact-us-required">*</span>
                  </label>
                  <textarea
                    id="projectDetails"
                    name="projectDetails"
                    value={formData.projectDetails}
                    onChange={handleChange}
                    className={`contact-us-textarea ${errors.projectDetails ? 'contact-us-input-error' : ''}`}
                    placeholder="Tell me what's on your mind... What would you like to know or discuss?"
                    rows={5}
                    required
                  />
                  {errors.projectDetails && (
                    <span className="contact-us-error-text">{errors.projectDetails}</span>
                  )}
                </div>

                <div className="contact-us-form-row">
                  <div className="contact-us-form-group">
                    <label htmlFor="budget" className="contact-us-label">
                      How Did You Find Me? (Optional)
                    </label>
                    <select
                      id="budget"
                      name="budget"
                      value={formData.budget}
                      onChange={handleChange}
                      className="contact-us-select"
                    >
                      <option value="">Select an option</option>
                      <option value="social">Social Media</option>
                      <option value="friend">Friend or Colleague</option>
                      <option value="search">Search Engine</option>
                      <option value="platform">Through Inqu Platform</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="contact-us-form-group">
                    <label htmlFor="timeline" className="contact-us-label">
                      Best Time to Reach You (Optional)
                    </label>
                    <select
                      id="timeline"
                      name="timeline"
                      value={formData.timeline}
                      onChange={handleChange}
                      className="contact-us-select"
                    >
                      <option value="">Select preference</option>
                      <option value="morning">Morning</option>
                      <option value="afternoon">Afternoon</option>
                      <option value="evening">Evening</option>
                      <option value="anytime">Anytime</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="contact-us-modal-footer">
              <button
                type="button"
                className="contact-us-btn contact-us-btn-secondary"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="contact-us-btn contact-us-btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Sending...' : 'Send Message →'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}