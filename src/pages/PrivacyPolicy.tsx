
import PageLayout from "@/components/landing/PageLayout";
import { Separator } from "@/components/ui/separator";

const PrivacyPolicy = () => {
  return (
    <PageLayout
      title="Privacy Policy"
      description="Last updated: January 21, 2026"
    >
      <div className="space-y-12">
        <section>
          <h2 className="text-2xl font-bold text-white mb-4">1. Information We Collect</h2>
          <p className="leading-relaxed mb-4">
            We collect information you provide directly to us, such as when you create an account,
            use our fleet management services, or contact us for support. This may include:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4 text-slate-300">
            <li>Account information (name, email address, password)</li>
            <li>Vehicle and fleet data you input into our system</li>
            <li>Usage data and preferences</li>
            <li>Communication records with our support team</li>
          </ul>
        </section>

        <Separator className="bg-white/10" />

        <section>
          <h2 className="text-2xl font-bold text-white mb-4">2. How We Use Your Information</h2>
          <p className="leading-relaxed mb-4">
            We use the information we collect to:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4 text-slate-300">
            <li>Provide, maintain, and improve our fleet management services</li>
            <li>Process transactions and send related information</li>
            <li>Send technical notices, updates, and support messages</li>
            <li>Respond to your comments, questions, and customer service requests</li>
            <li>Monitor and analyze trends, usage, and activities</li>
          </ul>
        </section>

        <Separator className="bg-white/10" />

        <section>
          <h2 className="text-2xl font-bold text-white mb-4">3. Information Sharing</h2>
          <p className="leading-relaxed">
            We do not sell, trade, or otherwise transfer your personal information to third parties
            without your consent, except as described in this policy. We may share your information in
            the following circumstances:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4 mt-4 text-slate-300">
            <li>With your consent or at your direction</li>
            <li>To comply with legal obligations</li>
            <li>To protect our rights and prevent fraud</li>
            <li>With service providers who assist in our operations</li>
          </ul>
        </section>

        <Separator className="bg-white/10" />

        <section>
          <h2 className="text-2xl font-bold text-white mb-4">4. Data Security</h2>
          <p className="leading-relaxed">
            We implement appropriate technical and organizational measures to protect your personal
            information against unauthorized access, alteration, disclosure, or destruction. However,
            no method of transmission over the internet is 100% secure.
          </p>
        </section>

        <Separator className="bg-white/10" />

        <section>
          <h2 className="text-2xl font-bold text-white mb-4">5. Contact Us</h2>
          <p className="leading-relaxed mb-6">
            If you have any questions about this Privacy Policy or our privacy practices,
            please contact us at:
          </p>
          <div className="p-6 bg-[#1E2536] rounded-xl border border-white/5">
            <div className="space-y-2">
              <p><strong className="text-white">Email:</strong> privacy@fleetmanage.ai</p>
              <p><strong className="text-white">Address:</strong> Fleet Management Services, Chicago, IL</p>
            </div>
          </div>
        </section>
      </div>
    </PageLayout>
  );
};

export default PrivacyPolicy;
