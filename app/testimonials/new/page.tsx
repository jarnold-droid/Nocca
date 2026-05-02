'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function NewTestimonial() {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/testimonials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });

      if (response.ok) {
        alert('Testimonial submitted successfully!');
        setContent('');
      }
    } catch (error) {
      console.error(error);
      alert('Failed to submit testimonial');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-600">NOCCA Stories</h1>
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-700">
            Back to Dashboard
          </Link>
        </nav>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-3xl font-bold mb-8">Write a Testimonial</h2>
        <p className="text-gray-600 mb-8">Help us inspire future alumni with a brief testimonial about NOCCA or your post-graduation experience</p>

        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow">
          <div className="mb-6">
            <label className="block text-sm font-semibold mb-2">Testimonial (Max 500 characters)</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value.slice(0, 500))}
              placeholder="Share a brief testimonial about your NOCCA experience or your journey after graduation..."
              rows={5}
              maxLength={500}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <p className="text-sm text-gray-500 mt-2">{content.length}/500 characters</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? 'Submitting...' : 'Submit Testimonial'}
          </button>
        </form>
      </main>
    </div>
  );
}
