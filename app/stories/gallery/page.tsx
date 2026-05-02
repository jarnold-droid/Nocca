import Link from 'next/link';

export default function StoriesGallery() {
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
        <h2 className="text-3xl font-bold mb-8">Alumni Stories</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
            <h3 className="text-xl font-semibold mb-2">Story Title</h3>
            <p className="text-gray-600 mb-4">Author • Class of 2020</p>
            <p className="text-gray-700 mb-4">This is a preview of the story content...</p>
            <Link href="#" className="text-blue-600 hover:text-blue-700 font-semibold">
              Read More →
            </Link>
          </div>

          <div className="text-center text-gray-500 col-span-full">
            Stories will appear here once they are approved by administrators
          </div>
        </div>
      </main>
    </div>
  );
}
