
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

export const EmailConfirmation = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const token = searchParams.get('token');
        const type = searchParams.get('type');
        
        if (!token || !type) {
          throw new Error('Missing verification parameters');
        }

        // For email confirmations, use the verification token
        if (type === 'signup' || type === 'email_change') {
          // Manually construct the URL for verification
          const { error } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: 'email',
          });

          if (error) {
            throw error;
          }

          toast({
            title: "Email verified successfully!",
            description: "Your account has been confirmed. You can now log in.",
          });
        } else {
          throw new Error('Unsupported verification type');
        }
      } catch (error: any) {
        console.error('Verification error:', error);
        toast({
          title: "Verification failed",
          description: error.message || "There was a problem verifying your email. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsVerifying(false);
        // Redirect to auth page after verification attempt
        setTimeout(() => {
          navigate('/auth');
        }, 2000);
      }
    };

    verifyEmail();
  }, [searchParams, navigate, toast]);

  return (
    <div className="min-h-screen bg-[#3A2618] flex flex-col items-center justify-center px-4">
      <div className="bg-[#E8DCC4] rounded-lg p-8 shadow-2xl max-w-md w-full">
        <h2 className="text-2xl font-serif font-semibold text-[#3A2618] mb-6 text-center">
          Email Verification
        </h2>
        
        {isVerifying ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3A2618] mx-auto"></div>
            <p className="mt-4 text-[#3A2618]">Verifying your email...</p>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-[#3A2618]">
              Verification complete. Redirecting to login page...
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailConfirmation;
