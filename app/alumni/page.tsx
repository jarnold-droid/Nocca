import Link from 'next/link';

export default function Alumni() {
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
        <h2 className="text-3xl font-bold mb-8">Connect with Alumni</h2>

        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <input
            type="text"
            placeholder="Search alumni by name or graduation year..."
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-gray-300 rounded-full mr-4"></div>
              <div>
                <h3 className="font-semibold">Alumni Name</h3>
                <p className="text-sm text-gray-600">Class of 2020</p>
              </div>
            </div>
            <p className="text-gray-700 text-sm mb-4">Alumni bio here...</p>
            <button className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              Connect
            </button>
          </div>

          <div className="text-center text-gray-500 col-span-full">
            More alumni will appear here as they join the platform
          </div>
        </div>
      </main>
    </div>
  );
}
