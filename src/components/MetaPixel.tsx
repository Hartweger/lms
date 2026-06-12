import Script from "next/script";
import { META_PIXEL_ID } from "@/lib/fbq";
import PixelPageView from "@/components/PixelPageView";

// Server komponenta - base kod se renderuje u SSR HTML (kao GTM/GA4), pa se okida rano.
// Base kod čita saglasnost SINHRONO iz localStorage (ključ 'cookie-consent', mora ostati
// u sinhronizaciji sa CONSENT_KEY iz src/lib/consent.ts - inline skript ne uvozi TS).
// Ako saglasnost nije data → fbq('consent','revoke') PRE init/PageView-a, pa pixel ništa
// ne šalje dok korisnik ne prihvati u CookieBanner-u.
function baseCode(pixelId: string): string {
  return `!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window,document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
try{if(localStorage.getItem('cookie-consent')!=='granted'){fbq('consent','revoke');}}catch(e){}
fbq('init','${pixelId}');
fbq('track','PageView');`;
}

export default function MetaPixel() {
  if (!META_PIXEL_ID) return null;

  return (
    <>
      <Script
        id="meta-pixel"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: baseCode(META_PIXEL_ID) }}
      />
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
      {/* PageView na klijentskim (SPA) navigacijama */}
      <PixelPageView />
    </>
  );
}
