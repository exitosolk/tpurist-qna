import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-12 max-w-4xl">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
          <p className="text-gray-600 mb-8">Last updated: December 28, 2025</p>

          <div className="prose max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Agreement to Terms</h2>
              <p className="text-gray-700 mb-4">
                By accessing or using OneCeylon ("the Service"), you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of the terms, you may not access the Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Description of Service</h2>
              <p className="text-gray-700 mb-4">
                OneCeylon is a question and answer platform focused on Sri Lanka travel. The Service allows users to:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Ask questions about Sri Lanka travel</li>
                <li>Provide answers to questions</li>
                <li>Vote on questions and answers</li>
                <li>Comment on content</li>
                <li>Earn reputation points through community participation</li>
                <li>Follow questions and receive notifications</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. User Accounts</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">3.1 Registration</h3>
              <p className="text-gray-700 mb-4">
                To use certain features of the Service, you must register for an account. You agree to:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Provide accurate, current, and complete information</li>
                <li>Maintain and update your information to keep it accurate</li>
                <li>Keep your password secure and confidential</li>
                <li>Verify your email address</li>
                <li>Accept responsibility for all activities under your account</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">3.2 Account Security</h3>
              <p className="text-gray-700 mb-4">
                You are responsible for safeguarding your account credentials. Notify us immediately of any unauthorized use of your account.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">3.3 Age Requirement</h3>
              <p className="text-gray-700 mb-4">
                You must be at least 13 years old to use this Service. By using the Service, you represent that you meet this age requirement.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. User Content</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">4.1 Content Ownership</h3>
              <p className="text-gray-700 mb-4">
                You retain all rights to the content you post on OneCeylon. By posting content, you grant us a worldwide, non-exclusive, royalty-free license to use, display, and distribute your content on the Service.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">4.2 Content Standards</h3>
              <p className="text-gray-700 mb-4">
                You agree not to post content that:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Is illegal, harmful, threatening, abusive, or hateful</li>
                <li>Infringes on intellectual property rights</li>
                <li>Contains spam, advertising, or promotional material</li>
                <li>Impersonates another person or entity</li>
                <li>Contains viruses or malicious code</li>
                <li>Is sexually explicit or obscene</li>
                <li>Violates anyone's privacy</li>
                <li>Is false, misleading, or deceptive</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">4.3 Content Moderation</h3>
              <p className="text-gray-700 mb-4">
                We reserve the right to remove, edit, or reject any content that violates these Terms or that we deem inappropriate, at our sole discretion.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Acceptable Use</h2>
              <p className="text-gray-700 mb-4">You agree not to:</p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Use the Service for any unlawful purpose</li>
                <li>Attempt to gain unauthorized access to the Service</li>
                <li>Interfere with or disrupt the Service</li>
                <li>Create multiple accounts to manipulate voting or reputation</li>
                <li>Use automated tools to scrape or access the Service</li>
                <li>Harass, abuse, or harm other users</li>
                <li>Sell or transfer your account</li>
                <li>Impersonate others or provide false information</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Reputation System</h2>
              <p className="text-gray-700 mb-4">
                OneCeylon uses a reputation point system to reward quality contributions:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Users earn reputation through upvotes and accepted answers</li>
                <li>Email verification grants initial reputation points</li>
                <li>Reputation may be lost through downvotes or removed content</li>
                <li>We reserve the right to adjust reputation for violations</li>
                <li>Gaming the reputation system is prohibited</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Intellectual Property</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">7.1 Service Content</h3>
              <p className="text-gray-700 mb-4">
                The Service and its original content (excluding user-generated content), features, and functionality are owned by OneCeylon and are protected by international copyright, trademark, and other intellectual property laws.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">7.2 User Content License</h3>
              <p className="text-gray-700 mb-4">
                By posting content, you grant OneCeylon and other users the right to use, copy, reproduce, and distribute your content under the Creative Commons Attribution-ShareAlike license.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Termination</h2>
              <p className="text-gray-700 mb-4">
                We may terminate or suspend your account and access to the Service immediately, without prior notice or liability, for any reason, including:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Violation of these Terms</li>
                <li>Fraudulent or illegal activity</li>
                <li>Extended period of inactivity</li>
                <li>At your request</li>
              </ul>
              <p className="text-gray-700 mb-4">
                Upon termination, your right to use the Service will immediately cease. Your publicly posted content may remain visible but will be dissociated from your account.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Disclaimers</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">9.1 Service "As Is"</h3>
              <p className="text-gray-700 mb-4">
                The Service is provided "AS IS" and "AS AVAILABLE" without warranties of any kind, either express or implied, including but not limited to implied warranties of merchantability, fitness for a particular purpose, or non-infringement.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">9.2 User Content</h3>
              <p className="text-gray-700 mb-4">
                We do not endorse, guarantee, or assume responsibility for any content posted by users. Travel advice and information provided by users should be independently verified. We are not responsible for any harm, loss, or damage resulting from reliance on user-generated content.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">9.3 Availability</h3>
              <p className="text-gray-700 mb-4">
                We do not guarantee that the Service will be available at all times or that it will be error-free. We may suspend, modify, or discontinue the Service at any time without notice.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Limitation of Liability</h2>
              <p className="text-gray-700 mb-4">
                To the maximum extent permitted by law, OneCeylon shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, use, or other intangible losses, resulting from:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Your use or inability to use the Service</li>
                <li>Unauthorized access to your account or data</li>
                <li>User content or conduct on the Service</li>
                <li>Any other matter relating to the Service</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Indemnification</h2>
              <p className="text-gray-700 mb-4">
                You agree to indemnify and hold harmless OneCeylon and its affiliates, officers, agents, and employees from any claim, demand, loss, or damage, including reasonable attorneys' fees, arising out of or related to your use of the Service, your content, or your violation of these Terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Governing Law</h2>
              <p className="text-gray-700 mb-4">
                These Terms shall be governed by and construed in accordance with the laws of Sri Lanka, without regard to its conflict of law provisions.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Changes to Terms</h2>
              <p className="text-gray-700 mb-4">
                We reserve the right to modify or replace these Terms at any time. We will provide notice of material changes by posting the new Terms on this page and updating the "Last updated" date. Your continued use of the Service after such changes constitutes acceptance of the new Terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">14. Severability</h2>
              <p className="text-gray-700 mb-4">
                If any provision of these Terms is found to be unenforceable or invalid, that provision will be limited or eliminated to the minimum extent necessary so that the remaining Terms will otherwise remain in full force and effect.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">15. Contact Information</h2>
              <p className="text-gray-700 mb-4">
                If you have any questions about these Terms, please contact us:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700 mb-2">
                  <strong>Email:</strong> legal@oneceylon.space
                </p>
                <p className="text-gray-700">
                  <strong>Website:</strong> oneceylon.space/contact
                </p>
              </div>
            </section>

            <div className="bg-blue-50 border-l-4 border-blue-600 p-4 mt-8">
              <p className="text-sm text-blue-900">
                <strong>Note:</strong> By using OneCeylon, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service and our Privacy Policy.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
