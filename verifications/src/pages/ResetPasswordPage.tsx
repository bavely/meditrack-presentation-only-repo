import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { gql, useMutation, isApolloError } from '@apollo/client';
import { Label } from '../components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import { cn } from '@/lib/utils';
const RESET_PASSWORD = gql`
  mutation ResetPassword($token: String!, $password: String!) {
    resetPassword(token: $token, password: $password) {
      success
      errors {
        field
        message
      }
      data {
        message
      }
    }
  }
`;

type FieldError = { field: string; message: string };
type ResetPasswordPayload = { message: string };
type ResetPasswordResponse = {
  resetPassword: {
    success: boolean;
    errors: FieldError[];
    data: ResetPasswordPayload | null;
  };
};

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userMsg, setUserMsg] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [resetPassword, { loading }] = useMutation<ResetPasswordResponse>(RESET_PASSWORD);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setUserMsg({ type: 'error', message: 'Passwords do not match!' });
      return;
    }

    try {
      const result = await resetPassword({ variables: { token, password } });

      if (result.data?.resetPassword.success) {
        setUserMsg({
          type: 'success',
          message: result.data.resetPassword.data?.message ?? 'Password reset successful.',
        });
      } else {
        const firstError = result.data?.resetPassword.errors[0];
        setUserMsg({
          type: 'error',
          message: firstError?.message ?? 'Unable to reset password.',
        });
      }
    } catch (error: unknown) {
      console.error('Reset password error', error);
      // Narrow the unknown to an ApolloError
      if (isApolloError(error as Error)) {
        const gqlErr = (error as import('@apollo/client').ApolloError).graphQLErrors?.[0];
        // Our interceptor stored the full envelope in extensions
        const ext = gqlErr?.extensions as {
          success: boolean;
          errors: Array<{ field: string; message: string }>;
          data: null;
        } | undefined;
        const msg =
          ext?.errors?.[0]?.message // our custom error string
          ?? gqlErr?.message // fallback GraphQLError message
          ?? 'Unable to reset password.';
        setUserMsg({ type: 'error', message: msg });
      } else {
        setUserMsg({
          type: 'error',
          message: 'Something went wrong. Please try again.',
        });
      }
    }
     
     

  };

  return (
    <div className="flex flex-col w-full min-w-full justify-center min-h-screen p-4 bg-gray-100">
      <h2 className="text-center text-2xl my-4 font-bold">Reset Password</h2>

      <form onSubmit={handleSubmit}>
        {userMsg && (
          <div
            className={cn(
              'text-white px-4 py-2 rounded-md mb-4',
              userMsg.type === 'success' ? 'bg-green-500' : 'bg-red-500'
            )}
          >
            {userMsg.message}
          </div>
        )}

        <LabelInputContainer className="mb-4">
          <Label htmlFor="password">New Password</Label>
          <PasswordInput
            id="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </LabelInputContainer>

        <LabelInputContainer className="mb-8">
          <Label htmlFor="confirm-password">Confirm Password</Label>
          <PasswordInput
            id="confirm-password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </LabelInputContainer>

        <button
          type="submit"
          disabled={loading}
          className="group/btn relative block h-10 w-full rounded-md bg-gradient-to-br from-black to-neutral-600 font-medium text-white shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] dark:bg-zinc-800 dark:from-zinc-900 dark:to-zinc-900 dark:shadow-[0px_1px_0px_0px_#27272a_inset,0px_-1px_0px_0px_#27272a_inset]"
        >
          {loading ? 'Resetting…' : 'Reset Password'}
        </button>
      </form>
    </div>
  );
}

const LabelInputContainer = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => <div className={cn('flex w-full flex-col space-y-2', className)}>{children}</div>;
