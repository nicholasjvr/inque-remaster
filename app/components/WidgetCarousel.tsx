'use client';

import { useState, useEffect } from 'react';
import WidgetCard from './WidgetCard';
import { Widget } from '@/hooks/useFirestore';

interface WidgetCarouselProps {
  widgets: Widget[];
  onSlotFocus: (slot: number) => void;
  isLoading: boolean;
}

export default function WidgetCarousel({ widgets, onSlotFocus, isLoading }: WidgetCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const totalSlots = 3;

  const updateCarousel = (index: number) => {
    setCurrentIndex(index);
  };

  const handlePrev = () => {
    const newIndex = currentIndex > 0 ? currentIndex - 1 : totalSlots - 1;
    updateCarousel(newIndex);
  };

  const handleNext = () => {
    const newIndex = currentIndex < totalSlots - 1 ? currentIndex + 1 : 0;
    updateCarousel(newIndex);
  };

  const handleDotClick = (index: number) => {
    updateCarousel(index);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex]);

  if (isLoading) {
    return (
      <div className="widget-carousel-container">
        <div className="carousel-header">
          <h3>Your Widget Timeline</h3>
          <p>Loading your widgets...</p>
        </div>
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="widget-carousel-container">
      <div className="carousel-header">
        <h3>Your Widget Timeline</h3>
        <p>Click on any slot to edit or upload a new widget</p>
      </div>

      <div className="carousel-track" style={{ transform: `translateX(-${currentIndex * 100}%)` }}>
        {Array.from({ length: totalSlots }, (_, index) => {
          const slot = index + 1;
          const widget = widgets.find(w => w.slot === slot);
          return (
            <WidgetCard
              key={slot}
              slot={slot}
              widget={widget}
              onFocus={() => onSlotFocus(slot)}
            />
          );
        })}
      </div>

      <div className="carousel-controls">
        <button className="carousel-btn prev-btn" onClick={handlePrev}>
          ‹
        </button>
        <div className="carousel-dots">
          {Array.from({ length: totalSlots }, (_, index) => (
            <span
              key={index}
              className={`dot ${index === currentIndex ? 'active' : ''}`}
              onClick={() => handleDotClick(index)}
            />
          ))}
        </div>
        <button className="carousel-btn next-btn" onClick={handleNext}>
          ›
        </button>
      </div>
    </div>
  );
}
