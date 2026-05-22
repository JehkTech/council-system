import React from 'react';
import AuthPage from '../components/auth/AuthPage';

export default function Register() {
  return <AuthPage initialMode="register" redirectTo="/" />;
}
