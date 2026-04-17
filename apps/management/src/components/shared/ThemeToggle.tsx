import { Moon, Sun } from 'lucide-react';
import { useThemeStore } from '@/store/themeStore';

function ThemeToggle() {
  const { theme, toggle } = useThemeStore();

  return (
    <button
      onClick={toggle}
      className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}

export { ThemeToggle };
