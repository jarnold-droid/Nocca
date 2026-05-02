import Link from 'next/link';

export default function Profile() {
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

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-3xl font-bold mb-8">My Profile</h2>

        <div className="bg-white p-8 rounded-lg shadow">
          <div className="mb-8">
            <div className="w-24 h-24 bg-gray-300 rounded-full mb-4"></div>
            <h3 className="text-xl font-semibold mb-2">User Name</h3>
            <p className="text-gray-600">Class of 2020</p>
          </div>

          <form className="space-y-6">
            <div>
              <label className="block text-sm font-semibold mb-2">Full Name</label>
              <input
                type="text"
                defaultValue="User Name"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Email</label>
              <input
                type="email"
                defaultValue="user@email.com"
                disabled
                className="w-full px-4 py-2 border rounded-lg bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Graduation Year</label>
              <input
                type="number"
                defaultValue="2020"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Bio</label>
              <textarea
                placeholder="Tell other alumni about yourself..."
                rows={4}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700"
            >
              Save Changes
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
