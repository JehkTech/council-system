import React from 'react';
import AuthPage from '../components/auth/AuthPage';

export default function Login() {
  return <AuthPage initialMode="login" redirectTo="/" />;
}
