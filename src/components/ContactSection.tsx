export default function ContactSection() {
  return (
    <section className="my-12">
      <h2 className="text-3xl font-bold mb-8">Contact Us</h2>
      <div className="max-w-2xl mx-auto">
        <form className="space-y-6">
          <div>
            <label className="block mb-2">Name</label>
            <input type="text" required className="w-full p-2 border rounded" />
          </div>

          <div>
            <label className="block mb-2">Email</label>
            <input
              type="email"
              required
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label className="block mb-2">Message</label>
            <textarea required className="w-full p-2 border rounded h-32" />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded"
          >
            Send Message
          </button>
        </form>
      </div>
    </section>
  );
}
