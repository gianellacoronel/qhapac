"use client";

import QRCode from "react-qr-code";
import { buildQrPayload } from "@/lib/benefits/utils";

type BenefitQrProps = {
  benefitId: string;
  size?: number;
};

export function BenefitQr({ benefitId, size = 180 }: BenefitQrProps) {
  return (
    <div className="flex items-center justify-center rounded-xl border border-border/80 bg-white p-5 shadow-xs">
      <QRCode
        value={buildQrPayload(benefitId)}
        size={size}
        bgColor="#FFFFFF"
        fgColor="#2A2240"
        level="M"
        aria-label={`QR code for benefit ${benefitId}`}
      />
    </div>
  );
}
