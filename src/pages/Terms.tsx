import PageLayout from "@/components/landing/PageLayout";
import { Separator } from "@/components/ui/separator";

const Terms = () => {
    return (
        <PageLayout
            title="Terms of Service"
            description="Last updated: January 21, 2026"
        >
            <div className="space-y-12">
                <section>
                    <h2 className="text-2xl font-bold text-white mb-4">1. Acceptance of Terms</h2>
                    <p className="leading-relaxed">
                        By accessing and using FleetManage.ai ("Service"), you agree to accept and comply with these Terms of Service.
                        If you do not agree with any part of these terms, you may not use our Service.
                    </p>
                </section>

                <Separator className="bg-white/10" />

                <section>
                    <h2 className="text-2xl font-bold text-white mb-4">2. Description of Service</h2>
                    <p className="leading-relaxed mb-4">
                        FleetManage.ai provides AI-powered fleet management tools, including but not limited to:
                    </p>
                    <ul className="list-disc list-inside space-y-2 ml-4 text-slate-300">
                        <li>AI Chat Assistants for asset inquiries</li>
                        <li>Automated receipt parsing and work order creation</li>
                        <li>Shop network management and tracking</li>
                        <li>Maintenance tracking and analytics</li>
                    </ul>
                </section>

                <Separator className="bg-white/10" />

                <section>
                    <h2 className="text-2xl font-bold text-white mb-4">3. Subscription & Payments</h2>
                    <p className="leading-relaxed mb-4">
                        <strong>Free Trial:</strong> We offer a 1-month free trial for new users. No credit card is required to start the trial.
                    </p>
                    <p className="leading-relaxed">
                        <strong>Pricing:</strong> After the trial period, the Service costs $6.00 per month per fleet account. You may cancel your subscription at any time.
                        Cancellation will take effect at the end of the current billing cycle.
                    </p>
                </section>

                <Separator className="bg-white/10" />

                <section>
                    <h2 className="text-2xl font-bold text-white mb-4">4. User Account & Security</h2>
                    <p className="leading-relaxed">
                        You are responsible for maintaining the confidentiality of your account credentials.
                        You agree to notify us immediately of any unauthorized use of your account.
                        FleetManage.ai is not liable for any loss or damage arising from your failure to protect your login information.
                    </p>
                </section>

                <Separator className="bg-white/10" />

                <section>
                    <h2 className="text-2xl font-bold text-white mb-4">5. Disclaimer of Warranties</h2>
                    <p className="leading-relaxed">
                        The Service is provided on an "AS IS" and "AS AVAILABLE" basis. We do not warrant that the Service
                        will be uninterrupted, error-free, or completely secure, though we strive to maintain high reliability standards.
                        Our AI features are designed to assist, but users should verify critical safety and maintenance information.
                    </p>
                </section>

                <Separator className="bg-white/10" />

                <section>
                    <h2 className="text-2xl font-bold text-white mb-4">6. Contact Information</h2>
                    <p className="leading-relaxed mb-4">
                        For any questions about these Terms, please contact us:
                    </p>
                    <div className="p-6 bg-[#1E2536] rounded-xl border border-white/5">
                        <p><strong className="text-white">Email:</strong> support@fleetmanage.ai</p>
                    </div>
                </section>
            </div>
        </PageLayout>
    );
};

export default Terms;
