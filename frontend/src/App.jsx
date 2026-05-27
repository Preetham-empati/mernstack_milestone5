import React, { useState } from 'react';

function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(null);
  const [submitMessage, setSubmitMessage] = useState('');

  const toggleView = () => {
    setIsRegistering(!isRegistering);
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setErrors({});
    setSubmitMessage('');
    setSubmitSuccess(null);
  };

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    
    if (errors.email) {
      setErrors(prevErrors => {
        const updated = { ...prevErrors };
        delete updated.email;
        return updated;
      });
    }
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);
    
    if (errors.password) {
      setErrors(prevErrors => {
        const updated = { ...prevErrors };
        delete updated.password;
        return updated;
      });
    }
  };

  const handleConfirmPasswordChange = (e) => {
    const value = e.target.value;
    setConfirmPassword(value);
    
    if (errors.confirmPassword) {
      setErrors(prevErrors => {
        const updated = { ...prevErrors };
        delete updated.confirmPassword;
        return updated;
      });
    }
  };

  const validateForm = () => {
    const tempErrors = {};
    
    if (!email.trim()) {
      tempErrors.email = 'Email is required';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        tempErrors.email = 'Please enter a valid email address (e.g., name@example.com)';
      }
    }
    
    if (!password) {
      tempErrors.password = 'Password is required';
    } else if (password.length < 6) {
      tempErrors.password = 'Password must be at least 6 characters long';
    }

    if (isRegistering) {
      if (!confirmPassword) {
        tempErrors.confirmPassword = 'Please confirm your password';
      } else if (password !== confirmPassword) {
        tempErrors.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitMessage('');
    setSubmitSuccess(null);

    const isValid = validateForm();
    if (!isValid) return;

    setIsLoading(true);

    const endpoint = isRegistering ? 'register' : 'login';
    const requestUrl = `http://localhost:5050/api/${endpoint}`;

    try {
      const response = await fetch(requestUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitSuccess(true);
        
        if (isRegistering) {
          setSubmitMessage('Registration successful! 🎉 You can now sign in below.');
          setIsRegistering(false);
          setPassword('');
          setConfirmPassword('');
          setErrors({});
        } else {
          setSubmitMessage(data.message || 'Login successful!');
          setEmail('');
          setPassword('');
        }
      } else {
        setSubmitSuccess(false);
        
        if (data.errors) {
          setErrors(data.errors);
          setSubmitMessage(data.message || 'Validation failed on the server.');
        } else {
          setSubmitMessage(data.message || 'Authentication failed. Please check inputs.');
        }
      }
    } catch (error) {
      setSubmitSuccess(false);
      setSubmitMessage('⚠️ Connection Error: Unable to connect to the backend server. Please make sure your Node/Express server is running on port 5050!');
      console.error('Fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="bg-orb orb-1"></div>
      <div className="bg-orb orb-2"></div>

      <div className="login-card">
        <div className="card-header">
          <div className="logo-badge">M</div>
          <h1>{isRegistering ? 'Register' : 'Login'}</h1>
          <p className="subtitle">
            {isRegistering ? 'Create your new account to authenticate' : 'Enter your details to validate and authenticate'}
          </p>
        </div>

        {submitMessage && (
          <div className={`status-banner ${submitSuccess ? 'banner-success' : 'banner-error'}`}>
            <span className="banner-icon">{submitSuccess ? '🎉' : '❌'}</span>
            <div className="banner-text">{submitMessage}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className={`form-group ${errors.email ? 'has-error' : ''}`}>
            <label htmlFor="email">Email Address</label>
            <div className="input-wrapper">
              <span className="input-icon">📧</span>
              <input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={handleEmailChange}
                className={errors.email ? 'input-error' : ''}
                disabled={isLoading}
              />
            </div>
            {errors.email && <span className="error-text">{errors.email}</span>}
          </div>

          <div className={`form-group ${errors.password ? 'has-error' : ''}`}>
            <label htmlFor="password">Password</label>
            <div className="input-wrapper">
              <span className="input-icon">🔒</span>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter password (min 6 chars)"
                value={password}
                onChange={handlePasswordChange}
                className={errors.password ? 'input-error' : ''}
                disabled={isLoading}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? 'Hide password' : 'Show password'}
                disabled={isLoading}
              >
                {showPassword ? '👁️' : '🙈'}
              </button>
            </div>
            {errors.password && <span className="error-text">{errors.password}</span>}
          </div>

          {isRegistering && (
            <div className={`form-group ${errors.confirmPassword ? 'has-error' : ''}`}>
              <label htmlFor="confirmPassword">Confirm Password</label>
              <div className="input-wrapper">
                <span className="input-icon">🔄</span>
                <input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Repeat your password"
                  value={confirmPassword}
                  onChange={handleConfirmPasswordChange}
                  className={errors.confirmPassword ? 'input-error' : ''}
                  disabled={isLoading}
                />
              </div>
              {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
            </div>
          )}

          <button type="submit" className="btn-submit" disabled={isLoading}>
            {isLoading ? (
              <span className="loading-spinner-wrapper">
                <span className="spinner"></span> Authenticating...
              </span>
            ) : (
              isRegistering ? 'Sign Up / Register' : 'Sign In'
            )}
          </button>
        </form>

        <div className="view-toggle-container">
          {isRegistering ? (
            <p>
              Already have an account? <button type="button" className="btn-toggle-link" onClick={toggleView}>Sign In</button>
            </p>
          ) : (
            <p>
              Don't have an account? <button type="button" className="btn-toggle-link" onClick={toggleView}>Sign Up</button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
