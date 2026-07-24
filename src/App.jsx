import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './page/home';
import { SettingsPage } from './page/setings';
import { ChatPage } from './page/chatPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/chat" element={<ChatPage />} />
      </Routes>
    </BrowserRouter>
  );
}