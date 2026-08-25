import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const PixelPageView = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    if (typeof window.fbq === 'function') {
      window.fbq('track', 'PageView');
    }
  }, [pathname]);

  return null;
};

export default PixelPageView;
