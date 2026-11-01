import { NextResponse } from 'next/server';

// This route used to let anyone on the internet send email from the ChurchCompass
// address. It is closed on purpose. Server code sends email through lib/email.js.
// This folder can be deleted.
const gone = () => NextResponse.json({ error: 'Not found.' }, { status: 404 });
export const GET = gone;
export const POST = gone;
