import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-12 max-w-4xl">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Cookie Policy</h1>
          <p className="text-gray-600 mb-8">Last updated: December 28, 2025</p>

          <div className="prose max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. What Are Cookies</h2>
              <p className="text-gray-700 mb-4">
                Cookies are small text files that are placed on your computer or mobile device when you visit a website. They are widely used to make websites work more efficiently and provide information to website owners.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. How We Use Cookies</h2>
              <p className="text-gray-700 mb-4">
                OneCeylon uses cookies for the following purposes:
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">2.1 Essential Cookies</h3>
              <p className="text-gray-700 mb-4">
                These cookies are necessary for the website to function properly:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li><strong>Session Management:</strong> Keeps you logged in as you navigate the site</li>
                <li><strong>Security:</strong> Protects against CSRF attacks and ensures secure authentication</li>
                <li><strong>User Preferences:</strong> Remembers your settings and preferences</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">2.2 Analytics Cookies</h3>
              <p className="text-gray-700 mb-4">
                We use analytics cookies to understand how visitors use our site:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Pages visited and time spent on pages</li>
                <li>Navigation paths through the site</li>
                <li>Browser and device information</li>
                <li>Errors and performance metrics</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">2.3 Functional Cookies</h3>
              <p className="text-gray-700 mb-4">
                These cookies enhance your experience:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Remember your login details</li>
                <li>Save your theme preferences</li>
                <li>Remember notification settings</li>
                <li>Store search history and filters</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Specific Cookies We Use</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b">Cookie Name</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b">Purpose</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr>
                      <td className="px-4 py-3 text-sm text-gray-700">next-auth.session-token</td>
                      <td className="px-4 py-3 text-sm text-gray-700">Authentication and session management</td>
                      <td className="px-4 py-3 text-sm text-gray-700">Session</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm text-gray-700">next-auth.csrf-token</td>
                      <td className="px-4 py-3 text-sm text-gray-700">Security (CSRF protection)</td>
                      <td className="px-4 py-3 text-sm text-gray-700">Session</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm text-gray-700">preferences</td>
                      <td className="px-4 py-3 text-sm text-gray-700">User preferences and settings</td>
                      <td className="px-4 py-3 text-sm text-gray-700">1 year</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Third-Party Cookies</h2>
              <p className="text-gray-700 mb-4">
                We may use third-party services that set their own cookies:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li><strong>Google Analytics:</strong> For website analytics and performance monitoring</li>
                <li><strong>OAuth Providers:</strong> For social login (Google, GitHub) if you choose to use them</li>
              </ul>
              <p className="text-gray-700 mb-4">
                These third parties have their own privacy policies and cookie policies.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Managing Cookies</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">5.1 Browser Settings</h3>
              <p className="text-gray-700 mb-4">
                You can control and/or delete cookies through your browser settings. Here's how:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li><strong>Chrome:</strong> Settings → Privacy and security → Cookies and other site data</li>
                <li><strong>Firefox:</strong> Options → Privacy & Security → Cookies and Site Data</li>
                <li><strong>Safari:</strong> Preferences → Privacy → Cookies and website data</li>
                <li><strong>Edge:</strong> Settings → Cookies and site permissions → Cookies</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">5.2 Impact of Disabling Cookies</h3>
              <p className="text-gray-700 mb-4">
                Please note that disabling cookies may affect the functionality of the website:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>You may not be able to stay logged in</li>
                <li>Some features may not work properly</li>
                <li>Your preferences will not be saved</li>
                <li>The site may not function as intended</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Do Not Track</h2>
              <p className="text-gray-700 mb-4">
                Some browsers have a "Do Not Track" feature that signals to websites that you do not want your online activity tracked. We currently do not respond to Do Not Track signals, as there is no industry standard for how to respond to them.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Updates to This Policy</h2>
              <p className="text-gray-700 mb-4">
                We may update this Cookie Policy from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons. We will notify you of any material changes by posting the new policy on this page with an updated "Last updated" date.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Contact Us</h2>
              <p className="text-gray-700 mb-4">
                If you have questions about our use of cookies, please contact us:
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
