// src/components/common/modal/AuthModal.jsx
import React, { useState, useEffect } from 'react';
import Login from '../../auth/Login';
import Signup from '../../auth/Signup';
import ForgetPassword from '../../auth/Forget';
import AppauraLogo from '../../../assets/appauralogos.png';
import { MdClose } from 'react-icons/md';

export default function AuthModal({ isOpen, onClose, initialMode = 'login' }) {
  const [currentView, setCurrentView] = useState(initialMode);
  const [prefilledEmail, setPrefilledEmail] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    setCurrentView(initialMode);
    setPrefilledEmail('');
    setSuccessMessage('');
  }, [initialMode, isOpen]);

  const handleChildAction = (action, payload = '') => {
    if (action === 'login') {
      setCurrentView('login');
      if (typeof payload === 'string') {
        setSuccessMessage(payload);
      }
    } else if (action === 'signup') {
      setCurrentView('signup');
      setSuccessMessage('');
    } else if (action === 'forget') {
      setCurrentView('forget');
      if (payload) setPrefilledEmail(payload);
    } else if (action === null) {
      onClose?.();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative w-full max-w-md mx-auto">
        <div
          className="relative bg-white rounded-3xl shadow-2xl overflow-hidden"
          style={{ minHeight: '600px', maxHeight: '90vh' }}
          id="auth-container"
        >
          {/* Close button ONLY on Login screen */}
          {currentView === 'login' && (
            <button
              onClick={() => handleChildAction(null)}
              className="absolute top-4 right-4 z-[999] bg-white/90 hover:bg-white shadow-lg rounded-full p-3 transition-all hover:scale-110 active:scale-95"
              aria-label="Close modal"
            >
              <MdClose className="text-2xl text-gray-800" />
            </button>
          )}

          <div className="flex flex-col items-center justify-start min-h-[600px] px-6 py-12 overflow-y-auto">


            <div className="w-full">
              {/* LOGIN VIEW */}
              {currentView === 'login' && (
                <Login
                  isModal={true}
                  onClose={handleChildAction}
                  initialSuccess={successMessage}
                />
              )}

              {/* SIGNUP VIEW - Full replacement, no login behind */}
              {currentView === 'signup' && (
                <Signup isModal={true} onClose={handleChildAction} />
              )}

              {/* FORGET PASSWORD VIEW */}
              {currentView === 'forget' && (
                <ForgetPassword isModal={true} onClose={handleChildAction} initialEmail={prefilledEmail} />
              )}
            </div>

            {/* Bottom links - only show relevant one based on current view */}
            {currentView === 'login' && (
              <p className="mt-6 text-center text-sm text-gray-600">
                Don't have an account?{' '}
                <button
                  onClick={() => handleChildAction('signup')}
                  className="text-[#3C5690] hover:underline font-medium"
                >
                  Sign up
                </button>
              </p>
            )}

            {currentView === 'signup' && (
              <p className="mt-6 text-center text-sm text-gray-600">
                Already have an account?{' '}
                <button
                  onClick={() => handleChildAction('login')}
                  className="text-[#3C5690] hover:underline font-medium"
                >
                  Sign in
                </button>
              </p>
            )}

            {currentView === 'forget' && (
              <div className="mt-8 text-center">
               
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}