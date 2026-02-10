import React from 'react';
import { AuthLayout } from '../components/AuthLayout';
import { RegisterForm } from '../components/RegisterForm';

const RegisterPage: React.FC = () => {
  return (
    <AuthLayout
      title="Create your account"
      subtitle="Get started with FitBot for your gym today."
      footerText="Already have an account?"
      footerLink="/login"
      footerLinkText="Sign in here"
    >
      <RegisterForm />
    </AuthLayout>
  );
};

export default RegisterPage;