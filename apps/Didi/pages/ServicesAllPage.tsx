import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { useDidiGestures } from '../hooks/useDidiGestures';
import { useDidiStrings } from '../hooks/useDidiStrings';
import { useDidiStore } from '../state';
import { TopBar } from '../components/ui';
import {
  IcServiceRide, IcServiceHitch, IcServiceDriver, IcServiceDelivery, IcServiceMore,
  IcServiceBike, IcServicePool, IcServiceExpress, IcServiceTransit, IcServiceFuel,
  IcServiceLoan, IcServicePet, IcServiceTour, IcServiceRental, IcServiceBus,
  IcPlane, IcStar, IcCoupon, IcWallet, IcSafety,
} from '../res/icons';

/** 更多服务(全部服务网格) —— 证据 s26、s27；正式图标，Stub → 暂未开放 */

function ServiceIcon({ Icon, color }: { Icon: LucideIcon; color: string }) {
  return (
    <span
      className="flex h-10 w-10 items-center justify-center rounded-2xl"
      style={{ background: `${color}1A` }}
    >
      <Icon size={22} strokeWidth={2.1} style={{ color }} />
    </span>
  );
}

function Stub({ Icon, color, label }: { Icon: LucideIcon; color: string; label: string }) {
  const { bindTap } = useDidiGestures();
  const toast = useDidiStore((s) => s.toast);
  const s = useDidiStrings();
  return (
    <button
      {...bindTap({ kind: 'action', id: 'services.all.stub' }, { onTrigger: () => toast(s.unavailable) })}
      className="flex flex-col items-center gap-1.5 bg-transparent border-none p-0"
    >
      <ServiceIcon Icon={Icon} color={color} />
      <span className="text-[11px] text-app-text">{label}</span>
    </button>
  );
}

function LinkItem({
  Icon,
  color,
  label,
  bind,
}: {
  Icon: LucideIcon;
  color: string;
  label: string;
  bind: object;
}) {
  return (
    <button {...bind} className="flex flex-col items-center gap-1.5 bg-transparent border-none p-0">
      <ServiceIcon Icon={Icon} color={color} />
      <span className="text-[11px] text-app-text">{label}</span>
    </button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <div className="text-[17px] font-bold text-app-text mb-3">{title}</div>
      <div className="grid grid-cols-5 gap-y-4">{children}</div>
    </div>
  );
}

export default function ServicesAllPage() {
  const { bindTap } = useDidiGestures();
  const toast = useDidiStore((s) => s.toast);
  const s = useDidiStrings();

  return (
    <div className="flex flex-col h-full bg-app-surface" data-status-bar-foreground="dark">
      <TopBar
        title={s.servicesTitle}
        right={(
          <button
            onClick={() => toast(s.unavailable)}
            className="text-[13px] text-app-text bg-transparent border-none p-1"
          >
            {s.edit}
          </button>
        )}
      />
      <div
        className="flex-1 overflow-y-auto px-4 pt-3 pb-8"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        <Section title={s.servicesDailyRide}>
          <LinkItem
            Icon={IcServiceRide}
            color="#FF7A45"
            label={s.serviceRide}
            bind={bindTap('services.all.ride')}
          />
          <LinkItem Icon={IcServiceDriver} color="#5B8DEF" label={s.serviceDriver} bind={bindTap('driver.fromServices')} />
          <LinkItem Icon={IcServiceHitch} color="#2BB0ED" label={s.serviceHitch} bind={bindTap('hitch.fromServices')} />
          <Stub Icon={IcServiceBike} color="#13B879" label={s.servicesBike} />
          <Stub Icon={IcServicePool} color="#FF9A6B" label={s.servicesPool} />
          <Stub Icon={IcServiceTransit} color="#4A90D9" label={s.servicesTransit} />
          <Stub Icon={IcServiceBus} color="#6B7C93" label={s.servicesShuttle} />
          <Stub Icon={IcServicePet} color="#E67E22" label={s.servicesPet} />
        </Section>

        <Section title={s.servicesDelivery}>
          <LinkItem Icon={IcServiceDelivery} color="#F5A623" label={s.categoryDelivery} bind={bindTap('delivery.fromServices')} />
          <Stub Icon={IcServiceExpress} color="#7C6AF2" label={s.servicesExpress} />
        </Section>

        <Section title={s.servicesTravel}>
          <LinkItem Icon={IcPlane} color="#5B8DEF" label={s.servicesTickets} bind={bindTap('travel.fromServices')} />
          <Stub Icon={IcServiceRental} color="#36B37E" label={s.servicesRental} />
          <Stub Icon={IcServiceTour} color="#00B8D9" label={s.servicesTour} />
        </Section>

        <Section title={s.servicesOwner}>
          <LinkItem Icon={IcServiceFuel} color="#36B37E" label={s.servicesFuel} bind={bindTap('owner.fromServices')} />
        </Section>

        <Section title={s.servicesConvenience}>
          <Stub Icon={IcServiceLoan} color="#FF7A45" label={s.servicesLoan} />
          <Stub Icon={IcSafety} color="#5B8DEF" label={s.servicesInsurance} />
          <Stub Icon={IcWallet} color="#F5A623" label={s.servicesTopup} />
        </Section>

        <Section title={s.servicesBenefits}>
          <Stub Icon={IcCoupon} color="#FF7A45" label={s.servicesDailyCoupon} />
          <Stub Icon={IcStar} color="#F5A623" label={s.servicesEarnFare} />
          <Stub Icon={IcServiceMore} color="#8B93A7" label={s.servicesSavingPlan} />
        </Section>
      </div>
    </div>
  );
}
