
import React, { useState } from 'react';
import { GlobeAltIcon, DevicePhoneMobileIcon } from '../constants'; 

const inputFieldStyle = "bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-500 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm rounded-lg p-2.5";
const labelStyle = "block text-sm font-medium text-gray-300 mb-1";
const buttonPrimaryStyle = "px-6 py-2.5 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-md transition-colors";

const SettingsPage: React.FC = () => {
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [mobileNumber, setMobileNumber] = useState('');
  const [otpMessage, setOtpMessage] = useState('');
  const [languageMessage, setLanguageMessage] = useState('');

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedLanguage(e.target.value);
    setLanguageMessage(`Mock: Language preference set to ${e.target.options[e.target.selectedIndex].text}. App would refresh/translate.`);
    setTimeout(() => setLanguageMessage(''), 3000);
  };

  const handleMobileNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMobileNumber(e.target.value);
  };

  const handleSetupOtp = () => {
    if (!mobileNumber.match(/^\d{10}$/)) { 
      setOtpMessage('Mock: Please enter a valid 10-digit mobile number.');
      return;
    }
    setOtpMessage(`Mock: OTP setup initiated for ${mobileNumber}. An SMS would be sent.`);
    setTimeout(() => setOtpMessage(''), 5000);
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-100">Settings</h1>
      
      <div className="bg-gray-800 p-6 rounded-xl shadow-xl">
        <h2 className="text-xl font-semibold text-gray-100 mb-4 flex items-center">
          <GlobeAltIcon className="w-6 h-6 mr-2 text-primary-400" />
          Language Selection
        </h2>
        <p className="text-sm text-gray-400 mb-3">
          Choose your preferred language for the application. (This is a conceptual setting)
        </p>
        <div className="max-w-xs">
          <select 
            id="language" 
            name="language"
            value={selectedLanguage}
            onChange={handleLanguageChange}
            className={`${inputFieldStyle} mt-1 pr-8`}
          >
            <option value="en">English</option>
            <option value="hi">हिन्दी (Hindi)</option>
            <option value="ta">தமிழ் (Tamil)</option>
            <option value="te">తెలుగు (Telugu)</option>
          </select>
        </div>
        {languageMessage && <p className="mt-2 text-sm text-green-400">{languageMessage}</p>}
      </div>

      <div className="bg-gray-800 p-6 rounded-xl shadow-xl">
        <h2 className="text-xl font-semibold text-gray-100 mb-4 flex items-center">
          <DevicePhoneMobileIcon className="w-6 h-6 mr-2 text-primary-400" />
          OTP Mobile Login Setup
        </h2>
        <p className="text-sm text-gray-400 mb-3">
          Configure OTP-based login for enhanced security. (This is a conceptual setting)
        </p>
        <div className="space-y-3 max-w-md">
          <div>
            <label htmlFor="mobileNumber" className={labelStyle}>
              Registered Mobile Number
            </label>
            <input 
              type="tel" 
              name="mobileNumber" 
              id="mobileNumber"
              value={mobileNumber}
              onChange={handleMobileNumberChange}
              placeholder="Enter 10-digit mobile number"
              className={`${inputFieldStyle} mt-1`}
            />
          </div>
          <button
            onClick={handleSetupOtp}
            className={buttonPrimaryStyle}
          >
            Setup OTP Login
          </button>
        </div>
        {otpMessage && <p className="mt-3 text-sm text-primary-400">{otpMessage}</p>}
      </div>

       <div className="bg-gray-800 p-6 rounded-xl shadow-xl">
        <h2 className="text-xl font-semibold text-gray-100 mb-4">
          Other Settings
        </h2>
        <p className="text-sm text-gray-500">
            More application settings like user profile management, notification preferences, etc., would be available here in a full application.
        </p>
       </div>

    </div>
  );
};

export default SettingsPage;