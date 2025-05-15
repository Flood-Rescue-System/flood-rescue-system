export default function DonationSection() {
  const donationAmounts = [100, 200, 500, 1000, 2000, 5000];

  return (
    <section className="my-12">
      <h2 className="text-3xl font-bold mb-8">Make a Donation</h2>
      <div className="max-w-2xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {donationAmounts.map((amount) => (
            <button
              key={amount}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded"
            >
              ₹{amount}
            </button>
          ))}
        </div>
        <p className="mt-6 text-sm text-gray-600">
          All donations are processed through verified payment gateways. You
          will receive a confirmation receipt via email.
        </p>
      </div>
    </section>
  );
}
