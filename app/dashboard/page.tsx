import Link from 'next/link';

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-600">NOCCA Stories</h1>
          <div className="space-x-4">
            <Link href="/profile" className="text-gray-600 hover:text-gray-900">
              Profile
            </Link>
            <Link href="/logout" className="text-gray-600 hover:text-gray-900">
              Logout
            </Link>
          </div>
        </nav>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-3xl font-bold mb-8">Your Dashboard</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link
            href="/stories/new"
            className="bg-white p-8 rounded-lg shadow hover:shadow-lg transition cursor-pointer"
          >
            <h3 className="text-xl font-semibold mb-2">📝 Submit a Story</h3>
            <p className="text-gray-600">Share your journey and experiences with the alumni community</p>
          </Link>

          <Link
            href="/testimonials/new"
            className="bg-white p-8 rounded-lg shadow hover:shadow-lg transition cursor-pointer"
          >
            <h3 className="text-xl font-semibold mb-2">💬 Write a Testimonial</h3>
            <p className="text-gray-600">Share a brief testimonial for social media and marketing</p>
          </Link>

          <Link
            href="/stories/gallery"
            className="bg-white p-8 rounded-lg shadow hover:shadow-lg transition cursor-pointer"
          >
            <h3 className="text-xl font-semibold mb-2">🎨 View Stories</h3>
            <p className="text-gray-600">Browse stories and testimonials from other alumni</p>
          </Link>

          <Link
            href="/alumni"
            className="bg-white p-8 rounded-lg shadow hover:shadow-lg transition cursor-pointer"
          >
            <h3 className="text-xl font-semibold mb-2">👥 Connect with Alumni</h3>
            <p className="text-gray-600">Find and follow other alumni members</p>
          </Link>

          <Link
            href="/my-stories"
            className="bg-white p-8 rounded-lg shadow hover:shadow-lg transition cursor-pointer"
          >
            <h3 className="text-xl font-semibold mb-2">📚 My Stories</h3>
            <p className="text-gray-600">View and manage your submitted stories</p>
          </Link>

          <Link
            href="/my-testimonials"
            className="bg-white p-8 rounded-lg shadow hover:shadow-lg transition cursor-pointer"
          >
            <h3 className="text-xl font-semibold mb-2">⭐ My Testimonials</h3>
            <p className="text-gray-600">View and manage your submitted testimonials</p>
          </Link>
        </div>
      </main>
    </div>
  );
}
