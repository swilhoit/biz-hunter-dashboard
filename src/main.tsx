import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Debug environment variables
console.log('🔧 Environment Debug:');
console.log('All import.meta.env:', import.meta.env);
console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Present' : 'Missing');

createRoot(document.getElementById("root")!).render(<App />);
