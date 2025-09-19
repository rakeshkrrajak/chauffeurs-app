import React from 'react';
import { NavigationItem } from './types';

// Icon components
export const HomeIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a1.5 1.5 0 012.122 0l8.954 8.955M2.25 12v10.5a.75.75 0 00.75.75h4.5a.75.75 0 00.75-.75v-6a.75.75 0 01.75-.75h3a.75.75 0 01.75.75v6a.75.75 0 00.75.75h4.5a.75.75 0 00.75-.75V12m-16.5 0a1.5 1.5 0 01-1.06-2.56l8.954-8.955a1.5 1.5 0 012.122 0l8.954 8.955a1.5 1.5 0 01-1.06 2.56H2.25z" />
  </svg>
);

export const TruckIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 0h5.25m-5.25 0V3.375M5.25 7.5h9" />
  </svg>
);

export const UserGroupIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-3.741-5.066M12 12a3 3 0 100-6 3 3 0 000 6zM21 12c0 1.683-.607 3.228-1.606 4.418M3.982 18.72a9.095 9.095 0 003.741-.479 3 3 0 00-3.741-5.066M12 12a3 3 0 100-6 3 3 0 000 6zM3 12c0 1.683.607 3.228 1.606 4.418m13.018-9.919A3 3 0 0013.965 3.06a3 3 0 00-2.436.505M17.65 18.61a3 3 0 00-3.262-.779M6.35 18.61a3 3 0 01-3.262-.779" />
  </svg>
);

export const UsersIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-2.452a9.357 9.357 0 00-2.056-4.321c-.394-.394-.824-.762-1.282-1.102M7.5 9.344c-.394-.394-.824-.762-1.282-1.102a9.357 9.357 0 00-2.056 4.321 9.337 9.337 0 004.121 2.452a9.38 9.38 0 002.625-.372M12 12.375c.394.394.824.762 1.282 1.102a9.357 9.357 0 012.056 4.321 9.337 9.337 0 01-4.121 2.452 9.38 9.38 0 01-2.625-.372 9.337 9.337 0 01-4.121-2.452 9.357 9.357 0 012.056-4.321c.394-.394.824-.762 1.282-1.102M12 12.375a9.337 9.337 0 004.121-2.452 9.357 9.357 0 00-2.056-4.321c-.394-.394-.824-.762-1.282-1.102a9.357 9.357 0 00-2.056 4.321 9.337 9.337 0 004.121 2.452zM12 6.75a2.25 2.25 0 110 4.5 2.25 2.25 0 010-4.5z" />
  </svg>
);

export const CogIcon = (props: React.SVGProps<SVGSVGElement>) => ( 
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.108 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.11v1.093c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.78.93l-.15.894c-.09.542-.56.94-1.11-.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.149-.894c-.07-.424-.384-.764-.78-.93-.398-.164-.854-.142-1.204.108l-.738.527a1.125 1.125 0 01-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93.78l-.894-.15c-.542-.09-.94-.56-.94-1.11v-1.094c0 .55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143.854-.107-1.204l-.527-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.93l.15-.894z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

export const ShieldCheckIcon = (props: React.SVGProps<SVGSVGElement>) => ( 
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
  </svg>
);

// Newly added icons
export const MapPinIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 005.16-4.242 12.082 12.082 0 00-11.48 0 16.981 16.981 0 005.16 4.242zM12 10a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" clipRule="evenodd" />
  </svg>
);

export const ArrowDownTrayIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path fillRule="evenodd" d="M12 2.25a.75.75 0 01.75.75v11.69l3.22-3.22a.75.75 0 111.06 1.06l-4.5 4.5a.75.75 0 01-1.06 0l-4.5-4.5a.75.75 0 111.06-1.06l3.22 3.22V3a.75.75 0 01.75-.75zm-9 13.5a.75.75 0 01.75.75v2.25a1.5 1.5 0 001.5 1.5h13.5a1.5 1.5 0 001.5-1.5V16.5a.75.75 0 011.5 0v2.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V16.5a.75.75 0 01.75-.75z" clipRule="evenodd" />
  </svg>
);

export const ArrowUpTrayIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path fillRule="evenodd" d="M11.47 2.47a.75.75 0 011.06 0l4.5 4.5a.75.75 0 01-1.06 1.06l-3.22-3.22V16.5a.75.75 0 01-1.5 0V4.81L8.03 8.03a.75.75 0 01-1.06-1.06l4.5-4.5zM3 15.75A.75.75 0 013.75 15h16.5a.75.75 0 010 1.5H3.75a.75.75 0 01-.75-.75zM3 19.5a.75.75 0 01.75-.75h16.5a.75.75 0 010 1.5H3.75a.75.75 0 01-.75-.75z" clipRule="evenodd" />
  </svg>
);


export const GlobeAltIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M12.75 2.25a.75.75 0 00-1.5 0v1.518A12.738 12.738 0 0012 3.75c1.15 0 2.26.15 3.32.418a.75.75 0 00.562-1.359A14.23 14.23 0 0012 2.25z" />
    <path fillRule="evenodd" d="M12 21.75c-5.385 0-9.75-4.365-9.75-9.75s4.365-9.75 9.75-9.75 9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75zM4.68 18.22a.75.75 0 001.06 0l1.125-1.125a.75.75 0 00-1.06-1.06L4.68 17.16a.75.75 0 000 1.06zm13.58-1.06a.75.75 0 00-1.06 0l-1.125 1.125a.75.75 0 001.06 1.06l1.125-1.125a.75.75 0 000-1.06zM12 5.25a.75.75 0 00-.75.75v1.5a.75.75 0 001.5 0v-1.5A.75.75 0 0012 5.25zM11.25 12a.75.75 0 00.75-.75v-1.5a.75.75 0 00-1.5 0v1.5a.75.75 0 00.75.75zM12 15.75a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5a.75.75 0 01.75-.75zM12.75 12a.75.75 0 00-.75.75v1.5a.75.75 0 001.5 0v-1.5a.75.75 0 00-.75-.75zM15.32 17.16a.75.75 0 001.06-1.06l-1.125-1.125a.75.75 0 00-1.06 1.06l1.125 1.125zM18.32 14.16a.75.75 0 00-1.06-1.06l-1.125 1.125a.75.75 0 101.06 1.06l1.125-1.125zM4.68 6.84a.75.75 0 001.06 0l1.125 1.125a.75.75 0 101.06-1.06L6.84 5.78a.75.75 0 00-1.06 1.06zM7.68 9.84a.75.75 0 00-1.06 0l-1.125 1.125a.75.75 0 001.06 1.06l1.125-1.125a.75.75 0 000-1.06z" clipRule="evenodd" />
  </svg>
);

export const DevicePhoneMobileIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path fillRule="evenodd" d="M6.75 2.25A.75.75 0 017.5 3v1.5h9V3A.75.75 0 0118 3v1.5h.75a3 3 0 013 3v11.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V7.5a3 3 0 013-3H6V3a.75.75 0 01.75-.75zM6 7.5a1.5 1.5 0 011.5-1.5h9A1.5 1.5 0 0118 7.5v11.25a1.5 1.5 0 01-1.5-1.5H7.5a1.5 1.5 0 01-1.5-1.5V7.5z" clipRule="evenodd" />
  </svg>
);

export const RouteIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path fillRule="evenodd" d="M4.125 3C3.504 3 3 3.504 3 4.125v15.75C3 20.496 3.504 21 4.125 21H5.25a.75.75 0 00.75-.75V3.75a.75.75 0 00-.75-.75H4.125zM18.75 3C18.129 3 17.625 3.504 17.625 4.125v15.75c0 .621.504 1.125 1.125 1.125H19.5a.75.75 0 00.75-.75V3.75a.75.75 0 00-.75-.75h-1.125zM12.375 3a.75.75 0 00-1.5 0v18a.75.75 0 001.5 0V3z" clipRule="evenodd" />
  </svg>
);

export const BellAlertIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path fillRule="evenodd" d="M11.25 4.5A6.75 6.75 0 004.5 11.25v2.645a.75.75 0 01-1.5 0V11.25C3 7.086 6.086 4.5 9.75 4.5h4.5c.34 0 .673.023 1 .065A.75.75 0 0014.25 3a.75.75 0 00-.75-.75h-4.5z" clipRule="evenodd" />
    <path fillRule="evenodd" d="M10.125 18.75a2.25 2.25 0 104.5 0v-5.645a.75.75 0 011.5 0v5.645a3.75 3.75 0 11-7.5 0v-5.645a.75.75 0 011.5 0v5.645z" clipRule="evenodd" />
    <path d="M15.75 4.5a.75.75 0 00-1.5 0v2.645a.75.75 0 01-1.5 0V4.5a.75.75 0 00-1.5 0v2.645a.75.75 0 01-1.5 0V4.5a.75.75 0 00-1.5 0v2.645a.75.75 0 01-1.5 0V4.5a.75.75 0 00-1.5 0V11.25a6.75 6.75 0 006.75 6.75h4.5a6.75 6.75 0 006.75-6.75V4.5a.75.75 0 00-1.5 0v2.645a.75.75 0 01-1.5 0V4.5z" />
  </svg>
);

export const CurrencyDollarIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path fillRule="evenodd" d="M14.25 8.25a.75.75 0 01.75.75v8.25a.75.75 0 01-1.5 0V9A.75.75 0 01.75-.75z" clipRule="evenodd" />
    <path fillRule="evenodd" d="M8.25 4.5A.75.75 0 019 5.25v2.25a.75.75 0 01-1.5 0V5.25A.75.75 0 018.25 4.5z" clipRule="evenodd" />
    <path fillRule="evenodd" d="M12 1.5a.75.75 0 01.75.75v19.5a.75.75 0 01-1.5 0V2.25A.75.75 0 0112 1.5z" clipRule="evenodd" />
    <path fillRule="evenodd" d="M15.75 4.5a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V5.25a.75.75 0 01.75-.75z" clipRule="evenodd" />
    <path fillRule="evenodd" d="M9.75 8.25a.75.75 0 01.75.75v8.25a.75.75 0 01-1.5 0V9A.75.75 0 019.75 8.25z" clipRule="evenodd" />
  </svg>
);

export const FireIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path fillRule="evenodd" d="M12.963 2.286a.75.75 0 00-1.071 1.052A24.453 24.453 0 0112 10.5c0 4.234-1.255 8.165-3.52 11.455a.75.75 0 101.325.772A25.952 25.952 0 0012 10.5a25.953 25.953 0 00-2.318-10.435.75.75 0 00-.735-1.28H12a.75.75 0 00.963-.434z" clipRule="evenodd" />
  </svg>
);

export const TagIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path fillRule="evenodd" d="M4.25 2.25a.75.75 0 00-.75.75v18a.75.75 0 00.75.75h15a.75.75 0 00.75-.75V3a.75.75 0 00-.75-.75h-15zm8.25 3a.75.75 0 00-1.5 0v3.5a.75.75 0 001.5 0v-3.5z" clipRule="evenodd" />
  </svg>
);

export const CreditCardIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M4.5 3.75a3 3 0 00-3 3v10.5a3 3 0 003 3h15a3 3 0 003-3V6.75a3 3 0 00-3-3h-15z" />
    <path fillRule="evenodd" d="M22.5 6.75a1.5 1.5 0 00-1.5-1.5h-15a1.5 1.5 0 00-1.5 1.5v10.5a1.5 1.5 0 001.5 1.5h15a1.5 1.5 0 001.5-1.5V6.75zM8.25 10.5a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5a.75.75 0 01.75-.75zm3.75-1.5a.75.75 0 00-1.5 0v4.5a.75.75 0 001.5 0v-4.5z" clipRule="evenodd" />
  </svg>
);

export const ClipboardListIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}><path fillRule="evenodd" d="M7.502 6.422a.75.75 0 011.06 0L12 9.858l3.438-3.436a.75.75 0 111.06 1.06L13.06 10.92l3.437 3.436a.75.75 0 11-1.06 1.06L12 11.977l-3.438 3.437a.75.75 0 01-1.06-1.06l3.436-3.438-3.436-3.438a.75.75 0 010-1.06z" clipRule="evenodd" /><path d="M1.5 12c0-5.798 4.702-10.5 10.5-10.5s10.5 4.702 10.5 10.5-4.702 10.5-10.5 10.5S1.5 17.798 1.5 12zM3 12a9 9 0 1118 0 9 9 0 01-18 0z" /></svg>
);

export const WrenchIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}><path fillRule="evenodd" d="M11.078 2.25c-.917 0-1.699.663-1.947 1.527l-.145.541a2.25 2.25 0 011.339 2.768l.484.204a2.251 2.251 0 012.406-.606l.33-.398a2.25 2.25 0 01-.307-3.268l-.444-.287A2.25 2.25 0 0011.078 2.25zM12.922 2.25c.917 0 1.699.663 1.947 1.527l.145.541a2.25 2.25 0 00-1.339 2.768l-.484.204a2.251 2.251 0 00-2.406-.606l-.33-.398a2.25 2.25 0 00.307 3.268l.444.287A2.25 2.25 0 0012.922 2.25zM11.078 21.75c-.917 0-1.699-.663-1.947-1.527l-.145-.541a2.25 2.25 0 011.339-2.768l.484-.204a2.251 2.251 0 012.406.606l.33.398a2.25 2.25 0 01-.307 3.268l-.444.287A2.25 2.25 0 0111.078 21.75zM12.922 21.75c.917 0 1.699-.663 1.947-1.527l.145-.541a2.25 2.25 0 00-1.339-2.768l-.484-.204a2.251 2.251 0 00-2.406-.606l-.33-.398a2.25 2.25 0 00.307 3.268l.444.287A2.25 2.25 0 0012.922 21.75zM2.25 11.078c0-.917.663-1.699 1.527-1.947l.541-.145a2.25 2.25 0 002.768 1.339l.204.484a2.251 2.251 0 00-.606 2.406l-.398.33a2.25 2.25 0 00-3.268-.307l-.287-.444A2.25 2.25 0 002.25 11.078zM2.25 12.922c0 .917.663 1.699 1.527 1.947l.541.145a2.25 2.25 0 012.768-1.339l.204-.484a2.251 2.251 0 01-.606-2.406l-.398-.33a2.25 2.25 0 01-3.268.307l-.287.444A2.25 2.25 0 012.25 12.922zM21.75 11.078c0-.917-.663-1.699-1.527-1.947l-.541-.145a2.25 2.25 0 01-2.768 1.339l-.204.484a2.251 2.251 0 01.606 2.406l.398.33a2.25 2.25 0 013.268-.307l.287-.444A2.25 2.25 0 0121.75 11.078zM21.75 12.922c0 .917-.663-1.699-1.527-1.947l-.541.145a2.25 2.25 0 00-2.768-1.339l-.204-.484a2.251 2.251 0 00.606-2.406l.398-.33a2.25 2.25 0 003.268.307l.287.444A2.25 2.25 0 0021.75 12.922zM12 7.75A4.25 4.25 0 1012 16.25 4.25 4.25 0 0012 7.75z" clipRule="evenodd" /></svg>
);

export const ChartPieIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M10.5 3.75a2.25 2.25 0 00-2.25 2.25v12a2.25 2.25 0 002.25 2.25h3a2.25 2.25 0 002.25-2.25v-12a2.25 2.25 0 00-2.25-2.25h-3z" /><path d="M3.75 10.5a2.25 2.25 0 002.25-2.25H3.75V6a2.25 2.25 0 012.25-2.25H6v2.25a2.25 2.25 0 002.25 2.25h1.5a.75.75 0 01.75.75v3a.75.75 0 01-.75.75h-1.5a2.25 2.25 0 00-2.25 2.25V18h.75A2.25 2.25 0 016 20.25v-2.25H3.75a2.25 2.25 0 01-2.25-2.25v-3c0-1.24 1.01-2.25 2.25-2.25zM15.75 10.5a2.25 2.25 0 002.25-2.25H15.75V6a2.25 2.25 0 012.25-2.25H18v2.25a2.25 2.25 0 002.25 2.25h1.5a.75.75 0 01.75.75v3a.75.75 0 01-.75.75h-1.5a2.25 2.25 0 00-2.25 2.25V18h.75a2.25 2.25 0 01-2.25 2.25v-2.25H15.75a2.25 2.25 0 01-2.25-2.25v-3c0-1.24 1.01-2.25 2.25-2.25z" /></svg>
);

export const DocumentChartBarIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}><path fillRule="evenodd" d="M3 3a1.5 1.5 0 00-1.5 1.5v12A1.5 1.5 0 003 18h3.75a.75.75 0 010 1.5H3a3 3 0 01-3-3V4.5a3 3 0 013-3h12a3 3 0 013 3v6.75a.75.75 0 01-1.5 0V4.5a1.5 1.5 0 00-1.5-1.5h-12z" clipRule="evenodd" /><path d="M10.5 9.75a.75.75 0 01.75-.75h1.5a.75.75 0 01.75.75v6a.75.75 0 01-.75.75h-1.5a.75.75 0 01-.75-.75v-6z" /><path d="M15 12.75a.75.75 0 01.75-.75h1.5a.75.75 0 01.75.75v3a.75.75 0 01-.75.75h-1.5a.75.75 0 01-.75-.75v-3z" /><path d="M6 11.25a.75.75 0 01.75-.75h1.5a.75.75 0 01.75.75v4.5a.75.75 0 01-.75.75h-1.5a.75.75 0 01-.75-.75v-4.5z" /><path d="M20.625 15.75a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0v-2.25a.75.75 0 01.75-.75z" /></svg>
);

export const EnvelopeIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M1.5 8.67v8.58a3 3 0 003 3h15a3 3 0 003-3V8.67l-8.928 5.493a3 3 0 01-3.144 0L1.5 8.67z" /><path d="M22.5 6.908V6.75a3 3 0 00-3-3h-15a3 3 0 00-3 3v.158l9.714 5.978a1.5 1.5 0 001.572 0L22.5 6.908z" /></svg>
);

export const BanknotesIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M12.75 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
    <path fillRule="evenodd" d="M3 6a3 3 0 013-3h12a3 3 0 013 3v12a3 3 0 01-3 3H6a3 3 0 01-3-3V6zm9 1.5a.75.75 0 00-1.5 0v.25a.75.75 0 001.5 0V7.5zM12 12a.75.75 0 01.75-.75h.25a.75.75 0 010 1.5H12a.75.75 0 01-.75-.75zM14.25 12a.75.75 0 00-1.5 0v.25a.75.75 0 001.5 0V12zM15 15a.75.75 0 01.75-.75h.25a.75.75 0 010 1.5H15a.75.75 0 01-.75-.75zM12 15a.75.75 0 00-1.5 0v.25a.75.75 0 001.5 0V15zM8.25 9.75a.75.75 0 01.75-.75h.25a.75.75 0 010 1.5H9a.75.75 0 01-.75-.75zM9 12a.75.75 0 00-1.5 0v.25a.75.75 0 001.5 0V12zM6.75 12a.75.75 0 01.75-.75h.25a.75.75 0 010 1.5H7.5a.75.75 0 01-.75-.75z" clipRule="evenodd" />
  </svg>
);

export const BuildingStorefrontIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M13.5 2.25a.75.75 0 00-1.5 0v1.136a4.505 4.505 0 00-4.422 4.422v1.136a.75.75 0 001.5 0v-1.136a3 3 0 013-3V15a.75.75 0 001.5 0V3.386a3 3 0 013 3v1.136a.75.75 0 001.5 0V6.386a4.505 4.505 0 00-4.422-4.422V2.25z" /><path fillRule="evenodd" d="M10.06 5.56a.75.75 0 00-1.06-1.06L7.668 5.832a.75.75 0 001.06 1.06l1.332-1.332zm3.878 1.06a.75.75 0 00-1.06-1.06l-1.332 1.332a.75.75 0 001.06 1.06l1.332-1.332z" clipRule="evenodd" /><path d="M17.25 12.75a.75.75 0 00-1.5 0v2.636a.75.75 0 101.5 0v-2.636z" /><path fillRule="evenodd" d="M6.386 21.75A4.505 4.505 0 0010.5 18.386V16.5a.75.75 0 00-1.5 0v1.886a3 3 0 01-3 3h1.136a.75.75 0 100-1.5H6.386zM15.386 21.75h1.136a.75.75 0 100-1.5h-1.136a3 3 0 01-3-3V16.5a.75.75 0 00-1.5 0v1.886a4.505 4.505 0 004.114 3.364z" clipRule="evenodd" /></svg>
);

export const RectangleStackIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}><path fillRule="evenodd" d="M2.25 12.75c0-.736.64-1.25 1.5-1.25h16.5c.86 0 1.5.514 1.5 1.25v6c0 .736-.64 1.25-1.5 1.25H3.75c-.86 0-1.5-.514-1.5-1.25v-6zM3.75 14.25a.75.75 0 00-.75.75v3a.75.75 0 00.75.75h16.5a.75.75 0 00.75-.75v-3a.75.75 0 00-.75-.75H3.75z" clipRule="evenodd" /><path d="M2.25 4.5A.75.75 0 013 3.75h18a.75.75 0 010 1.5H3a.75.75 0 01-.75-.75z" /><path d="M2.25 8.25A.75.75 0 013 7.5h18a.75.75 0 010 1.5H3A.75.75 0 012.25 8.25z" /></svg>
);

export const ClipboardDocumentCheckIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
    </svg>
);

export const CalendarDaysIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0h18M9.75 12.75h4.5" />
    </svg>
);

export const SunIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
  </svg>
);

export const MoonIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25c0 5.385 4.365 9.75 9.75 9.75 2.572 0 4.921-.994 6.697-2.643a.75.75 0 01.255-1.357z" />
  </svg>
);

export const PlusCircleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export const DocumentReportIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
);

export const WifiIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z" /></svg>
);

export const PaperAirplaneIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>
);

export const QrCodeIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.5A.75.75 0 014.5 3.75h1.5a.75.75 0 01.75.75v1.5a.75.75 0 01-.75.75h-1.5a.75.75 0 01-.75-.75v-1.5zM3.75 10.5a.75.75 0 01.75-.75h1.5a.75.75 0 01.75.75v1.5a.75.75 0 01-.75.75h-1.5a.75.75 0 01-.75-.75v-1.5zM3.75 16.5a.75.75 0 01.75-.75h1.5a.75.75 0 01.75.75v1.5a.75.75 0 01-.75.75h-1.5a.75.75 0 01-.75-.75v-1.5zM9.75 4.5a.75.75 0 01.75-.75h1.5a.75.75 0 01.75.75v1.5a.75.75 0 01-.75.75h-1.5a.75.75 0 01-.75-.75v-1.5zM9.75 10.5a.75.75 0 01.75-.75h1.5a.75.75 0 01.75.75v1.5a.75.75 0 01-.75.75h-1.5a.75.75 0 01-.75-.75v-1.5zM9.75 16.5a.75.75 0 01.75-.75h1.5a.75.75 0 01.75.75v1.5a.75.75 0 01-.75.75h-1.5a.75.75 0 01-.75-.75v-1.5zM15.75 4.5a.75.75 0 01.75-.75h1.5a.75.75 0 01.75.75v1.5a.75.75 0 01-.75.75h-1.5a.75.75 0 01-.75-.75v-1.5zM15.75 10.5a.75.75 0 01.75-.75h1.5a.75.75 0 01.75.75v1.5a.75.75 0 01-.75.75h-1.5a.75.75 0 01-.75-.75v-1.5zM15.75 16.5a.75.75 0 01.75-.75h1.5a.75.75 0 01.75.75v1.5a.75.75 0 01-.75.75h-1.5a.75.75 0 01-.75-.75v-1.5z" /></svg>
);


// App-level constants
export const APP_NAME = "FleetPro";

// Map related constants
export const BANGALORE_CENTER_LAT = 12.9716;
export const BANGALORE_CENTER_LON = 77.5946;
export const BANGALORE_MAP_COORD_VARIATION_LAT = 0.25; 
export const BANGALORE_MAP_COORD_VARIATION_LON = 0.25;


export const NAVIGATION_ITEMS: NavigationItem[] = [
  { name: "Dashboard", path: "/", icon: HomeIcon },
  { 
    name: "Vehicle Management", 
    path: "/vehicles", 
    icon: TruckIcon,
    children: [
        { name: "Vehicle Directory", path: "/vehicles/directory", icon: TruckIcon },
        { name: "Onboarding", path: "/vehicles/onboard", icon: PlusCircleIcon },
        { name: "Reporting Dashboard", path: "/vehicles/reporting", icon: DocumentChartBarIcon },
    ]
  },
  { 
    name: "Chauffeurs", 
    path: "/chauffeurs", 
    icon: UserGroupIcon,
    children: [
        { name: "Overview Dashboard", path: "/chauffeurs/overview", icon: ChartPieIcon },
        { name: "Directory", path: "/chauffeurs/directory", icon: UsersIcon },
        { name: "Onboard Chauffeur", path: "/chauffeurs/onboard", icon: PlusCircleIcon },
        { name: "Trip Log", path: "/chauffeurs/trip-log", icon: DocumentReportIcon },
        { name: "Pool Trip Requests", path: "/chauffeurs/pool-trip-requests", icon: CalendarDaysIcon },
        { name: "Attendance", path: "/chauffeurs/attendance", icon: ClipboardDocumentCheckIcon },
        { name: "Performance Reporting", path: "/chauffeurs/performance", icon: DocumentChartBarIcon },
    ]
  },
   { 
    name: "Chauffeur Connect Hub", 
    path: "/chauffeur-connect", 
    icon: WifiIcon,
    children: [
        { name: "Live Status", path: "/chauffeur-connect/status", icon: MapPinIcon },
        { name: "Trip Dispatch", path: "/chauffeur-connect/dispatch", icon: PaperAirplaneIcon },
        { name: "Leave Requests", path: "/chauffeur-connect/leaves", icon: CalendarDaysIcon },
    ]
  },
  { 
    name: "Maintenance", 
    path: "/maintenance", 
    icon: WrenchIcon,
    children: [
        { name: "Maintenance Dashboard", path: "/maintenance/dashboard", icon: ChartPieIcon },
        { name: "Workshop / Job Cards", path: "/maintenance/tasks", icon: ClipboardListIcon },
        { name: "Mechanics Directory", path: "/maintenance/mechanics", icon: UserGroupIcon },
    ]
  },
    { 
    name: "Cost Management", 
    path: "/costs", 
    icon: CurrencyDollarIcon,
    children: [
        { name: "Cost Dashboard", path: "/costs/dashboard", icon: ChartPieIcon },
        { name: "Vehicle Costs", path: "/costs/vehicle-entry", icon: CreditCardIcon },
        { name: "Fuel Log", path: "/costs/fuel-log", icon: FireIcon },
        { name: "Fuel Cards", path: "/costs/fuel-cards", icon: CreditCardIcon },
        { name: "Cost Categories", path: "/costs/categories", icon: TagIcon },
    ]
  },
  { 
    name: "Employees", 
    path: "/employees", 
    icon: UserGroupIcon,
    children: [
      { name: "Directory", path: "/employees/directory", icon: UserGroupIcon },
      { name: "Onboard Employee", path: "/employees/onboard", icon: PlusCircleIcon },
    ]
  },
  { 
    name: "Monitoring & Alerts", 
    path: "/monitoring", 
    icon: BellAlertIcon,
    children: [
      { name: "Notifications Log", path: "/monitoring/notifications", icon: EnvelopeIcon },
      { name: "Email Log", path: "/monitoring/email-log", icon: EnvelopeIcon },
    ]
  },
  { 
    name: "Administration", 
    path: "/admin", 
    icon: UsersIcon,
    children: [
      { name: "User Management", path: "/admin/users", icon: UsersIcon },
    ]
  },
];

export const MOCK_VEHICLES_COUNT = 25;
export const MOCK_CHAUFFEURS_COUNT = 25; 
export const MOCK_USERS_COUNT = 12;
export const MOCK_CHAUFFEUR_ATTENDANCE_COUNT = 50;
export const MOCK_TRIPS_COUNT = 50;
export const MOCK_REPORTED_ISSUES_COUNT = 15;
export const MOCK_MAINTENANCE_TASKS_COUNT = 40;
export const MOCK_MECHANICS_COUNT = 8;
export const MOCK_COST_ENTRIES_COUNT = 100;
export const MOCK_FUEL_LOGS_COUNT = 200;
export const MOCK_FUEL_CARDS_COUNT = 10;


// Gemini Model Name
export const GEMINI_TEXT_MODEL = "gemini-2.5-flash";