import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function useKeyboardNavigation() {
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Skip if user is typing in an input field
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement ||
        (event.target as HTMLElement)?.contentEditable === 'true'
      ) {
        return;
      }

      // Global keyboard shortcuts
      switch (event.key) {
        case '/':
          event.preventDefault();
          // Focus search input if available
          const searchInput = document.querySelector('input[placeholder*="Titles"]') as HTMLInputElement;
          if (searchInput) {
            searchInput.focus();
          }
          break;
        
        case 'h':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            router.push('/');
          }
          break;
        
        case 'm':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            router.push('/movies');
          }
          break;
        
        case 't':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            router.push('/tv-shows');
          }
          break;
        
        case 'e':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            router.push('/explore');
          }
          break;
        
        case 'l':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            router.push('/my-list');
          }
          break;
        
        case 'Escape':
          // Close any open modals or overlays
          const closeButtons = document.querySelectorAll('[aria-label*="Close"], [aria-label*="close"]');
          if (closeButtons.length > 0) {
            (closeButtons[closeButtons.length - 1] as HTMLElement).click();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [router]);
}

// Hook for focus management
export function useFocusManagement() {
  useEffect(() => {
    const handleFocusVisible = (event: FocusEvent) => {
      const target = event.target as HTMLElement;
      if (target && target.matches(':focus-visible')) {
        target.classList.add('focus-visible');
      }
    };

    const handleBlur = (event: FocusEvent) => {
      const target = event.target as HTMLElement;
      if (target) {
        target.classList.remove('focus-visible');
      }
    };

    document.addEventListener('focus', handleFocusVisible, true);
    document.addEventListener('blur', handleBlur, true);

    return () => {
      document.removeEventListener('focus', handleFocusVisible, true);
      document.removeEventListener('blur', handleBlur, true);
    };
  }, []);
}

// Hook for skip links
export function useSkipLinks() {
  useEffect(() => {
    const skipLink = document.createElement('a');
    skipLink.href = '#main-content';
    skipLink.textContent = 'Skip to main content';
    skipLink.className = 'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-white focus:text-black focus:px-4 focus:py-2 focus:rounded-md focus:outline-none focus:ring-2 focus:ring-red-500';
    skipLink.style.position = 'absolute';
    skipLink.style.top = '-40px';
    skipLink.style.left = '6px';
    skipLink.style.transition = 'top 0.3s';
    
    skipLink.addEventListener('focus', () => {
      skipLink.style.top = '6px';
    });
    
    skipLink.addEventListener('blur', () => {
      skipLink.style.top = '-40px';
    });

    document.body.insertBefore(skipLink, document.body.firstChild);

    return () => {
      if (skipLink.parentNode) {
        skipLink.parentNode.removeChild(skipLink);
      }
    };
  }, []);
}