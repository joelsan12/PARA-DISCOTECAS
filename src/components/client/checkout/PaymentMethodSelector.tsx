import type { ReactNode } from 'react';
import { CreditCard, Landmark } from 'lucide-react';
import { formatUsd } from '../../../lib/formatUsd';
import { esPaymentMethod } from '../../../lib/esLabels';

export type CheckoutPaymentMethod = 'credit_card' | 'transfer';

interface Props {
  paymentMethod: CheckoutPaymentMethod;
  setPaymentMethod: (method: CheckoutPaymentMethod) => void;
  depositRequired: number;
}

type PaymentMethod = CheckoutPaymentMethod;

const paymentMethods: Array<{ key: PaymentMethod; icon: ReactNode }> = [
  { key: 'credit_card', icon: <CreditCard size={15} /> },
  { key: 'transfer', icon: <Landmark size={15} /> },
];

export const PaymentMethodSelector = ({
  paymentMethod,
  setPaymentMethod,
  depositRequired,
}: Props) => {
  const columns = paymentMethods.length > 0 ? paymentMethods.length : 1;
  return (
    <div>
      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>
        Método de pago del anticipo ({formatUsd(depositRequired)})
      </label>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`, gap: '8px' }}>
        {paymentMethods.map(opt => {
          const isSel = paymentMethod === opt.key;
          return (
            <button
              type="button"
              key={opt.key}
              onClick={() => setPaymentMethod(opt.key)}
              style={{
                padding: '10px 8px',
                borderRadius: 'var(--radius-sm)',
                background: isSel ? 'rgba(229, 181, 79, 0.14)' : 'rgba(255, 255, 255, 0.03)',
                border: '1px solid',
                borderColor: isSel ? 'var(--accent)' : 'rgba(255, 255, 255, 0.08)',
                color: isSel ? '#fff' : 'var(--text-muted)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.76rem',
                fontWeight: 600
              }}
            >
              {opt.icon}
              <span>{esPaymentMethod(opt.key)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
