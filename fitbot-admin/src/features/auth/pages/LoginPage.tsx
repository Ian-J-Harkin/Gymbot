import React from 'react';
import { AuthLayout } from '../components/AuthLayout';
import { LoginForm } from '../components/LoginForm';

const LoginPage: React.FC = () => {
  return (
    <AuthLayout
      title="Sign in to your account"
      subtitle="Welcome back! Please enter your details."
      footerText="Don't have an account?"
      footerLink="/register"
      footerLinkText="Sign up here"
    >
      <LoginForm />
    </AuthLayout>
  );
};

export default LoginPage;