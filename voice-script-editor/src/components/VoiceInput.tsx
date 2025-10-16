import { useState, useRef, useEffect } from 'react';

interface VoiceInputProps {
  onTextReceived: (text: string) => void;
  onError?: (error: string) => void;
  className?: string;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  addEventListener(type: 'result', listener: (event: SpeechRecognitionEvent) => void): void;
  addEventListener(type: 'error', listener: (event: SpeechRecognitionErrorEvent) => void): void;
  addEventListener(type: 'start', listener: () => void): void;
  addEventListener(type: 'end', listener: () => void): void;
  addEventListener(type: 'speechstart', listener: () => void): void;
  addEventListener(type: 'speechend', listener: () => void): void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

export default function VoiceInput({ onTextReceived, onError, className = '' }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [interimText, setInterimText] = useState('');
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const silenceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Check if speech recognition is supported
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognition);

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.addEventListener('start', () => {
        setIsListening(true);
        setInterimText('');
      });

      recognition.addEventListener('end', () => {
        setIsListening(false);
        setInterimText('');
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
        }
      });

      recognition.addEventListener('result', (event: SpeechRecognitionEvent) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        setInterimText(interimTranscript);

        if (finalTranscript) {
          onTextReceived(finalTranscript);
          setInterimText('');
          
          // Reset silence timeout after receiving final text
          if (silenceTimeoutRef.current) {
            clearTimeout(silenceTimeoutRef.current);
          }
          
          // Auto-pause after 3 seconds of silence
          silenceTimeoutRef.current = setTimeout(() => {
            if (recognitionRef.current && isListening) {
              recognition.stop();
            }
          }, 3000);
        }
      });

      recognition.addEventListener('error', (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        setInterimText('');
        
        let errorMessage = 'Voice input error occurred';
        switch (event.error) {
          case 'no-speech':
            errorMessage = 'No speech detected. Please try again.';
            break;
          case 'audio-capture':
            errorMessage = 'Microphone not accessible. Please check permissions.';
            break;
          case 'not-allowed':
            errorMessage = 'Microphone access denied. Please allow microphone access.';
            break;
          case 'network':
            errorMessage = 'Network error. Please check your connection.';
            break;
          case 'service-not-allowed':
            errorMessage = 'Speech recognition service not available.';
            break;
          default:
            errorMessage = `Speech recognition error: ${event.error}`;
        }
        
        onError?.(errorMessage);
      });

      recognition.addEventListener('speechstart', () => {
        // Clear silence timeout when speech starts
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
        }
      });

      recognition.addEventListener('speechend', () => {
        // Start silence timeout when speech ends
        silenceTimeoutRef.current = setTimeout(() => {
          if (recognitionRef.current && isListening) {
            recognition.stop();
          }
        }, 3000);
      });

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
    };
  }, [onTextReceived, onError, isListening]);

  const toggleListening = () => {
    if (!isSupported) {
      onError?.('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    if (!recognitionRef.current) {
      onError?.('Speech recognition not initialized.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
    } else {
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.error('Failed to start speech recognition:', error);
        onError?.('Failed to start voice input. Please try again.');
      }
    }
  };

  if (!isSupported) {
    return (
      <div className={`${className} flex flex-col items-center`}>
        <button
          disabled
          className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center cursor-not-allowed opacity-50"
          title="Speech recognition not supported in this browser"
        >
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
          </svg>
        </button>
        <p className="text-xs text-gray-500 mt-2 text-center">
          Voice input not supported
        </p>
      </div>
    );
  }

  return (
    <div className={`${className} flex flex-col items-center`}>
      {/* Voice Input Button */}
      <button
        onClick={toggleListening}
        className={`
          w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-amber-500/30 shadow-2xl
          ${isListening 
            ? 'bg-gradient-to-r from-red-500 to-red-600 shadow-red-500/50 animate-pulse' 
            : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-amber-500/50'
          }
        `}
        title={isListening ? 'Stop voice input' : 'Start voice input'}
      >
        {isListening ? (
          <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 6h12v12H6z"/>
          </svg>
        ) : (
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        )}
      </button>

      {/* Status Text - Only show when listening for floating design */}
      {isListening && (
        <div className="mt-3 bg-slate-800/90 backdrop-blur-sm border border-slate-700/50 rounded-lg px-3 py-2 shadow-lg">
          <div className="text-center">
            <p className="text-sm text-amber-300 font-medium">
              🎤 Listening...
            </p>
            {interimText && (
              <p className="text-xs text-gray-400 italic max-w-xs truncate mt-1">
                "{interimText}"
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}