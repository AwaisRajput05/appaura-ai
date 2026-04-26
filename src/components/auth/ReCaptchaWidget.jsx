// src/components/ReCaptchaWidget.jsx
import React, { useRef } from "react";
import ReCAPTCHA from "react-google-recaptcha";

const ReCaptchaWidget = ({ siteKey, onChange }) => {
  const recaptchaRef = useRef(null);

  const handleChange = (token) => {
    if (onChange) onChange(token);
  };

  return (
    <div className="flex justify-center my-3">
      <ReCAPTCHA
        ref={recaptchaRef}
        sitekey={siteKey}
        onChange={handleChange}
      />
    </div>
  );
};

export default ReCaptchaWidget;
