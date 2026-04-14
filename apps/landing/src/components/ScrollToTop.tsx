import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Instantly scrolls to the top of the page whenever the route changes.
 * Must be rendered inside <BrowserRouter>.
 */
export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Use instant scroll (not smooth) so the user starts fresh at top
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname]);

  return null;
}
