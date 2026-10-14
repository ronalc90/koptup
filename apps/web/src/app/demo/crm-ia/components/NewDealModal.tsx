'use client';

import Button from '@/components/ui/Button';
import { addDays } from './crm';
import DealForm, { DealFormValues } from './DealForm';
import { Modal } from './ui';
import { useCrmText } from './useCrmText';
import type { NewDealInput } from './useCrmStore';

interface Props {
  onClose: () => void;
  onCreate: (input: NewDealInput) => void;
}

const FORM_ID = 'crm-new-deal-form';

export default function NewDealModal({ onClose, onCreate }: Props) {
  const tx = useCrmText();
  const { t } = tx;

  const initial: DealFormValues = {
    company: '',
    contactName: '',
    role: '',
    nit: '',
    city: 'Bogotá',
    email: '',
    phone: '',
    channel: 'whatsapp',
    source: 'web',
    title: '',
    value: '',
    stage: 'prospect',
    owner: 'vr',
    closeDate: addDays(tx.ref, 45),
    size: 'medium',
    budgetConfirmed: false,
    decisionMaker: false,
    nextAction: '',
  };

  return (
    <Modal
      labelId="crm-new-deal-title"
      title={t('newDeal.title')}
      subtitle={t('newDeal.subtitle')}
      onClose={onClose}
      closeLabel={t('common.close')}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" form={FORM_ID}>
            {t('newDeal.submit')}
          </Button>
        </>
      }
    >
      <DealForm
        formId={FORM_ID}
        mode="create"
        initial={initial}
        onSubmit={(v) =>
          onCreate({
            contactName: v.contactName,
            company: v.company,
            role: v.role,
            nit: v.nit,
            city: v.city,
            email: v.email,
            phone: v.phone,
            channel: v.channel,
            source: v.source,
            owner: v.owner,
            value: v.value,
            stage: v.stage,
            closeDate: v.closeDate,
            size: v.size,
            budgetConfirmed: v.budgetConfirmed,
            decisionMaker: v.decisionMaker,
            title: v.title,
            nextAction: v.nextAction,
          })
        }
      />
    </Modal>
  );
}
