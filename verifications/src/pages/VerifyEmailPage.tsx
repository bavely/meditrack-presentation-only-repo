// src/pages/VerifyEmailPage.tsx
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { gql, useMutation } from "@apollo/client";
import { Button } from "@/components/ui/button";
import { Spinner } from '@/components/ui/spinner';
const VERIFY_EMAIL = gql`
  mutation VerifyEmail($token: String!) {
    verifyEmail(token: $token){
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

const REQUEST_NEW_VERIFICATION = gql`
  mutation ResendVerificationEmail($token: String!) {
    resendVerificationEmail(token: $token){
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

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [verifyEmail, { loading }] = useMutation(VERIFY_EMAIL);
  const [resendVerificationEmail, { loading: resendLoading }] = useMutation(
    REQUEST_NEW_VERIFICATION
  );
  const [message, setMessage] = useState("Verifying...");
  const [success, setSuccess] = useState(false);
  const [showRequestNewVerification, setShowRequestNewVerification] =
    useState(false);
  useEffect(() => {

    verifyEmail({ variables: { token } })
      .then((res) => {
        console.log(res);
        setSuccess(res.data.verifyEmail.success);
        setMessage(res.data.verifyEmail.data.message);
      })
      .catch((err) => {
        setSuccess(false);
        setMessage(err.message);
      });
  }, [token, verifyEmail]);


  const handleRequestNewVerification = () => {
    setMessage("");
    setShowRequestNewVerification(true);
    resendVerificationEmail({ variables: { token } })
      .then((res) => {
        

        console.log(res);
        setSuccess(res.data.resendVerificationEmail.success);
        setMessage(res.data.resendVerificationEmail.data.message);
      })
      .catch((err) => {
        console.log(err);
        setSuccess(false);

        setMessage(err.message);
      });
  };
  return (
    <div className="flex flex-col items-center justify-start min-h-screen p-4 bg-gray-100">
      {showRequestNewVerification ? (
        <>
          {resendLoading ? (
            <Spinner size="large" />
          ) : success ? (
            <p className="text-[green]">{message}</p>
          ) : (
            <p className="text-[red]">{message}</p>
          )}
        </>
      ) : (
        <>
          {" "}
          <h2 className="text-2xl font-bold">Email Verification</h2>
          {loading ? (
            <Spinner size="large" />
          ) : success ? (
            <>
              <div className="success-animation">
<svg className="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52"><circle className="checkmark__circle" cx="26" cy="26" r="25" fill="none" /><path className="checkmark__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" /></svg>
</div>
              <p className="text-[green]">{message}</p>
            </>
          ) : (
            <>
              <div className="error-animation">
  <svg className="crossmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
    <circle className="crossmark__circle" cx="26" cy="26" r="25" fill="none" />
    <path className="crossmark__line1" d="M16 16 L36 36" fill="none" />
    <path className="crossmark__line2" d="M36 16 L16 36" fill="none" />
  </svg>
</div>
              <p className="text-[red]">{message}</p>
              <Button
                className="mt-4"
                onClick={handleRequestNewVerification}
              >
                Request New Verification
              </Button>
            </>
          )}
        </>
      )}
    </div>
  );
}
