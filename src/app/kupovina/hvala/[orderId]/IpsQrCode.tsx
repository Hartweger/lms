"use client";

import { QRCodeSVG } from "qrcode.react";

interface Props {
  data: string;
}

export default function IpsQrCode({ data }: Props) {
  return (
    <div className="flex flex-col items-center gap-3 pt-4 border-t border-gray-100">
      <p className="text-sm text-gray-500">IPS QR kod za mobilno bankarstvo</p>
      <QRCodeSVG value={data} size={200} />
    </div>
  );
}
