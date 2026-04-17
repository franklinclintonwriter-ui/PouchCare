/**
 * Websites — now merged into the Web Portfolio page.
 * This component redirects to /assets/domains (portfolio).
 */
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Websites() {
  const navigate = useNavigate();
  useEffect(() => { navigate('/assets/domains', { replace: true }); }, [navigate]);
  return null;
}
