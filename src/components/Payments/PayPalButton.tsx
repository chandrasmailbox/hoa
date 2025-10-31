import React, { useRef, useEffect } from 'react';

declare global {
  interface Window {
    paypal: any;
  }
}

interface PayPalButtonProps {
  amount: number;
  currency?: string;
  onSuccess: (details: any) => void;
  onError?: (error: any) => void;
}

export const PayPalButton: React.FC<PayPalButtonProps> = ({
  amount,
  currency = 'USD',
  onSuccess,
  onError,
}) => {
  const paypalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function renderPayPalButton() {
      if (paypalRef.current) {
        window.paypal.Buttons({
          style: { layout: 'vertical', color: 'blue', shape: 'rect', label: 'pay' },
          createOrder: (data: any, actions: any) => {
            return actions.order.create({
              purchase_units: [
                {
                  amount: {
                    value: amount.toFixed(2),
                  },
                },
              ],
            });
          },
          onApprove: async (data: any, actions: any) => {
            const details = await actions.order.capture();
            onSuccess(details);
          },
          onError: (err: any) => {
            if (onError) onError(err);
          },
        }).render(paypalRef.current);
      }
    }

    if (!window.paypal) {
      const script = document.createElement('script');
      script.src = `https://www.paypal.com/sdk/js?client-id=${import.meta.env.VITE_PAYPAL_CLIENT_ID}&currency=${currency}&components=buttons,funding-eligibility`;
      script.async = true;
      script.onload = () => renderPayPalButton();
      document.body.appendChild(script);
      return () => {
        document.body.removeChild(script);
        if (paypalRef.current) paypalRef.current.innerHTML = '';
      };
    } else {
      renderPayPalButton();
      return () => {
        if (paypalRef.current) paypalRef.current.innerHTML = '';
      };
    }
    // eslint-disable-next-line
  }, [amount, currency]);

  return <div ref={paypalRef} />;
};