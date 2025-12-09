import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useCurrentAccount, useSignPersonalMessage, useSuiClient } from '@mysten/dapp-kit';
import { SessionKey } from '@mysten/seal';
import {
  loadSessionKey,
  saveSessionKey,
  clearSessionKey,
  clearAllExpiredSessions
} from '../utils/sessionStorage';
import { POSTS_PACKAGE_ID } from '../constants';

interface SessionKeyContextProps {
  sessionKey: SessionKey | null;
  isInitializing: boolean;
  error: Error | null;
  clearSession: () => void;
  initializeManually: () => Promise<void>;
}

const SessionKeyContext = createContext<SessionKeyContextProps | undefined>(undefined);

const TTL_MINUTES = 30;

export const SessionKeyProvider = ({ children }: { children: ReactNode }) => {
  const suiClient = useSuiClient();
  const currentAccount = useCurrentAccount();
  const { mutateAsync: signPersonalMessage } = useSignPersonalMessage();

  const [sessionKey, setSessionKey] = useState<SessionKey | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const clearSession = () => {
    if (currentAccount?.address) {
      clearSessionKey(currentAccount.address, POSTS_PACKAGE_ID);
      setSessionKey(null);
    }
  };

  useEffect(() => {
    // Clean up expired sessions on mount
    clearAllExpiredSessions();
  }, []);

  const initializeManually = async () => {
    if (!currentAccount?.address) {
      setSessionKey(null);
      return;
    }

    setIsInitializing(true);
    setError(null);

    try {
      // Create a new session key
      console.log('Creating new session key');
      const newSessionKey = await SessionKey.create({
        address: currentAccount.address,
        packageId: POSTS_PACKAGE_ID,
        ttlMin: TTL_MINUTES,
        suiClient,
      });

      // Sign the personal message
      const message = await signPersonalMessage({
        message: newSessionKey.getPersonalMessage(),
      });

      // Set the signature on the session key
      await newSessionKey.setPersonalMessageSignature(message.signature);

      // Save the session key to storage
      saveSessionKey(currentAccount.address, POSTS_PACKAGE_ID, newSessionKey);
      console.log('New session key created and saved');

      setSessionKey(newSessionKey);
      console.log('new session key', newSessionKey.export())
    } catch (err) {
      console.error('Error initializing session key:', err);
      setError(err instanceof Error ? err : new Error('Failed to initialize session key'));
      setSessionKey(null);
    } finally {
      setIsInitializing(false);
    }
  };

  useEffect(() => {
    const loadCachedSession = async () => {
      if (!currentAccount?.address) {
        setSessionKey(null);
        return;
      }

      // Only try to load a cached session key, don't create a new one
      const cachedSessionData = loadSessionKey(currentAccount.address, POSTS_PACKAGE_ID);

      if (cachedSessionData) {
        console.log('Loading cached session key');
        try {
          // Import the cached session key
          const restoredSessionKey = SessionKey.import(cachedSessionData, suiClient);

          // Double-check it's not expired
          if (!restoredSessionKey.isExpired()) {
            setSessionKey(restoredSessionKey);
            console.log('Successfully loaded cached session key');
            return;
          } else {
            console.log('Cached session key is expired, manual initialization required');
            clearSessionKey(currentAccount.address, POSTS_PACKAGE_ID);
            setSessionKey(null);
          }
        } catch (error) {
          console.error('Failed to import cached session key:', error);
          clearSessionKey(currentAccount.address, POSTS_PACKAGE_ID);
          setSessionKey(null);
        }
      } else {
        console.log('No cached session key found, manual initialization required');
        setSessionKey(null);
      }
    };

    loadCachedSession();
  }, [currentAccount?.address, suiClient]);

  // Clean up on disconnect
  useEffect(() => {
    if (!currentAccount?.address && sessionKey) {
      console.log('Wallet disconnected, clearing session');
      setSessionKey(null);
    }
  }, [currentAccount?.address, sessionKey]);

  return (
    <SessionKeyContext.Provider value={{ sessionKey, isInitializing, error, clearSession, initializeManually }}>
      {children}
    </SessionKeyContext.Provider>
  );
};

export const useSessionKey = () => {
  const context = useContext(SessionKeyContext);
  if (context === undefined) {
    throw new Error('useSessionKey must be used within a SessionKeyProvider');
  }
  return context;
};