"use client";

import Navbar from "@/components/Navbar";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <Navbar />

      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h2 className="text-5xl font-bold mb-4">
            Every traveler has a story.
            <br />
            <span className="text-blue-600">Share yours.</span>
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join the community of travelers exploring Sri Lanka. Ask questions, share experiences, and discover hidden gems.
          </p>
          <div className="flex gap-4 justify-center">
            <a href="/questions/ask" className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-lg">
              Ask a Question
            </a>
            <a href="/questions" className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 text-lg">
              Browse Questions
            </a>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="text-3xl mb-3">❓</div>
            <h3 className="text-xl font-semibold mb-2">Ask Questions</h3>
            <p className="text-gray-600">
              Get answers from experienced travelers about destinations, activities, and travel tips in Sri Lanka.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="text-3xl mb-3">💡</div>
            <h3 className="text-xl font-semibold mb-2">Share Knowledge</h3>
            <p className="text-gray-600">
              Help fellow travelers by sharing your experiences and local insights about Sri Lankan destinations.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="text-3xl mb-3">🏆</div>
            <h3 className="text-xl font-semibold mb-2">Build Reputation</h3>
            <p className="text-gray-600">
              Earn reputation points and badges by contributing valuable content to the community.
            </p>
          </div>
        </div>

        <div className="bg-white p-8 rounded-lg shadow-sm border">
          <h3 className="text-2xl font-bold mb-6">Popular Topics</h3>
          <div className="flex flex-wrap gap-3">
            {["Colombo", "Kandy", "Galle", "Ella", "Sigiriya", "Beaches", "Wildlife", "Food", "Culture", "Hiking", "Tea Country", "Budget Travel"].map((tag) => (
              <a
                key={tag}
                href={`/questions/tagged/${tag.toLowerCase().replace(" ", "-")}`}
                className="px-4 py-2 bg-blue-50 text-blue-700 rounded-full hover:bg-blue-100"
              >
                {tag}
              </a>
            ))}
          </div>
        </div>
      </main>

      <footer className="border-t bg-gray-50 mt-16">
        <div className="container mx-auto px-4 py-8 text-center text-gray-600">
          <p>&copy; 2025 OneCeylon. A community for travelers exploring Sri Lanka.</p>
        </div>
      </footer>
    </div>
  );
}
