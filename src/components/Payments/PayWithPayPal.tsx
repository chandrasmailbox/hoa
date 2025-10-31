import React, { useState } from 'react';
import { PayPalButton } from './PayPalButton';

export const PayWithPayPal = ({
  payment,
  onPaid,
}: {
  payment: { amount: number; id: string };
  onPaid: () => void;
}) => {
  const [show, setShow] = useState(false);

  return (
    <>
      <button
        onClick={() => setShow(true)}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
      >
        Pay Now
      </button>
      {show && (
        <div className="mt-4">
          <PayPalButton
            amount={payment.amount}
            onSuccess={() => {
              setShow(false);
              onPaid(); // Mark as paid in the app
            }}
            onError={(err) => {
              setShow(false);
              alert('PayPal payment failed!');
              console.error('PayPal error:', err);
            }}
          />
        </div>
      )}
    </>
  );
};