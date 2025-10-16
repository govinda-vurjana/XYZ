import { useState, useEffect } from 'react';
import { AuthService, type User, type VoiceSettings as VoiceSettingsType } from '../services/auth';

interface VoiceSettingsProps {
  user: User;
  onUserUpdate: (user: User) => void;
  onClose: () => void;
}

const LANGUAGE_OPTIONS = [
  { code: 'en-US', name: 'English (US)' },
  { code: 'en-GB', name: 'English (UK)' },
  { code: 'es-ES', name: 'Spanish (Spain)' },
  { code: 'es-MX', name: 'Spanish (Mexico)' },
  { code: 'fr-FR', name: 'French (France)' },
  { code: 'de-DE', name: 'German (Germany)' },
  { code: 'it-IT', name: 'Italian (Italy)' },
  { code: 'pt-BR', name: 'Portuguese (Brazil)' },
  { code: 'ja-JP', name: 'Japanese (Japan)' },
  { code: 'ko-KR', name: 'Korean (South Korea)' },
  { code: 'zh-CN', name: 'Chinese (Simplified)' },
  { code: 'zh-TW', name: 'Chinese (Traditional)' }
];

export default function VoiceSettings({ user, onUserUpdate, onClose }: VoiceSettingsProps) {
  const [settings, setSettings] = useState<VoiceSettingsType>(() => {
    return user.preferences?.voiceSettings || {
      language: 'en-US',
      sensitivity: 0.5,
      customCommands: {},
      noiseReduction: true
    };
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isTestingMic, setIsTestingMic] = useState(false);
  const [micTestResult, setMicTestResult] = useState<string>('');
  const [availableMicrophones, setAvailableMicrophones] = useState<MediaDeviceInfo[]>([]);

  useEffect(() => {
    // Get available microphones
    navigator.mediaDevices.enumerateDevices()
      .then(devices => {
        const microphones = devices.filter(device => device.kind === 'audioinput');
        setAvailableMicrophones(microphones);
      })
      .catch(console.error);
  }, []);

  const handleSettingChange = (key: keyof VoiceSettingsType, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updatedUser = await AuthService.updateUserPreferences(user.id, {
        voiceSettings: settings
      });
      onUserUpdate(updatedUser);
      onClose();
    } catch (error) {
      console.error('Failed to save voice settings:', error);
      alert('Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const testMicrophone = async () => {
    setIsTestingMic(true);
    setMicTestResult('');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: settings.microphoneDeviceId ? { exact: settings.microphoneDeviceId } : undefined
        }
      });

      // Test speech recognition with current settings
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.lang = settings.language;
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.addEventListener('result', (event: any) => {
          const transcript = event.results[0][0].transcript;
          setMicTestResult(`✅ Test successful! Recognized: "${transcript}"`);
          stream.getTracks().forEach(track => track.stop());
          setIsTestingMic(false);
        });

        recognition.addEventListener('error', (event: any) => {
          setMicTestResult(`❌ Test failed: ${event.error}`);
          stream.getTracks().forEach(track => track.stop());
          setIsTestingMic(false);
        });

        recognition.addEventListener('end', () => {
          if (isTestingMic) {
            setMicTestResult('⚠️ No speech detected. Please try speaking when the test starts.');
            setIsTestingMic(false);
          }
          stream.getTracks().forEach(track => track.stop());
        });

        setMicTestResult('🎤 Listening... Please say something');
        recognition.start();

        // Auto-stop after 5 seconds
        setTimeout(() => {
          if (isTestingMic) {
            recognition.stop();
          }
        }, 5000);
      } else {
        setMicTestResult('❌ Speech recognition not supported in this browser');
        stream.getTracks().forEach(track => track.stop());
        setIsTestingMic(false);
      }
    } catch (error) {
      console.error('Microphone test failed:', error);
      setMicTestResult('❌ Microphone access denied or not available');
      setIsTestingMic(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Voice Settings</h2>
              <p className="text-gray-600 dark:text-gray-400">Configure your voice input preferences</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Language Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Speech Recognition Language
            </label>
            <select
              value={settings.language}
              onChange={(e) => handleSettingChange('language', e.target.value)}
              className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-gray-900 dark:text-white"
            >
              {LANGUAGE_OPTIONS.map(lang => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Select the language for speech recognition
            </p>
          </div>

          {/* Microphone Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Microphone Device
            </label>
            <select
              value={settings.microphoneDeviceId || ''}
              onChange={(e) => handleSettingChange('microphoneDeviceId', e.target.value || undefined)}
              className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-gray-900 dark:text-white"
            >
              <option value="">Default Microphone</option>
              {availableMicrophones.map(mic => (
                <option key={mic.deviceId} value={mic.deviceId}>
                  {mic.label || `Microphone ${mic.deviceId.substring(0, 8)}...`}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Choose which microphone to use for voice input
            </p>
          </div>

          {/* Sensitivity Slider */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Microphone Sensitivity: {Math.round(settings.sensitivity * 100)}%
            </label>
            <div className="relative">
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={settings.sensitivity}
                onChange={(e) => handleSettingChange('sensitivity', parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                <span>Low</span>
                <span>Medium</span>
                <span>High</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Adjust how sensitive the microphone is to your voice
            </p>
          </div>

          {/* Noise Reduction */}
          <div>
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={settings.noiseReduction}
                onChange={(e) => handleSettingChange('noiseReduction', e.target.checked)}
                className="w-5 h-5 text-amber-500 bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 rounded focus:ring-amber-500 focus:ring-2"
              />
              <div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Enable Noise Reduction
                </span>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Reduce background noise during voice input
                </p>
              </div>
            </label>
          </div>

          {/* Microphone Test */}
          <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Test Microphone
              </h3>
              <button
                onClick={testMicrophone}
                disabled={isTestingMic}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isTestingMic
                    ? 'bg-gray-300 dark:bg-slate-600 text-gray-500 cursor-not-allowed'
                    : 'bg-amber-500 hover:bg-amber-600 text-white'
                }`}
              >
                {isTestingMic ? 'Testing...' : 'Test Microphone'}
              </button>
            </div>
            {micTestResult && (
              <div className="text-sm text-gray-600 dark:text-gray-400 bg-white dark:bg-slate-800 rounded-lg p-3 border border-gray-200 dark:border-slate-600">
                {micTestResult}
              </div>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Test your microphone with current settings to ensure voice input works properly
            </p>
          </div>

          {/* Custom Commands (Future Enhancement) */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-500/20">
            <div className="flex items-center space-x-2 mb-2">
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-sm font-medium text-blue-700 dark:text-blue-300">
                Custom Voice Commands
              </h3>
            </div>
            <p className="text-xs text-blue-600 dark:text-blue-400">
              Custom voice commands will be available in a future update. You'll be able to create personalized shortcuts for common screenplay formatting.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-slate-700">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 ${
              isSaving
                ? 'bg-gray-300 dark:bg-slate-600 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white'
            }`}
          >
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
          .slider::-webkit-slider-thumb {
            appearance: none;
            height: 20px;
            width: 20px;
            border-radius: 50%;
            background: #f59e0b;
            cursor: pointer;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          }

          .slider::-moz-range-thumb {
            height: 20px;
            width: 20px;
            border-radius: 50%;
            background: #f59e0b;
            cursor: pointer;
            border: none;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          }
        `
      }} />
    </div>
  );
}