import React, { useState, useEffect } from 'react';
import { MdSecurity, MdDevices, MdPin, MdDelete, MdAdd } from 'react-icons/md';
import { useAuth } from '../contexts/AuthContext';
import authService from '../services/auth';
import type { TrustedDevice } from '../types';

const SecuritySettings: React.FC = () => {
  const { user, setupPin, trustDevice } = useAuth();
  const [isSettingUpPin, setIsSettingUpPin] = useState(false);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [trustedDevices, setTrustedDevices] = useState<TrustedDevice[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTrustedDevices();
  }, []);

  const loadTrustedDevices = async () => {
    try {
      const response = await authService.getTrustedDevices();
      // Ensure we always set an array
      setTrustedDevices(Array.isArray(response.devices) ? response.devices : []);
    } catch (error) {
      console.error('Failed to load trusted devices:', error);
      setTrustedDevices([]); // Set to empty array on error
    }
  };

  const handleSetupPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (pin !== confirmPin) {
      setError('PINs do not match');
      return;
    }

    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      setError('PIN must be exactly 4 digits');
      return;
    }

    setLoading(true);
    try {
      await setupPin(pin);
      setSuccess('PIN set up successfully!');
      setPin('');
      setConfirmPin('');
      setIsSettingUpPin(false);
    } catch (err: any) {
      setError(err.message || 'Failed to set up PIN');
    } finally {
      setLoading(false);
    }
  };

  const handleTrustCurrentDevice = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await trustDevice();
      setSuccess('This device has been trusted!');
      await loadTrustedDevices();
    } catch (err: any) {
      setError(err.message || 'Failed to trust device');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveDevice = async (deviceId: number) => {
    if (!confirm('Are you sure you want to remove this trusted device?')) {
      return;
    }

    setLoading(true);
    try {
      await authService.removeTrustedDevice(deviceId);
      setSuccess('Device removed successfully');
      await loadTrustedDevices();
    } catch (err: any) {
      setError(err.message || 'Failed to remove device');
    } finally {
      setLoading(false);
    }
  };

  const handleDisablePin = async () => {
    if (!confirm('Are you sure you want to disable PIN login? You will need to use email and password to log in.')) {
      return;
    }

    setLoading(true);
    try {
      await authService.disablePin();
      setSuccess('PIN login has been disabled');
    } catch (err: any) {
      setError(err.message || 'Failed to disable PIN');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="flex items-center mb-6">
          <MdSecurity className="h-6 w-6 text-primary-600 dark:text-primary-400 mr-3" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Security Settings
          </h1>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <p className="text-red-800 dark:text-red-400">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
            <p className="text-green-800 dark:text-green-400">{success}</p>
          </div>
        )}

        {/* PIN Setup Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <MdPin className="h-5 w-5 text-gray-500 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                PIN Login
              </h2>
            </div>
            <div className="flex items-center space-x-2">
              {user?.pinEnabled && (
                <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 text-xs rounded-full">
                  Enabled
                </span>
              )}
            </div>
          </div>

          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Set up a 4-digit PIN for quick access on trusted devices.
          </p>

          {!user?.pinEnabled ? (
            !isSettingUpPin ? (
              <button
                onClick={() => setIsSettingUpPin(true)}
                className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <MdAdd className="h-4 w-4 mr-2" />
                Set Up PIN
              </button>
            ) : (
              <form onSubmit={handleSetupPin} className="space-y-4 max-w-xs">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Enter 4-digit PIN
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    pattern="[0-9]{4}"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-gray-100 text-center text-lg tracking-widest"
                    placeholder="••••"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Confirm PIN
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    pattern="[0-9]{4}"
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-gray-100 text-center text-lg tracking-widest"
                    placeholder="••••"
                  />
                </div>
                <div className="flex space-x-2">
                  <button
                    type="submit"
                    disabled={loading || pin.length !== 4 || confirmPin.length !== 4}
                    className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
                  >
                    {loading ? 'Setting up...' : 'Set PIN'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsSettingUpPin(false);
                      setPin('');
                      setConfirmPin('');
                      setError('');
                    }}
                    className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )
          ) : (
            <div className="space-y-2">
              <p className="text-green-600 dark:text-green-400">
                ✓ PIN login is enabled for this account
              </p>
              <button
                onClick={handleDisablePin}
                disabled={loading}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
              >
                {loading ? 'Disabling...' : 'Disable PIN'}
              </button>
            </div>
          )}
        </div>

        {/* Trusted Devices Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <MdDevices className="h-5 w-5 text-gray-500 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Trusted Devices
              </h2>
            </div>
            <button
              onClick={handleTrustCurrentDevice}
              disabled={loading}
              className="flex items-center px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <MdAdd className="h-4 w-4 mr-1" />
              Trust This Device
            </button>
          </div>

          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Trusted devices allow PIN login and extended sessions. Devices are automatically untrusted after 30 days of inactivity.
          </p>

          {(trustedDevices && trustedDevices.length === 0) ? (
            <p className="text-gray-500 dark:text-gray-400 italic">
              No trusted devices yet. Trust this device to enable PIN login.
            </p>
          ) : (
            <div className="space-y-3">
              {(trustedDevices || []).map((device) => (
                <div
                  key={device.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-md"
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {device.device_name || 'Unknown Device'}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Last used: {formatDate(device.last_used)}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Expires: {formatDate(device.expires_at)}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemoveDevice(device.id)}
                    disabled={loading}
                    className="flex items-center px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                  >
                    <MdDelete className="h-4 w-4 mr-1" />
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SecuritySettings;
