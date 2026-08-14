import React, { createContext, useContext, useState, useEffect } from 'react';

interface AccessibilityContextType {
  highContrast: boolean;
  toggleHighContrast: () => void;
  dyslexiaFont: boolean;
  toggleDyslexiaFont: () => void;
  fontSize: 'normal' | 'large' | 'xlarge';
  setFontSize: (size: 'normal' | 'large' | 'xlarge') => void;
  soundFeedback: boolean;
  toggleSoundFeedback: () => void;
  announce: (message: string) => void;
  currentAnnouncement: string;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [highContrast, setHighContrast] = useState<boolean>(() => {
    return localStorage.getItem('echonote_high_contrast') === 'true';
  });

  const [dyslexiaFont, setDyslexiaFont] = useState<boolean>(() => {
    return localStorage.getItem('echonote_dyslexia_font') === 'true';
  });

  const [fontSize, setFontSizeState] = useState<'normal' | 'large' | 'xlarge'>(() => {
    const saved = localStorage.getItem('echonote_font_size');
    return (saved as 'normal' | 'large' | 'xlarge') || 'normal';
  });

  const [soundFeedback, setSoundFeedback] = useState<boolean>(() => {
    return localStorage.getItem('echonote_sound_feedback') !== 'false';
  });

  const [currentAnnouncement, setCurrentAnnouncement] = useState<string>('');

  useEffect(() => {
    localStorage.setItem('echonote_high_contrast', String(highContrast));
    if (highContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
  }, [highContrast]);

  useEffect(() => {
    localStorage.setItem('echonote_dyslexia_font', String(dyslexiaFont));
    if (dyslexiaFont) {
      document.documentElement.classList.add('dyslexia-mode');
    } else {
      document.documentElement.classList.remove('dyslexia-mode');
    }
  }, [dyslexiaFont]);

  useEffect(() => {
    localStorage.setItem('echonote_font_size', fontSize);
    document.documentElement.setAttribute('data-font-size', fontSize);
  }, [fontSize]);

  const toggleHighContrast = () => {
    setHighContrast(prev => {
      const next = !prev;
      announce(next ? "High contrast mode enabled" : "High contrast mode disabled");
      return next;
    });
  };

  const toggleDyslexiaFont = () => {
    setDyslexiaFont(prev => {
      const next = !prev;
      announce(next ? "Dyslexia-friendly reading font enabled" : "Default font restored");
      return next;
    });
  };

  const setFontSize = (size: 'normal' | 'large' | 'xlarge') => {
    setFontSizeState(size);
    announce(`Font size changed to ${size}`);
  };

  const toggleSoundFeedback = () => {
    setSoundFeedback(prev => !prev);
  };

  const announce = (message: string) => {
    setCurrentAnnouncement(message);
    // Automatically clear after 4s so repeated announcements trigger
    setTimeout(() => {
      setCurrentAnnouncement('');
    }, 4000);
  };

  return (
    <AccessibilityContext.Provider
      value={{
        highContrast,
        toggleHighContrast,
        dyslexiaFont,
        toggleDyslexiaFont,
        fontSize,
        setFontSize,
        soundFeedback,
        toggleSoundFeedback,
        announce,
        currentAnnouncement
      }}
    >
      {/* Hidden Live Region for Screen Readers */}
      <div
        id="a11y-announcer"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {currentAnnouncement}
      </div>
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};
