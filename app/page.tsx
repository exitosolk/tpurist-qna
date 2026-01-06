"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <Navbar />

      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4">
            Sri Lanka Travel Questions & Answers
            <br />
            <span className="text-blue-600">Every traveler has a story. Share yours.</span>
          </h1>
          <p className="text-xl text-gray-600 mb-4">
            Join the community of travelers exploring Sri Lanka. Ask questions, share experiences, and discover hidden gems.
          </p>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-8">
            OneCeylon is your trusted travel companion for exploring the Pearl of the Indian Ocean. Whether you're planning your first visit to Sri Lanka or you're a seasoned traveler looking for off-the-beaten-path adventures, our community of locals and experienced travelers is here to help. From the ancient temples of Anuradhapura to the pristine beaches of Mirissa, from the cool highlands of Nuwara Eliya to the bustling streets of Colombo - get real answers from people who know Sri Lanka best.
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

        <div className="max-w-4xl mx-auto mb-12 bg-gradient-to-r from-blue-50 to-purple-50 p-8 rounded-xl">
          <h2 className="text-2xl font-bold mb-4 text-center">Why Choose OneCeylon?</h2>
          <p className="text-gray-700 mb-4">
            Planning a trip to Sri Lanka can be overwhelming with so much to see and do. That's where OneCeylon comes in. Our platform connects you with travelers who have been there and locals who call it home. Get personalized recommendations, honest reviews, and practical advice for transportation, accommodations, dining, activities, and cultural experiences.
          </p>
          <p className="text-gray-700">
            Whether you need to know the best time to visit Yala National Park, how to get from Colombo to Ella by train, where to find authentic Sri Lankan cuisine, or which beaches are best for surfing - our community has the answers. Share your own adventures and help others make the most of their Sri Lankan journey.
          </p>
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
                href={`/questions/tagged/${encodeURIComponent(tag)}`}
                className="px-4 py-2 bg-blue-50 text-blue-700 rounded-full hover:bg-blue-100"
              >
                {tag}
              </a>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
