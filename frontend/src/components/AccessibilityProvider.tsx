'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';

interface AccessibilityContextType {
  fontSize: number;
  increaseFontSize: () => void;
  decreaseFontSize: () => void;
  resetFontSize: () => void;
  isSpeaking: boolean;
  toggleSpeech: () => void;
  isPointAndReadActive: boolean;
  togglePointAndRead: () => void;
  speak: (text: string, isLast?: boolean) => void;
  stopSpeech: () => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) throw new Error('useAccessibility must be used within an AccessibilityProvider');
  return context;
};

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [fontSize, setFontSize] = useState(100);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPointAndReadActive, setIsPointAndReadActive] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const pathname = usePathname();

  const speak = useCallback((text: string, isLast = false) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';
    
    const ptVoice = voices.find(v => v.lang.includes('pt-BR')) || voices[0];
    if (ptVoice) utterance.voice = ptVoice;

    if (isLast) {
      utterance.onend = () => setIsSpeaking(false);
    }
    
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }, [voices]);

  const stopSpeech = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  // Stop speech when navigating
  useEffect(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, [pathname]);

  // Point and Read Logic
  useEffect(() => {
    if (!isPointAndReadActive) return;

    let lastElement: HTMLElement | null = null;
    let timeoutId: NodeJS.Timeout | null = null;

    const handlePoint = (e: MouseEvent | TouchEvent) => {
      const x = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const y = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const element = document.elementFromPoint(x, y) as HTMLElement;

      if (!element) return;

      // Find the closest text-bearing element
      const target = element.closest('h1, h2, h3, p, th, td, label, button, a, .text-sm, .text-lg') as HTMLElement;
      
      if (target && target !== lastElement) {
        const text = target.textContent?.trim();
        if (text && text.length > 1) {
          if (timeoutId) clearTimeout(timeoutId);

          timeoutId = setTimeout(() => {
            // Visual highlight
            const originalOutline = target.style.outline;
            target.style.outline = '2px solid #3b82f6';
            target.style.outlineOffset = '2px';
            
            window.speechSynthesis.cancel();
            speak(text);
            lastElement = target;

            setTimeout(() => {
              if (target) target.style.outline = originalOutline;
            }, 1000);
          }, 100); // 100ms debounce
        }
      }
    };

    window.addEventListener('mousemove', handlePoint as any);
    window.addEventListener('touchstart', handlePoint as any);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      window.removeEventListener('mousemove', handlePoint as any);
      window.removeEventListener('touchstart', handlePoint as any);
    };
  }, [isPointAndReadActive, speak]);

  // Initialize values from localStorage
  useEffect(() => {
    const savedFontSize = localStorage.getItem('accessibility_font_size');

    if (savedFontSize) setFontSize(parseInt(savedFontSize, 10));

    const handleVoicesChanged = () => {
      setVoices(window.speechSynthesis.getVoices());
    };

    window.speechSynthesis.onvoiceschanged = handleVoicesChanged;
    setVoices(window.speechSynthesis.getVoices());

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
      window.speechSynthesis.cancel();
    };
  }, []);

  // Apply font size to html element
  useEffect(() => {
    document.documentElement.style.fontSize = `${fontSize}%`;
    localStorage.setItem('accessibility_font_size', fontSize.toString());
  }, [fontSize]);

  const increaseFontSize = () => setFontSize(prev => Math.min(prev + 10, 150));
  const decreaseFontSize = () => setFontSize(prev => Math.max(prev - 10, 80));
  const resetFontSize = () => setFontSize(100);

  const toggleSpeech = () => {
    if (isSpeaking) {
      stopSpeech();
    } else {
      window.speechSynthesis.cancel();
      setIsSpeaking(true);
      
      const mainElement = document.querySelector('main') || document.body;
      const elements = mainElement.querySelectorAll('h1, h2, h3, p, th, td, label, .text-sm, .text-lg');
      
      const seenText = new Set<string>();
      const segments: string[] = [`Modo de voz ativado. Página: ${document.title}`];
      
      elements.forEach(el => {
        const htmlEl = el as HTMLElement;
        const text = htmlEl.textContent?.trim();
        
        if (text && text.length > 1) {
          const rect = htmlEl.getBoundingClientRect();
          const style = window.getComputedStyle(htmlEl);
          
          // Modern checkVisibility() or fallback to rect/style check
          const isActuallyVisible = 
            (typeof htmlEl.checkVisibility === 'function' ? htmlEl.checkVisibility() : true) &&
            rect.width > 0 && 
            rect.height > 0 &&
            style.display !== 'none' && 
            style.visibility !== 'hidden' && 
            style.opacity !== '0';

          // Normalize text to avoid duplicates (hidden vs visible versions often have same text)
          const normalizedText = text.toLowerCase().replace(/\s+/g, ' ').trim();

          if (isActuallyVisible && !seenText.has(normalizedText)) {
            const tagName = htmlEl.tagName.toLowerCase();
            let prefix = '';
            
            if (tagName === 'h1' || tagName === 'h2' || tagName === 'h3') {
              prefix = 'Título: ';
            } else if (tagName === 'th') {
              prefix = 'Coluna: ';
            }

            segments.push(prefix + text);
            seenText.add(normalizedText);
          }
        }
      });

      segments.push("Fim da leitura da página.");

      // Use the browser queue for natural pauses
      // Limit to first 100 segments to prevent browser hanging
      const limitedSegments = segments.slice(0, 100);
      limitedSegments.forEach((text, index) => {
        speak(text, index === limitedSegments.length - 1);
      });
    }
  };

  const togglePointAndRead = () => {
    const newValue = !isPointAndReadActive;
    setIsPointAndReadActive(newValue);
    localStorage.setItem('accessibility_point_read', newValue.toString());
    if (newValue) {
      window.speechSynthesis.cancel();
      speak("Modo de leitura por toque ativado. Passe o mouse ou toque nos elementos para ouvir.");
    } else {
      window.speechSynthesis.cancel();
    }
  };

  return (
    <AccessibilityContext.Provider value={{ 
      fontSize, 
      increaseFontSize, 
      decreaseFontSize, 
      resetFontSize,
      isSpeaking,
      toggleSpeech,
      isPointAndReadActive,
      togglePointAndRead,
      speak,
      stopSpeech
    }}>
      {children}
    </AccessibilityContext.Provider>
  );
}
