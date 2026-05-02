import Link from 'next/link';

export default function MyTestimonials() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-600">NOCCA Stories</h1>
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-700">
            Dashboard
          </Link>
        </nav>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-3xl font-bold mb-8">My Testimonials</h2>

        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-600 mb-4">You haven't submitted any testimonials yet.</p>
          <Link
            href="/testimonials/new"
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Write Your First Testimonial
          </Link>
        </div>
      </main>
    </div>
  );
}
