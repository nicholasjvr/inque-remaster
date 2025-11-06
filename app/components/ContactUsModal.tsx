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
              Let's Build Something Amazing Together
            </h2>
            <p className="contact-us-subtitle">
              Transform your vision into a powerful custom web application
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
            <h3 className="contact-us-success-title">Thank You!</h3>
            <p className="contact-us-success-message">
              We've received your inquiry and will get back to you within 24 hours.
              <br />
              Let's make your web application vision a reality!
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
                <div className="contact-us-value-icon">🚀</div>
                <h3 className="contact-us-value-title">Why Choose Us?</h3>
                <ul className="contact-us-value-list">
                  <li>⚡ Lightning-fast development with modern tech stack</li>
                  <li>🎨 Custom UI/UX designed specifically for your brand</li>
                  <li>💎 Scalable architecture that grows with your business</li>
                  <li>🔒 Secure & reliable infrastructure</li>
                  <li>📱 Fully responsive across all devices</li>
                  <li>🎯 Built to convert and engage your users</li>
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
                      placeholder="John Doe"
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
                      placeholder="john@company.com"
                      required
                    />
                    {errors.email && <span className="contact-us-error-text">{errors.email}</span>}
                  </div>
                </div>

                <div className="contact-us-form-row">
                  <div className="contact-us-form-group">
                    <label htmlFor="company" className="contact-us-label">
                      Company Name
                    </label>
                    <input
                      type="text"
                      id="company"
                      name="company"
                      value={formData.company}
                      onChange={handleChange}
                      className="contact-us-input"
                      placeholder="Your Company Inc."
                    />
                  </div>

                  <div className="contact-us-form-group">
                    <label htmlFor="projectType" className="contact-us-label">
                      Project Type
                    </label>
                    <select
                      id="projectType"
                      name="projectType"
                      value={formData.projectType}
                      onChange={handleChange}
                      className="contact-us-select"
                    >
                      <option value="">Select a type</option>
                      <option value="web-app">Custom Web Application</option>
                      <option value="dashboard">Analytics Dashboard</option>
                      <option value="ecommerce">E-commerce Platform</option>
                      <option value="saas">SaaS Product</option>
                      <option value="portal">Client Portal</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="contact-us-form-group">
                  <label htmlFor="projectDetails" className="contact-us-label">
                    Tell Us About Your Project <span className="contact-us-required">*</span>
                  </label>
                  <textarea
                    id="projectDetails"
                    name="projectDetails"
                    value={formData.projectDetails}
                    onChange={handleChange}
                    className={`contact-us-textarea ${errors.projectDetails ? 'contact-us-input-error' : ''}`}
                    placeholder="Describe your vision, goals, target audience, and any specific features you need..."
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
                      Budget Range
                    </label>
                    <select
                      id="budget"
                      name="budget"
                      value={formData.budget}
                      onChange={handleChange}
                      className="contact-us-select"
                    >
                      <option value="">Select range</option>
                      <option value="under-10k">Under $10,000</option>
                      <option value="10k-25k">$10,000 - $25,000</option>
                      <option value="25k-50k">$25,000 - $50,000</option>
                      <option value="50k-100k">$50,000 - $100,000</option>
                      <option value="100k-plus">$100,000+</option>
                    </select>
                  </div>

                  <div className="contact-us-form-group">
                    <label htmlFor="timeline" className="contact-us-label">
                      Timeline
                    </label>
                    <select
                      id="timeline"
                      name="timeline"
                      value={formData.timeline}
                      onChange={handleChange}
                      className="contact-us-select"
                    >
                      <option value="">Select timeline</option>
                      <option value="asap">As soon as possible</option>
                      <option value="1-3months">1-3 months</option>
                      <option value="3-6months">3-6 months</option>
                      <option value="6-12months">6-12 months</option>
                      <option value="exploring">Just exploring options</option>
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
                {isSubmitting ? 'Submitting...' : 'Send Inquiry →'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}