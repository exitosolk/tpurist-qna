import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-12 max-w-4xl">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
          <p className="text-gray-600 mb-8">Last updated: December 28, 2025</p>

          <div className="prose max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introduction</h2>
              <p className="text-gray-700 mb-4">
                Welcome to OneCeylon ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website oneceylon.space and use our services.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Information We Collect</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">2.1 Personal Information</h3>
              <p className="text-gray-700 mb-4">
                When you register for an account, we collect:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Email address</li>
                <li>Username and display name</li>
                <li>Password (encrypted)</li>
                <li>Profile information (bio, location, website - optional)</li>
                <li>Avatar/profile picture (optional)</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">2.2 User-Generated Content</h3>
              <p className="text-gray-700 mb-4">
                We collect information you provide when using our services:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Questions, answers, and comments you post</li>
                <li>Tags and categories you create or use</li>
                <li>Votes and ratings you submit</li>
                <li>Bookmarks and followed content</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">2.3 Automatically Collected Information</h3>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>IP address and device information</li>
                <li>Browser type and version</li>
                <li>Usage data and analytics</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. How We Use Your Information</h2>
              <p className="text-gray-700 mb-4">We use your information to:</p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Provide, operate, and maintain our services</li>
                <li>Create and manage your account</li>
                <li>Send you email notifications and updates</li>
                <li>Respond to your comments and questions</li>
                <li>Calculate reputation points and rankings</li>
                <li>Prevent fraud and abuse</li>
                <li>Improve our services and user experience</li>
                <li>Send administrative information and service updates</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Information Sharing and Disclosure</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">4.1 Public Information</h3>
              <p className="text-gray-700 mb-4">
                The following information is publicly visible to all users:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Your username and display name</li>
                <li>Profile information you choose to share</li>
                <li>Questions, answers, and comments you post</li>
                <li>Your reputation score</li>
                <li>Activity history (questions asked, answers provided)</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">4.2 Private Information</h3>
              <p className="text-gray-700 mb-4">
                We never share your email address or password with third parties. We may share your information only in the following circumstances:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>With your explicit consent</li>
                <li>To comply with legal obligations</li>
                <li>To protect our rights and prevent fraud</li>
                <li>With service providers who assist in operating our platform (e.g., email services, hosting)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Data Security</h2>
              <p className="text-gray-700 mb-4">
                We implement appropriate technical and organizational security measures to protect your personal information, including:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Encrypted password storage using bcrypt</li>
                <li>HTTPS/SSL encryption for data in transit</li>
                <li>Regular security assessments</li>
                <li>Access controls and authentication</li>
              </ul>
              <p className="text-gray-700 mb-4">
                However, no method of transmission over the Internet is 100% secure. While we strive to protect your information, we cannot guarantee absolute security.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Cookies and Tracking Technologies</h2>
              <p className="text-gray-700 mb-4">
                We use cookies and similar tracking technologies to:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Maintain your login session</li>
                <li>Remember your preferences</li>
                <li>Analyze site usage and improve performance</li>
                <li>Provide personalized content</li>
              </ul>
              <p className="text-gray-700 mb-4">
                You can control cookies through your browser settings. However, disabling cookies may affect your ability to use certain features.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Your Rights and Choices</h2>
              <p className="text-gray-700 mb-4">You have the right to:</p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Access and review your personal information</li>
                <li>Update or correct your information</li>
                <li>Delete your account and associated data</li>
                <li>Opt-out of marketing communications</li>
                <li>Request a copy of your data</li>
                <li>Object to certain processing of your data</li>
              </ul>
              <p className="text-gray-700 mb-4">
                To exercise these rights, please contact us through your profile settings or email us at privacy@oneceylon.space.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Data Retention</h2>
              <p className="text-gray-700 mb-4">
                We retain your personal information for as long as necessary to provide our services and comply with legal obligations. When you delete your account, we will delete or anonymize your personal information within 30 days, except where we are required to retain it for legal purposes.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Children's Privacy</h2>
              <p className="text-gray-700 mb-4">
                Our services are not directed to children under 13 years of age. We do not knowingly collect personal information from children under 13. If you believe we have collected information from a child under 13, please contact us immediately.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. International Data Transfers</h2>
              <p className="text-gray-700 mb-4">
                Your information may be transferred to and processed in countries other than your country of residence. We ensure appropriate safeguards are in place to protect your information in accordance with this Privacy Policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Changes to This Privacy Policy</h2>
              <p className="text-gray-700 mb-4">
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date. We encourage you to review this Privacy Policy periodically.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Contact Us</h2>
              <p className="text-gray-700 mb-4">
                If you have any questions about this Privacy Policy or our data practices, please contact us at:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700 mb-2">
                  <strong>Email:</strong> privacy@oneceylon.space
                </p>
                <p className="text-gray-700">
                  <strong>Website:</strong> oneceylon.space/contact
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
