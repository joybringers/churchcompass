export const metadata = {
  title: 'ChurchCompass',
  description: 'Free church management — attendance, sign-in, first timers and more.',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" />
      </head>
      <body style={{ margin: 0, fontFamily: "'Segoe UI', system-ui, sans-serif", background: '#f8fafc' }}>
        {children}
      </body>
    </html>
  );
}
