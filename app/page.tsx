import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <header className="border-b">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-600">NOCCA Stories</h1>
          <div className="space-x-4">
            <Link href="/login" className="text-gray-600 hover:text-gray-900">
              Login
            </Link>
            <Link href="/signup" className="bg-blue-600 text-white px-4 py-2 rounded">
              Sign Up
            </Link>
          </div>
        </nav>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <section className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Share Your Story</h2>
          <p className="text-xl text-gray-600 mb-8">
            Connect with fellow alumni, share your journey, and inspire the next generation
          </p>
          <Link
            href="/dashboard"
            className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700"
          >
            Get Started
          </Link>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-2">📸 Share Stories</h3>
            <p className="text-gray-600">Submit your story with photos and details about your journey after graduation</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-2">💬 Testimonials</h3>
            <p className="text-gray-600">Leave testimonials for marketing and social media campaigns</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-2">🤝 Connect</h3>
            <p className="text-gray-600">Network with other alumni and stay connected</p>
          </div>
        </section>

        <section>
          <h3 className="text-2xl font-bold mb-6">Latest Stories</h3>
          <div className="text-center text-gray-500">
            Sign in to view stories from the alumni community
          </div>
        </section>
      </main>
    </div>
  );
}
