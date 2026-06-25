import React, { useState, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import styles from './Register.module.css'; // ✅ lowercase

const Register = () => {
  const navigate = useNavigate();
  const { register } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'renter',
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    const result = await register(formData.name, formData.email, formData.password, formData.role);
    
    if (result.success) {
      setSuccessMsg('✅ Account created successfully! Redirecting...');
      setTimeout(() => navigate('/'), 1500);
    } else {
      setErrorMsg(`❌ ${result.message}`);
    }
    
    setLoading(false);
  };

  return (
    <div className={styles.background}>
      <div className={styles.overlay}></div>

      <div className={styles.card}>
        <h2 className={styles.title}>Create Your Account</h2>
        <p className={styles.subtitle}>
          Join us today and book or provide cars easily.
        </p>

        {errorMsg && <p className={styles.error}>{errorMsg}</p>}
        {successMsg && <p className={styles.success}>{successMsg}</p>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            type="text"
            name="name"
            placeholder="👤 Full Name"
            onChange={handleChange}
            required
            className={styles.input}
          />
          <input
            type="email"
            name="email"
            placeholder="📧 Email Address"
            onChange={handleChange}
            required
            className={styles.input}
          />
          <input
            type="password"
            name="password"
            placeholder="🔒 Password"
            onChange={handleChange}
            required
            minLength="6"
            className={styles.input}
          />

          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className={styles.select}
          >
            <option value="renter">🚗 Renter</option>
            <option value="provider">🛠️ Provider</option>
          </select>

          <button type="submit" className={styles.button} disabled={loading}>
            {loading ? '⏳ Registering...' : 'Register'}
          </button>
        </form>

        <p className={styles.footerText}>
          Already have an account?{' '}
          <span onClick={() => navigate('/login')} className={styles.link}>
            Login here
          </span>
        </p>
      </div>
    </div>
  );
};

export default Register;