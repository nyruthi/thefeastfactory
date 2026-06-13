export default function Settings() {
  return <main className="p-5 md:p-8"><h1 className="text-3xl font-semibold">Platform settings</h1><div className="mt-6 rounded-md border bg-white p-5"><p className="font-medium">Current development defaults</p><dl className="mt-4 grid grid-cols-2 gap-3 text-sm"><dt>Booking lead time</dt><dd>48 hours</dd><dt>OTP expiry</dt><dd>300 seconds</dd><dt>OTP attempts</dt><dd>5</dd><dt>Currency</dt><dd>INR</dd></dl></div></main>;
}
